import { ChangeDetectorRef, Component, computed, effect, inject, signal, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { firstValueFrom, Observable, tap } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import {
  AddressInput,
  AddressOutput,
  MissionInput,
  MissionOutput,
  MissionStatusOutput,
  MissionTypeOutput,
  UserOutput,
} from '../../../../api/models';
import {
  ClientsService,
  CustomFormsService,
  EmployeesService,
  MissionsService,
  OrdersService,
  OrderTypesService,
} from '../../../../api/services';
import { MissionStatusesService } from '../../../../api/services/mission-statuses.service';
import { MissionTypesService } from '../../../../api/services/mission-types.service';
import { DetailTopbarComponent } from '../../../../components/detail-topbar/detail-topbar.component';
import { AddressComponent } from '../../../../components/fields/address/address.component';
import { Option } from '../../../../components/fields/custom-types';
import { EditDateFieldComponent } from '../../../../components/fields/edit-date-field/edit-date-field.component';
import { EditSelectFieldComponent } from '../../../../components/fields/edit-select-field/edit-select-field.component';
import { EditTextFieldComponent } from '../../../../components/fields/edit-text-field/edit-text-field.component';
import { EditTextareaFieldComponent } from '../../../../components/fields/edit-textarea-field/edit-textarea-field.component';
import { CustomFormsAnswerDetailsComponent } from '../../../../components/missions/custom-forms-answer-details/custom-forms-answer-details.component';
import { DocumentsListComponent } from '../../../../components/missions/documents-list/documents-list.component';
import { ImagesCarouselComponent } from '../../../../components/missions/images-carousel/images-carousel.component';
import { AbstractForm } from '../../../abstract-form.component';
import { CommandeMissionService } from '../../service/commande-mission.service';
import { RequestConfirmationDialogComponent } from '../../../../components/request-confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { TooltipOperatorsWorkingDaysComponent } from '../../../../components/ui/planning/tooltip-operators-working-days/tooltip-operators-working-days.component';
import { DateTime } from 'luxon';
import { OperatorExtended, PlanningService } from '../../../../services/planning.service';

// Validator personnalisé pour vérifier que la date de fin est postérieure à la date de début
export function dateRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const startDate = control.get('dateFrom')?.value;
    const endDate = control.get('dateTo')?.value;

    if (!startDate || !endDate) {
      return null; // Ne pas valider si l'une des dates est manquante
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return { dateRange: { message: 'La date de fin ne peut pas être antérieure à la date de début' } };
    }

    return null;
  };
}

@Component({
  selector: 'app-mission-details',
  standalone: true,
  templateUrl: './mission-details.component.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    EditTextFieldComponent,
    EditTextareaFieldComponent,
    EditSelectFieldComponent,
    MatProgressSpinnerModule,
    DetailTopbarComponent,
    MatTabsModule,
    MatIconModule,
    DocumentsListComponent,
    ImagesCarouselComponent,
    EditDateFieldComponent,
    AddressComponent,
    CustomFormsAnswerDetailsComponent,
  ],
})
export class MissionDetailsComponent extends AbstractForm<MissionInput, MissionOutput> {
  // Services
  cdr = inject(ChangeDetectorRef);
  ordersService = inject(OrdersService);
  orderTypesService = inject(OrderTypesService);
  clientsService = inject(ClientsService);
  missionTypesService = inject(MissionTypesService);
  missionStatusesService = inject(MissionStatusesService);
  employeesService = inject(EmployeesService);
  missionsService = inject(MissionsService);
  customFormsService = inject(CustomFormsService);
  commandeMissionService = inject(CommandeMissionService);
  planningService = inject(PlanningService);
  matDialog = inject(MatDialog);
  overlay = inject(Overlay); // tooltip custom
  private overlayRef?: OverlayRef;
  // Abstract properties implementation
  entityListRouteName = ['missions'];
  entityRouteName = ['missions'];
  onCreateSuccessMessage = this.tr.language().MISSION_CREATED;
  onCreateErrorMessage = this.tr.language().ERROR;
  onUpdateSuccessMessage = 'Mission mise à jour avec succès';
  onUpdateErrorMessage = this.tr.language().ERROR;
  onArchivedMessage = 'Mission archivée avec succès';
  onUnarchivedMessage = 'Mission désarchivée avec succès';
  onArchivedErrorMessage = "Erreur lors de l'archivage de la mission";
  onUnarchivedErrorMessage = 'Erreur lors du désarchivage de la mission';

