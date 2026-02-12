export const RICHTEXT = {
  ACCEPTED_EXTENSIONS_HEADER: [
    '89504e47', // PNG
    'ffd8ffe0', // JPEG
    'ffd8ffe1', // JPEG
    'ffd8ffe2', // JPEG
    'ffd8ffe3', // JPEG
    'ffd8ffe8', // JPEG
  ],
  ACCEPTED_EXTENSIONS_DOCUMENT: ['.pdf', '.xls', '.xlsx', '.csv', '.doc', '.docx'],
  ACCEPTED_MIME_TYPES_DOCUMENT: [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ACCEPTED_MIME_TYPES: ['image/png', 'image/jpeg'],
  ACCEPTED_EXTENSIONS: ['.png', '.jpg', '.jpeg'],
};
const CUSTOM_FORM_FILES = {
  CUSTOM_FORM_ACCEPTED_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.pdf'],
  CUSTOM_FORM_ACCEPTED_MIME_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
};
const CATEGORY_IMAGES = {
  CATEGORY_ACCEPTED_EXTENSIONS: ['.png', '.jpg', '.jpeg'],
  CATEGORY_ACCEPTED_MIME_TYPES: ['image/png', 'image/jpeg'],
};
const LOGO = {
  ACCEPTED_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.svg'],
  ACCEPTED_MIME_TYPES: ['image/png', 'image/jpeg', 'image/svg+xml'],
};

export class ROLE {
  static readonly SUPERVISOR = 'supervisor';
  static readonly TEAMLEADER = 'teamleader';
  static readonly OPERATOR = 'operator';
}

export const APP_CONSTANTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5 Mo
  ...RICHTEXT,
  ...CUSTOM_FORM_FILES,
  ...CATEGORY_IMAGES,
  ...LOGO,
};
