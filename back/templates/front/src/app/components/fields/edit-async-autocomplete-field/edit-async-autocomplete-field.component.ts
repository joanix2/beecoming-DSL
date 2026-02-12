import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { Option } from '../custom-types';
import { AbstractFieldComponent } from '../abstract-field.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { FilterParams } from '../../datagrid/datagrid.component';
import { debounceTime, distinctUntilChanged, filter, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-edit-async-autocomplete-field',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatInputModule,
    ErrorMessageComponent,
  ],
  templateUrl: './edit-async-autocomplete-field.component.html',
  styleUrls: ['../field-style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditAutocompleteFieldComponent),
      multi: true,
    },
  ],
})
export class EditAutocompleteFieldComponent<T> extends AbstractFieldComponent<Option<T>> implements OnInit {
  @Input() searchFn!: (params: FilterParams) => Promise<T[]>;
  @Input() toOption!: (entity: T) => Option<T>;
  @Input() optionsLength: number = 10;
  @Input() debounceTime: number = 300;
  onSelection = output<Option<T>>();

  options = signal<Option<T>[]>([]);

  constructor(protected override readonly cdr: ChangeDetectorRef) {
    super(cdr);
  }
  get value() {
    return [this.formControl.value as Option<T>];
  }

  override ngOnInit() {
    super.ngOnInit();

    this.formControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(this.debounceTime),
        filter((value): value is string => value !== null && value !== undefined),
        distinctUntilChanged(),
        switchMap((term: string) => this.fetchOptions(term)),
      )
      .subscribe((options) => {
        this.options.set(options);

        const input = this.displayFn(this.formControl.value).trim().toLowerCase();
        const match = options.find((opt) => opt.name.toLowerCase() === input);
        if (match) {
          this.formControl.setValue(match, { emitEvent: false });
        }
      });
  }

  async fetchOptions(term: string): Promise<Option<T>[]> {
    const filterParams: FilterParams = {
      $skip: 0,
      $top: this.optionsLength,
    };

    const trimTerm = term.toString().trim();
    if (trimTerm !== '') {
      filterParams.$search = trimTerm;
    }

    const response = await this.searchFn(filterParams);
    return (response || []).map(this.toOption);
  }

  onOptionSelected(option: Option<T>) {
    this.formControl.setValue(option);
    this.onSelection.emit(option);
  }

  displayFn(option: Option<T> | string | null): string {
    if (typeof option === 'string') return option;
    return option?.name ?? '';
  }
}