  // Computed
  title = computed(() => {
    const mission = this.entitySignal();
    if (this.isNew()) return this.tr.language().ADD_MISSION;
    const name = mission?.name ?? '';
    return this.editMode() ? `${this.tr.language().EDIT_MISSION} - ${name}` : name;
  });
  warningMultiTeamLeader = signal(false);
  warningHoles = signal(false);
  daysOfTheWeek = this.planningService.daysOfTheWeek;
  showWeekend = this.planningService.isShowWeekendSignal;

  // Signal pour le mode d'édition du type de mission (éditable seulement à la création)
  missionTypeEditMode = signal<boolean>(false);

  // Flag pour éviter les appels multiples lors de la programmation des valeurs
  private isSettingTypeProgrammatically = false;

  // Form Controls
  nameControl = new FormControl('', [Validators.required]);
  typeControl = new FormControl<Option<MissionTypeOutput> | null>(null, [Validators.required]);
  statusControl = new FormControl<Option<MissionStatusOutput> | null>(null, [Validators.required]);
  startDateControl = new FormControl<Date | null>(new Date(), [Validators.required]);
  endDateControl = new FormControl<Date | null>(null, [Validators.required]);
  addressControl = new FormControl<AddressInput | null>({} as AddressInput);
  commentControl = new FormControl('');
  orderIdControl = new FormControl('');
  teamLeaderControl = new FormControl<Option<UserOutput> | null>(null);

  // Select options
  missionTypes: Option<MissionTypeOutput>[] = [];
  status: Option<MissionStatusOutput>[] = [];
  teamLeaders = signal<Option<UserOutput>[]>([]);

  // Specific signals for missions
  orderId = signal<string | null>(null);

  // Signal pour indiquer que les données de base sont chargées
  initialDataLoaded = signal<boolean>(false);

  // Signaux pour les contraintes de dates
  minEndDate = signal<Date | null>(null);
  maxStartDate = signal<Date | null>(null);

  // Reference to custom forms component
  @ViewChild('customFormsComponent') customFormsComponent?: CustomFormsAnswerDetailsComponent;

  constructor() {
    super();

    // update the warning multi team leader when the mission changes
    effect(() => {
      const mission = this.entitySignal();
      if (mission) {
        this.warningMultiTeamLeader.set(this.checkIfMissionHasMultipleTeamLeaders(mission));
        this.warningHoles.set(this.checkIfMissionHasWholes(mission));
      }
    });

    // Redéfinir le form pour inclure tous les contrôles nécessaires
    this.form = this.fb.group(
      {
        archivedAt: this.archivedAtControl, // Nécessaire pour AbstractForm
        name: this.nameControl,
        status: this.statusControl,
        type: this.typeControl,
        dateFrom: this.startDateControl,
        dateTo: this.endDateControl,
        address: this.addressControl,
        comment: this.commentControl,
        orderId: this.orderIdControl,
        teamLeader: this.teamLeaderControl,
      },
      { validators: [dateRangeValidator()] },
    );

    // Écouter les changements de dates pour mettre à jour les contraintes
    this.startDateControl.valueChanges.subscribe(() => {
      this.updateDateConstraints();
    });

    this.endDateControl.valueChanges.subscribe(() => {
      this.updateDateConstraints();
    });

    // Écouter les changements du type de mission pour récupérer les custom forms
    this.typeControl.valueChanges.pipe(distinctUntilChanged()).subscribe(async (selectedType) => {
      // Éviter les appels multiples lors de la programmation des valeurs
      if (this.isSettingTypeProgrammatically) {
        return;
      }

      if (this.isNew() && selectedType?.value?.id) {
        await this.fetchCustomFormsForMissionType(selectedType.value.id);
      }
    });

    // Charger les données de base de façon asynchrone
    this.loadInitialData();
  }
  private updateDateConstraints(): void {
    const startDate = this.startDateControl.value;
    const endDate = this.endDateControl.value;

    // Mettre à jour la date minimum pour la date de fin
    if (startDate) {
      this.minEndDate.set(startDate);
    } else {
      this.minEndDate.set(null);
    }

    // Mettre à jour la date maximum pour la date de début
    if (endDate) {
      this.maxStartDate.set(endDate);
    } else {
      this.maxStartDate.set(null);
    }
  }

