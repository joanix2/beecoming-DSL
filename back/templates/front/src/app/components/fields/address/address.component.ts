import { CommonModule } from '@angular/common';
import { Component, forwardRef, inject, input, model, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AddressInput } from '../../../api/models';
import { GeocodingService } from '../../../services/geocoding.service';
import { TranslationService } from '../../../services/translation/translation.service';
import { MapViewComponent } from '../../map-view/map-view.component';
import { FIELD_ERRORS } from '../custom-errors';
import { EditNumberFieldComponent } from '../edit-number-field/edit-number-field.component';
import { EditTextFieldComponent } from '../edit-text-field/edit-text-field.component';

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EditTextFieldComponent,
    EditNumberFieldComponent,
    MatIcon,
    MatButtonModule,
    MapViewComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddressComponent),
      multi: true,
    },
  ],
})
export class AddressComponent implements ControlValueAccessor {
  geocodingService = inject(GeocodingService);
  tr = inject(TranslationService);

  addressFormGroup!: FormGroup;
  streetControl = new FormControl('', [Validators.required]);
  postalCodeControl = new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\d{5}$/)]);
  cityControl = new FormControl('', [Validators.required]);
  countryControl = new FormControl('', [Validators.required]);
  additionalInfoControl = new FormControl('');
  latitudeControl = new FormControl<number | null>(null);
  longitudeControl = new FormControl<number | null>(null);

  isEditMode = model<boolean>(false);
  label = input<string>('');
  signalAddress = signal<AddressInput[]>([] as AddressInput[]);
  isLoading = signal<boolean>(false);

  FIELD_ERRORS = FIELD_ERRORS;

  constructor() {
    this.addressFormGroup = new FormGroup({
      street: this.streetControl,
      postalCode: this.postalCodeControl,
      city: this.cityControl,
      country: this.countryControl,
      additionalInfo: this.additionalInfoControl,
      latitude: this.latitudeControl,
      longitude: this.longitudeControl,
    });
  }

  writeValue(value: AddressInput | null): void {
    if (!value) return;
    this.updateInternalFormFromValue(value);
    this.signalAddress.set([value]);
  }

  registerOnChange(fn: (value: AddressInput | null) => void): void {
    this.addressFormGroup.valueChanges.subscribe((value) => {
      fn(value as AddressInput);
    });
  }

  registerOnTouched(fn: () => void): void {
    this.addressFormGroup.statusChanges.subscribe(() => fn());
  }

  disableFormControl() {
    this.addressFormGroup.disable();
  }

  enableFormControl(): void {
    this.addressFormGroup.enable();
  }

  async localize() {
    this.isLoading.set(true);
    try {
      const result = await this.geocodingService.localizeAddress(this.addressFormGroup.value ?? {});
      if (result) {
        this.latitudeControl.setValue(result.latitude);
        this.longitudeControl.setValue(result.longitude);
        this.signalAddress.set([result as unknown as AddressInput]);
      }
    } catch (error) {
      console.error(error);
      this.tr.language().FORM_LOCATE_ERROR;
    } finally {
      this.isLoading.set(false);
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
