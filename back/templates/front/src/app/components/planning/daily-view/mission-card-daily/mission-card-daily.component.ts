import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { NgClass, NgStyle, UpperCasePipe } from '@angular/common';
import { MissionOutput } from '../../../../api/models';
import { TranslationService } from '../../../../services/translation/translation.service';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { AppService } from '../../../../services/app.service';
import { MatTooltip } from '@angular/material/tooltip';
import { MissionsService } from '../../../../api/services';
import { PlanningService } from '../../../../services/planning.service';
import { DateTime } from 'luxon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mission-card-daily',
  imports: [MatIcon, NgStyle, NgClass, CdkDragHandle, MatTooltip, UpperCasePipe, RouterLink],
  templateUrl: './mission-card-daily.component.html',
})
export class MissionCardDailyComponent {
  tr = inject(TranslationService);
  appService = inject(AppService);
  missionService = inject(MissionsService);
  planningServie = inject(PlanningService);

  dateOfTheDay = this.planningServie.selectedDateSignal;
  mission = model.required<MissionOutput>();
  affectation = computed(() => this.mission().affectationMissionXTeamLeaders?.[0]);
  isMission = input(true);
  visibilityState = computed(() =>
    this.isMission() ? this.mission().isHidden : (this.mission().affectationMissionXTeamLeaders?.[0].isHidden ?? false),
  );

  onClicked = output<string>();
  isSelected = signal(false);
  private readonly breakpointObserver = inject(BreakpointObserver);
  isDesktop = toSignal(
    this.breakpointObserver.observe([Breakpoints.Large, Breakpoints.XLarge]).pipe(map((result) => result.matches)),
    { initialValue: false },
  );
  isFixedProfile = model(true);

  constructor() {}

  handleSelect() {
    if (this.mission) {
      this.onClicked.emit(this.mission().id ?? '');
    }
  }

  async navigateToMission(mission: MissionOutput) {
    this.appService.goTo(['missions', mission.id]);
  }

  async handleShow() {
    if (this.isMission()) {
      const missionUpdated = await firstValueFrom(
        this.missionService.missionsUpdateMissionVisibilityPut({
          body: {
            missionId: this.mission().id!,
            isHidden: !this.mission().isHidden,
          },
        }),
      );
      await this.planningServie.FetchAllMissionsInInterval();

      // this.mission.set({ ...this.mission(), isHidden: missionUpdated });
    } else {
      // si affectation
      const missionUpdatedVisibility = await firstValueFrom(
        this.missionService.missionsUpdateMissionAffectationVisibilityPut({
          body: {
            missionAffectationId: this.affectation()?.id ?? '',
            isHidden: !this.mission().affectationMissionXTeamLeaders?.[0].isHidden,
          },
        }),
      );
      await this.planningServie.FetchAllMissionsInInterval();
    }
  }

  alreadyStarted() {
    return DateTime.now() > this.dateOfTheDay().endOf('day').set({ millisecond: 0 });
  }
  // alreadyFinished() {
  //   return (
  //     DateTime.now().toJSDate() >
  //     DateTime.fromISO(this.affectation()?.assignedAt ?? '')
  //       .endOf('day')
  //       .toJSDate()
  //   );
  // }
}
