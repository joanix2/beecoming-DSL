import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { firstValueFrom, Observable } from 'rxjs';
import {
  AddressInput,
  ClientInput,
  ClientOutput,
  MissionListOutput,
  OrderListOutput,
  OrderStatusOutput,
} from '../../../api/models';
import { ClientsService, MissionsService, OrdersService, OrderStatusService } from '../../../api/services';
import {
  CheckboxFilterComponent,
  ColorCheckbox,
  ColorCheckboxAndCount,
} from '../../../components/datagrid/checkbox-filter/checkbox-filter.component';
import { DatagridComponent, FilterParams, textFilterToReplace } from '../../../components/datagrid/datagrid.component';
import {
  RowDetailDisplayColumn,
  RowDetailRendererComponent,
  RowDetailRendererConfig,
} from '../../../components/datagrid/row-detail-renderer/row-detail-renderer.component';
import { DetailTopbarComponent } from '../../../components/detail-topbar/detail-topbar.component';
import { AddressComponent } from '../../../components/fields/address/address.component';
import { EditTextFieldComponent } from '../../../components/fields/edit-text-field/edit-text-field.component';
import { LoadingService } from '../../../services/loading.service';
import { AbstractForm } from '../../abstract-form.component';

@Component({
  selector: 'app-client-details',
  templateUrl: './client-details.component.html',
  styleUrls: ['./client-details.component.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    EditTextFieldComponent,
    DetailTopbarComponent,
    ReactiveFormsModule,
    DetailTopbarComponent,
    AddressComponent,
    DatagridComponent,
  ],
})
export class ClientDetailsComponent extends AbstractForm<ClientInput, ClientOutput> {
  clientsService = inject(ClientsService);
  ordersService = inject(OrdersService);
  orderStatusesService = inject(OrderStatusService);
  missionsService = inject(MissionsService);

  cdr = inject(ChangeDetectorRef);
  loadingService = inject(LoadingService);

  // Abstract properties implementation
  entityListRouteName = ['clients'];
  entityRouteName = ['clients'];
  onCreateSuccessMessage = this.tr.language().CLIENT_CREATED;
  onCreateErrorMessage = this.tr.language().ERROR;
  onUpdateSuccessMessage = this.tr.language().CLIENT_UPDATED;
  onUpdateErrorMessage = this.tr.language().ERROR;
  onArchivedMessage = this.tr.language().CLIENT_ARCHIVED;
  onUnarchivedMessage = this.tr.language().CLIENT_UNARCHIVED;
  onArchivedErrorMessage = this.tr.language().CLIENT_ARCHIVE_ERROR;
  onUnarchivedErrorMessage = this.tr.language().CLIENT_UNARCHIVE_ERROR;

  // Form Controls
  companyControl = new FormControl('', [Validators.required]);
  contactNameControl = new FormControl('', [Validators.required]);
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  phoneControl = new FormControl('', [Validators.pattern(/^[0-9]{10}$/)]);
  addressControl = new FormControl<AddressInput | null>({} as AddressInput);

  // Title observable
  title = computed(() => {
    const client = this.entitySignal();
    if (this.isNew()) return this.tr.language().NEW_CLIENT;
    const name = client?.company ?? '';
    return this.editMode() ? `${this.tr.language().EDIT_CLIENT} - ${name}` : name;
  });

