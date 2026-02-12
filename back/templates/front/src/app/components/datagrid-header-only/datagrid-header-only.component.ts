import { AG_GRID_LOCALE_EN, AG_GRID_LOCALE_FR } from '@ag-grid-community/locale';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  EventEmitter,
  Input,
  Output,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, FilterChangedEvent, GridOptions, GridReadyEvent, themeQuartz } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import { mapAgGridFiltersToOData } from '../../../utils/aggrid-to-odatafilter';
import { _fr } from '../../services/translation/fr';
import { TranslationService } from '../../services/translation/translation.service';
import { FilterParams } from '../datagrid/datagrid.component';

/**
 * Transforme les paramètres de filtre pour les requêtes POST
 * @param filterParams
 */
export function filterParamsTransformForPost(
  filterParams: FilterParams,
): FilterParams & { body: { filter: string | null } } {
  return {
    ...filterParams,
    $filter: undefined,
    body: {
      filter: filterParams.$filter ? encodeURIComponent(filterParams.$filter) : null,
    },
  };
}

export const textFilterToReplace = '$replaceByFilter';

@Component({
  selector: 'app-datagrid-header-only',
  imports: [AgGridAngular, CommonModule, MatIconModule, MatButtonModule],
  styleUrls: ['./datagrid-header-only.scss'],
  templateUrl: './datagrid-header-only.component.html',
  standalone: true,
})
export class DatagridHeaderOnlyComponent<T> {
  @Input({ required: true }) columnDefs: ColDef<T>[] = [];
  @Input({ required: true }) rowCountSignal = signal(0);
  @Input({ required: true }) fetchParamsSignal!: WritableSignal<FilterParams>;
  @Input({ required: false }) textAddButton: string | null = null;
  @Input({ required: false }) editModeSignal: WritableSignal<boolean> = signal(false);
  @Input({ required: true }) datagridName: string = '';

  @Output() back = new EventEmitter<void>();
  @Output() gridReady = new EventEmitter<GridReadyEvent>();

  @ViewChild('agGrid') agGrid!: AgGridAngular;
  /**
   * Theme de la grid
   */
  theme = themeQuartz.withParams({
    /* Changes the color of the grid text */
    foregroundColor: '#000000',
    /* Changes the color of the grid background */
    backgroundColor: '#F8FAFC',
    /* Changes the header color of the top row */
    headerBackgroundColor: '#F4F1EC',
    /* Changes the hover color of the row*/
    rowHoverColor: '#F4F1EC',

    textColor: '#000000',
  });
  /**
   * Options de la grid pour ajouter des icons custom et le theme
   */
  options: GridOptions = {
    theme: this.theme,
    editType: 'fullRow',
    suppressClickEdit: true,
    alwaysMultiSort: true,
    defaultColDef: {
      unSortIcon: true,
      cellDataType: false,
    },
    context: {},
    icons: {
      filter: `<img src="assets/icons/filter_icon.svg" style="width: 16px; height: 16px;" alt="filter_icon">`,
      filterActive: `<img src="assets/icons/filter_active.svg" style="width: 16px; height: 16px;" alt="filter_active">`,
      sortUnSort: `<img src="assets/icons/sort_unsort.svg" style="width: 16px; height: 16px;" alt="sort_unsort">`,
      sortAscending: `<img src="assets/icons/tri_ascending.svg" style="width: 16px; height: 16px;" alt="tri_ascending">`,
      sortDescending: `<img src="assets/icons/tri_descending.svg" style="width: 16px; height: 16px;" alt="tri_descending">`,
    },
    alwaysPassFilter: () => true,
  };
  popupParent = document.body;
  protected numberElementPerPages: number = 25;
  /**
   * Locale de la grid à partir de la langue de l'utilisateur
   * @protected
   */
  protected readonly localeTextComputed = computed(() => {
    return this.translationService.language() === _fr ? AG_GRID_LOCALE_FR : AG_GRID_LOCALE_EN;
  });
  private firstLoad = true;

  readonly elementTextComputed = computed(() => {
    const count = this.rowCountSignal();
    return `${count} ${count > 1 ? this.translationService.language().ELEMENTS : this.translationService.language().ELEMENT}`;
  });

