import { Component, computed, effect, EventEmitter, inject, Input, model, output, Output, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { NgClass, NgStyle, UpperCasePipe } from '@angular/common';
import { DateTime } from 'luxon';
import { MissionOutput, UserTagOutput } from '../../../../api/models';
import { TranslationService } from '../../../../services/translation/translation.service';
import { CdkDrag, CdkDragHandle, DragDropModule } from '@angular/cdk/drag-drop';
import { AppService } from '../../../../services/app.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MissionsService } from '../../../../api/services';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mission-card-weekly',
  imports: [MatIcon, NgStyle, MatTooltipModule, UpperCasePipe, RouterLink, DragDropModule],
  templateUrl: './mission-card-weekly.component.html',
})
export class MissionCardWeeklyComponent {
  tr = inject(TranslationService);
  appService = inject(AppService);
  missionService = inject(MissionsService);

  mission = model.required<MissionOutput>();
  missions = model.required<MissionOutput[]>();
  height = signal(0);
  width = signal(0);

  private readonly breakpointObserver = inject(BreakpointObserver);

  constructor() {
    effect(() => {
      const mission = this.mission();
      this.height.set(this.missions().length > 3 ? 90 : 184);
      this.width.set(this.missions().length > 1 ? 100 : 300);
    });
  }
  async navigateToMission(mission: MissionOutput) {
    this.appService.goTo(['missions', mission.id]);
  }
}
