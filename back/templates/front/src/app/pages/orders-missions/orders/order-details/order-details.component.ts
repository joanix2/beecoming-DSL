import { ChangeDetectorRef, Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavigationExtras } from '@angular/router';
import { firstValueFrom, Observable, tap } from 'rxjs';
import { addressValidator } from '../../../../../utils/address-validator';
import {
  AddressInput,
  ClientAutoCompleteOutput,
  OrderInput,
  OrderOutput,
  OrderStatusOutput,
  OrderTypeOutput,
} from '../../../../api/models';
import { ClientsService, OrdersService, OrderStatusService, OrderTypesService } from '../../../../api/services';
import { FilterParams } from '../../../../components/datagrid/datagrid.component';
import { DetailTopbarComponent } from '../../../../components/detail-topbar/detail-topbar.component';
import { AddressComponent } from '../../../../components/fields/address/address.component';
import { notTypeValidator } from '../../../../components/fields/custom-errors';
import { Option } from '../../../../components/fields/custom-types';
import { EditAutocompleteFieldComponent } from '../../../../components/fields/edit-async-autocomplete-field/edit-async-autocomplete-field.component';
import { EditSelectFieldComponent } from '../../../../components/fields/edit-select-field/edit-select-field.component';
import { EditTextFieldComponent } from '../../../../components/fields/edit-text-field/edit-text-field.component';
import { EditTextareaFieldComponent } from '../../../../components/fields/edit-textarea-field/edit-textarea-field.component';
import { DocumentsListComponent } from '../../../../components/missions/documents-list/documents-list.component';
import { AbstractForm } from '../../../abstract-form.component';
import { MissionsListComponent } from '../../missions/missions-list/missions-list.component';
import { MatDialog } from '@angular/material/dialog';
import { RequestConfirmationDialogComponent } from '../../../../components/request-confirmation-dialog.component';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
  imports: [
    MatDividerModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    EditSelectFieldComponent,
    EditTextFieldComponent,
    EditTextareaFieldComponent,
    DetailTopbarComponent,
    MissionsListComponent,
    EditAutocompleteFieldComponent,
    ReactiveFormsModule,
    AddressComponent,
    DocumentsListComponent,
  ],
})
export class OrderDetailsComponent extends AbstractForm<OrderInput, OrderOutput> {
  // Services
  cdr = inject(ChangeDetectorRef);
  ordersService = inject(OrdersService);
  orderTypesService = inject(OrderTypesService);
  clientsService = inject(ClientsService);
  orderStatusesService = inject(OrderStatusService);
  matDialog = inject(MatDialog);
  // Abstract properties implementation
  entityListRouteName = ['orders'];
  entityRouteName = ['orders'];
  onCreateSuccessMessage = this.tr.language().ORDER_CREATED;
  onCreateErrorMessage = this.tr.language().ERROR;
  onUpdateSuccessMessage = this.tr.language().ORDER_UPDATED;
  onUpdateErrorMessage = this.tr.language().ERROR;
  onArchivedMessage = 'Commande archivée avec succès';
  onUnarchivedMessage = 'Commande désarchivée avec succès';
  onArchivedErrorMessage = "Erreur lors de l'archivage de la commande";
  onUnarchivedErrorMessage = 'Erreur lors du désarchivage de la commande';

  // Computed
  title = computed(() =>
    this.isNew()
      ? this.tr.language().NEW_ORDER
      : this.entitySignal()?.name + ' - ' + this.entitySignal()?.displayId || '',
  );

  // Form Controls
  nameControl = new FormControl('', Validators.required);
  clientControl = new FormControl<Option<ClientAutoCompleteOutput> | null>(null, [
    Validators.required,
    notTypeValidator('string'),
  ]);
  typeControl = new FormControl<Option<OrderTypeOutput> | null>(null, Validators.required);
  statusControl = new FormControl<Option<OrderStatusOutput> | null>(null, Validators.required);
  addressControl = new FormControl<AddressInput | null>({} as AddressInput, [addressValidator]);
  commentControl = new FormControl('');

  // Options
  statusOptions: Option<OrderStatusOutput>[] = [];
  typeOptions: Option<OrderTypeOutput>[] = [];

  constructor() {
    super();

    // Redéfinir le form pour inclure tous les contrôles nécessaires
    this.form = this.fb.group({
      archivedAt: this.archivedAtControl,
      name: this.nameControl,
      client: this.clientControl,
      type: this.typeControl,
      status: this.statusControl,
      address: this.addressControl,
      comment: this.commentControl,
    });

    // Charger les types de commande
    this.fetchOrderTypes();
    this.fetchOrderStatuses();
  }

