import { DatePipe } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { ToastrService } from 'ngx-toastr';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { APP_CONSTANTS } from '../../../../utils/constant';
import { getFieldErrors } from '../../../../utils/custom-form-field-validation';
import { FieldOutput, FieldResponse, FieldType } from '../../../api/models';
import { FileHelperService, FileInfo } from '../../../services/file-helper.service';
import { TranslationService } from '../../../services/translation/translation.service';
import { FileDisplayComponent } from '../../file-display/file-display.component';
import { SignatureFieldComponent } from '../signature-field/signature-field.component';

@Component({
  standalone: true,
  selector: 'app-custom-form-field',
  templateUrl: 'custom-form-field.component.html',
  styleUrls: ['custom-form-field.component.scss'],
  providers: [
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'fr-FR',
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
    provideLuxonDateAdapter(),
  ],
  imports: [
    FormsModule,
    MatInputModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatTimepickerModule,
    MatError,
    SignatureFieldComponent,
    FileDisplayComponent,
    DatePipe,
  ],
})
export class CustomFormFieldComponent implements OnInit, OnDestroy {
  @Input({ required: true }) field!: FieldOutput;
  @Input({ required: true }) answerValue!: FieldResponse | undefined;
  @Input() firstNextClicked = false;
  @Input() editMode = true;
  @Output() answerValueChange = new EventEmitter<any>();
  @ViewChild('inputRef') input: NgModel | undefined;
  @ViewChild('fileInput') fileInput!: ElementRef;
  protected readonly FieldType = FieldType;
  protected readonly APP_CONSTANTS = APP_CONSTANTS;

  private destroy$ = new Subject<void>();
  private valueChangeSubject = new Subject<any>();

  constructor(
    public readonly translateService: TranslationService,
    private toastr: ToastrService,
    private readonly fileHelperService: FileHelperService,
  ) {
    // Configurer le debounce pour les changements de valeur
    this.valueChangeSubject
      .pipe(
        debounceTime(300), // 300ms de délai
        takeUntil(this.destroy$),
      )
      .subscribe((newValue) => {
        this.emitValueChange(newValue);
      });
  }

  get files() {
    const value = this.answerValue?.value;

    // Si c'est un tableau
    if (Array.isArray(value)) {
      return value;
    }

    // Si c'est une string (URL unique)
    if (typeof value === 'string' && value) {
      return [value];
    }

    // Si c'est un objet FileInfo unique
    if (value && typeof value === 'object' && value.url) {
      return [value];
    }

    return [];
  }

  get selectedValue() {
    return this.field.options?.find((option) => option.id === this.answerValue?.value)?.label;
  }

  ngOnInit() {
    if (this.answerValue === undefined) {
      this.answerValue = {
        fieldId: this.field.id,
        value: '',
      };
    }
    switch (this.field.type) {
      case FieldType.DateRange:
        this.answerValue.value = this.answerValue.value || {};
        break;
      case FieldType.Checkbox:
        this.answerValue.value = this.answerValue.value || {};
        break;
      case FieldType.Photo:
      case FieldType.PhotoMultiple:
        this.answerValue.value = this.answerValue.value || [];
        break;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  hasError() {
    return getFieldErrors(
      this.field,
      this.input?.touched || this.firstNextClicked,
      this.answerValue,
      this.translateService,
    );
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.answerValue) {
      const fileInfo = this.fileHelperService.handleFile(
        file,
        APP_CONSTANTS.CUSTOM_FORM_ACCEPTED_MIME_TYPES,
        APP_CONSTANTS.CUSTOM_FORM_ACCEPTED_EXTENSIONS,
      );

      if (fileInfo) {
        const newFieldResponse: FieldResponse = {
          fieldId: this.answerValue.fieldId,
          value: [fileInfo],
        };
        // Mettre à jour answerValue pour que le template se mette à jour
        this.answerValue.value = [fileInfo];
        this.answerValueChange.emit(newFieldResponse);
      }
    }

    //clear input
    (event.target as HTMLInputElement).value = '';
  }

  onMultipleFileChange(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files && this.answerValue) {
      const fileInfos: FileInfo[] = [];

      for (const file of files) {
        const fileInfo = this.fileHelperService.handleFile(
          file,
          APP_CONSTANTS.CUSTOM_FORM_ACCEPTED_MIME_TYPES,
          APP_CONSTANTS.CUSTOM_FORM_ACCEPTED_EXTENSIONS,
        );

        if (fileInfo) {
          fileInfos.push(fileInfo);
        }
      }

      if (fileInfos.length > 0) {
        const newFieldResponse: FieldResponse = {
          fieldId: this.answerValue.fieldId,
          value: fileInfos,
        };
        // Mettre à jour answerValue pour que le template se mette à jour
        this.answerValue.value = fileInfos;
        this.answerValueChange.emit(newFieldResponse);
      }
    }

    //clear input
    (event.target as HTMLInputElement).value = '';
  }

  removeFile(index: number = 0) {
    if (this.answerValue && this.answerValue.value) {
      const currentFiles = this.answerValue.value as FileInfo[];
      const updatedFiles = currentFiles.filter((_, i) => i !== index);

      const newFieldResponse: FieldResponse = {
        fieldId: this.answerValue.fieldId,
        value: updatedFiles,
      };
      // Mettre à jour answerValue pour que le template se mette à jour
      this.answerValue.value = updatedFiles;
      this.answerValueChange.emit(newFieldResponse);
    }
  }

  /**
   * Gère les changements de valeur des champs et émet l'événement
   */
  onValueChange(newValue: any): void {
    this.valueChangeSubject.next(newValue);
  }

  /**
   * Émet immédiatement un changement de valeur (pour les champs qui ne nécessitent pas de debounce)
   */
  onImmediateValueChange(newValue: any): void {
    this.emitValueChange(newValue);
  }

  /**
   * Gère les changements de valeur des checkboxes
   */
  onCheckboxChange(optionId: string, checked: boolean): void {
    if (this.answerValue && this.answerValue.value) {
      this.answerValue.value[optionId] = checked;
      this.answerValueChange.emit(this.answerValue);
    }
  }

  private emitValueChange(newValue: any): void {
    if (this.answerValue) {
      this.answerValue.value = newValue;
      this.answerValueChange.emit(this.answerValue);
    }
  }
}
