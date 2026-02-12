import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { firstValueFrom } from 'rxjs';
import { CustomFormListOutput, MissionTypeListOutput, MissionTypeListOutputListResponse } from '../../../../api/models';
import { CustomFormsService, MissionTypesService } from '../../../../api/services';
import { AppService } from '../../../../services/app.service';
import { TranslationService } from '../../../../services/translation/translation.service';
import { ActionButtonGenericComponent } from '../../../datagrid/action-button-generic/action-button-generic.component';
import { ColorCellComponent } from '../../../datagrid/color-cell/color-cell.component';
import { DatagridComponent, FilterParams } from '../../../datagrid/datagrid.component';
import {
  RowDetailDisplayColumn,
  RowDetailRendererComponent,
  RowDetailRendererConfig,
} from '../../../datagrid/row-detail-renderer/row-detail-renderer.component';
import { DeleteConfirmationDialogComponent } from '../../../delete-confirmation-dialog/delete-confirmation-dialog.component';

@Component({
  selector: 'app-mission-types',
  templateUrl: './mission-types.component.html',
  styleUrls: ['./mission-types.component.scss'],
  imports: [MatIconModule, MatButtonModule, DatagridComponent],
})
export class MissionTypesComponent implements OnInit {
  // Services
  tr = inject(TranslationService);
  appService = inject(AppService);
  private router = inject(Router);
  private readonly missionTypeService = inject(MissionTypesService);
  private readonly customFormsService = inject(CustomFormsService);
  private readonly dialog = inject(MatDialog);

  // Signals
  fetchParamsSignal = signal<FilterParams>({});
  missionTypesSignal = signal<MissionTypeListOutput[]>([]);
  missionTypesCount = signal<number>(0);
  datagridName = input<string>('MISSION-TYPES');

  // Others
  columnDefs = computed<ColDef<MissionTypeListOutput>[]>(() => [
    {
      headerName: this.tr.language().MISSION_TYPE_NAME,
      sort: 'asc',
      field: 'name',
      sortable: true,
      filter: true,
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: 'name',
        maxNumConditions: 1,
      },
      cellRenderer: RowDetailRendererComponent,
      cellRendererParams: {
        dataKey: 'customFormsCount',
        checkType: 'number',
        threshold: 0,
        loadDataFunction: async (id: string) => {
          return await this.getRelatedForms(id);
        },
        displayColumns: [
          {
            key: 'name',
            type: 'text',
          },
          {
            key: 'exportFileName',
            type: 'text',
          },
        ] as RowDetailDisplayColumn[],
        navigationRoute: ['administration', 'custom-forms'],
        navigationIdKey: 'id',
      } as RowDetailRendererConfig,
    },
    {
      headerName: this.tr.language().MISSION_TYPE_FORM_CUSTOM_FORMS_COUNT,
      field: 'customFormsCount',
      type: 'number',
      filter: true,
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: 'customFormsCount',
        maxNumConditions: 1,
      },
      sortable: false,
    },
    {
      headerName: this.tr.language().MISSION_TYPE_FORM_COLOR,
      field: 'color',
      type: 'text',
      filter: true,
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: 'color',
        maxNumConditions: 1,
      },
      sortable: false,
      cellRendererSelector: (params: ICellRendererParams) => {
        return {
          component: ColorCellComponent,
          params: {
            color: params.value,
          },
        };
      },
    },
    {
      headerName: this.tr.language().MISSION_TYPE_FORM_ICON,
      field: 'icon',
      type: 'text',
      filter: false,
      sortable: false,
      cellRenderer: 'IconCell',
      cellRendererParams: (params: ICellRendererParams) => {
        return {
          iconType: params.data.icon,
          iconColor: '#000000',
          showIcon: true,
          showIconName: false,
        };
      },
    },
    {
      headerName: '',
      sortable: false,
      filter: false,
      minWidth: 30,
      width: 30,
      cellClass: 'flex justify-center',
      cellRenderer: ActionButtonGenericComponent,
      cellRendererParams: {
        icon: 'delete',
        class: 'text-red-600',
        showText: false,
        actionFunction: (id: string) => this.deleteForm(id),
      },
    },
  ]);

  constructor() {
    let initialRun = true;
    effect(async () => {
      const fetchParams = this.fetchParamsSignal();

      if (initialRun) {
        initialRun = false;
        return;
      }

      await this.loadData(fetchParams);
    });
  }

  ngOnInit() {
    // this.loadData();
  }

  async loadData(fetchParams: FilterParams = {}) {
    try {
      const data: MissionTypeListOutputListResponse = await firstValueFrom(
        this.missionTypeService.missionTypesGet(fetchParams),
      );
      this.missionTypesSignal.set(data.value ?? []);
      this.missionTypesCount.set(data.count ?? 0);
    } catch (error) {
      console.error(error);
    }
  }

  // Méthode pour ajuster automatiquement la taille des colonnes
  onGridReady(params: any) {
    // Auto-size toutes les colonnes pour s'adapter au contenu
    params.api.sizeColumnsToFit();

    // Ou bien auto-size seulement certaines colonnes
    // params.api.autoSizeColumns(['name', 'exportFileName']);
  }

  goToDetails(id: string | undefined): void {
    if (!id) return;
    this.appService.goTo(['administration', 'mission-types', id]);
  }

  onRowClick(row: MissionTypeListOutput) {
    this.goToDetails(row.id);
  }

  async deleteForm(id: string): Promise<void> {
    if (!id) return;

    const missionType = this.missionTypesSignal().find((missionType) => missionType.id === id);
    const formName = missionType?.name || 'ce type de mission';

    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      data: {
        title: 'Supprimer le type de mission',
        itemName: formName,
      },
      width: '400px',
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());

    if (confirmed) {
      try {
        await firstValueFrom(this.missionTypeService.missionTypesIdDelete({ id }));
        this.missionTypesSignal.update((prev) => prev.filter((missionType) => missionType.id !== id));
        this.missionTypesCount.update((prev) => prev - 1);
      } catch (error) {
        console.error(error);
      }
    }
  }

  async getRelatedForms(id: string): Promise<CustomFormListOutput[]> {
    try {
      const response = await firstValueFrom(
        this.customFormsService.customFormsByMissionTypeMissionTypeIdGet({ missionTypeId: id }),
      );
      return response;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
}