  // Abstract methods implementation
  setForm(entity: OrderOutput): void {
    this.nameControl.setValue(entity?.name || '');
    this.clientControl.setValue(
      entity?.client
        ? {
            id: entity.client.id,
            name: entity.client.company || '',
            value: { ...entity.client, company: entity.client.company },
            color: null,
          }
        : null,
    );
    this.typeControl.setValue(
      entity?.type
        ? {
            id: entity.type.id,
            name: entity.type.name ?? entity.type.id,
            iconUrl: `assets/icons/${entity.type.icon}.svg`,
            value: entity.type,
            color: entity.type.color ?? null,
          }
        : null,
    );
    this.statusControl.setValue(
      entity?.status
        ? {
            id: entity.status.id ?? '',
            name: entity.status.name ?? '',
            value: entity.status,
            color: entity.status.color ?? null,
          }
        : null,
    );
    this.addressControl.setValue((entity?.address as AddressInput) ?? ({} as AddressInput));
    this.commentControl.setValue(entity?.comments ?? '');
  }

  getEntityInput(): OrderInput {
    return {
      name: this.nameControl.value || '',
      clientId: this.clientControl.value?.id || '',
      typeId: this.typeControl.value?.id || '',
      statusId: this.statusControl.value?.id || '',
      address: this.addressControl.value || ({} as AddressInput),
      comment: this.commentControl.value || '',
      archivedAt: this.archivedAtControl.value,
    };
  }

  getById(id: string): Observable<OrderOutput> {
    return this.ordersService.ordersOrderIdGet({ orderId: id });
  }

  async createEntity(body: OrderInput): Promise<string> {
    return await firstValueFrom(this.ordersService.ordersPost({ body }));
  }

  async updateEntity(id: string, body: OrderInput): Promise<OrderOutput> {
    return await firstValueFrom(this.ordersService.ordersOrderIdPut({ orderId: id, body }));
  }

  async archiveOrUnarchiveEntity(id: string): Promise<void> {
    try {
      let message = '';
      let title = '';
      if (!this.isArchived()) {
        message = 'Voulez-vous archiver cette commande ?';
        title = 'Archiver';
      } else {
        message = 'Voulez-vous désarchiver cette commande ?';
        title = 'Désarchiver';
      }

      const dialogRef = this.matDialog.open(RequestConfirmationDialogComponent, {
        data: {
          title,
          message,
        },
      });
      const confirmed = await firstValueFrom(dialogRef.afterClosed());
      if (!confirmed) {
        return;
      }

      if (this.isArchived()) {
        await firstValueFrom(this.ordersService.ordersIdUnarchivePost({ id }));
      } else {
        await firstValueFrom(this.ordersService.ordersOrderIdDelete({ orderId: id }));
      }
    } catch (error: any) {
      this.toastr.error(this.tr.get(error.error), this.onArchivedErrorMessage);
    }
  }

  // Méthodes spécifiques aux commandes
  private async fetchOrderTypes() {
    try {
      const result = await firstValueFrom(this.orderTypesService.orderTypesGet());
      this.typeOptions =
        result.value?.map((type) => ({
          id: type.id ?? '',
          name: type.name ?? '',
          iconUrl: `assets/icons/${type.icon}.svg`,
          value: type,
          color: type.color ?? null,
        })) ?? [];
    } catch {
      this.toastr.error(this.tr.language().ERROR);
    }
  }

  private async fetchOrderStatuses() {
    try {
      const result = await firstValueFrom(this.orderStatusesService.orderStatusGet());
      this.statusOptions =
        result?.map((status) => ({
          id: status.id ?? '',
          name: status.name ?? '',
          value: status,
          color: status.color ?? null,
        })) ?? [];
    } catch {
      this.toastr.error(this.tr.language().ERROR);
    }
  }

  clientsSearchFn = async (params: FilterParams) => {
    const result = await firstValueFrom(
      this.clientsService.clientsAutocompleteGet({ search: params.$search }).pipe(
        tap(
          (x) =>
            x.map((c) => ({
              id: c.id ?? '',
              name: c.company ?? '',
              value: c,
              color: null,
            })) ?? [],
        ),
      ),
    );
    return result ?? [];
  };

  clientToOption = (client: ClientAutoCompleteOutput): Option<ClientAutoCompleteOutput> => ({
    id: client.id,
    name: client.company ?? '',
    value: client,
    color: null,
  });

  createNewMission() {
    const extra: NavigationExtras = {
      queryParams: {
        orderId: this.entityIdSignal(),
      },
    };
    this.appService.goTo(['missions', 'new'], extra);
  }

  async onClientSelection(option: Option<ClientAutoCompleteOutput>) {
    const clientDetailed = await firstValueFrom(this.clientsService.clientsIdGet({ id: option.value.id }));
    if (clientDetailed?.address) {
      this.form.patchValue({
        address: clientDetailed.address as AddressInput,
      });
    }
  }
}
