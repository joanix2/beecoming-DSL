import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from "@angular/material/dialog";
import { MatError, MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { TranslationService } from "../../services/translation/translation.service";

@Component({
  selector: "forgot-password-dialog",
  templateUrl: "forgot-password-dialog.component.html",
  styleUrls: ["forgot-password-dialog.component.scss"],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatError,
    MatButton,
    MatFormFieldModule,
    MatInputModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
  ],
})
export class ForgotPasswordDialogComponent {
  forgotPasswordForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ForgotPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { email: string },
    private formBuilder: FormBuilder,
    protected readonly tr: TranslationService,
  ) {
    this.forgotPasswordForm = this.formBuilder.group({
      email: [data.email, [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    this.dialogRef.close(this.forgotPasswordForm.value.email);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
