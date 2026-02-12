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
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, FilterChangedEvent, GridOptions, GridReadyEvent, themeQuartz } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import { mapAgGridFiltersToOData } from '../../../utils/aggrid-to-odatafilter';
import { deepCompare } from '../../../utils/deep-compare';
import { _fr } from '../../services/translation/fr';
import { TranslationService } from '../../services/translation/translation.service';
import { LinkCellComponent } from '../link-cell/link-cell.component';
import { ChipComponent } from './chip/chip.component';
import { IconCellComponent } from './icon-cell/icon-cell.component';
import { RowDetailRendererComponent } from './row-detail-renderer/row-detail-renderer.component';

/**
 * Paramètres de filtre pour la grille avec ODATA
 */
export interface FilterParams {
  /**
   * L'id de l'utilisateur pour la liste des missions par utilisateur (teamleader)
   */
  userId?: string;
  /**
   * L'id du client pour la liste des commandes d'un client
   */
  clientId?: string;
  /**
   * L'id de la commande pour la liste des mission d'une  commande
   */
  orderId?: string;
  /**
   * The max number of records.
   */
  $top?: number;

  /**
   * The number of records to skip.
   */
  $skip?: number;

  /**
   * A function that must evaluate to true for a record to be returned.
   */
  $filter?: string;

  /**
   * Determines what values are used to order a collection of records.
   */
  $orderby?: string;

  /**
   * A function that must evaluate to true for a record to be returned.
   */
  $search?: string;
}

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

/**
 * Enumération des actions possibles sur une ligne
 */
export enum ActionType {
  EDIT = 'edit',
  CANCEL = 'cancel',
  SAVE = 'save',
  DELETE = 'delete',
}

export interface ActionRow<T> {
  action: ActionType;
  data: T;
  columnId: string;
}

export const textFilterToReplace = '$replaceByFilter';

@Component({
  selector: 'app-datagrid',
  imports: [AgGridAngular, MatPaginator, CommonModule, ChipComponent],
  templateUrl: './datagrid.component.html',
  standalone: true,
})
export class DatagridComponent<T> {
  @Input({ required: true }) columnDefs: ColDef<T>[] = [];
  @Input({ required: true }) rowCountSignal = signal(0);
  @Input({ required: true }) data!: T[];
  @Input({ required: true }) fetchParamsSignal!: WritableSignal<FilterParams>;
  @Input({ required: false }) textAddButton: string | null = null;
  @Input({ required: false }) editModeSignal: WritableSignal<boolean> = signal(false);
  @Input({ required: true }) datagridName: string = '';
  @Input({ required: false }) paginationEnabledSignal: WritableSignal<boolean> = signal(true);

  /**
   * Signal pour gérer les actions sur une ligne
   */
  actionRowSignal = signal<ActionRow<T> | null>(null);

  @Output() rowClick = new EventEmitter<T>();
  @Output() saveItem = new EventEmitter<T>();
  @Output() deleteItem = new EventEmitter<T>();
  @Output() gridReady = new EventEmitter<GridReadyEvent>();

