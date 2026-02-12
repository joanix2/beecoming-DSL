import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, forwardRef, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AddressInput } from '../../../../api/models';
import { GeocodingService } from '../../../../services/geocoding.service';
import { TranslationService } from '../../../../services/translation/translation.service';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { FIELD_ERRORS } from '../../custom-errors';
import { EditNumberFieldComponent } from '../../edit-number-field/edit-number-field.component';
import { EditTextFieldComponent } from '../../edit-text-field/edit-text-field.component';

@Component({
  selector: 'app-address-fields',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EditTextFieldComponent,
    EditNumberFieldComponent,
    MatIcon,
    MatButtonModule,
  ],
  templateUrl: './address-fields.component.html',
  styleUrls: ['../../field-style.scss', './address-style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddressFieldsComponent),
      multi: true,
    },
  ],
})
export class AddressFieldsComponent extends AbstractFieldComponent<AddressInput> {
  geocodingService = inject(GeocodingService);

  addressFormGroup!: FormGroup;
  streetControl = new FormControl('', [Validators.required]);
  postalCodeControl = new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\d{5}$/)]);
  cityControl = new FormControl('', [Validators.required]);
  countryControl = new FormControl('', [Validators.required]);
  additionalInfoControl = new FormControl('');
  latitudeControl = new FormControl<number | null>(null);
  longitudeControl = new FormControl<number | null>(null);

  FIELD_ERRORS = FIELD_ERRORS;

  constructor(
    protected override readonly cdr: ChangeDetectorRef,
    public readonly tr: TranslationService,
  ) {
    super(cdr);

    this.addressFormGroup = new FormGroup({
      street: this.streetControl,
      postalCode: this.postalCodeControl,
      city: this.cityControl,
      country: this.countryControl,
      additionalInfo: this.additionalInfoControl,
      latitude: this.latitudeControl,
      longitude: this.longitudeControl,
    });

    // Re-bind internal group value to main control
    this.addressFormGroup.valueChanges.subscribe((val) => {
      const currentValue = this.formControl.value;
      const newValue = { ...currentValue, ...val } as AddressInput;
      // Évite les mises à jour inutiles
      if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
        this.formControl.setValue(newValue, { emitEvent: false });
      }
    });

    // Listen to parent formControl changes and update internal form
    this.formControl.valueChanges.subscribe((value) => {
      this.updateInternalFormFromValue(value);
    });
  }

  override ngOnInit() {
    super.ngOnInit();
    // Initialize form with any existing value
    this.updateInternalFormFromValue(this.formControl.value);
  }

  override writeValue(value: AddressInput | null): void {
    if (!value) return;

    super.writeValue(value);
    this.updateInternalFormFromValue(value);
  }

  override registerOnChange(fn: (value: AddressInput | null) => void): void {
    super.registerOnChange(fn);

    this.addressFormGroup.valueChanges.subscribe((val) => {
      fn({
        ...this.formControl.value,
        ...val,
      } as AddressInput);
    });
  }

  override registerOnTouched(fn: () => void): void {
    super.registerOnTouched(fn);
    this.addressFormGroup.statusChanges.subscribe(() => fn());
  }

  override disableFormControl() {
    super.disableFormControl();
    this.addressFormGroup.disable({ emitEvent: false });
  }

  override enableFormControl(): void {
    super.enableFormControl();
    this.addressFormGroup.enable({ emitEvent: false });
  }

  async localize() {
    const result = await this.geocodingService.localizeAddress(this.formControl.value ?? {});
    if (result) {
      this.latitudeControl.setValue(result.latitude);
      this.longitudeControl.setValue(result.longitude);
    }
  }

  private updateInternalFormFromValue(value: AddressInput | null): void {
    if (!value) return;

    this.addressFormGroup.patchValue(
      {
        street: value.street ?? '',
        postalCode: value.postalCode ?? '',
        city: value.city ?? '',
        country: value.country ?? '',
        additionalInfo: value.additionalInfo ?? '',
        latitude: value.latitude ?? null,
        longitude: value.longitude ?? null,
      },
      { emitEvent: true },
    );
  }
}
