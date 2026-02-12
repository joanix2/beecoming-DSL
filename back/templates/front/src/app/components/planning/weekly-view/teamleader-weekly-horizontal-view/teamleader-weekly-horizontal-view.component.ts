import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import {
  AffectationTeamLeaderOperatorInput,
  MissionOutput,
  OperatorOutput,
  UserOutput,
  UserTagOutput,
} from '../../../../api/models';
import { DateTime } from 'luxon';
import { TeamleaderGroupedDailyMissionsComponent } from '../teamleader-grouped-daily-missions/teamleader-grouped-daily-missions.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { CommonModule, NgStyle } from '@angular/common';
import { InitialLetterPipe } from '../../../../pipes/initial-letter.pipe';
import { TranslationService } from '../../../../services/translation/translation.service';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { PlanningMatrix, PlanningService } from '../../../../services/planning.service';
import { catchError, firstValueFrom, of } from 'rxjs';
import { UsersService } from '../../../../api/services';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { TooltipOperatorsWorkingDaysComponent } from '../../../ui/planning/tooltip-operators-working-days/tooltip-operators-working-days.component';

@Component({
  selector: 'app-teamleader-weekly-horizontal-view',
  templateUrl: './teamleader-weekly-horizontal-view.component.html',
  styleUrls: ['./teamleader-weekly-horizontal-view.component.scss'],
  imports: [
    TeamleaderGroupedDailyMissionsComponent,
    MatIconModule,
    MatSelectModule,
    NgStyle,
    InitialLetterPipe,
    CdkDrag,
    CdkDragHandle,
    RouterLink,
    DragDropModule,
    CommonModule,
    MatTooltipModule,
    MatTooltip,
    TooltipOperatorsWorkingDaysComponent,
  ],
})
export class TeamleaderWeeklyHorizontalViewComponent implements OnInit {
  tr = inject(TranslationService);
  planningService = inject(PlanningService);
  usersService = inject(UsersService);
  toastr = inject(ToastrService);
  overlay = inject(Overlay);
  private overlayRef?: OverlayRef;

  daysOfTheWeek = this.planningService.daysOfTheWeek;

  showDate = model(false);

  availableOperators = this.planningService.availableOperators;

  // la liste utilisée pour la selection (MatSelect) => les opérateurs choisis sont au top de la liste
  // les opérateurs non choisis sont en bas de la liste
  // les opérateurs choisis sont marqués avec les jours de travail (days) pour l'overlay tooltip
  orderedAvailableOperators = linkedSignal(() => {
    let availableOperators = this.availableOperators();
    availableOperators = structuredClone(availableOperators);
    const affectedOperators = this.teamleader()?.affectedOperators || [];

    // liste des opérateur affectés, sans doublons
    const affectedUserIds = new Set(affectedOperators.map((op) => op.userId));
    const affectedAvailableOperators = availableOperators.filter((op) => affectedUserIds.has(op.userId));

    // marquer les opérateurs choisis avec leurs jours de travail
    affectedUserIds.forEach((id) => {
      const operator = affectedAvailableOperators.find((op) => op.userId === id);
      if (operator) {
        operator.days = this.getWorkingDays(affectedOperators.filter((aff) => aff.userId === id));
      }
    });

    const freeOperators = availableOperators.filter((op) => !affectedUserIds.has(op.userId));

    return [
      ...affectedAvailableOperators.sort((a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? '')),
      ...freeOperators.sort((a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? '')),
    ];
  });

  // indicateur si tous les opérateurs choisis travaillent tous les jours
  areAllFullTimeOperators = linkedSignal(() => {
    const orderedAvailableOperators = this.orderedAvailableOperators();
    return orderedAvailableOperators
      .filter((op) => op.days)
      .every((op) => op.days?.length === this.daysOfTheWeek().length);
  });

  availableIds = input<string[][]>([]); // liste des ids des jours et des teamleaders pour le drag and drop
  teamleader = model<UserTagOutput>();
  missions = input.required<{ [key: string]: MissionOutput[] }>();

  constructor() {}

  drop($event: any) {}

  ngOnInit() {
    const defaults = this.orderedAvailableOperators();
  }

  onAffectedMissionsChange(dayIndex: number, updatedMissions: MissionOutput[]) {}

  compareById = (a: OperatorOutput, b: OperatorOutput) => a && b && a.userId === b.userId;

  // methode qui permet d'affecter des opérateurs à un teamleader
  async affectOperator(operatorIds: OperatorOutput[]) {
    // verifier si la liste des opérateurs a changé
    const oldOperatorIds = this.teamleader()?.affectedOperators?.map((op) => op.userId ?? '') ?? [];
    const newOperatorIds = operatorIds.map((op) => op.userId ?? '');

    if (
      oldOperatorIds.every((id) => newOperatorIds.includes(id)) &&
      newOperatorIds.every((id) => oldOperatorIds.includes(id))
    ) {
      return;
    }
    const periodeStart =
      DateTime.now() > this.daysOfTheWeek()[0]
        ? DateTime.now().startOf('day').toISO()
        : (this.daysOfTheWeek()[0].startOf('day').toISO() ?? undefined);
    const periodeEnd = this.daysOfTheWeek()[this.daysOfTheWeek().length - 1].endOf('day').toISO() ?? undefined;
    try {
      await firstValueFrom(
        this.usersService.usersAffectOperatorsPatch({
          body: {
            operatorsIds: operatorIds.map((op) => op.userId ?? ''),
            teamleaderId: this.teamleader()!.id,
            startedAt: periodeStart,
            endedAt: periodeEnd,
          },
        }),
      );
    } catch (ex: any) {
      this.toastr.error(this.tr.language().AFFECTATION_OPERATOR_ERROR_OCCURED);
    } finally {
      await this.planningService.getAvailableOperators();
      await this.planningService.fetchTeams();
    }
  }

  // methode qui permet de récupérer les jours de travail d'un opérateur
  getWorkingDays(affectations: OperatorOutput[]): DateTime[] {
    const workingDays: DateTime[] = [];
    this.daysOfTheWeek().forEach((day) => {
      if (
        affectations.some(
          (aff) =>
            aff.dateFrom &&
            day >= DateTime.fromISO(aff.dateFrom ?? '') &&
            (day <= DateTime.fromISO(aff.dateTo ?? '') || !aff.dateTo),
        )
      ) {
        workingDays.push(day);
      }
    });
    return workingDays;
  }

  // overlay tooltip operators working days
  openTooltip(origin: HTMLElement) {
    const operators = this.orderedAvailableOperators().filter((op) => op.days);
    if (operators.length === 0) {
      return;
    }
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions([{ originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' }]);

    this.overlayRef = this.overlay.create({ positionStrategy });

    const tooltipPortal = new ComponentPortal(TooltipOperatorsWorkingDaysComponent);
    const tooltipRef = this.overlayRef.attach(tooltipPortal);

    tooltipRef.instance.operators.set(operators);
  }

  closeTooltip() {
    this.overlayRef?.dispose();
  }
}
