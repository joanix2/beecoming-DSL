import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, tap } from 'rxjs';
import { CustomFormInput, CustomFormOutput, FormStructure } from '../../../api/models';
import { CustomFormsService } from '../../../api/services';
import { DetailTopbarComponent } from '../../../components/detail-topbar/detail-topbar.component';
import { Option } from '../../../components/fields/custom-types';
import { EditSelectFieldComponent } from '../../../components/fields/edit-select-field/edit-select-field.component';
import { EditTextFieldComponent } from '../../../components/fields/edit-text-field/edit-text-field.component';
import { CustomFormBuilderComponent } from '../../../components/ui/custom-form-builder/custom-form-builder.component';
import { AbstractForm } from '../../abstract-form.component';

@Component({
  selector: 'app-custom-form-details',
  templateUrl: './custom-form-details.component.html',
  styleUrls: ['./custom-form-details.component.scss'],
  imports: [
    EditTextFieldComponent,
    EditSelectFieldComponent,
    MatButtonModule,
    CustomFormBuilderComponent,
    DetailTopbarComponent,
    ReactiveFormsModule,
  ],
})
export class CustomFormDetailsComponent extends AbstractForm<CustomFormInput, CustomFormOutput> implements OnInit {
  // Services
  router = inject(Router);
  customFormsService = inject(CustomFormsService);

  // Abstract properties implementation
  entityListRouteName = ['administration'];
  entityRouteName = ['administration', 'custom-forms'];
  onCreateSuccessMessage = 'Formulaire créé avec succès';
  onCreateErrorMessage = 'Erreur lors de la création du formulaire';
  onUpdateSuccessMessage = 'Formulaire mis à jour avec succès';
  onUpdateErrorMessage = 'Erreur lors de la mise à jour du formulaire';
  onArchivedMessage = 'Formulaire archivé avec succès';
  onUnarchivedMessage = 'Formulaire désarchivé avec succès';
  onArchivedErrorMessage = "Erreur lors de l'archivage du formulaire";
  onUnarchivedErrorMessage = 'Erreur lors du désarchivage du formulaire';

  // Computed
  title = computed(() => (this.isNew() ? 'Nouveau formulaire' : `Formulaire ${this.entitySignal()?.name || ''}`));

  // Signals
  customFormStructureSignal = signal<FormStructure | null>(null);

  // Forms controls
  nameControl = new FormControl('', [Validators.required]);
  colorControl = new FormControl<string>('#000000', [Validators.required]);
  iconControl = new FormControl<Option<string> | null>(null, [Validators.required]);
  structureControl = new FormControl<FormStructure | null>(null, [Validators.required]);
  missionTypeIdControl = new FormControl<string | null>(null);

  // Form options
  iconOptions: Option<string>[] = [
    { id: '1', name: '', color: null, value: 'rond', iconUrl: 'assets/icons/rond.svg' },
    { id: '2', name: '', color: null, value: 'rectangle', iconUrl: 'assets/icons/rectangle.svg' },
    { id: '3', name: '', color: null, value: 'triangle', iconUrl: 'assets/icons/triangle.svg' },
    { id: '4', name: '', color: null, value: 'rectangle_2', iconUrl: 'assets/icons/rectangle_2.svg' },
  ];

  constructor() {
    super();

    // Redéfinir le form pour inclure tous les contrôles nécessaires
    this.form = this.fb.group({
      archivedAt: this.archivedAtControl,
      name: this.nameControl,
      color: this.colorControl,
      icon: this.iconControl,
      structure: this.structureControl,
      missionTypeId: this.missionTypeIdControl,
    });
  }

