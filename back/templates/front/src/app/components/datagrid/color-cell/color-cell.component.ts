import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-color-cell',
  template: `
    <div class="flex h-[46px] items-center gap-2">
      <div class="h-5 w-5 rounded-full" [style.backgroundColor]="params.value"></div>
      <span class="text-sm">{{ params.value | uppercase }}</span>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class ColorCellComponent implements ICellRendererAngularComp {
  @Input() params!: ICellRendererParams;

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    return true;
  }
}
