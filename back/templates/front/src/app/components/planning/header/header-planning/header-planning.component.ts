import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, model, OnInit, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { UserTagOutput } from '../../../../api/models';
import { UsersService } from '../../../../api/services';
import { WeekdayDayMonthPipe } from '../../../../pipes/weeday-day-month.pipe';
import { TranslationService } from '../../../../services/translation/translation.service';
import { SwitchButtonComponent } from '../../../fields/switch-button/switch-button.component';
import { UserTrigramCircleComponent } from '../user-trigram-circle/user-trigram-circle.component';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { DateTime } from 'luxon';
import { CustomWeekPipe } from '../../../../pipes/custom-week.pipe';
import { PlanningService } from '../../../../services/planning.service';
import { RouterLink } from '@angular/router';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-header-planning',
  templateUrl: './header-planning.component.html',
  styleUrls: ['./header-planning.component.scss'],
  imports: [
    CommonModule,
    MatIconModule,
    SwitchButtonComponent,
    MatButtonModule,
    MatIconModule,
    WeekdayDayMonthPipe,
    MatDividerModule,
    UserTrigramCircleComponent,
    CdkDrag,
    CdkDropList,
    CustomWeekPipe,
    RouterLink,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
  ],
})
export class HeaderPlanningComponent {
  /* Services */
  tr = inject(TranslationService);
  usersService = inject(UsersService);
  planningService = inject(PlanningService);

  /* Signals */
  selectedDateSignal = this.planningService.selectedDateSignal;
  selectedWeekSignal = this.planningService.selectedWeekSignal;
  includeFinishedSignal = this.planningService.includeFinishedSignal;

  isWeeklyViewSignal = this.planningService.isWeeklyViewSignal;
  isMapView = this.planningService.isMapView;
  teamleaders = this.planningService.teamleaders;
  isShowWeekendSignal = this.planningService.isShowWeekendSignal;
  today = DateTime.now();

  // output
  onMapViewChanged = output<boolean>();
  onDateChanged = output<Date>();
  onTeamsOrderChanged = output<UserTagOutput[]>();
  onTeamleadersChanged = output<UserTagOutput[]>();

  constructor() {
    effect(() => {
      const isWeeklyView = this.planningService.isWeeklyViewSignal();
      const selectedDate = this.planningService.selectedDateSignal();
      const selectedWeek = this.planningService.selectedWeekSignal();
      const includeFinished = this.planningService.includeFinishedSignal();

      this.planningService.fetchTeams();
      this.planningService.getAvailableOperators();
      this.planningService.FetchAllMissionsInInterval();
    });
  }

  onSwitchChange(event: boolean) {
    this.isWeeklyViewSignal.set(event);
  }
  onSwitchShowWeekendChange(event: boolean) {
    this.isShowWeekendSignal.set(event);
  }
  onSwitchShowFinishedMissionsChange(event: boolean) {
    this.includeFinishedSignal.set(event);
  }
  async goToday() {
    this.selectedDateSignal.set(DateTime.now().startOf('day'));
    this.selectedWeekSignal.set(DateTime.now().weekNumber);
  }

  handleMapView() {
    this.isMapView.set(!this.isMapView());
    this.onMapViewChanged.emit(this.isMapView());
  }

  reorderPlanning<T>(event: CdkDragDrop<T[]>) {
    // reorder la liste des équipes  ou autres localement
    const users = this.teamleaders();
    moveItemInArray(users, event.previousIndex, event.currentIndex);
    this.teamleaders.set([...users]);

    // émet la novelle liste
    this.onTeamsOrderChanged.emit(users);
  }

  // Main() header navigation days  or weeks
  async previousWeekOrDay(): Promise<void> {
    if (this.isWeeklyViewSignal()) {
      this.selectedDateSignal.set(this.selectedDateSignal().minus({ weeks: 1 }));
      this.selectedWeekSignal.set(this.selectedDateSignal().weekNumber);
    } else {
      // this.selectedDateSignal.set(this.selectedDateSignal().minus({ days: 1 }).startOf('day'));
      if (this.isShowWeekendSignal()) {
        this.selectedDateSignal.set(this.selectedDateSignal().minus({ days: 1 }).startOf('day'));
      } else {
        if (this.selectedDateSignal().weekday === 1) {
          this.selectedDateSignal.set(this.selectedDateSignal().minus({ days: 3 }).startOf('day'));
        } else {
          this.selectedDateSignal.set(this.selectedDateSignal().minus({ days: 1 }).startOf('day'));
        }
      }
    }
  }
  async nextWeekOrDay(): Promise<void> {
    if (this.isWeeklyViewSignal()) {
      this.selectedDateSignal.set(this.selectedDateSignal().plus({ weeks: 1 }));
      this.selectedWeekSignal.set(this.selectedDateSignal().weekNumber);
    } else {
      if (this.isShowWeekendSignal()) {
        this.selectedDateSignal.set(this.selectedDateSignal().plus({ days: 1 }).startOf('day'));
      } else {
        if (this.isShowWeekendSignal()) {
          this.selectedDateSignal.set(this.selectedDateSignal().plus({ days: 1 }).startOf('day'));
        } else {
          // cas où on ne montre pas le weekend
          // si on est le vendredi, on passe au lundi
          if (this.selectedDateSignal().weekday === 5) {
            this.selectedDateSignal.set(this.selectedDateSignal().plus({ days: 3 }).startOf('day'));
          } else if (this.selectedDateSignal().weekday === 6) {
            this.selectedDateSignal.set(this.selectedDateSignal().plus({ days: 2 }).startOf('day'));
          } else {
            this.selectedDateSignal.set(this.selectedDateSignal().plus({ days: 1 }).startOf('day'));
          }
        }
      }
    }
  }
}
