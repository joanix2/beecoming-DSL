import { ChangeDetectorRef, effect, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Directive } from '@angular/core';
import { FieldError } from './custom-types';

@Directive()
export abstract class AbstractFieldComponent<T> implements OnInit {
  @Input() isEditMode = signal(true);
  @Input() label: string | undefined = undefined;
  @Input() placeholder: string = '';
  @Input() formControl = new FormControl<T | null>(null, []);
  @Input() errors: FieldError[] = [];
  @Input() isDisabled = signal(false);
  // @Output() valueChange = new EventEmitter<T | null>();

  public onChange: (value: any) => void = () => {};
  public onTouched: () => void = () => {};
  protected onValueChangeCallbackfn: (value: T | null) => void = (value) => {};

  constructor(protected readonly cdr: ChangeDetectorRef) {
    effect(() => {
      const disabled = this.isDisabled();
      if (disabled) {
        this.disableFormControl();
      } else {
        this.enableFormControl();
      }
    });
  }

  ngOnInit(): void {
    this.formControl.valueChanges.subscribe((value) => {
      this.onValueChangeCallbackfn(value);
      this.cdr.detectChanges();
    });
  }
  writeValue(value: any): void {
    if (!this.formControl) {
      console.warn('writeValue called before formControl is ready');
      return;
    }

    const currentValue = this.formControl.value;
    const hasChanged = JSON.stringify(currentValue) !== JSON.stringify(value);

    if (hasChanged) {
      this.formControl.setValue(value, { emitEvent: false });
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  disableFormControl() {
    if (this.formControl) {
      this.formControl.disable({ emitEvent: false });
    } else {
      console.warn('formControl is undefined');
    }
  }

  enableFormControl(): void {
    if (this.formControl) {
      this.formControl.enable({ emitEvent: false });
    } else {
      console.warn('formControl is undefined');
    }
  }

  onValueChange(value: any): void {
    this.onChange(value);
    this.onTouched();
    // this.valueChange.emit(value);
  }
}