  @ViewChild('matPaginator') paginator!: MatPaginator;
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
    headerBackgroundColor: '#E6F3FC',
    /* Changes the hover color of the row*/
    rowHoverColor: '#F8FAFC',

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
    context: {
      actionRowSignal: this.actionRowSignal,
      data: this.data,
    },
    components: {
      ChipComponent: ChipComponent,
      IconCell: IconCellComponent,
      LinkCell: LinkCellComponent,
      ExpandableRowComponent: RowDetailRendererComponent,
    },
    alwaysPassFilter: () => true,
  };
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
    // effect qui gère les actions sur la ligne qui correspond à l'action
    effect(() => {
      const actionRow = this.actionRowSignal();

      if (!actionRow) return;

      const { action, data, columnId } = actionRow;
      const rowIndex = this.agGrid.api.getRenderedNodes().findIndex((node) => deepCompare(node.data, data));
      const oldData = JSON.parse(JSON.stringify(data));

      if (action && data) {
        switch (action) {
          case ActionType.EDIT:
            this.onEdit(columnId, rowIndex);
            break;
          case ActionType.CANCEL:
            this.onCancel(data, rowIndex);
            break;
          case ActionType.SAVE:
            this.onSave(data, oldData, rowIndex, columnId);
            break;
          case ActionType.DELETE:
            this.onDelete(data, rowIndex);
            break;
        }
      }
    });

    effect(() => {
      const editMode = this.editModeSignal();
      if (!editMode && this.agGrid?.api) {
        this.agGrid.api.stopEditing(true);
        this.actionRowSignal.set(null);
      }
    });
  }

  onEdit(columnId: string, rowIndex: number) {
    this.agGrid.api?.startEditingCell({
      rowIndex: rowIndex ?? 0,
      colKey: columnId,
    });
  }

  onCancel(data: any, rowIndex: number) {
    this.agGrid.api.stopEditing(true);

    // si toutes les props sont null ou undefined, on supprime la ligne
    if (Object.values(data).every((v) => v === null || v === undefined)) {
      this.agGrid.api.applyTransaction({ remove: [data] });
      this.deleteItem.emit(data);
      this.data.splice(rowIndex ?? 0, 1);
    }

    this.actionRowSignal.set(null);
  }

  onSave(data: any, oldData: any, rowIndex: number, columnId: string) {
    this.agGrid.api.stopEditing(false);

    // si toutes les props sont null ou undefined ou une liste vide, on revert le changement et repasse en edit
    if (Object.values(data).every((v) => v === null || v === undefined || (Array.isArray(v) && v.length === 0))) {
      this.agGrid.api.applyTransaction({ remove: [data], add: [oldData] });
      this.data[rowIndex ?? 0] = oldData;
      this.actionRowSignal.set({
        data: oldData,
        action: ActionType.EDIT,
        columnId: columnId,
      });
      this.toastService.error(this.translationService.language().ONE_FILED_REQUIRED);
      return;
    }
    this.saveItem.emit(data);
    this.actionRowSignal.set(null);
  }

  onDelete(data: any, rowIndex: number) {
    this.agGrid.api.applyTransaction({ remove: [data] });
    this.deleteItem.emit(data);
    this.data.splice(rowIndex ?? 0, 1);
    this.actionRowSignal.set(null);
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

    this.paginator.pageSize = top;
    this.paginator.pageIndex = Math.floor(skip / top);
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

  onPaginateChanged(event: PageEvent) {
    if (!this.paginationEnabledSignal()) return;
    let params = this.fetchParamsSignal();

    params = {
      ...params,
      $top: event.pageSize,
      $skip: event.pageIndex * event.pageSize,
    };

    this.fetchParamsSignal.set({ ...params });

    this.saveState();
  }

  onFilterChanged(event: FilterChangedEvent) {
    if (this.firstLoad) return;
    if (this.paginationEnabledSignal()) {
      this.paginator.pageIndex = 0;
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

  onSortChanged() {
    if (this.firstLoad) return;
    const orderBy = this.getOrderByRaw();

    this.fetchParamsSignal.set({
      ...this.fetchParamsSignal(),
      $orderby: orderBy === '' ? undefined : orderBy,
    });

    this.saveState();
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

  addRow() {
    const dataToAdd = this.columnDefs.reduce(
      (acc, col) => (col.field ? { ...acc, [col.field as string]: null } : acc),
      {},
    ) as T;
    this.agGrid.api.applyTransaction({ add: [dataToAdd] });
    this.data.push(dataToAdd);
    this.actionRowSignal.set({
      data: dataToAdd,
      action: ActionType.EDIT,
      columnId: this.columnDefs[0].field as string,
    });
  }

  valueGetterFromDataAndColDef(data: T, col: ColDef<T>) {
    return typeof col.valueGetter === 'function'
      ? col.valueGetter({
          data: data as any,
          getValue: (key: string) => (data as any)[key],
          column: this.agGrid?.api?.getColumn(col.field as string)!,
          colDef: col,
          api: this.agGrid?.api,
          context: this.agGrid?.context,
          node: null,
        })
      : (data as any)[col.field];
  }

  valueArray(data: T, col: ColDef<T>) {
    if (Array.isArray((data as any)[col.field])) {
      return (data as any)[col.field].map((item: any) => item.name).join(', ');
    } else {
      return (data as any)[col.field].name ?? (data as any)[col.field];
    }
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
