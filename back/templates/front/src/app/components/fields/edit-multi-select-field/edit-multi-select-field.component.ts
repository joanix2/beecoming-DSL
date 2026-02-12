import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Input,
  OnInit,
  output,
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { AbstractFieldComponent } from '../abstract-field.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { CommonModule } from '@angular/common';
import { Option } from '../custom-types';

@Component({
  selector: 'app-edit-multi-select-field',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatChipsModule,
    ErrorMessageComponent,
  ],
  templateUrl: './edit-multi-select-field.component.html',
  styleUrls: ['../field-style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditMultiSelectFieldComponent),
      multi: true,
    },
  ],
})
export class EditMultiSelectFieldComponent<T> extends AbstractFieldComponent<Option<T>[]> implements OnInit {
  @Input() options: Option<T>[] = [];
  onSelectionChange = output<Option<T>[]>();

  constructor(protected override readonly cdr: ChangeDetectorRef) {
    super(cdr);
  }
  override ngOnInit(): void {
    super.ngOnInit();

    this.formControl.valueChanges.subscribe((value) => {});
  }

  renderSelectionLabels(items: Option<T>[]): string {
    if (!items || items.length === 0) {
      return '';
    }

    const mainLabel = items[0]?.name || '';
    const additionalCount = items.length - 1;

    if (additionalCount > 0) {
      return `${mainLabel} (+${additionalCount} autres)`;
    }

    return mainLabel;
  }

  compareWith(option1: Option<T>, option2: Option<T>): boolean {
    return option1.id === option2.id;
  }
  // override onChange = (value: any): void => {
  //   this.onSelectionChange.emit(value);
  // };
}
