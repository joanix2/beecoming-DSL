import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, output, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterModule } from '@angular/router';
import { EquipeChipComponent } from '../equipe-chip/equipe-chip.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { TranslationService } from '../../../../services/translation/translation.service';

@Component({
  selector: 'app-planning-header',
  imports: [
    CommonModule,
    RouterModule,
    EquipeChipComponent,
    ReactiveFormsModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './planning-header.component.html',
  styleUrls: ['./planning-header.component.scss'],
})
export class PlanningHeaderComponent implements OnInit {
  today = signal(new Date());
  onDayChange = output<Date>();

  translateService = inject(TranslationService);

  constructor() {}

  ngOnInit() {}

  changeDate(goNext: boolean) {
    const newDate = new Date(this.today());
    if (goNext) {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    this.today.set(newDate);
    this.onDayChange.emit(newDate);
  }

  setToday() {
    this.today.set(new Date());
    this.onDayChange.emit(this.today());
  }
}
