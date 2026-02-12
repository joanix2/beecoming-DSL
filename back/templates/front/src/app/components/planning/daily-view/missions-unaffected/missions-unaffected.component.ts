import { Component, effect, inject, input, linkedSignal, model, OnInit, signal } from '@angular/core';
import { TranslationService } from '../../../../services/translation/translation.service';

import { MatIconModule } from '@angular/material/icon';
import { MissionOutput } from '../../../../api/models';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { MissionCardDailyComponent } from '../mission-card-daily/mission-card-daily.component';
import { MatButtonModule } from '@angular/material/button';
import { DateTime } from 'luxon';
import { CustomWeekPipe } from '../../../../pipes/custom-week.pipe';
import { NgClass } from '@angular/common';
import { MissionsService } from '../../../../api/services';
import { firstValueFrom } from 'rxjs';
import { PlanningService } from '../../../../services/planning.service';

@Component({
  selector: 'app-missions-unaffected',
  imports: [CdkDropList, CdkDrag, MissionCardDailyComponent, NgClass, MatButtonModule, MatIconModule, CustomWeekPipe],
  templateUrl: './missions-unaffected.component.html',
  styleUrls: ['./missions-unaffected.component.scss'],
})
export class MissionsUnaffectedComponent {
  tr = inject(TranslationService);
  missionsService = inject(MissionsService);
  planningService = inject(PlanningService);

  connectedToIds = input.required<string[]>();
  unaffectedMissionsSignal = linkedSignal(() => this.planningService.unaffectedDailyMissions());
  isWeeklyViewSignal = linkedSignal(() => this.planningService.isWeeklyViewSignal());
  today = this.planningService.today;

  selectedDateSignal = this.planningService.selectedDateSignal;
  selectedWeekSignal = this.planningService.selectedWeekSignal;

  internalSelectedDateSignal = linkedSignal(() => this.planningService.selectedDateSignal());

  async missionsPreviousDay() {
    this.internalSelectedDateSignal.update((prev) => prev.minus({ days: 1 }).startOf('day'));
    await this.FetchAndFilterMissions();
  }

  async missionsNextDay() {
    this.internalSelectedDateSignal.update((prev) => prev.plus({ days: 1 }).startOf('day'));
    await this.FetchAndFilterMissions();
  }

  async drop(event: CdkDragDrop<MissionOutput[] | undefined>) {
    try {
      if (event.container == event.previousContainer) {
        return;
      }
      const missionId = await firstValueFrom(
        this.missionsService.missionsUnassignPut({
          affectationMissionXTeamleaderId: (event.item.data.mission as MissionOutput)
            .affectationMissionXTeamLeaders?.[0]?.id,
        }),
      );
      await this.planningService.FetchAllMissionsInInterval();
    } catch (error) {
      console.error('Error dropping mission:', error);
    }
  }

  async FetchAndFilterMissions() {
    try {
      let dateFrom = this.internalSelectedDateSignal().toISODate() ?? undefined;
      let dateTo = this.internalSelectedDateSignal().plus({ days: 1 }).toISODate() ?? undefined;

      if (dateFrom == dateTo) {
        dateTo = this.internalSelectedDateSignal().plus({ days: 1 }).toISODate() ?? undefined;
      }

      const missions = await firstValueFrom(
        this.missionsService.missionsMissionsDetailedGet({
          dateFrom: dateFrom,
          dateTo: dateTo,
        }),
      );
      var unaffected = missions?.filter((mission) => {
        return (
          mission.affectationMissionXTeamLeaders?.length === 0 ||
          (mission.dateFrom &&
            DateTime.fromISO(mission.dateFrom) &&
            mission.affectationMissionXTeamLeaders?.every(
              (affectation) =>
                new Date(affectation.assignedAt ?? '').toISOString() !==
                this.internalSelectedDateSignal().toJSDate().toISOString(),
            ))
        );
      });
      this.unaffectedMissionsSignal.update((prev) => unaffected);
    } catch (error) {
      console.error('Error fetching missions:', error);
    }
  }

  shouldDisableDrag() {
    return DateTime.now().toJSDate() > this.selectedDateSignal().endOf('day').set({ millisecond: 0 }).toJSDate();
  }
}
