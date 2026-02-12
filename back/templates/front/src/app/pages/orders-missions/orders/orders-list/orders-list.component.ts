import { Component, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { firstValueFrom, tap } from 'rxjs';
import {
  AddressOutput,
  AddressOutputListResponse,
  ClientOutput,
  MissionStatusOutput,
  OrderOutput,
  OrderOutputListResponse,
  OrderStatusOutput,
  OrderTypeOutput,
} from '../../../../api/models';
import {
  MissionsService,
  MissionStatusesService,
  OrdersService,
  OrderStatusService,
  OrderTypesService,
} from '../../../../api/services';
import { DatagridHeaderOnlyComponent } from '../../../../components/datagrid-header-only/datagrid-header-only.component';
import {
  CheckboxFilterComponent,
  ColorCheckbox,
  ColorCheckboxAndCount,
} from '../../../../components/datagrid/checkbox-filter/checkbox-filter.component';
import {
  DatagridComponent,
  FilterParams,
  textFilterToReplace,
} from '../../../../components/datagrid/datagrid.component';
import {
  RowDetailDisplayColumn,
  RowDetailRendererComponent,
  RowDetailRendererConfig,
} from '../../../../components/datagrid/row-detail-renderer/row-detail-renderer.component';
import { MapViewComponent } from '../../../../components/map-view/map-view.component';
import { AppService } from '../../../../services/app.service';
import { TranslationService } from '../../../../services/translation/translation.service';
import { CommandeMissionService } from '../../service/commande-mission.service';

@Component({
  selector: 'app-orders-list',
  templateUrl: './orders-list.component.html',
  standalone: true,
  imports: [DatagridComponent, DatagridHeaderOnlyComponent, MatFormFieldModule, MatInputModule, MapViewComponent],
})
export class OrdersListComponent {
  commandeMissionService = inject(CommandeMissionService);
  fb = inject(FormBuilder);
  router = inject(Router);
  missionsService = inject(MissionsService);
  missionStatusesService = inject(MissionStatusesService);
  ordersSignal = signal<OrderOutputListResponse | null>(null);
  ordersAddressesSignal = signal<AddressOutputListResponse | null>(null);

  fetchParamsSignal = this.commandeMissionService.fetchParamsSignal;
  ordersCount = signal<number>(0);
  private readonly ordersStatusService = inject(OrderStatusService);
  private readonly translationService = inject(TranslationService);

  // Pour la liste des commandes d'un client
  datagridName = input<string>('ORDERS-LIST');
  clientId = input<string>('');
  isMapView = computed(() => {
    return this.commandeMissionService.isMapViewSignal();
  });
  types = signal<OrderTypeOutput[]>([]);
  statuses = signal<OrderStatusOutput[]>([]);
  missionStatuses = signal<MissionStatusOutput[]>([]);

  // reférence au datagrid pour récupérer les données de la ligne sélectionnée
  datagrid = viewChild<DatagridComponent<OrderOutput>>('datagrid');

  initialRun = true; // Pour ne pas charger les données lors du premier chargement de la page
  // ou lors du changement de la vue, en mode carte. dans effect on set initialRun à true

  columnDefs = computed<ColDef<OrderOutput>[]>(() => [
    {
      headerName: this.translateService.language().ORDER_DISPLAY_ID,
      sort: 'asc',
      sortIndex: 0,
      field: 'displayId',
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: 'displayId',
        maxNumConditions: 1,
      },
      cellRenderer: RowDetailRendererComponent,
      cellRendererParams: {
        dataKey: 'missionsInfos',
        checkType: 'array',
        threshold: 0,
        displayColumns: [
          {
            key: 'displayId',
            type: 'text',
            columnHeader: 'Id',
          },
          {
            key: 'type.name',
            type: 'chip',
            colorKey: 'type.color',
            columnHeader: 'Type',
          },
          {
            key: 'teamLeader',
            type: 'custom',
            customTemplate: (value: any, item: any) => {
              if (!value) return 'Non-associé';
              return `<span class="text-sm">${value?.firstname} ${value?.lastname}</span>`;
            },
            columnHeader: 'Equipe',
          },
          {
            key: 'status.name',
            type: 'chip',
            colorKey: 'status.color',
            columnHeader: 'Statut',
          },
        ] as RowDetailDisplayColumn[],
      } as RowDetailRendererConfig,
      type: 'text',
      sortable: true,
      filter: true,
    },
    {
      headerName: this.translateService.language().ORDER_NAME,
      field: 'name' as keyof OrderOutput,
      colId: 'name',
      filterValueGetter: (params) => params.data?.name ?? '',
      filterKey: `name in (${textFilterToReplace})`,
      sortKey: 'name',
      filter: true,
      sortable: true,
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        maxNumConditions: 1,
      },
    },
    {
      headerName: this.translateService.language().ORDER_CLIENT_NAME,
      field: 'clients' as keyof OrderOutput,
      colId: 'client/company',
      valueGetter: (params) => this.getClientString(params.data?.client),
      filterValueGetter: (params) => params.data?.client?.company ?? '',
      filterKey: `client/company in (${textFilterToReplace})`,
      sortKey: 'client/company',
      filter: true,
      sortable: true,
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        maxNumConditions: 1,
      },
    },
    {
      headerName: this.translateService.language().ORDER_STATUS,
      field: 'status',
      sortable: false,
      type: 'array',
      filter: CheckboxFilterComponent,
      filterParams: {
        fetchFilterValues: this.getStatuses.bind(this),
        filterKey: `status/id in (${textFilterToReplace})`,
        sortKey: 'status/name',
      },
      cellRenderer: 'ChipComponent',
      cellRendererParams: (params: ICellRendererParams) => ({
        value: params.data.status.name,
        color: params.data.status.color,
      }),
    },
    {
      headerName: this.translateService.language().PROGRESSION,
      field: 'missionsInfos',
      sortable: false,
      type: 'array',
      headerClass: 'no-actions',
      valueGetter: (params) => {
        return this.getAvancement(params.data!);
      },
    },
    {
      headerName: this.translateService.language().DEPARTMENT_NAME,
      sortIndex: 0,
      field: 'address.postalCode',
      colId: 'address.postalCode',
      valueGetter: (params) => this.getDepartementKey(params.data?.address),
      filter: 'agTextColumnFilter',
      filterParams: {
        filterKey: 'address/postalCode',
        maxNumConditions: 1,
        filterOptions: ['startsWith', 'contains', 'endsWith'],
      },
      type: 'text',
      sortable: true,
    },
    // {
    //   cellRenderer: ActionButtonGenericComponent,
    //   cellRendererParams: {
    //     icon: 'add',
    //     showText: false,
    //     actionFunction: (id: string) => {
    //       this.goToOrderDetails(id);
    //     },
    //     context: {},
    //   },
    //   sortable: false,
    //   filter: false,
    //   width: 25,
    // },
  ]);

  columnDefsMapView = computed<ColDef<OrderOutput>[]>(() => {
    const columnDefs = this.columnDefs();
    columnDefs.pop();
    return columnDefs.map((col) => {
      return {
        ...col,
        sortable: false,
      };
    });
  });

  form = this.fb.group({
    address: new FormControl<AddressOutput | null>(null),
    type: new FormControl<OrderTypeOutput | null>(null),
    status: new FormControl<OrderStatusOutput | null>(null),
    date: new FormControl<string | null>(null),
    client: new FormControl<string | null>(null),
    multiSelect: new FormControl<OrderStatusOutput[]>([]),
  });

  constructor(
    protected readonly translateService: TranslationService,
    private readonly ordersService: OrdersService,
    private readonly appService: AppService,
    private readonly orderTypesService: OrderTypesService,
  ) {
    effect(() => {
      const isMapView = this.commandeMissionService.isMapViewSignal();
      this.initialRun = true;
    });

    effect(async () => {
      const fetchParams = this.fetchParamsSignal();

      if (this.initialRun) {
        this.initialRun = false;
        return;
      }
      const untrackedMapView = untracked(() => this.commandeMissionService.isMapViewSignal);
      if (!untrackedMapView()) {
        await this.loadData(fetchParams);
      } else {
        await this.loadDataAddresses(fetchParams);
      }
    });

    effect(() => {
      this.ordersCount.set(this.ordersSignal()?.count ?? 0);
    });
  }

  ngOnInit(): void {
    this.getTypes();
    this.getStatuses();
    this.getMissionStatuses();
  }

  getClientString(client: ClientOutput | undefined): string {
    if (!client) return '';
    // return `${client.lastname}: ${client.firstname}`;
    return client.company ?? '';
  }

  getDepartementKey(address: AddressOutput | undefined): string {
    if (!address) return 'Non-fourni';
    return address.postalCode?.substring(0, 2) ?? 'Non-fourni';
  }

  getStatusString(commandeStatus: OrderStatusOutput | undefined): string {
    if (!commandeStatus) return 'Non-fourni';
    return commandeStatus.name ?? 'Non-fourni';
  }

  async loadData(fetchParams: FilterParams = {}) {
    if (this.clientId()) {
      fetchParams.clientId = this.clientId();
    }
    const orders = await firstValueFrom(this.ordersService.ordersDatagridPost(fetchParams));
    this.ordersSignal.set(orders);
  }

  async loadDataAddresses(fetchParams: FilterParams = {}) {
    if (this.clientId()) {
      fetchParams.clientId = this.clientId();
    }
    const addresses = await firstValueFrom(this.ordersService.ordersAddressesPost(fetchParams));
    this.ordersAddressesSignal.set(addresses);
  }

  async getStatuses(): Promise<ColorCheckboxAndCount> {
    if (this.statuses() && this.statuses().length > 0) {
      return {
        colorCheckbox: this.statuses().map<ColorCheckbox>((c) => ({
          value: c.id ?? '',
          color: c.color ?? '',
          label: c.name ?? '',
        })),
        count: this.statuses().length,
      };
    }
    const statuses = await firstValueFrom(
      this.ordersStatusService.orderStatusGet().pipe(tap((x) => this.statuses.set(x ?? []))),
    );
    return {
      colorCheckbox:
        statuses?.map<ColorCheckbox>((c) => ({
          value: c.id ?? '',
          color: c.color ?? '',
          label: c.name ?? '',
        })) ?? [],
      count: statuses?.length ?? 0,
    };
  }

  async getMissionStatuses(): Promise<ColorCheckboxAndCount> {
    if (this.missionStatuses() && this.missionStatuses().length > 0) {
      return {
        colorCheckbox: this.missionStatuses().map<ColorCheckbox>((c) => ({
          value: c.id ?? '',
          color: c.color ?? '',
          label: c.name ?? '',
        })),
        count: this.missionStatuses().length,
      };
    }
    const statuses = await firstValueFrom(
      this.missionStatusesService.missionStatusesGet().pipe(tap((x) => this.missionStatuses.set(x))),
    );
    return {
      colorCheckbox:
        statuses?.map<ColorCheckbox>((c) => ({
          value: c.id ?? '',
          color: c.color ?? '',
          label: c.name ?? '',
        })) ?? [],
      count: statuses.length ?? 0,
    };
  }

  getAvancement(order: OrderOutput): string {
    if (order.missionsInfos && this.missionStatuses() && this.missionStatuses().length > 0) {
      const status = this.missionStatuses().find((s) => s.name === 'Terminée');
      if (status?.name === 'Terminée') {
        const missions = order.missionsInfos.filter((m) => m.statusId === status.id);
        return `${missions.length} / ${order.missionsInfos.length}`;
      }
    }
    return `Aucune mission`;
  }

  async getTypes(): Promise<ColorCheckboxAndCount> {
    if (this.types() && this.types().length > 0) {
      return {
        colorCheckbox: this.types().map<ColorCheckbox>((c) => ({
          value: c.id ?? '',
          color: c.color ?? '',
          label: c.name ?? '',
        })),
        count: this.types().length,
      };
    }
    const types = await firstValueFrom(
      this.orderTypesService.orderTypesGet().pipe(tap((x) => this.types.set(x.value ?? []))),
    );
    return {
      colorCheckbox:
        types?.value?.map<ColorCheckbox>((c) => ({
          value: c.id ?? '',
          color: c.color ?? '',
          label: c.name ?? '',
        })) ?? [],
      count: types.value?.length ?? 0,
    };
  }

  goToOrderDetails(orderId: string): void {
    this.appService.goTo(['orders', orderId]);
  }

  getMissions(orderId: string): void {
    let index = this.ordersSignal()?.value?.findIndex((o) => o.id === orderId) ?? 0;
    this.datagrid()?.agGrid?.api.applyTransaction({
      addIndex: index + 1,
      add: [
        {
          orderId: orderId,
        },
      ],
    });
    this.missionsService.missionsDatagridGet({ orderId: orderId });
  }

  onClickBack(): void {
    this.commandeMissionService.isMapViewSignal.set(false);
  }
}
export interface Type {
  id: string;
  name: string;
}
