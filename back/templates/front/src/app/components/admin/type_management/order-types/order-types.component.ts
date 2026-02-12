import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { MissionTypeListOutput, OrderTypeListOutput, OrderTypeListOutputListResponse } from '../../../../api/models';
import { MissionTypesService, OrderTypesService } from '../../../../api/services';
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
  selector: 'app-order-types',
  templateUrl: './order-types.component.html',
  styleUrls: ['./order-types.component.scss'],
  imports: [MatIconModule, MatButtonModule, DatagridComponent],
})
export class OrderTypesComponent implements OnInit {
  // Services
  tr = inject(TranslationService);
  toastr = inject(ToastrService);
  appService = inject(AppService);
  private router = inject(Router);
  private readonly orderTypeService = inject(OrderTypesService);
  private readonly missionTypeService = inject(MissionTypesService);
  private readonly dialog = inject(MatDialog);

  // Signals
  fetchParamsSignal = signal<FilterParams>({});
  orderTypesSignal = signal<OrderTypeListOutput[]>([]);
  orderTypesCount = signal<number>(0);
  datagridName = input<string>('ORDER-TYPES');

  // Others
  columnDefs = computed<ColDef<OrderTypeListOutput>[]>(() => [
    {
      headerName: this.tr.language().ORDER_TYPE_NAME,
      field: 'name',
      type: 'text',
      sortable: true,
      filter: true,
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: 'name',
        maxNumConditions: 1,
      },
      cellRenderer: RowDetailRendererComponent,
      cellRendererParams: {
        dataKey: 'missionTypesCount',
        checkType: 'number',
        threshold: 0,
        loadDataFunction: async (id: string) => {
          return await this.getRelatedMissionTypes(id);
        },
        displayColumns: [
          {
            key: 'name',
            type: 'text',
          },
          {
            key: 'customFormsCount',
            type: 'text',
          },
          {
            key: 'color',
            type: 'color',
            colorKey: 'color',
          },
          {
            key: 'icon',
            type: 'icon',
          },
        ] as RowDetailDisplayColumn[],
        navigationRoute: ['administration', 'mission-types'],
        navigationIdKey: 'id',
      } as RowDetailRendererConfig,
    },
    {
      headerName: this.tr.language().ORDER_TYPE_MISSION_TYPES_COUNT,
      field: 'missionTypesCount',
      type: 'number',
      filter: true,
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: 'missionTypesCount',
        maxNumConditions: 1,
      },
      sortable: false,
    },
    {
      headerName: this.tr.language().ORDER_TYPE_COLOR,
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
      headerName: this.tr.language().ORDER_TYPE_ICON,
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
      const data: OrderTypeListOutputListResponse = await firstValueFrom(
        this.orderTypeService.orderTypesGet(fetchParams),
      );
      this.orderTypesSignal.set(data.value ?? []);
      this.orderTypesCount.set(data.count ?? 0);
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
    this.appService.goTo(['administration', 'order-types', id]);
  }

  onRowClick(row: MissionTypeListOutput) {
    this.goToDetails(row.id);
  }

  async deleteForm(id: string): Promise<void> {
    if (!id) return;

    const orderType = this.orderTypesSignal().find((orderType) => orderType.id === id);
    const orderTypeName = orderType?.name || 'ce type de commande';

    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      data: {
        title: 'Supprimer le type de commande',
        itemName: orderTypeName,
      },
      width: '400px',
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());

    if (confirmed) {
      try {
        await firstValueFrom(this.orderTypeService.orderTypesIdDelete({ id }));
        this.orderTypesSignal.update((prev) => prev.filter((orderType) => orderType.id !== id));
        this.orderTypesCount.update((prev) => prev - 1);
      } catch (error) {
        console.error(error);
      }
    }
  }

  async getRelatedMissionTypes(id: string): Promise<MissionTypeListOutput[]> {
    try {
      const response = await firstValueFrom(
        this.missionTypeService.missionTypesByOrderTypeOrderTypeIdGet({ orderTypeId: id }),
      );
      return response;
    } catch (error) {
      this.toastr.error('Erreur lors de la récupération des types de mission');
      return [];
    }
  }
}
