import { FieldOutput } from "../app/api/models/field-output";
import { TranslationService } from "../app/services/translation/translation.service";
import { FieldType } from "../app/api/models";

function hasRequiredError(field: FieldOutput, touched: boolean, answerValue: any) {
  if (!field.isRequired || !touched || field.isDeleted) {
    return false;
  }

  const value = answerValue?.value;
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (typeof value === "object" && Object.keys(value).length === 0)
  );
}

export function getFieldErrors(field: FieldOutput, touched: boolean, answerValue: any, tr: TranslationService) {
  if (hasRequiredError(field, touched, answerValue)) {
    return "Le champ est requis";
  }

  if (!touched) {
    return "";
  }
  const { value } = answerValue || {};
  switch (field.type) {
    case FieldType.Text:
    case FieldType.Paragraph:
      return typeof value !== "string" ? tr.language().CUSTOM_FORM_FIELD_STRING : "";

    case FieldType.NumberInt:
      return (value && isNaN(value)) || !Number.isInteger(value) ? tr.language().CUSTOM_FORM_FIELD_INT : "";

    case FieldType.Number:
      return value && isNaN(value) ? tr.language().CUSTOM_FORM_FIELD_NUMBER : "";

    case FieldType.Date:
    case FieldType.Datetime:
    case FieldType.Time:
      return value && isNaN(Date.parse(value)) ? tr.language().CUSTOM_FORM_FIELD_DATE : "";

    case FieldType.DateRange:
      if (value) {
        if (!value.start) return tr.language().CUSTOM_FORM_FIELD_DATE_START;
        if (!value.end) return tr.language().CUSTOM_FORM_FIELD_DATE_END;
        if (value.start > value.end) return tr.language().CUSTOM_FORM_FIELD_DATE_ORDER;
        if (value.start === value.end) return tr.language().CUSTOM_FORM_FIELD_DATE_DIFF;
      }
      break;
  }
  return "";
}
