import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatError } from '@angular/material/form-field';
import { TranslationService } from '../../../services/translation/translation.service';
import { FieldError } from '../custom-types';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule, MatError, FormsModule, ReactiveFormsModule],
  templateUrl: './error-message.component.html',
})
export class ErrorMessageComponent {
  @Input() control!: FormControl;
  @Input() errors: FieldError[] = [];

  constructor(private readonly tr: TranslationService) {}
  get errorMessage(): string | null {
    if (!this.control || this.control.valid || !this.control.touched) return null;

    for (const err of this.errors) {
      if (this.control.hasError(err.validator)) {
        return err.message;
      }
    }

    return this.tr.language().CUSTOM_FORM_FIELD_ERROR;
  }
}
