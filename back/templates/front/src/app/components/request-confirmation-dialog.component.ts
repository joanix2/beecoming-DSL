import { Component, Inject, input } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { TranslationService } from '../services/translation/translation.service';

@Component({
  selector: 'app-request-confirmation-dialog',
  template: `
    <h1 class="title" mat-dialog-title>{{ data.title }}</h1>
    <div mat-dialog-content>
      <p class="text-base">
        {{ data.message }}
      </p>
    </div>
    <div class="flex w-full justify-center gap-2" mat-dialog-actions>
      <button mat-stroked-button type="button" class="primary" (click)="onCancel()">
        {{ tr.language().DEACTIVATE_CANCEL }}
      </button>
      <button mat-flat-button type="submit" (click)="onConfirm()">{{ tr.language().DEACTIVATE_LEAVE }}</button>
    </div>
  `,
  imports: [MatDialogContent, MatDialogTitle, MatDialogActions, MatButton],
  styles: `
    .title {
      font-size: large;
      font-weight: bold;
    }
  `,
})
export class RequestConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<RequestConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    protected readonly tr: TranslationService,
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
