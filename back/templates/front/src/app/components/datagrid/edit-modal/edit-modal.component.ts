import { Component, OnDestroy, signal, WritableSignal } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";
import { MatIcon } from "@angular/material/icon";
import { ActionRow } from "../datagrid.component";
import { MatIconButton } from "@angular/material/button";
import { NgStyle } from "@angular/common";

@Component({
  selector: "app-edit-modal",
  imports: [MatIcon, MatIconButton, NgStyle],
  templateUrl: "./edit-modal.component.html",
  styleUrl: "./edit-modal.component.scss",
})
export class EditModalComponent<T> implements ICellRendererAngularComp, OnDestroy {
  params!: ICellRendererParams & {
    cellEditedSignal?: WritableSignal<number | null>;
    cellToDeleteSignal?: WritableSignal<number | null>;
  };
  rowData!: T;
  actionRowSignal = signal<ActionRow<T> | null>(null);

  agInit(
    params: ICellRendererParams & {
      cellEditedSignal?: WritableSignal<number | null>;
      cellToDeleteSignal?: WritableSignal<number | null>;
    },
  ): void {
    this.params = params;
    this.rowData = params.data!;
    this.params.api.sizeColumnsToFit();
    this.actionRowSignal = params.context.actionRowSignal;
  }

  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }

  ngOnDestroy(): void {
    this.params.api.sizeColumnsToFit();
  }

  onEdit() {
    this.params.cellEditedSignal?.set(this.params.node.rowIndex);
  }

  onDelete() {
    this.params.cellToDeleteSignal?.set(this.params.node.rowIndex);
  }
}
