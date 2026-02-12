import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { firstValueFrom, Observable } from 'rxjs';
import { CustomFormListOutput, MissionTypeInput, MissionTypeOutput } from '../../../api/models';
import { CustomFormsService, MissionTypesService } from '../../../api/services';
import { ActionButtonGenericComponent } from '../../../components/datagrid/action-button-generic/action-button-generic.component';
import { DatagridComponent, FilterParams } from '../../../components/datagrid/datagrid.component';
import { DeleteConfirmationDialogComponent } from '../../../components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { DetailTopbarComponent } from '../../../components/detail-topbar/detail-topbar.component';
import { Option } from '../../../components/fields/custom-types';
import { EditSelectFieldComponent } from '../../../components/fields/edit-select-field/edit-select-field.component';
import { EditTextFieldComponent } from '../../../components/fields/edit-text-field/edit-text-field.component';
import { AbstractForm } from '../../abstract-form.component';

@Component({
  selector: 'app-mission-type-details',
  templateUrl: './mission-type-details.component.html',
  styleUrls: ['./mission-type-details.component.scss'],
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
export class MissionTypeDetailsComponent extends AbstractForm<MissionTypeInput, MissionTypeOutput> implements OnInit {
  // Services
  router = inject(Router);
  missionTypeService = inject(MissionTypesService);
  customFormsService = inject(CustomFormsService);
  dialog = inject(MatDialog);

  // Abstract properties implementation
  entityListRouteName = ['administration'];
  entityRouteName = ['administration', 'mission-types'];
  onCreateSuccessMessage = 'Type de mission créé avec succès';
  onCreateErrorMessage = 'Erreur lors de la création du type de mission';
  onUpdateSuccessMessage = 'Type de mission mis à jour avec succès';
  onUpdateErrorMessage = 'Erreur lors de la mise à jour du type de mission';
  onArchivedMessage = 'Type de mission archivé avec succès';
  onUnarchivedMessage = 'Type de mission désarchivé avec succès';
  onArchivedErrorMessage = "Erreur lors de l'archivage du type de mission";
  onUnarchivedErrorMessage = 'Erreur lors du désarchivage du type de mission';

  // Computed
  title = computed(() =>
    this.isNew() ? 'Nouveau type de mission' : `Type de mission ${this.entitySignal()?.name || ''}`,
  );

  // Forms controls
  nameControl = new FormControl('', [Validators.required]);
  colorControl = new FormControl<string>('#000000', [Validators.required]);
  iconControl = new FormControl<Option<string> | null>(null, [Validators.required]);
  orderTypeIdControl = new FormControl<string | null>(null);

  // Form options
  iconOptions: Option<string>[] = [
    { id: '1', name: '', color: null, value: 'rond', iconUrl: 'assets/icons/rond.svg' },
    { id: '2', name: '', color: null, value: 'rectangle', iconUrl: 'assets/icons/rectangle.svg' },
    { id: '3', name: '', color: null, value: 'triangle', iconUrl: 'assets/icons/triangle.svg' },
    { id: '4', name: '', color: null, value: 'rectangle_2', iconUrl: 'assets/icons/rectangle_2.svg' },
  ];

  // Datagrid
  datagridName = input<string>('CUSTOM-FORMS');
  fetchParamsSignal = signal<FilterParams>({});
  customFormsSignal = signal<CustomFormListOutput[]>([]);
  customFormsCount = signal<number>(0);
  paginationEnabledSignal = signal<boolean>(false);
  columnDefs = computed<ColDef<CustomFormListOutput>[]>(() => [
    {
      headerName: this.tr.language().CUSTOM_FORM_NAME,
      field: 'name',
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    {
      headerName: this.tr.language().FILE_EXPORT,
      field: 'exportFileName',
      filter: false,
      sortable: false,
    },
    {
      headerName: '',
      sortable: false,
      filter: false,
      minWidth: 15,
      width: 15,
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
    super();

    // Redéfinir le form pour inclure tous les contrôles nécessaires
    this.form = this.fb.group({
      archivedAt: this.archivedAtControl,
      name: this.nameControl,
      color: this.colorControl,
      icon: this.iconControl,
      orderTypeId: this.orderTypeIdControl,
    });
  }

  ngOnInit() {
    // Remettre le scroll en haut de la page
    window.scrollTo(0, 0);

    setTimeout(() => {
      const initialOrderTypeId = this.route.snapshot.queryParams['orderTypeId'];
      if (initialOrderTypeId) {
        this.orderTypeIdControl.setValue(initialOrderTypeId, {
          emitEvent: false,
          onlySelf: true,
        });
      }
    }, 100);
  }

  // Abstract methods implementation
  setForm(entity: MissionTypeOutput): void {
    // Gérer à la fois les entités existantes et les nouveaux formulaires (entity peut être vide)
    this.nameControl.setValue(entity?.name || '');
    this.colorControl.setValue(entity?.color || null);

    // Convertir string vers Option<string> pour l'icône en récupérant l'option complète
    const iconOption = entity?.icon ? this.iconOptions.find((option) => option.value === entity.icon) || null : null;
    this.iconControl.setValue(iconOption);

    // Charger les custom forms associés au mission type
    if (entity?.customForms) {
      this.customFormsSignal.set(entity.customForms);
      this.customFormsCount.set(entity.customForms.length);
    } else {
      this.customFormsSignal.set([]);
      this.customFormsCount.set(0);
    }
  }

  getEntityInput(): MissionTypeInput {
    return {
      name: this.nameControl.value || '',
      color: this.colorControl.value || '',
      icon: this.iconControl.value?.value || '',
      orderTypeId: this.orderTypeIdControl.value || null,
    };
  }

  getById(id: string): Observable<MissionTypeOutput> {
    return this.missionTypeService.missionTypesIdGet({ id });
  }

  async createEntity(body: MissionTypeInput): Promise<string> {
    const result = await firstValueFrom(this.missionTypeService.missionTypesPost({ body }));
    return result.id;
  }

  async updateEntity(id: string, body: MissionTypeInput): Promise<MissionTypeOutput> {
    const result = await firstValueFrom(this.missionTypeService.missionTypesIdPut({ id, body }));
    return result;
  }

  async archiveOrUnarchiveEntity(id: string): Promise<void> {
    if (this.isArchived()) {
      await firstValueFrom(this.missionTypeService.missionTypesIdUnarchivePost({ id }));
    } else {
      await firstValueFrom(this.missionTypeService.missionTypesIdDelete({ id }));
    }
  }

  // Datagrid
  async goToCustomFormDetails(id: string): Promise<void> {
    if (this.editMode()) {
      if (this.form.valid && this.isNew()) {
        const missionTypeId = await this.createEntity(this.getEntityInput());

        this.appService.goTo(['administration', 'custom-forms', 'new'], {
          queryParams: { missionTypeId },
        });
      }
    } else {
      this.appService.goTo(['administration', 'custom-forms', id], {
        queryParams: { missionTypeId: this.entitySignal()?.id || '' },
      });
    }
  }

  async onSubmit() {
    this.form.markAllAsTouched();
  }

  async deleteForm(id: string): Promise<void> {
    // Trouver le nom du formulaire pour l'afficher dans la confirmation
    const customForm = this.customFormsSignal().find((form) => form.id === id);
    const formName = customForm?.name || 'ce formulaire';

    // Ouvrir le dialog de confirmation
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      data: {
        title: 'Supprimer le formulaire',
        itemName: formName,
      },
      width: '400px',
    });

    // Attendre la réponse de l'utilisateur
    const confirmed = await firstValueFrom(dialogRef.afterClosed());

    if (confirmed) {
      try {
        await firstValueFrom(this.customFormsService.customFormsIdDelete({ id }));
        this.customFormsSignal.update((prev) => prev.filter((form) => form.id !== id));
        this.customFormsCount.update((prev) => prev - 1);
        this.toastr.success('Formulaire supprimé avec succès');
      } catch (error) {
        this.toastr.error('Erreur lors de la suppression du formulaire');
      }
    }
  }
}
