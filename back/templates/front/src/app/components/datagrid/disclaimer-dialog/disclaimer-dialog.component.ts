import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { TranslationService } from "../../../services/translation/translation.service";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-disclaimer-dialog",
  templateUrl: "disclaimer-dialog.component.html",
  styleUrls: ["disclaimer-dialog.component.scss"],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButton,
    MatFormFieldModule,
    MatInputModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
  ],
})
export class DisclaimerDialogComponent {
  richTextContent: string;

  constructor(
    public dialogRef: MatDialogRef<DisclaimerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { richTextContent: string },
    protected readonly translateService: TranslationService,
    protected readonly sanitizer: DomSanitizer,
  ) {
    this.richTextContent = data.richTextContent;
  }

  onSubmit(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  sanitize(value: string) {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
