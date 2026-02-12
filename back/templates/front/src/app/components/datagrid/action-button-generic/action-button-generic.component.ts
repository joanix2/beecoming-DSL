import { Component, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

interface ActionButtonGenericParams extends ICellRendererParams {
  icon?: string;
  class?: string;
  selectedIcon?: string;
  showText?: boolean;
  tooltipLabel?: string;
  key?: string;
  actionFunction: (data: any) => void;
}

@Component({
  selector: 'app-edit-button-simplified',
  templateUrl: './action-button-generic.component.html',
  styleUrls: ['./action-button-generic.component.scss'],
  imports: [MatIcon, MatButtonModule, MatIconModule, MatTooltipModule],
})
export class ActionButtonGenericComponent<T> implements ICellRendererAngularComp, OnDestroy {
  params!: ActionButtonGenericParams;
  rowData!: T;
  actionFunction!: (data: T) => void;
  icon: string = 'edit';
  class: string = 'text-black';
  selectedIcon: string = '';
  showText: boolean = false;
  key: string = 'displayId';
  tooltipLabel: string = '';
  selected = false;

  agInit(params: ActionButtonGenericParams): void {
    this.params = params;
    this.icon = params.icon ?? 'edit';
    this.class = params.class ?? 'text-black';
    this.selectedIcon = params.selectedIcon ?? '';
    this.rowData = params.data!;
    this.actionFunction = params.actionFunction;
    this.showText = params.showText ?? false;
    this.key = params.key ?? 'displayId';
    this.tooltipLabel = params.tooltipLabel + ' ' + (this.rowData as any)[this.key];
    this.params.api.sizeColumnsToFit();
  }

  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }

  ngOnDestroy(): void {
    this.params.api.sizeColumnsToFit();
  }

  onAction(event: MouseEvent) {
    event.stopPropagation();
    this.selected = !this.selected;
    this.actionFunction((this.rowData as any)?.id ?? this.rowData);
  }
}
