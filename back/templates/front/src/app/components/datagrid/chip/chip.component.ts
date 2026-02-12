import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-chip',
  template: `
    <div
      class="flex h-11 max-w-max items-center gap-2 overflow-x-auto"
      [matTooltip]="label() || value?.label || value"
      matTooltipPosition="after"
    >
      @if (isArray()) {
        @for (item of items(); track item) {
          <span
            class="flex h-6 min-h-0 w-fit items-center gap-2 rounded-full px-2 py-0 align-middle text-xs text-white"
            [ngStyle]="{ 'background-color': item.color }"
          >
            {{ item.label }}
          </span>
        }
      } @else {
        <span
          class="flex h-6 min-h-0 w-fit items-center gap-2 rounded-full px-2 py-0 align-middle text-xs text-white"
          [ngStyle]="{ 'background-color': color }"
        >
          {{ label() || value?.label || value }}
        </span>
      }
    </div>
  `,
  standalone: true,
  imports: [MatIconModule, CommonModule, MatTooltip],
})
export class ChipComponent implements ICellRendererAngularComp {
  @Input() value: any;
  @Input() color: string = 'purple';

  label = signal('');
  isArray = signal(false);
  items = signal<{ label: string; color: string }[]>([]);

  agInit(params: ChipParams): void {
    if (Array.isArray(params.value)) {
      this.isArray.set(true);
      this.items.set(params.value);
    } else {
      this.isArray.set(false);
      this.label.set(params.value || this.value?.label || '');
      this.color = params.color || this.color || 'purple';
    }
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}

interface ChipParams extends ICellRendererParams {
  color: string;
  colors: string[];
}