  async loadInitialData() {
    // Charger les données de base d'abord
    await this.fetchMissionTypes();
    await this.fetchStatusOptions();
    await this.fetchTeamLeaders();

    // Marquer que les données initiales sont chargées
    this.initialDataLoaded.set(true);

    // Mettre à jour le mode d'édition du type de mission
    this.missionTypeEditMode.set(this.isNew());

    // Gérer les query params spécifiques aux missions
    const orderId = this.route.snapshot.queryParams['orderId'];
    const isEdit = this.route.snapshot.queryParams['isEdit'];
    this.orderId.set(orderId ?? null);

    if (orderId) {
      const order = await firstValueFrom(this.ordersService.ordersOrderIdGet({ orderId }));

      this.addressControl.setValue(order.address as AddressInput);
    }

    // Logique spécifique pour les nouvelles missions
    if (this.isNew()) {
      if (this.status.length > 0 && !this.statusControl.value) {
        this.statusControl.setValue(this.status[0]);
      }

      if (this.orderId()) {
        this.orderIdControl.setValue(this.orderId());
      }
    }

    if (isEdit === 'true') {
      this.editMode.set(true);
      // delete the query params
      this.route.queryParams.subscribe((params) => {
        delete params['isEdit'];
      });
    }
  }

  /* Abstract methods implementation */
  getById(id: string): Observable<MissionOutput> {
    return this.missionsService.missionsIdGet({ id }).pipe(
      tap((mission) => {
        this.orderId.set(mission.orderId ?? null);
      }),
    );
  }

  checkIfMissionHasMultipleTeamLeaders(mission: MissionOutput): boolean {
    const distinctTeamleadersIds = [
      ...new Set(mission?.affectationMissionXTeamLeaders?.map((aff) => aff.teamLeaderId)),
    ];
    return distinctTeamleadersIds.length > 1;
  }

  checkIfMissionHasWholes(mission: MissionOutput): boolean {
    if (!mission.dateFrom || !mission.dateTo) {
      return false;
    }

    const startDate = DateTime.fromISO(mission.dateFrom);
    const endDate = DateTime.fromISO(mission.dateTo);

    if (!startDate.isValid || !endDate.isValid) {
      return false;
    }

    // Get all affectation dates for this mission
    const affectationDates = new Set(
      mission.affectationMissionXTeamLeaders?.map((aff) =>
        DateTime.fromISO(aff.assignedAt ?? '')
          .toJSDate()
          .toDateString(),
      ) ?? [],
    );

    // Iterate through each day in the mission's date range
    let currentDate = startDate.startOf('day');

    while (currentDate <= endDate) {
      // Check if we should consider this day based on showWeekend setting
      const isWeekend = currentDate.weekday > 5; // Saturday = 6, Sunday = 7
      const shouldCheckDay = this.showWeekend() || !isWeekend;

      if (shouldCheckDay) {
        const dayString = currentDate.toJSDate().toDateString();

        // If this day doesn't have an affectation, we have a "hole"
        if (!affectationDates.has(dayString)) {
          return true;
        }
      }

      currentDate = currentDate.plus({ days: 1 });
    }

    return false;
  }

  async createEntity(body: MissionInput): Promise<string> {
    return await firstValueFrom(this.missionsService.missionsPost({ body }));
  }

  async updateEntity(id: string, body: MissionInput): Promise<MissionOutput> {
    return await firstValueFrom(this.missionsService.missionsIdPut({ id, body }));
  }

