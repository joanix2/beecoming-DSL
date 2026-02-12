import { Component, computed, OnDestroy, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MatIcon } from '@angular/material/icon';
import { ActionRow, ActionType } from '../datagrid.component';
import { MatIconButton } from '@angular/material/button';
import { NgStyle } from '@angular/common';
import { deepCompare } from '../../../../utils/deep-compare';

@Component({
  selector: 'app-edit-button',
  imports: [MatIcon, MatIconButton, NgStyle],
  templateUrl: './edit-button.component.html',
  styleUrl: './edit-button.component.scss',
})
export class EditButtonComponent<T> implements ICellRendererAngularComp, OnDestroy {
  params!: ICellRendererParams;
  rowData!: T;
  showEdit: boolean = true;
  showDelete: boolean = true;
  actionRowSignal = signal<ActionRow<T> | null>(null);
  editCurrentLigneSignal = computed(() => {
    const actionRow = this.actionRowSignal();

    return !!(actionRow && actionRow.action === ActionType.EDIT && deepCompare(actionRow.data, this.rowData));
  });

  agInit(params: ICellRendererParams<T>): void {
    this.params = params;
    this.rowData = params.data!;
    this.params.api.sizeColumnsToFit();
    this.actionRowSignal = params.context.actionRowSignal;
    this.showEdit = params.context.showEdit;
    this.showDelete = params.context.showDelete;
  }

  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }

  ngOnDestroy(): void {
    this.params.api.sizeColumnsToFit();
  }

  onEdit() {
    this.actionRowSignal.set({
      action: ActionType.EDIT,
      data: this.rowData,
      columnId: this.params.column?.getColId() ?? '',
    });
  }

  onCancelEdit() {
    this.actionRowSignal.set({
      action: ActionType.CANCEL,
      data: this.rowData,
      columnId: this.params.column?.getColId() ?? '',
    });
  }

  onSaveEdit() {
    this.actionRowSignal.set({
      action: ActionType.SAVE,
      data: this.rowData,
      columnId: this.params.column?.getColId() ?? '',
    });
  }

  onDelete() {
    this.actionRowSignal.set({
      action: ActionType.DELETE,
      data: this.rowData,
      columnId: this.params.column?.getColId() ?? '',
    });
  }
}
