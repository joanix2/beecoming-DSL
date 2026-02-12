import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslationService } from '../../services/translation/translation.service';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-can-deactivate-dialog',
  templateUrl: 'can-deactivate-dialog.component.html',
  styleUrls: ['can-deactivate-dialog.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButton],
})
export class CanDeactivateDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CanDeactivateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { email: string },
    protected readonly tr: TranslationService,
  ) {}

  onSubmit(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
