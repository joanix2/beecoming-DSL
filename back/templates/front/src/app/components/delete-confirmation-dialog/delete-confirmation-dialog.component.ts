import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslationService } from '../../services/translation/translation.service';

export interface DeleteConfirmationData {
  title?: string;
  message?: string;
  itemName?: string;
}

@Component({
  selector: 'app-delete-confirmation-dialog',
  templateUrl: 'delete-confirmation-dialog.component.html',
  styleUrls: ['delete-confirmation-dialog.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButton],
})
export class DeleteConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteConfirmationData,
    protected readonly tr: TranslationService,
  ) {}

  get title(): string {
    return this.data.title || 'Confirmer la suppression';
  }

  get message(): string {
    if (this.data.message) {
      return this.data.message;
    }
    if (this.data.itemName) {
      return `Êtes-vous sûr de vouloir supprimer "${this.data.itemName}" ?`;
    }
    return 'Êtes-vous sûr de vouloir supprimer cet élément ?';
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
