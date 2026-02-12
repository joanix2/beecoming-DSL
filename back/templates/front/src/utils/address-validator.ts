import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function addressValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return { addressInvalid: true };

    const { street, city, country, postalCode } = value;

    const isValid = street?.trim() && city?.trim() && country?.trim() && postalCode?.trim();

    return isValid ? null : { addressInvalid: true };
  };
}
