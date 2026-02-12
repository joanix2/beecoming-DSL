import { Component, Input, signal } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { LinkCellComponent } from '../../link-cell/link-cell.component';
import { ChipComponent } from '../chip/chip.component';
import { ActionRow } from '../datagrid.component';
import { IconCellComponent } from '../icon-cell/icon-cell.component';

@Component({
  selector: 'app-render-cell-custom',
  imports: [ChipComponent, IconCellComponent, LinkCellComponent, MatTooltip],
  templateUrl: './render-cell-custom.component.html',
})
export class RenderCellCustomComponent<T> {
  @Input({ required: true }) element!: any;
  @Input({ required: true }) column!: ColDef;
  @Input({ required: true }) agGrid!: AgGridAngular;
  @Input({ required: true }) indexData!: number;
  @Input() actionRowSignal = signal<ActionRow<T> | null>(null);

  getCellRendererContent() {
    if (typeof this.column.cellRenderer === 'function') {
      return this.column.cellRenderer({ value: this.element[this.column.field as string], data: this.element });
    }
    return this.element[this.column.field as string] ?? '';
  }

  getCellRendererParams() {
    if (typeof this.column.cellRendererParams === 'function') {
      return this.column.cellRendererParams({ value: this.element[this.column.field as string], data: this.element });
    }
    return this.column.cellRendererParams;
  }

  getFieldValue() {
    return this.column.field ? this.element[this.column.field] : null;
  }

  getChipLabel(): string {
    const value = this.getFieldValue();
    return value && value.label ? value.label : value;
  }

  getChipColor() {
    const value = this.getFieldValue();
    return value && value.color ? value.color : 'purple';
  }

  getLinkCellLabel() {
    const params =
      typeof this.column.cellRendererParams === 'function'
        ? this.column.cellRendererParams({ value: this.getFieldValue(), data: this.element })
        : this.column.cellRendererParams;
    return params?.label ?? this.getFieldValue();
  }

  getLinkCellValue() {
    const params =
      typeof this.column.cellRendererParams === 'function'
        ? this.column.cellRendererParams({ value: this.getFieldValue(), data: this.element })
        : this.column.cellRendererParams;
    return params?.link ?? this.getFieldValue();
  }

  getIconCellParams() {
    let params = {};
    if (typeof this.column.cellRendererParams === 'function') {
      params = this.column.cellRendererParams({ value: this.getFieldValue(), data: this.element });
    } else if (this.column.cellRendererParams) {
      params = this.column.cellRendererParams;
    }
    return { value: this.getFieldValue(), ...params };
  }

  getValue() {
    if (typeof this.column.valueGetter === 'function') {
      const columnField = this.column.field as string;
      const column = this.agGrid.api.getColumn(columnField);
      if (!column) return this.getFieldValue();
      return this.column.valueGetter({
        data: this.element,
        getValue: (key: string) => this.element[key],
        column,
        colDef: this.column,
        api: this.agGrid.api,
        context: this.agGrid.context,
        node: null,
      });
    }
    return this.getFieldValue();
  }

  getFormattedValue() {
    if (typeof this.column.valueFormatter === 'function') {
      const columnField = this.column.field as string;
      const column = this.agGrid.api.getColumn(columnField);
      if (!column) return this.getValue();
      return this.column.valueFormatter({
        value: this.getValue(),
        data: this.element,
        node: null,
        column,
        colDef: this.column,
        api: this.agGrid.api,
        context: this.agGrid.context,
      });
    }
    if (typeof this.column.valueFormatter === 'string') {
      return this.column.valueFormatter;
    }
    return this.getValue();
  }
}
