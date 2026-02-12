import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HeaderPlanningComponent } from '../../components/planning/header/header-planning/header-planning.component';
import { MissionOutput, UserOutput, UserTagOutput } from '../../api/models';
import { PlanningColumnComponent } from '../../components/planning/daily-view/planning-column/planning-column.component';
import { TranslationService } from '../../services/translation/translation.service';
import { DateTime } from 'luxon';
import { MissionsUnaffectedComponent } from '../../components/planning/daily-view/missions-unaffected/missions-unaffected.component';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { AllTeamleadersWeeklyHorizontalViewComponent } from '../../components/planning/weekly-view/all-teamleaders-weekly-horizontal-view/all-teamleaders-weekly-horizontal-view.component';
import { PlanningService } from '../../services/planning.service';
import { UsersService } from '../../api/services';
@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.scss'],
  imports: [
    CommonModule,
    HeaderPlanningComponent,
    PlanningColumnComponent,
    MissionsUnaffectedComponent,
    CdkDrag,
    CdkDropList,
    AllTeamleadersWeeklyHorizontalViewComponent,
  ],
})
export class PlanningComponent {
  tr = inject(TranslationService);
  planningService = inject(PlanningService);
  userService = inject(UsersService);

  selectedDateSignal = this.planningService.selectedDateSignal;
  isWeeklyViewSignal = this.planningService.isWeeklyViewSignal;
  teamleaders = this.planningService.teamleaders;
  selectedUserIdsComputed = computed(() => this.teamleaders()!.map((user) => user.id ?? ''));

  drop(event: any) {}

  reorderColumnPlanning(event: CdkDragDrop<any>) {
    const users = this.teamleaders();
    moveItemInArray(users, event.previousIndex, event.currentIndex);
    this.teamleaders.set([...users]);
  }
}
