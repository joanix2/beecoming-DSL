import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { AbstractFieldComponent } from '../abstract-field.component';

@Component({
  selector: 'app-edit-textarea-field',
  standalone: true,
  imports: [
    CommonModule,
    MatLabel,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    ErrorMessageComponent,
  ],
  templateUrl: './edit-textarea-field.component.html',
  styleUrls: ['../field-style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditTextareaFieldComponent),
      multi: true,
    },
  ],
})
export class EditTextareaFieldComponent extends AbstractFieldComponent<string | null> {
  @Input() nowrap = false;

  constructor(protected override readonly cdr: ChangeDetectorRef) {
    super(cdr);
  }
}
