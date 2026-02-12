import { AbstractControl, ValidatorFn } from "@angular/forms";
import { DateTime } from "luxon";

export class CustomValidators {
  public static readonly datePassedValidator: ValidatorFn = (control: AbstractControl) => {
    const currentDate = DateTime.now();
    const controlDate = DateTime.fromISO(control.value);
    return controlDate > currentDate ? { dateNotPassed: true } : null;
  };

  public static readonly numberPositiveValidator: ValidatorFn = (control: AbstractControl) => {
    return control.value < 0 ? { numberNegative: true } : null;
  };

  public static readonly urlValidator: ValidatorFn = (control: AbstractControl) => {
    try {
      new URL(control.value);
      return null;
    } catch {
      return { invalidUrl: true };
    }
  };
}
