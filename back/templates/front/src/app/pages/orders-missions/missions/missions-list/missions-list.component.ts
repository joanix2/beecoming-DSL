import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { firstValueFrom, tap } from 'rxjs';
import {
  AddressOutput,
  AddressOutputListResponse,
  ClientOutput,
  MissionListOutputListResponse,
  MissionOutput,
  MissionStatusOutput,
  MissionTypeOutput,
} from '../../../../api/models';
import { MissionsService, MissionStatusesService, MissionTypesService } from '../../../../api/services';
import { DatagridHeaderOnlyComponent } from '../../../../components/datagrid-header-only/datagrid-header-only.component';
import { ActionButtonGenericComponent } from '../../../../components/datagrid/action-button-generic/action-button-generic.component';
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
import { MapViewComponent } from '../../../../components/map-view/map-view.component';
import { AppService } from '../../../../services/app.service';
import { LoadingService } from '../../../../services/loading.service';
import { TranslationService } from '../../../../services/translation/translation.service';
import { CommandeMissionService } from '../../service/commande-mission.service';

@Component({
  selector: 'app-missions-list',
  templateUrl: './missions-list.component.html',
  imports: [DatagridComponent, DatagridHeaderOnlyComponent, MapViewComponent],
  providers: [DatePipe, TitleCasePipe],
})
export class MissionsListComponent {
  // Injections modernes avec inject()
  private readonly commandeMissionService = inject(CommandeMissionService);
  private readonly missionService = inject(MissionsService);
  private readonly typeService = inject(MissionTypesService);
  private readonly statusService = inject(MissionStatusesService);
  private readonly appService = inject(AppService);
  private readonly translateService = inject(TranslationService);
  private readonly datePipe = inject(DatePipe);
  private readonly titlecasePipe = inject(TitleCasePipe);
  private readonly loadingService = inject(LoadingService);

  // Signals pour la gestion d'état
  missionsSignal = signal<MissionListOutputListResponse | null>(null);
  missionsCount = signal<number>(0);
  missionsTypesSignal = signal<MissionTypeOutput[]>([]);
  missionsStatusesSignal = signal<MissionStatusOutput[]>([]);
  missionsAddressesSignal = signal<AddressOutputListResponse | null>(null);
  initialRun = true;

  // Inputs avec la nouvelle API input()
  commandeId = input<string | undefined>(undefined);
  dataGridName = input<string>('MISSION_LIST');
  clientId = input<string | undefined>(undefined);
  userId = input<string | undefined>(undefined);
  // reference datagrid parent
  datagrid = viewChild<DatagridComponent<MissionOutput>>('datagrid');

  // Computed signals
  fetchParamsSignal = this.commandeMissionService.fetchParamsSignal;
  isMapView = computed(() => this.commandeMissionService.isMapViewSignal());