  async archiveOrUnarchiveEntity(id: string): Promise<void> {
    try {
      let message = '';
      let title = '';
      if (!this.isArchived()) {
        message = 'Voulez-vous archiver cette mission ?';
        title = 'Archiver';
      } else {
        message = 'Voulez-vous désarchiver cette mission ?';
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
        await firstValueFrom(this.missionsService.missionsIdUnarchivePost({ id }));
      } else {
        await firstValueFrom(this.missionsService.missionsIdDelete({ id }));
      }
    } catch (error: any) {
      this.toastr.error(this.tr.get(error.error), this.onArchivedErrorMessage);
    }
  }

  setForm(entity: MissionOutput): void {
    if (!this.initialDataLoaded()) {
      setTimeout(() => this.setForm(entity), 100);
      return;
    }

    if (!this.status || this.status.length === 0) {
      return;
    }

    // Mettre à jour le mode d'édition du type de mission (éditable seulement à la création)
    this.missionTypeEditMode.set(this.isNew());

    // Trouver l'option complète de type de mission (avec iconUrl)
    const optionType = this.missionTypes.find((option) => option.value.id === entity.type?.id) || null;

    // Trouver l'option complète de statut
    const optionStatus = this.status.find((option) => option.value.id === entity.status?.id) || null;

    const teamLeader = this.teamLeaders()
      .map((option) => option.value)
      .find((t) => t.id === entity.teamLeader?.id);

    const optionTeamLeader = teamLeader
      ? {
          id: teamLeader?.id ?? '',
          name: `${teamLeader?.firstname} ${teamLeader?.lastname}`,
          value: teamLeader,
          color: null,
        }
      : (this.teamLeaders()?.[0] ?? null);

    this.orderId.set(entity.orderId ?? null);
    this.nameControl.setValue(entity.name ?? '');
    this.statusControl.setValue(optionStatus);

    // Marquer que nous programmons la valeur pour éviter les appels multiples
    this.isSettingTypeProgrammatically = true;
    this.typeControl.setValue(optionType);
    this.isSettingTypeProgrammatically = false;

    this.startDateControl.setValue(entity.dateFrom ? new Date(entity.dateFrom) : new Date());
    this.endDateControl.setValue(entity.dateTo ? new Date(entity.dateTo) : null);
    this.addressControl.setValue(entity.address as AddressInput);
    this.commentControl.setValue(entity.comments ?? '');
    this.orderIdControl.setValue(entity.orderId ?? null);
    this.teamLeaderControl.setValue(optionTeamLeader as Option<UserOutput>);
  }

  getEntityInput(): MissionInput {
    const startDate = this.convertDateToISOString(this.startDateControl.value);
    const endDate = this.convertDateToISOString(this.endDateControl.value);

    // Récupérer les données des custom forms depuis le composant enfant
    const customFormResponses = this.customFormsComponent?.generateCustomFormResponsesSync() || [];

    const missionInput: MissionInput = {
      name: this.nameControl.value || '',
      orderId: this.orderId(),
      typeId: this.typeControl.value?.id ?? '',
      statusId: this.statusControl.value?.id ?? '',
      teamLeaderId: this.teamLeaderControl.value?.id !== '' ? this.teamLeaderControl.value?.id : null,
      dateFrom: startDate,
      dateTo: endDate,
      address: this.addressControl.value || undefined,
      comments: this.commentControl.value || undefined,
      customFormResponses: customFormResponses,
    };

    return missionInput;
  }

  /* Méthodes spécifiques aux missions */
  private convertDateToISOString(dateValue: any): string {
    if (!dateValue) {
      return '';
    }

    // Si c'est déjà une instance de Date
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue.toISOString();
    }

    // Si c'est un objet date-like (par exemple de Angular Material)
    if (dateValue && typeof dateValue === 'object') {
      // Essayer de créer une nouvelle Date à partir de l'objet
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    // Si c'est une string
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    return '';
  }

  async getAddressFromOrder(orderId: string | null): Promise<AddressInput> {
    if (!orderId) {
      return {} as AddressInput;
    }

    const order = await firstValueFrom(this.ordersService.ordersOrderIdGet({ orderId }));
    return order.address as AddressInput;
  }

  private async fetchMissionTypes() {
    try {
      const result = await firstValueFrom(this.missionTypesService.missionTypesGet());
      this.missionTypes =
        result.value?.map((type) => ({
          id: type.id,
          name: type.name ?? type.id,
          iconUrl: `assets/icons/${type.icon}.svg`,
          value: type,
          color: type.color,
        })) ?? [];
    } catch {
      this.toastr.error(this.tr.language().ERROR);
    }
  }

