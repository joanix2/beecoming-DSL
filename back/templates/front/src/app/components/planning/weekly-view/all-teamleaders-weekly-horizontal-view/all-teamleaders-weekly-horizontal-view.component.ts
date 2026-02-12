import { Component, computed, effect, inject, model, signal, untracked } from '@angular/core';
import { DateTime } from 'luxon';
import { MissionOutput, UserTagOutput } from '../../../../api/models';
import { TeamleaderWeeklyHorizontalViewComponent } from '../teamleader-weekly-horizontal-view/teamleader-weekly-horizontal-view.component';
import { MissionsService } from '../../../../api/services';
import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkConnectedOverlay } from '@angular/cdk/overlay';
import { PlanningMatrix, PlanningService } from '../../../../services/planning.service';

@Component({
  selector: 'app-all-teamleaders-weekly-horizontal-view',
  templateUrl: './all-teamleaders-weekly-horizontal-view.component.html',
  styleUrls: ['./all-teamleaders-weekly-horizontal-view.component.scss'],
  imports: [TeamleaderWeeklyHorizontalViewComponent, CdkDropList, CdkDrag, CdkConnectedOverlay, DragDropModule],
})
export class AllTeamleadersWeeklyHorizontalViewComponent {
  missionsService = inject(MissionsService);
  planningService = inject(PlanningService);

  teamleaders = model.required<UserTagOutput[]>();
  weekDate = model.required<DateTime>();
  daysOfTheWeek = this.planningService.daysOfTheWeek;
  missions = this.planningService.missions;
  organizedMissionsByDays = signal<PlanningMatrix>({});

  availableIds = computed(() => {
    const days = this.daysOfTheWeek();
    const teamleaders = untracked(() => this.teamleaders());
    const res: string[][] = [];
    days.forEach((day) => {
      const dayIds: string[] = [];
      teamleaders.forEach((teamleader) => {
        dayIds.push(day.toJSDate().toISOString() + '_' + teamleader.id!);
      });
      dayIds.push(day.toJSDate().toISOString() + '_unaffected');
      res.push(dayIds);
    });
    return res;
  });

  constructor() {
    effect(() => {
      const missions = this.planningService.missions();
      this.organizedMissionsByDays.set(this.buildPlanningMatrix());
    });
  }

  drop($event: CdkDragDrop<UserTagOutput[]>) {
    moveItemInArray(this.teamleaders(), $event.previousIndex, $event.currentIndex);
    this.teamleaders.set([...this.teamleaders()]);
  }

  // methode qui sert à trier les missions par jour et par teamleader selon leurs affectations
  buildPlanningMatrix(): PlanningMatrix {
    const matrix: PlanningMatrix = {};
    const days = untracked(() => this.daysOfTheWeek());

    const teamLeaderIds: string[] = untracked(() => this.teamleaders().map((tl) => tl.id!));
    const missions: MissionOutput[] = untracked(() => this.missions() ?? []);
    // init matrice vide
    matrix['unaffected'] = {};
    days.forEach((d) => (matrix['unaffected'][d.toJSDate().toISOString()] = []));
    teamLeaderIds.forEach((tl) => {
      matrix[tl] = {};
      days.forEach((d) => (matrix[tl][d.toJSDate().toISOString()] = []));
    });
    const allAffectations = missions.flatMap((mission) => mission.affectationMissionXTeamLeaders ?? []);

    // remplissage
    for (const mission of missions) {
      for (const day of days) {
        const dayDate = day;

        // Vérifie si la mission est valide ce jour
        if (dayDate < DateTime.fromISO(mission.dateFrom ?? '') || dayDate > DateTime.fromISO(mission.dateTo ?? '')) {
          continue;
        }

        // cherche une affectation pour ce jour
        const aff = mission.affectationMissionXTeamLeaders?.find(
          (a) =>
            DateTime.fromISO(a.assignedAt ?? '')
              .toJSDate()
              .toDateString() === dayDate.toJSDate().toDateString(),
        );

        if (aff) {
          matrix[aff.teamLeaderId!][day.toJSDate().toISOString()].push(mission);
        } else {
          matrix['unaffected'][day.toJSDate().toISOString()].push(mission);
        }
      }
    }
    return matrix;
  }
}
