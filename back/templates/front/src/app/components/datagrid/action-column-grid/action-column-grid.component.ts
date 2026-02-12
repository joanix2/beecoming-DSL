import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-action-column-grid',
  templateUrl: './action-column-grid.component.html',
  styleUrls: ['./action-column-grid.component.scss'],
  imports: [MatButtonModule, MatIconModule],
})
export class ActionColumnGridComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams<any, any, any>;
  constructor() {}
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.params = params;
  }
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }

  onEdit(event: MouseEvent) {
    event.stopPropagation();
    this.params.context.componentParent.onEditRow(this.params.data);
  }

  onDelete(event: MouseEvent) {
    event.stopPropagation();
    this.params.context.componentParent.onDeleteRow(this.params.data);
  }
}
