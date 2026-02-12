import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { TranslationService } from '../../services/translation/translation.service';

const tr = new TranslationService();
export const FIELD_ERRORS = {
  required: { validator: 'required', message: tr.language().CUSTOM_FORM_FIELD_REQUIRED },
  email: { validator: 'email', message: tr.language().CUSTOM_FORM_FIELD_EMAIL },
  phoneNumber: { validator: 'pattern', message: tr.language().CUSTOM_FORM_FIELD_PHONE_NUMBER },
  postalCode: { validator: 'pattern', message: tr.language().CUSTOM_FORM_FIELD_POSTAL_CODE },
  isNotString: { validator: 'notType', message: tr.language().CUSTOM_FORM_AUTOCOMPLETE_STRING },
  dateRange: { validator: 'dateRange', message: 'La date de fin ne peut pas être antérieure à la date de début' },
};

export function notTypeValidator(
  disallowedType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null',
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (disallowedType === 'array') {
      return Array.isArray(value) ? { notType: { disallowed: 'array', actual: 'array' } } : null;
    }

    if (disallowedType === 'null') {
      return value === null ? { notType: { disallowed: 'null', actual: 'null' } } : null;
    }

    return typeof value === disallowedType ? { notType: { disallowed: disallowedType, actual: typeof value } } : null;
  };
}
