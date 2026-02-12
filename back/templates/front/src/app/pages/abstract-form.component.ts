import { computed, Directive, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom, Observable } from 'rxjs';
import { WithLoading } from '../../utils/decorator';
import { FIELD_ERRORS } from '../components/fields/custom-errors';
import { ICanDeactivate } from '../interfaces/can-deactivate';
import { AppService } from '../services/app.service';
import { TranslationService } from '../services/translation/translation.service';

interface IArchivable {
  archivedAt?: string | null;
}

@Directive()
export abstract class AbstractForm<K, T extends IArchivable> implements ICanDeactivate {
  FIELD_ERRORS = FIELD_ERRORS;

  route = inject(ActivatedRoute);
  appService = inject(AppService);
  toastr = inject(ToastrService);
  tr = inject(TranslationService);
  fb = inject(FormBuilder);

  editMode = signal(false);
  entityIdSignal = signal('');
  entitySignal = signal<T | null>(null);
  loading = signal(false);

  abstract entityListRouteName: string[];
  abstract entityRouteName: string[];
  abstract onCreateSuccessMessage: string;
  abstract onCreateErrorMessage: string;
  abstract onUpdateSuccessMessage: string;
  abstract onUpdateErrorMessage: string;
  abstract onArchivedMessage: string;
  abstract onUnarchivedMessage: string;
  abstract onArchivedErrorMessage: string;
  abstract onUnarchivedErrorMessage: string;

  form!: FormGroup;
  archivedAtControl = new FormControl<string | null>(null);

  isNew = computed(() => this.entityIdSignal() === 'new');

  isArchived = computed(() => Boolean(this.entitySignal()?.archivedAt));

  abstract title: ReturnType<typeof computed>;

  constructor() {
    this.form = this.fb.group({
      archivedAt: this.archivedAtControl,
    });

    const id = this.route.snapshot.params['id'];
    if (!id) {
      this.goBack();
      return;
    }

    this.entityIdSignal.set(id);

    // Effect 1: Gérer l'état enable/disable du form et setForm si entitySignal change
    effect(() => {
      const edit = this.editMode();
      edit ? this.form.enable() : this.form.disable();

      const entity = this.entitySignal();
      const untractedIsNew = untracked(() => this.isNew());
      if (entity && !untractedIsNew) {
        this.setForm(entity);
      }
    });

    // Effect 2: Fetch entity quand entityIdSignal change
    effect(async () => {
      const id = this.entityIdSignal();

      // Éviter les boucles: ne fetch que si l'id change vraiment
      if (id && id !== 'new') {
        await this.fetchEntity(id);
      } else if (id === 'new') {
        await this.fetchEntity(id);
      }
    });
  }

  @WithLoading('loading')
  async fetchEntity(id: string) {
    if (id === 'new') {
      this.editMode.set(true);
      // Pour les nouvelles entités, assigner une entité vide pour que les effects
      // se déclenchent et appellent setForm() automatiquement
      this.entitySignal.set({} as T);
      return;
    }

    try {
      const entity = await firstValueFrom(this.getById(id));
      this.entitySignal.set(entity);
    } catch (error) {
      console.error('❌ Error fetching entity:', error);
      throw error;
    }
  }

  abstract setForm(entity: T): void;

  abstract getEntityInput(): K;

  abstract getById(id: string): Observable<T>;

  abstract createEntity(body: K): Promise<string>; // return new ID

  abstract updateEntity(id: string, body: K): Promise<T>;

  abstract archiveOrUnarchiveEntity(id: string): Promise<void>;

  /**
   * Méthode pour personnaliser la redirection après création
   * Par défaut, redirige vers la page de détail de l'entité créée
   * Peut être surchargée dans les composants enfants pour un comportement personnalisé
   */
  protected getRedirectAfterCreate(createdEntityId: string): string[] | null {
    return [...this.entityRouteName, createdEntityId];
  }

  @WithLoading('loading')
  submit() {
    this.form.markAllAsTouched();
    if (!this.form.valid) return;

    const body = this.getEntityInput();
    if (this.isNew()) {
      this.handleCreate(body);
    } else {
      this.handleUpdate(this.entityIdSignal(), body, this.onUpdateSuccessMessage, this.onUpdateErrorMessage);
    }
  }

  private async handleCreate(body: K) {
    try {
      const id = await this.createEntity(body);
      this.toastr.success(this.onCreateSuccessMessage);

      // Mettre à jour l'ID avant de récupérer l'entité
      this.entityIdSignal.set(id);

      // Récupérer l'entité créée pour avoir les données complètes
      try {
        const createdEntity = await firstValueFrom(this.getById(id));
        this.entitySignal.set(createdEntity);
      } catch (fetchError) {
        console.warn('Could not fetch created entity, entity will be fetched on navigation:', fetchError);
      }

      // Utiliser la méthode de redirection personnalisable
      const redirectPath = this.getRedirectAfterCreate(id);
      if (redirectPath) {
        this.appService.goTo(redirectPath);
      }
      this.editMode.set(false);
    } catch (error: any) {
      this.toastr.error(this.tr.get(error.error), this.onCreateErrorMessage);
    }
  }

  private async handleUpdate(id: string, body: K, successMessage?: string, errorMessage?: string) {
    try {
      const entity = await this.updateEntity(id, body);
      this.entitySignal.set(entity);
      this.toastr.success(successMessage);
      this.editMode.set(false);
    } catch (error: any) {
      this.toastr.error(this.tr.get(error.error), errorMessage);
    }
  }

  private async handleArchiveOrUnarchive(id: string, body: K, successMessage?: string, errorMessage?: string) {
    try {
      await this.archiveOrUnarchiveEntity(id);
      this.entitySignal.set(null);
      this.toastr.success(successMessage);

      if (this.isArchived()) {
        this.appService.goTo([...this.entityRouteName, id]);
      } else {
        this.goBack();
      }
    } catch (error: any) {
      this.toastr.error(this.tr.get(error.error), errorMessage);
    }
  }

  goBack(): void {
    this.appService.goTo([...this.entityListRouteName]);
  }

  archiveOrUnarchive() {
    let successMessage = '';
    let errorMessage = '';

    if (this.isArchived()) {
      this.archivedAtControl.setValue(new Date().toISOString());
      successMessage = this.onUnarchivedMessage;
      errorMessage = this.onUnarchivedErrorMessage;
    } else {
      this.archivedAtControl.setValue(null);
      successMessage = this.onArchivedMessage;
      errorMessage = this.onArchivedErrorMessage;
    }

    const id = this.entityIdSignal();
    const body = this.getEntityInput();
    this.handleArchiveOrUnarchive(id, body, successMessage, errorMessage);
  }

  cancelEdition(): void {
    const entity = this.entitySignal();
    if (!entity) return;

    this.setForm(entity);
    this.editMode.set(false);

    if (this.isNew()) {
      this.goBack();
    }
  }

  canDeactivate(): boolean {
    if (!this.editMode() || this.isNew()) return true;
    return !this.form.dirty;
  }
}
