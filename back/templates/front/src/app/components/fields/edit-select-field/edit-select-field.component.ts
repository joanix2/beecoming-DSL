import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ChipComponent } from '../../datagrid/chip/chip.component';
import { AbstractFieldComponent } from '../abstract-field.component';
import { Option } from '../custom-types';
import { ErrorMessageComponent } from '../error-message/error-message.component';

@Component({
  selector: 'app-edit-select-field',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    ErrorMessageComponent,
    ChipComponent,
  ],
  templateUrl: './edit-select-field.component.html',
  styleUrls: ['../field-style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditSelectFieldComponent),
      multi: true,
    },
  ],
})
export class EditSelectFieldComponent<T> extends AbstractFieldComponent<Option<T>> implements OnInit {
  @Input() options: Option<T>[] = [];
  @Input() render: 'chip' | 'icon' | 'select' = 'select';
  @Output() onOptionsChanged = new EventEmitter<Option<T>[]>();

  constructor(protected override readonly cdr: ChangeDetectorRef) {
    super(cdr);
  }
  override ngOnInit(): void {
    super.ngOnInit();
  }

  get value() {
    const controlValue = this.formControl.value;
    if (controlValue) {
      return [controlValue as Option<T>];
    }
    return [];
  }

  compareOptions = (o1: Option<T>, o2: Option<T>): boolean => {
    return o1?.id === o2?.id;
  };

  override onChange = (value: any): void => {
    this.onOptionsChanged.emit(this.options);
  };
}
