import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslationService } from '../../../services/translation/translation.service';
import { AbstractFieldComponent } from '../abstract-field.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';

@Component({
  selector: 'app-edit-date-field',
  templateUrl: './edit-date-field.component.html',
  styleUrls: ['./edit-date-field.component.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    ErrorMessageComponent,
    MatDatepickerModule,
    MatInputModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditDateFieldComponent),
      multi: true,
    },
  ],
})
export class EditDateFieldComponent extends AbstractFieldComponent<Date> implements OnInit {
  readonly tr = inject(TranslationService);

  // Propriétés pour les contraintes de dates
  min = input<Date | null>(null);
  max = input<Date | null>(null);

  constructor(protected override readonly cdr: ChangeDetectorRef) {
    super(cdr);
  }

  override ngOnInit() {
    super.ngOnInit();
  }
}
