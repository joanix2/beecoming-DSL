import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input, OnInit } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AbstractFieldComponent } from '../abstract-field.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';

@Component({
  selector: 'app-edit-number-field',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, ErrorMessageComponent],
  templateUrl: './edit-number-field.component.html',
  styleUrls: ['../field-style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditNumberFieldComponent),
      multi: true,
    },
  ],
})
export class EditNumberFieldComponent extends AbstractFieldComponent<number | null> implements OnInit {
  @Input() nowrap = false;

  constructor(protected override readonly cdr: ChangeDetectorRef) {
    super(cdr);
  }
}