  constructor(
    private readonly translationService: TranslationService,
    private readonly toastService: ToastrService,
  ) {
    effect(() => {
      const editMode = this.editModeSignal();
      if (!editMode && this.agGrid?.api) {
        this.agGrid.api.stopEditing(true);
      }
    });
  }

  onEdit(columnId: string, rowIndex: number) {
    this.agGrid.api?.startEditingCell({
      rowIndex: rowIndex ?? 0,
      colKey: columnId,
    });
  }

  onGridReady(event: GridReadyEvent) {
    window.addEventListener('resize', () => {
      event.api?.sizeColumnsToFit();
    });

    const savedState = localStorage.getItem(this.datagridName);
    let skip = 0;
    let top = this.numberElementPerPages;
    if (savedState && this.agGrid.api) {
      const parsedState = JSON.parse(savedState);
      this.agGrid.api.setFilterModel(parsedState.filter);
      this.agGrid.api.applyColumnState({ state: parsedState.sort });
      skip = parsedState.skip;
      top = parsedState.top;
      this.numberElementPerPages = top;
    }
    const orderby = this.getOrderByRaw();

    this.fetchParamsSignal.set({
      $top: top,
      $skip: skip,
      $filter: this.getFilterRaw() ?? undefined,
      $orderby: orderby === '' ? undefined : orderby,
    });
    this.gridReady.emit(event);
  }

  onFirstDataRendered() {
    this.firstLoad = false;
  }

  onFilterChanged(event: FilterChangedEvent) {
    if (this.firstLoad) {
      this.firstLoad = false;
      return;
    }
    let params = this.fetchParamsSignal();

    params = { ...params, $skip: 0 };

    const string = this.getFilterRaw();
    if (!string) {
      this.fetchParamsSignal.set({ ...params, $filter: undefined });
    } else {
      this.fetchParamsSignal.set({ ...params, $filter: string, $skip: 0 });
    }

    this.saveState();
  }

  getFilterRaw(): string | null {
    const filtersSelected = this.agGrid.api.getFilterModel();
    // si pas de filtre, on reset les filtres
    if (Object.keys(filtersSelected).length === 0) {
      return null;
    }

    // on transforme les filtres ag-grid en filtres odata
    return Object.entries(filtersSelected)
      .map(([key, filter]) => mapAgGridFiltersToOData(filter, key, this.columnDefs))
      .join(' and ');
  }

  getOrderByRaw(): string {
    // Obtenir les colonnes avec tri
    const sortedColumns = this.agGrid.api
      .getColumns()!
      .filter((col) => col.getSort())
      .sort((a, b) => (a.getSortIndex() ?? 0) - (b.getSortIndex() ?? 0))
      .map((col) => {
        const sortState = col.getSort();
        const colId = col.getColId();
        const colDef = this.columnDefs.find((c) => c.field === colId);
        const colName: string = colDef?.filterParams?.sortKey ?? colDef?.filterParams?.filterKey ?? colId;
        const colType = colDef?.type;
        return sortState ? { colName, sortState, colType } : null;
      })
      .filter((col) => col !== null); // Filtrer les colonnes sans tri

    // Construire le $orderby pour OData
    return sortedColumns
      .map((col: any) => {
        const colName =
          col.colName.includes('eq') || col.colType == 'number' || col.colType == 'array' || col.colType == 'date'
            ? col.colName
            : col.colName != 'id'
              ? `tolower(${col.colName})`
              : col.colName;
        return `${colName} ${col.sortState}`;
      }) // Exemple : 'firstname asc', 'lastname desc'
      .join(', '); // Séparer par virgule
  }

  saveState(): void {
    if (this.agGrid.api) {
      const filterModel = this.agGrid.api.getFilterModel();
      const sortModel = this.agGrid.api.getColumnState().filter((col) => col.sort);

      localStorage.setItem(
        this.datagridName,
        JSON.stringify({
          filter: filterModel,
          sort: sortModel,
          skip: this.fetchParamsSignal().$skip,
          top: this.fetchParamsSignal().$top,
        }),
      );
    }
  }
}