  columnDefs = computed<ColDef<MissionOutput>[]>(() => [
    {
      headerName: this.translateService.language().MISSION_DISPLAY_ID,
      sortIndex: 0,
      field: 'displayId',
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: 'displayId',
        maxNumConditions: 1,
      },
      type: 'text',
      sortable: true,
      filter: true,
    },
    {
      headerName: this.translateService.language().MISSION_TYPE,
      sortable: false,
      field: 'type' as keyof MissionOutput,
      type: 'array',
      filter: CheckboxFilterComponent,
      filterParams: {
        fetchFilterValues: this.getTypes.bind(this),
        filterKey: `type/id in (${textFilterToReplace})`,
        sortKey: 'type/name',
      },
      cellRenderer: 'IconCell',
      cellRendererParams: (params: ICellRendererParams) => ({
        value: params.data.type.name,
        showIcon: true,
        iconType: params.data.type.icon,
        iconColor: params.data.type.color,
      }),
    },
    {
      headerName: this.translateService.language().MISSION_STATUS,
      field: 'status' as keyof MissionOutput,
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
      field: 'dateFrom',
      headerName: this.translateService.language().MISSION_START_DATE,
      sortIndex: 1,
      sort: 'desc',
      type: 'date',
      sortable: true,
      filter: 'agDateColumnFilter',
      valueGetter: (params: any) => this.datePipe.transform(params.data.dateFrom, 'dd/MM/yyyy') || '-',
    },
    {
      field: 'dateTo',
      headerName: this.translateService.language().MISSION_END_DATE,
      filter: 'agDateColumnFilter',
      valueGetter: (params: any) => this.datePipe.transform(params.data.dateTo, 'dd/MM/yyyy') || '-',
    },
    {
      headerName: this.translateService.language().MISSION_TEAMLEADER,
      sortIndex: 0,
      field: 'teamLeader',
      valueGetter: (params) => {
        if (!params.data?.teamLeader) return 'Non-associé';
        return `${params.data?.teamLeader?.firstname} ${params.data?.teamLeader?.lastname}`;
      },
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: "concat(concat(mainTeamLeader/firstname, ' '), mainTeamLeader/lastname)",
        maxNumConditions: 1,
      },
      type: 'text',
      sortable: false,
      filter: true,
    },
    {
      field: 'client',
      headerName: this.translateService.language().MISSION_ClIENT,
      type: 'text',
      sortIndex: 0,
      filterParams: {
        filterOptions: ['contains'],
        filterKey: 'order/client/company',
        maxNumConditions: 1,
      },
      filter: true,
      valueGetter: (params: any) => this.formatFullName(params.data?.client),
    },
    {
      headerName: this.translateService.language().DEPARTMENT_NAME,
      sortIndex: 0,
      field: 'address',
      valueGetter: (params) => this.getDepartementKey(params.data?.address),
      filterParams: {
        filterOptions: ['startsWith'],
        filterKey: 'address/postalCode',
        maxNumConditions: 1,
      },
      type: 'text',
      sortable: true,
      filter: true,
    },
    {
      headerName: '',
      cellRenderer: ActionButtonGenericComponent,
      cellRendererParams: {
        icon: 'copy',
        showText: false,
        actionFunction: async (id: string) => {
          await this.duplicateMission(id);
        },
        tooltipLabel: this.translateService.language().DUPLICATE,
        context: {},
      },
      sortable: false,
      filter: false,
      width: 50,
    },
  ]);

  columnDefsMapView = computed<ColDef<MissionOutput>[]>(() => {
    const columnDefs = this.columnDefs();
    columnDefs.pop();
    return columnDefs.map((col) => {
      return {
        ...col,
        sortable: false,
      };
    });
  });

  constructor() {
    effect(async () => {
      const fetchParams = this.fetchParamsSignal();
      if (this.initialRun) {
        this.initialRun = false;
        return;
      }
      if (!this.isMapView()) {
        await this.loadData(fetchParams);
      } else {
        await this.loadDataAddresses(fetchParams);
      }
    });

    effect(() => {
      this.missionsCount.set(this.missionsSignal()?.count ?? 0);
    });
  }

  async ngOnInit() {}

  async loadData(fetchParams: FilterParams = {}): Promise<void> {
    try {
      this.loadingService.show(); // Afficher la barre de chargement

      // Cas où on est sur la liste des missions d'une commande
      if (this.commandeId() !== null && this.commandeId() !== undefined) {
        fetchParams.orderId = this.commandeId();
      }
      if (this.userId() !== null && this.userId() !== undefined) {
        fetchParams.userId = this.userId();
      }
      if (this.clientId() !== null && this.clientId() !== undefined) {
        fetchParams.clientId = this.clientId();
      }
      const missions = await firstValueFrom(this.missionService.missionsDatagridGet(fetchParams));
      this.missionsSignal.set(missions);
    } finally {
      this.loadingService.hide(); // Masquer la barre de chargement
    }
  }

  async loadDataAddresses(fetchParams: FilterParams = {}) {
    try {
      this.loadingService.show(); // Afficher la barre de chargement

      // Cas où on est sur la liste des missions d'une commande
      if (this.commandeId() !== null && this.commandeId() !== undefined) {
        fetchParams.orderId = this.commandeId();
      }
      if (this.userId() !== null && this.userId() !== undefined) {
        fetchParams.userId = this.userId();
      }
      if (this.clientId() !== null && this.clientId() !== undefined) {
        fetchParams.clientId = this.clientId();
      }
      const addresses = await firstValueFrom(this.missionService.missionsAddressesPost(fetchParams));
      this.missionsAddressesSignal.set(addresses);
    } finally {
      this.loadingService.hide(); // Masquer la barre de chargement
    }
  }

  goToMissionDetails(missionId: string | undefined): void {
    if (!missionId) return;
    this.appService.goTo(['missions', missionId]);
  }

  getDepartementKey(address: AddressOutput | undefined): string {
    if (!address) return 'Non-fourni';
    return address.postalCode?.substring(0, 2) ?? 'Non-fourni';
  }

  formatFullName(client: ClientOutput | undefined): string {
    if (!client) return 'Non-fourni';
    return `${this.titlecasePipe.transform(client.contactName)} ${client.contactName?.substring(0, 1).toUpperCase()}.`;
  }

  async getTypes(): Promise<ColorCheckboxAndCount> {
    if (this.missionsTypesSignal() && this.missionsTypesSignal().length > 0) {
      return {
        colorCheckbox: this.missionsTypesSignal().map<ColorCheckbox>((c) => ({
          value: c.id ?? '',
          color: c.color ?? '',
          label: c.name ?? '',
        })),
        count: this.missionsTypesSignal().length,
      };
    }
    const types = await firstValueFrom(
      this.typeService.missionTypesGet().pipe(tap((x) => this.missionsTypesSignal.set(x.value ?? []))),
    );
    return {
      colorCheckbox:
        types.value?.map<ColorCheckbox>((c) => ({
          value: c.id ?? '',
          color: c.color ?? '',
          label: c.name ?? '',
        })) ?? [],
      count: types.count ?? 0,
    };
  }

  async getStatuses(): Promise<ColorCheckboxAndCount> {
    if (this.missionsStatusesSignal() && this.missionsStatusesSignal().length > 0) {
      return {
        colorCheckbox: this.missionsStatusesSignal().map<ColorCheckbox>((c) => ({
          value: c.id ?? '',
          color: c.color ?? '',
          label: c.name ?? '',
        })),
        count: this.missionsStatusesSignal().length,
      };
    }
    const statuses = await firstValueFrom(
      this.statusService.missionStatusesGet().pipe(tap((x) => this.missionsStatusesSignal.set(x))),
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

  onClickBack(): void {
    this.commandeMissionService.isMapViewSignal.set(false);
  }

  async duplicateMission(missionId: string): Promise<void> {
    try {
      this.loadingService.show();
      const response = await firstValueFrom(this.missionService.missionsMissionIdDuplicateGet({ missionId }));
      if (response) {
        this.appService.goTo(['missions', response], {
          queryParams: { isEdit: 'true' },
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingService.hide();
    }
  }
}
