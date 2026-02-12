import { ChangeDetectorRef, Component, inject, input, linkedSignal, model, OnInit } from '@angular/core';
import { MissionOutput } from '../../../../api/models';
import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { DatePipe, NgClass } from '@angular/common';
import { MissionCardWeeklyComponent } from '../mission-card-weekly/mission-card-weekly.component';
import { MissionsService } from '../../../../api/services';
import { firstValueFrom } from 'rxjs';
import { PlanningService } from '../../../../services/planning.service';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-teamleader-grouped-daily-missions',
  templateUrl: './teamleader-grouped-daily-missions.component.html',
  styleUrls: ['./teamleader-grouped-daily-missions.component.scss'],
  imports: [NgClass, DatePipe, MissionCardWeeklyComponent, CdkDropList, DragDropModule, CdkDrag],
})
export class TeamleaderGroupedDailyMissionsComponent {
  missionsService = inject(MissionsService);
  cdr = inject(ChangeDetectorRef);
  planningService = inject(PlanningService);

  dateOfTheDay = model.required<Date>();
  affectedMissions = model.required<MissionOutput[]>();
  teamleaderId = input<string>('unaffected');
  availableIds = input<string[]>([]);

  showDate = model(false);

  async drop(event: CdkDragDrop<MissionOutput[]>) {
    const idSenderArray = event.previousContainer.id.split('_');
    const senderId = idSenderArray[idSenderArray.length - 1];

    const idReceiverArray = event.container.id.split('_');
    const receiverId = idReceiverArray[idReceiverArray.length - 1];

    if (event.container == event.previousContainer) {
      moveItemInArray(this.affectedMissions(), event.previousIndex, event.currentIndex);
      this.affectedMissions.set([...this.affectedMissions()]);
    } else {
      if (senderId == 'unaffected') {
        try {
          const affectationId = await firstValueFrom(
            this.missionsService.missionsAssignPut({
              missionId: event.item.data.mission.id,
              teamleaderId: receiverId,
              dateFrom: this.dateOfTheDay().toDateString(),
              orderIndex: event.currentIndex,
            }),
          );
          event.item.data.mission.affectationMissionXTeamLeaderId = affectationId;
          await this.planningService.FetchAllMissionsInInterval();
        } catch (error) {
          console.error('Error occurred while handling drop:', error);
        }
      } else {
        // drop affected to unaffected
        if (receiverId == 'unaffected' && senderId != 'unaffected') {
          try {
            const mission = event.item.data.mission as MissionOutput;

            await firstValueFrom(
              this.missionsService.missionsUnassignPut({
                affectationMissionXTeamleaderId:
                  mission.affectationMissionXTeamLeaders?.find(
                    (aff) =>
                      aff.teamLeaderId == senderId &&
                      DateTime.fromISO(aff.assignedAt ?? '')
                        .toJSDate()
                        .toISOString() === this.dateOfTheDay().toISOString(),
                  )?.id ?? '',
              }),
            );
            await this.planningService.FetchAllMissionsInInterval();
          } catch (error) {
            console.error('Error occurred while handling drop:', error);
          }
        }
        // drop between affected
        if (receiverId != 'unaffected' && senderId != 'unaffected') {
          try {
            await firstValueFrom(
              this.missionsService.missionsAssignPut({
                missionId: event.item.data.mission.id,
                teamleaderId: receiverId,
                dateFrom: this.dateOfTheDay().toDateString(),
                orderIndex: event.currentIndex,
              }),
            );
          } catch (error) {
            console.error('Error occurred while handling drop:', error);
          } finally {
            await this.planningService.FetchAllMissionsInInterval();
          }
        }
      }
    }
  }

  shouldDisableDrag() {
    return (
      DateTime.now().toJSDate() >
      DateTime.fromJSDate(this.dateOfTheDay()).endOf('day').set({ millisecond: 0 }).toJSDate()
    );
  }

  goToSelectedDay() {
    this.planningService.selectedDateSignal.set(DateTime.fromJSDate(this.dateOfTheDay()) as DateTime<true>);
    this.planningService.isWeeklyViewSignal.set(false);
  }
}
