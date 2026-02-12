import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { firstValueFrom, Observable } from 'rxjs';
import { MissionTypeListOutput, OrderTypeInput, OrderTypeOutput } from '../../../api/models';
import { MissionTypesService, OrderTypesService } from '../../../api/services';
import { DatagridComponent, FilterParams } from '../../../components/datagrid/datagrid.component';
import { DeleteConfirmationDialogComponent } from '../../../components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { DetailTopbarComponent } from '../../../components/detail-topbar/detail-topbar.component';
import { Option } from '../../../components/fields/custom-types';
import { EditSelectFieldComponent } from '../../../components/fields/edit-select-field/edit-select-field.component';
import { EditTextFieldComponent } from '../../../components/fields/edit-text-field/edit-text-field.component';
import { AbstractForm } from '../../abstract-form.component';

@Component({
  selector: 'app-order-type-details',
  templateUrl: './order-type-details.component.html',
  styleUrls: ['./order-type-details.component.scss'],
  imports: [
    EditTextFieldComponent,
    EditSelectFieldComponent,
    MatButtonModule,
    MatIconModule,
    DetailTopbarComponent,
    ReactiveFormsModule,
    DatagridComponent,
  ],
})
export class OrderTypeDetailsComponent extends AbstractForm<OrderTypeInput, OrderTypeOutput> implements OnInit {
  // Services
  router = inject(Router);
  orderTypesService = inject(OrderTypesService);
  missionTypesService = inject(MissionTypesService);
  dialog = inject(MatDialog);

  // Abstract properties implementation
  entityListRouteName = ['administration'];
  entityRouteName = ['administration', 'order-types'];
  onCreateSuccessMessage = 'Type de commande créé avec succès';
  onCreateErrorMessage = 'Erreur lors de la création du type de commande';
  onUpdateSuccessMessage = 'Type de commande mis à jour avec succès';
  onUpdateErrorMessage = 'Erreur lors de la mise à jour du type de commande';
  onArchivedMessage = 'Type de commande archivé avec succès';
  onUnarchivedMessage = 'Type de commande désarchivé avec succès';
  onArchivedErrorMessage = "Erreur lors de l'archivage du type de commande";
  onUnarchivedErrorMessage = 'Erreur lors du désarchivage du type de commande';

  // Computed
  title = computed(() =>
    this.isNew() ? 'Nouveau type de commande' : `Type de commande ${this.entitySignal()?.name || ''}`,
  );

  // Forms controls
  nameControl = new FormControl('', [Validators.required]);
  colorControl = new FormControl<string | null>('#000000', [Validators.required]);
  iconControl = new FormControl<Option<string> | null>(null, [Validators.required]);

  // Form options
  iconOptions: Option<string>[] = [
    { id: '1', name: '', color: null, value: 'rond', iconUrl: 'assets/icons/rond.svg' },
    { id: '2', name: '', color: null, value: 'rectangle', iconUrl: 'assets/icons/rectangle.svg' },
    { id: '3', name: '', color: null, value: 'triangle', iconUrl: 'assets/icons/triangle.svg' },
    { id: '4', name: '', color: null, value: 'rectangle_2', iconUrl: 'assets/icons/rectangle_2.svg' },
  ];

