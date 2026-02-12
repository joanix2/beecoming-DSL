import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
  isDevMode,
  LOCALE_ID,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideToastr } from 'ngx-toastr';
import { MatNativeDatetimeModule } from '@mat-datetimepicker/core';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { apiInterceptor } from './api.interceptor';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslationService } from './services/translation/translation.service';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideServiceWorker } from '@angular/service-worker';
import { provideIndexedDb, DBConfig } from 'ngx-indexed-db';
import { provideIonicAngular } from '@ionic/angular/standalone';
import localeFr from '@angular/common/locales/fr';
import { registerLocaleData } from '@angular/common';

export const MAT_DATE_LUXON_FORMATS = {
  parse: {
    dateInput: 'dd/MM/yyyy', // Format attendu pour l'entrée de la date
  },
  display: {
    dateInput: 'dd/MM/yyyy', // Format d'affichage dans le champ de saisie
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'dd/MM/yyyy',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_STARS = '*'.repeat(PASSWORD_MIN_LENGTH);
export const PASSWORD_PATTERN = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\da-zA-Z]).{' + PASSWORD_MIN_LENGTH + ',}$';

// Module à register depuis la version 33 de ag-grid
ModuleRegistry.registerModules([AllCommunityModule]);
// Module à register pour la gestion des locales
registerLocaleData(localeFr);

export function getPaginatorIntl(translationService: TranslationService) {
  const paginatorIntl = new MatPaginatorIntl();
  const setTranslations = (language: string) => {
    paginatorIntl.itemsPerPageLabel = translationService.language().itemsPerPageLabel;
    paginatorIntl.nextPageLabel = translationService.language().nextPageLabel;
    paginatorIntl.previousPageLabel = translationService.language().previousPageLabel;
    paginatorIntl.firstPageLabel = translationService.language().firstPageLabel;
    paginatorIntl.lastPageLabel = translationService.language().lastPageLabel;
    paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return `0 de ${length}`;
      }
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} de ${length}`;
    };
    paginatorIntl.changes.next();
  };

  setTranslations('fr'); // Initial language

  return paginatorIntl;
}

const dbConfig: DBConfig = {
  name: 'MyAppDB',
  version: 1,
  objectStoresMeta: [
    {
      store: 'offlineData',
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'formData', keypath: 'formData', options: { unique: false } },
        { name: 'timestamp', keypath: 'timestamp', options: { unique: false } },
      ],
    },
  ],
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideIndexedDb(dbConfig),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync('animations'),
    provideHttpClient(withInterceptors([apiInterceptor])),
    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    provideToastr(),
    importProvidersFrom(MatNativeDatetimeModule),
    { provide: MatPaginatorIntl, useFactory: getPaginatorIntl, deps: [TranslationService] },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic', appearance: 'outline' } },
    provideLuxonDateAdapter(),
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' }),
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' }),
    provideIonicAngular({}),
  ],
};