  private async fetchStatusOptions() {
    try {
      const result = await firstValueFrom(this.missionStatusesService.missionStatusesGet());
      this.status =
        result.map((status) => ({
          id: status.id ?? '',
          name: status.name ?? status.id ?? '',
          value: status,
          color: status.color,
        })) ?? [];
    } catch {
      this.toastr.error(this.tr.language().ERROR);
    }
  }

  async fetchTeamLeaders() {
    const employees = await firstValueFrom(this.employeesService.employeesTeamleadersListGet());

    const teamLeadersOptions: Option<UserOutput>[] =
      employees?.map(
        (employee): Option<UserOutput> => ({
          id: employee.id ?? '',
          name: `${employee.firstname} ${employee.lastname}`,
          value: employee,
          color: null,
        }),
      ) || [];

    teamLeadersOptions.unshift({
      id: '',
      name: this.tr.language().MISSION_NO_TEAM_LEADER,
      value: {
        id: '',
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        role: '',
        archivedAt: '',
      } as UserOutput,
      color: null,
    });

    this.teamLeaders.set(teamLeadersOptions);
  }

  private async fetchCustomFormsForMissionType(typeId: string) {
    try {
      const customForms = await firstValueFrom(
        this.customFormsService.customFormsByMissionTypeMissionTypeIdBaseAnswerGet({ missionTypeId: typeId }),
      );

      // Convertir les CustomFormWithBaseAnswerOutput en CustomFormWithSavedDataOutput
      const convertedCustomForms = customForms.map((customForm) => ({
        archivedAt: customForm.archivedAt,
        color: customForm.color,
        exportFileName: customForm.exportFileName,
        exportFileUrl: customForm.exportFileUrl,
        formStructure: customForm.formStructure,
        icon: customForm.icon,
        id: customForm.id,
        missionTypeId: customForm.missionTypeId,
        missionTypeName: customForm.missionTypeName,
        name: customForm.name,
        savedData: customForm.customFormData || { sections: [] },
      }));

      // Mettre à jour les custom forms dans le composant enfant
      if (this.customFormsComponent) {
        this.customFormsComponent.setupCustomFormsData(convertedCustomForms);
      }
    } catch (error) {
      console.error('Error fetching custom forms for mission type:', error);
      this.toastr.error(this.tr.language().ERROR);
    }
  }

  // overlay tooltip operators working days
  openTooltip(origin: HTMLElement) {
    const mission = this.entitySignal();
    const distinctTeamleaders = new Map(
      mission?.affectationMissionXTeamLeaders?.map((aff) => [aff.teamLeaderId, aff.teamLeader]),
    );
    const teamleadersIds = [...distinctTeamleaders.keys()];
    const teamleaders = [...distinctTeamleaders.values()].map(
      (tl) =>
        ({ ...tl, userId: tl?.id ?? '', fullName: `${tl?.firstname ?? ''} ${tl?.lastname ?? ''}` }) as OperatorExtended,
    );

    teamleaders.forEach((tl) => {
      tl.days = mission?.affectationMissionXTeamLeaders
        ?.sort((a, b) =>
          DateTime.fromISO(a.assignedAt ?? '')
            .diff(DateTime.fromISO(b.assignedAt ?? ''))
            .toMillis(),
        )
        ?.filter((aff) => aff.teamLeaderId == tl.userId)
        .map((aff) => DateTime.fromISO(aff.assignedAt ?? ''));
    });

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions([{ originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' }]);

    this.overlayRef = this.overlay.create({ positionStrategy });

    const tooltipPortal = new ComponentPortal(TooltipOperatorsWorkingDaysComponent);
    const tooltipRef = this.overlayRef.attach(tooltipPortal);

    tooltipRef.instance.operators.set(teamleaders);
    tooltipRef.instance.showDays.set(false);
    if (this.warningHoles()) {
      tooltipRef.instance.message.set(this.tr.language().MISSION_HOLES);
    }
  }

  closeTooltip() {
    this.overlayRef?.dispose();
  }
}