  // Datagrid
  datagridName = input<string>('MISSION-TYPES');
  fetchParamsSignal = signal<FilterParams>({});
  missionTypesSignal = signal<MissionTypeListOutput[]>([]);
  missionTypesCount = signal<number>(0);
  paginationEnabledSignal = signal<boolean>(false);
  columnDefs = computed<ColDef<MissionTypeListOutput>[]>(() => [
    {
      headerName: this.tr.language().MISSION_TYPE_NAME,
      field: 'name',
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    {
      headerName: this.tr.language().MISSION_TYPE_FORM_COLOR,
      field: 'color',
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    {
      headerName: this.tr.language().MISSION_TYPE_FORM_ICON,
      field: 'icon',
      filter: 'agTextColumnFilter',
      sortable: true,
    },
  ]);

  constructor() {
    super();

    // Redéfinir le form pour inclure tous les contrôles nécessaires
    this.form = this.fb.group({
      archivedAt: this.archivedAtControl,
      name: this.nameControl,
      color: this.colorControl,
      icon: this.iconControl,
    });
  }

  ngOnInit() {
    // Remettre le scroll en haut de la page
    window.scrollTo(0, 0);
  }

  // Abstract methods implementation
  setForm(entity: OrderTypeOutput): void {
    // Gérer à la fois les entités existantes et les nouveaux formulaires (entity peut être vide)
    this.nameControl.setValue(entity?.name || '');
    this.colorControl.setValue(entity?.color || null);

    // Convertir string vers Option<string> pour l'icône en récupérant l'option complète
    const iconOption = entity?.icon ? this.iconOptions.find((option) => option.value === entity.icon) || null : null;
    this.iconControl.setValue(iconOption);

    // Charger les commandes associées au type de commande
    if (entity?.missionTypes) {
      this.missionTypesSignal.set(entity.missionTypes);
      this.missionTypesCount.set(entity.missionTypes.length);
    } else {
      this.missionTypesSignal.set([]);
      this.missionTypesCount.set(0);
    }
  }

  getEntityInput(): OrderTypeInput {
    return {
      name: this.nameControl.value || '',
      color: this.colorControl.value || '',
      icon: this.iconControl.value?.value || '',
    };
  }

  getById(id: string): Observable<OrderTypeOutput> {
    return this.orderTypesService.orderTypesIdGet({ id });
  }

  async createEntity(body: OrderTypeInput): Promise<string> {
    const result = await firstValueFrom(this.orderTypesService.orderTypesPost({ body }));
    return result.id;
  }

  async updateEntity(id: string, body: OrderTypeInput): Promise<OrderTypeOutput> {
    const result = await firstValueFrom(this.orderTypesService.orderTypesIdPut({ id, body }));
    return result;
  }

  async archiveOrUnarchiveEntity(id: string): Promise<void> {
    if (this.isArchived()) {
      await firstValueFrom(this.orderTypesService.orderTypesIdUnarchivePost({ id }));
    } else {
      await firstValueFrom(this.orderTypesService.orderTypesIdDelete({ id }));
    }
  }

  // Datagrid
  async goToMissionTypeDetails(id: string): Promise<void> {
    if (this.editMode()) {
      if (this.form.valid && this.isNew()) {
        const orderTypeId = await this.createEntity(this.getEntityInput());

        this.appService.goTo(['administration', 'mission-types', 'new'], {
          queryParams: { orderTypeId },
        });
      }
    } else {
      this.appService.goTo(['administration', 'mission-types', id], {
        queryParams: { orderTypeId: this.entitySignal()?.id || '' },
      });
    }
  }

  async onSubmit() {
    this.form.markAllAsTouched();
  }

  async deleteForm(id: string): Promise<void> {
    // Trouver le nom du formulaire pour l'afficher dans la confirmation
    const missionType = this.missionTypesSignal().find((type) => type.id === id);
    const missionTypeName = missionType?.name || 'ce type de mission';

    // Ouvrir le dialog de confirmation
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      data: {
        title: 'Supprimer le type de mission',
        itemName: missionTypeName,
      },
      width: '400px',
    });

    // Attendre la réponse de l'utilisateur
    const confirmed = await firstValueFrom(dialogRef.afterClosed());

    if (confirmed) {
      try {
        await firstValueFrom(this.missionTypesService.missionTypesIdDelete({ id }));
        this.missionTypesSignal.update((prev) => prev.filter((type) => type.id !== id));
        this.missionTypesCount.update((prev) => prev - 1);
        this.toastr.success('Type de mission supprimé avec succès');
      } catch (error) {
        this.toastr.error('Erreur lors de la suppression du formulaire');
      }
    }
  }
}
