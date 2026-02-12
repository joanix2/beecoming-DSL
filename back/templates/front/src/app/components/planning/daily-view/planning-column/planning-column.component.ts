import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgStyle } from '@angular/common';
import { Component, computed, effect, inject, linkedSignal, model, OnInit, signal, untracked } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { MissionOutput, OperatorOutput, UserOutput, UserTagOutput } from '../../../../api/models';
import { AppService } from '../../../../services/app.service';
import { MissionCardDailyComponent } from '../mission-card-daily/mission-card-daily.component';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MissionsService, UsersService } from '../../../../api/services';
import { firstValueFrom } from 'rxjs';
import { DateTime } from 'luxon';
import { InitialLetterPipe } from '../../../../pipes/initial-letter.pipe';
import { PlanningService } from '../../../../services/planning.service';
import { ToastrService } from 'ngx-toastr';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-planning-column',
  imports: [
    NgStyle,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    MatIcon,
    MissionCardDailyComponent,
    MatSelectModule,
    InitialLetterPipe,
    RouterLink,
    MatTooltip,
  ],
  templateUrl: './planning-column.component.html',
  styleUrls: ['./planning-column.component.scss'],
})
export class PlanningColumnComponent {
  appService = inject(AppService);
  missionsService = inject(MissionsService);
  usersService = inject(UsersService);
  planningService = inject(PlanningService);
  router = inject(Router);
  toastr = inject(ToastrService);

  teamleader = model.required<UserTagOutput>(); // utilisateur
  datePlanning = this.planningService.selectedDateSignal;
  availableOperators = this.planningService.availableOperators;
  orderedAvailableOperators = linkedSignal(() => {
    const availableOperators = this.availableOperators();
    const affectedOperators = this.teamleader().affectedOperators || [];

    const affectedUserIds = new Set(affectedOperators.map((op) => op.userId));

    const affectedAvailableOperators = availableOperators.filter((op) => affectedUserIds.has(op.userId));
    const freeOperators = availableOperators.filter((op) => !affectedUserIds.has(op.userId));

    return [
      ...affectedAvailableOperators.sort((a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? '')),
      ...freeOperators.sort((a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? '')),
    ];
  });

  userIds = model.required<string[]>(); // liste des ids des utilisateurs pour le drag and drop

  tooltipOperators = computed(() => {
    const teamleader = this.teamleader();
    return teamleader.affectedOperators?.map((operator) => operator.fullName).join(', ');
  });

  assignedMissions = computed(() => {
    const missions = this.planningService.missions();
    return (
      missions
        ?.filter((mission) =>
          mission.affectationMissionXTeamLeaders?.some(
            (affectation) =>
              affectation.teamLeaderId === this.teamleader().id &&
              new Date(affectation.assignedAt ?? '').toISOString() === this.datePlanning().toJSDate().toISOString(),
          ),
        )
        .sort(
          (a, b) =>
            (a.affectationMissionXTeamLeaders?.[0]?.orderIndex ?? 0) -
            (b.affectationMissionXTeamLeaders?.[0]?.orderIndex ?? 0),
        ) ?? []
    );
  });

  async drop(event: CdkDragDrop<MissionOutput[], any>, positionFromHtml?: number) {
    if (event.previousContainer === event.container) {
      try {
        moveItemInArray(this.assignedMissions(), event.previousIndex, event.currentIndex);
        await firstValueFrom(
          this.missionsService.missionsReArrangPut({
            affectationId: event.item.data.mission.affectationMissionXTeamLeaders?.[0]?.id ?? '',
            orderIndex: event.currentIndex,
          }),
        );
      } catch (error) {
        console.error('Error occurred while handling drop:', error);
      }
    } else {
      const oldOrders = [...this.assignedMissions()];
      try {
        let mission = (event.item.data as any).mission as MissionOutput;
        console.log('mission', mission);

        // Mettre à jour la mission dans l'API
        const missionUpdated = await firstValueFrom(
          this.missionsService.missionsAssignPut({
            missionId: mission.id,
            teamleaderId: this.teamleader().id,
            dateFrom: this.datePlanning().toISODate() ?? undefined,
            orderIndex: event.currentIndex,
          }),
        );

        await this.planningService.FetchAllMissionsInInterval();

        mission = missionUpdated;

        mission = { ...mission };

        // Insérer à la position de drop
        const missions = structuredClone(this.assignedMissions());
        missions.splice(event.currentIndex, 0, mission);
      } catch (error) {
        this.toastr.error('Erreur lors du drop');
        console.error('Error occurred while handling drop:', error);
      }
    }
  }

  compareById = (a: OperatorOutput, b: OperatorOutput) => a && b && a.userId === b.userId;

  async affectOperator(event: OperatorOutput[]) {
    const oldOperatorIds = this.teamleader().affectedOperators?.map((op) => op.userId ?? '') ?? [];
    const newOperatorIds = (event as OperatorOutput[]).map((op: OperatorOutput) => op.userId!) ?? [];
    if (
      oldOperatorIds.every((id) => newOperatorIds.includes(id)) &&
      newOperatorIds.every((id) => oldOperatorIds.includes(id))
    ) {
      return;
    }

    const ides = (event as OperatorOutput[]).map((op: OperatorOutput) => op.userId!);
    await firstValueFrom(
      this.usersService.usersAffectOperatorsPatch({
        body: {
          operatorsIds: ides,
          teamleaderId: this.teamleader().id,
          startedAt: this.datePlanning().startOf('day').toISO() ?? undefined,
          endedAt: this.datePlanning().endOf('day').set({ millisecond: 0 }).toISO() ?? undefined,
        },
      }),
    );
    await this.planningService.fetchTeams();
  }

  shouldDisableDrag() {
    return DateTime.now().toJSDate() > this.datePlanning().endOf('day').set({ millisecond: 0 }).toJSDate();
  }
}
