import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
  selector: 'app-icon-cell',
  template: `
    <span class="flex h-11 max-w-max items-center gap-2" [matTooltip]="value()" matTooltipPosition="after">
      <mat-icon
        *ngIf="showIcon && iconType"
        [svgIcon]="iconType"
        class="!h-5 !w-5 cursor-pointer transition-opacity hover:opacity-70"
        [style.color]="isHexColor ? iconColor : null"
        [class]="!isHexColor ? iconColor : ''"
        (click)="onIconClick($event)"
      ></mat-icon>
      @if (showIconName) {
        <span class="first-letter:uppercase">
          {{ value() }}
        </span>
      }
    </span>
  `,
  styles: [
    `
      mat-icon {
        ::ng-deep {
          svg {
            fill: currentColor;
          }

          path {
            fill: currentColor;
          }
        }
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltip],
})
export class IconCellComponent implements ICellRendererAngularComp, OnInit {
  @Input() params: any;

  value = signal<string | undefined>(undefined);
  iconType: string = '';
  iconColor: string = '';
  isHexColor: boolean = false;
  showIcon: boolean = true;
  showIconName: boolean = true;

  agInit(params: any): void {
    this.setParams(params);
  }

  ngOnInit() {
    if (this.params) {
      this.setParams(this.params);
    }
  }

  setParams(params: any) {
    this.value.set(params.value);
    this.iconType = params.iconType;
    this.showIconName = params.showIconName ?? true;

    // Gestion de la couleur de l'icône
    if (params.iconColor) {
      // Si c'est une couleur hexadécimale (commence par #)
      if (typeof params.iconColor === 'string' && params.iconColor.startsWith('#')) {
        this.iconColor = params.iconColor;
        this.isHexColor = true;
      } else {
        // Sinon, c'est une classe CSS
        this.iconColor = params.iconColor;
        this.isHexColor = false;
      }
    }

    if (typeof this.value() === 'object') {
      this.value.set(params.value?.label);
    }

    if (params.isDate && params.value !== undefined && params.value !== null) {
      const date = new Date(params.value);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      this.value.set(date.toLocaleDateString());

      if (params.isFinished) {
        this.showIcon = false;
        return;
      }

      if (diffDays < 0) this.iconColor = 'text-danger';
      else if (diffDays <= 7) this.iconColor = 'text-attention';
      else if (diffDays > 7) this.showIcon = false;
    }
  }

  refresh(params?: any): boolean {
    return true;
  }

  onIconClick(event: Event): void {
    event.stopPropagation(); // Empêche la propagation vers la ligne

    // Exécute la fonction callback si elle est fournie dans les paramètres
    if (this.params?.onClick && typeof this.params.onClick === 'function') {
      this.params.onClick(this.params);
    }
  }
}
