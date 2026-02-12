import { Component, computed, inject, input, model } from '@angular/core';
import { OperatorExtended, PlanningService } from '../../../../services/planning.service';

@Component({
  selector: 'app-custom-tooltip',
  template: `
    <div class="tooltip-content">
      @if (message()) {
        <span>
          <span class="text-red-600">*</span>
          {{ message() }}
        </span>
      }
      <div>
        <span class="text-yellow-600">*{{ ' ' }}</span>
        <strong>Chefs d'équipe assignés :</strong>
      </div>
      @for (operator of operatorsWithDaysAsStrings(); track operator.userId) {
        <div class="flex flex-col gap-2">
          <span>
            <span class="text-yellow-600">-{{ ' ' }}</span>
            <strong>{{ operator.fullName }}</strong>
            @if (showDays()) {
              <span>: {{ operator.days }}</span>
            }
          </span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .tooltip-content {
        background: rgb(41, 36, 36);
        color: rgb(223, 220, 220);
        padding: 12px;
        border-radius: 8px;
        font-size: 12px;
        max-width: 300px;
        transform: scale(0.8);
        transition: transform 200ms ease;
      }
      .tooltip-content.animate {
        transform: scale(1);
      }
    `,
  ],
})
export class TooltipOperatorsWorkingDaysComponent {
  planningService = inject(PlanningService);

  operators = model<OperatorExtended[]>();
  showDays = model<boolean>(true);
  message = model<string>('');

  // convertir les dates en format lisible
  operatorsWithDaysAsStrings = computed(() =>
    (this.operators() ?? []).map((operator) => ({
      ...operator,
      days: operator.days?.map((day) => day.setLocale('fr').toFormat('cccc')).join(', '),
    })),
  );
}
