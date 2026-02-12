import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input, OnInit } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AbstractFieldComponent } from '../abstract-field.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';

@Component({
  selector: 'app-edit-text-field',
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
  templateUrl: './edit-text-field.component.html',
  styleUrls: ['../field-style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditTextFieldComponent),
      multi: true,
    },
  ],
})
export class EditTextFieldComponent extends AbstractFieldComponent<string | null> {
  @Input() nowrap = false;
  @Input() type: 'text' | 'password' | 'email' | 'tel' | 'url' | 'number' | 'color' | 'search' = 'text';

  constructor(protected override readonly cdr: ChangeDetectorRef) {
    super(cdr);
  }
}