  ngOnInit() {
    // L'initialisation des données se fait automatiquement via AbstractForm
    // grâce aux effects qui appellent setForm() avec les bonnes valeurs

    // Remettre le scroll en haut de la page
    window.scrollTo(0, 0);

    // Récupérer le query param missionTypeId - UNIQUEMENT dans ngOnInit
    // pour éviter tout conflit avec l'initialisation d'AbstractForm
    setTimeout(() => {
      const initialMissionTypeId = this.route.snapshot.queryParams['missionTypeId'];
      if (initialMissionTypeId) {
        // Triple protection : silent, no validators, no dirty marking
        this.missionTypeIdControl.setValue(initialMissionTypeId, {
          emitEvent: false,
          onlySelf: true,
        });
      }
    }, 100);
  }

  /**
   * Surcharge de la méthode de redirection pour gérer le cas particulier
   * où on vient de la page mission-type-details
   */
  protected override getRedirectAfterCreate(createdEntityId: string): string[] | null {
    const missionTypeId = this.missionTypeIdControl.value;

    // Si on a un missionTypeId, on retourne vers la page du mission type
    if (missionTypeId) {
      return ['administration', 'mission-types', missionTypeId];
    }

    // Sinon, comportement par défaut
    return super.getRedirectAfterCreate(createdEntityId);
  }

  // Abstract methods implementation
  setForm(entity: CustomFormOutput): void {
    // Gérer à la fois les entités existantes et les nouveaux formulaires (entity peut être vide)
    // Utiliser emitEvent: false pour éviter les effets de bord pendant l'initialisation
    this.nameControl.setValue(entity?.name || '', { emitEvent: false });
    this.colorControl.setValue(entity?.color || null, { emitEvent: false });

    // Convertir string vers Option<string> pour l'icône en récupérant l'option complète
    const iconOption = entity?.icon ? this.iconOptions.find((option) => option.value === entity.icon) || null : null;
    this.iconControl.setValue(iconOption, { emitEvent: false });

    // Pour un nouveau formulaire, initialiser avec une structure vide
    const defaultStructure = { sections: [] };
    this.structureControl.setValue(entity?.formStructure || defaultStructure, { emitEvent: false });
    this.customFormStructureSignal.set(entity?.formStructure || defaultStructure);

    // Marquer le form comme pristine après l'initialisation
    this.form.markAsPristine();
  }

  getEntityInput(): CustomFormInput {
    // Utiliser la structure du signal en priorité, puis celle du contrôle en fallback
    const structure = this.customFormStructureSignal() || this.structureControl.value || { sections: [] };

    // Ajout de missionTypeId si présent
    const missionTypeId = this.missionTypeIdControl.value;

    const input: CustomFormInput = {
      name: this.nameControl.value || '',
      color: this.colorControl.value || '',
      icon: this.iconControl.value?.value || '',
      structure,
    };

    if (missionTypeId) {
      (input as any).missionTypeId = missionTypeId;
    }

    return input;
  }

  getById(id: string): Observable<CustomFormOutput> {
    return this.customFormsService.customFormsIdGet({ id }).pipe(
      tap((customForm) => {
        this.setForm(customForm);
      }),
    );
  }

  async createEntity(body: CustomFormInput): Promise<string> {
    const result = await firstValueFrom(this.customFormsService.customFormsPost({ body }));
    return result.id;
  }

  async updateEntity(id: string, body: CustomFormInput): Promise<CustomFormOutput> {
    const result = await firstValueFrom(this.customFormsService.customFormsIdPut({ id, body }));
    return result;
  }

  async archiveOrUnarchiveEntity(id: string): Promise<void> {
    if (this.isArchived()) {
      await firstValueFrom(this.customFormsService.customFormsIdUnarchivePost({ id }));
    } else {
      await firstValueFrom(this.customFormsService.customFormsIdDelete({ id }));
    }
  }

  onFormStructureChange(formStructure: FormStructure): void {
    this.customFormStructureSignal.set(formStructure);
    // IMPORTANT: Synchroniser avec le FormControl pour que le formulaire soit valide
    this.structureControl.setValue(formStructure);
    // Marquer le contrôle comme "dirty" pour indiquer qu'il a été modifié
    this.structureControl.markAsDirty();
  }
}
