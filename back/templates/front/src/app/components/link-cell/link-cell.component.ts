import { CommonModule } from "@angular/common";
import { Component, Input, signal } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";
import { MatTooltip } from "@angular/material/tooltip";

@Component({
  selector: "app-link-cell",
  imports: [CommonModule, RouterModule, MatTooltip],
  template: `<a
    [matTooltip]="labelSignal() || label"
    matTooltipPosition="after"
    [routerLink]="linkSignal() || link"
    class="block h-full w-full truncate text-primary underline"
    >{{ labelSignal() || label }}</a
  >`,
})
export class LinkCellComponent implements ICellRendererAngularComp {
  @Input() link?: string;
  @Input() label?: string;

  linkSignal = signal<string>("");
  labelSignal = signal<string>("");

  agInit(params: LinkCellParams): void {
    this.labelSignal.set(params.label ?? params.value);
    this.linkSignal.set(params.link);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}

interface LinkCellParams extends ICellRendererParams {
  link: string;
  label: string;
}