  // Datagrid
  datagridName = input<string>('ORDERS');
  fetchParamsSignal = signal<FilterParams>({});
  ordersSignal = signal<OrderListOutput[]>([]);
  ordersCount = signal<number>(0);
  paginationEnabledSignal = signal<boolean>(false);
  columnDefs = computed<ColDef<OrderListOutput>[]>(() => [
    { field: 'id', headerName: this.tr.language().ORDER_DISPLAY_ID, hide: true },
    {
      field: 'displayId',
      headerName: this.tr.language().ORDER_DISPLAY_ID,
      cellRenderer: RowDetailRendererComponent,
      cellRendererParams: {
        dataKey: 'missionIds',
        checkType: 'array',
        threshold: 0,
        loadDataFunction: async (id: string) => {
          return await this.getRelatedMissions(id);
        },
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
            key: 'status.name',
            type: 'chip',
            colorKey: 'status.color',
            columnHeader: 'Statut',
          },
          {
            key: 'dateFrom',
            type: 'date',
            columnHeader: 'Date de début',
          },
          {
            key: 'dateTo',
            type: 'date',
            columnHeader: 'Date de fin',
          },
          {
            key: 'teamLeader.lastname',
            type: 'text',
            columnHeader: "Chef d'équipe",
          },
          {
            key: 'address.postalCode',
            type: 'text',
            columnHeader: 'Code postal',
          },
        ] as RowDetailDisplayColumn[],
      } as RowDetailRendererConfig,
    },
    {
      headerName: this.tr.language().ORDER_STATUS,
      field: 'status',
      sortable: false,
      type: 'array',
      filter: CheckboxFilterComponent,
      filterParams: {
        fetchFilterValues: this.getOrderStatuses.bind(this),
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
      headerName: this.tr.language().PROGRESSION,
      field: 'progression',
      type: 'text',
      sortable: false,
      filter: false,
    },

    {
      headerName: this.tr.language().DEPARTMENT_NAME,
      field: 'postalCode',
      type: 'text',
      sortable: false,
      filter: false,
    },
  ]);

  orderStatusesSignal = signal<OrderStatusOutput[]>([]);
  missionsSignal = signal<MissionListOutput[]>([]);

  constructor() {
    super();
    this.form = this.fb.group({
      archivedAt: this.archivedAtControl,
      contactName: this.contactNameControl,
      email: this.emailControl,
      phoneNumber: this.phoneControl,
      address: this.addressControl,
      company: this.companyControl,
    });

    // Effet pour réinitialiser fetchParamsSignal quand le client change
    effect(() => {
      const client = this.entitySignal();
      if (client && client.id) {
        // Reset la pagination et les filtres à chaque changement de client
        this.fetchParamsSignal.set({ clientId: client.id, $top: 25, $skip: 0 });
      }
    });

    // Effet pour charger les commandes quand fetchParamsSignal change
    effect(async () => {
      const fetchParams = this.fetchParamsSignal();
      await this.fetchOrders(fetchParams);
    });
  }

  setForm(client: ClientOutput): void {
    this.form.patchValue({
      archivedAt: client.archivedAt ?? null,
      contactName: client.contactName ?? '',
      email: client.email ?? '',
      phoneNumber: client.phoneNumber ?? '',
      address: client.address as AddressInput,
      company: client.company,
    });
    this.cdr.detectChanges();
  }

  getEntityInput(): ClientInput {
    return {
      archivedAt: this.archivedAtControl.value,
      contactName: this.contactNameControl.value ?? '',
      email: this.emailControl.value ?? '',
      phoneNumber: this.phoneControl.value ?? '',
      address: this.addressControl.value ?? ({} as AddressInput),
      company: this.companyControl.value ?? '',
    };
  }

  getById(id: string): Observable<ClientOutput> {
    return this.clientsService.clientsIdGet({ id });
  }

  async createEntity(body: ClientInput): Promise<string> {
    return await firstValueFrom(this.clientsService.clientsPost({ body }));
  }

  async updateEntity(id: string, body: ClientInput): Promise<ClientOutput> {
    return await firstValueFrom(this.clientsService.clientsIdPut({ id, body }));
  }

  async archiveOrUnarchiveEntity(id: string): Promise<void> {
    // La logique d'archive/unarchive est gérée par getEntityInput() qui inclut archivedAt
    // Cette méthode peut rester vide car AbstractForm gère déjà la logique via updateEntity
  }

  async fetchOrders(fetchParams: FilterParams = {}): Promise<void> {
    const clientId = this.entitySignal()?.id;
    if (!clientId) return;
    // Toujours forcer le clientId dans les params
    const params = { ...fetchParams, clientId };
    const result = await firstValueFrom(this.ordersService.ordersDatagridClientIdGet(params));
    this.ordersSignal.set(result.value ?? []);
    this.ordersCount.set(result.count ?? result.value?.length ?? 0);
  }

  async getOrderStatuses(): Promise<ColorCheckboxAndCount> {
    const statuses = await firstValueFrom(this.orderStatusesService.orderStatusGet());
    return {
      colorCheckbox: statuses.map<ColorCheckbox>((c) => ({
        value: c.id ?? '',
        color: c.color ?? '',
        label: c.name ?? '',
      })),
      count: statuses.length,
    };
  }

  goToOrderDetails(orderId: string | undefined): void {
    if (!orderId) return;
    this.appService.goTo(['orders', orderId]);
  }

  async getRelatedMissions(orderId: string): Promise<MissionListOutput[]> {
    try {
      const missions = await firstValueFrom(this.missionsService.missionsDatagridGet({ orderId }));
      this.missionsSignal.set(missions.value ?? []);
      return missions.value ?? [];
    } catch (error) {
      console.error(error);
      this.toastr.error(this.tr.language().ERROR);
      return [];
    }
  }
}
