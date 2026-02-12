import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import {
  CustomFormData,
  CustomFormResponseInput,
  CustomFormWithSavedDataOutput,
  FieldOutput,
  FieldResponse,
  SectionOutput,
  SectionResponse,
} from '../../../api/models';
import { FilesService } from '../../../api/services';
import { TranslationService } from '../../../services/translation/translation.service';
import { CustomFormFieldComponent } from '../../custom-form/custom-form-field/custom-form-field.component';

@Component({
  selector: 'app-custom-forms-answer-details',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, CustomFormFieldComponent],
  templateUrl: './custom-forms-answer-details.component.html',
  styleUrls: ['./custom-forms-answer-details.component.scss'],
})
export class CustomFormsAnswerDetailsComponent {
  // Services
  tr = inject(TranslationService);
  filesService = inject(FilesService);
  toastr = inject(ToastrService);

  // Inputs
  missionId = input.required<string>();
  editMode = input.required<boolean>();

  // Models and Signals
  customFormsData = model<CustomFormWithSavedDataOutput[]>([]);
  customFormControls = signal<Map<string, FormControl>>(new Map());

  // Signal computed pour pré-calculer toutes les valeurs des champs
  customFormFieldValues = computed(() => {
    const values = new Map<string, FieldResponse>();
    const customForms = this.customFormsData();
    const controls = this.customFormControls();

    customForms.forEach((customForm) => {
      if (!customForm.formStructure?.sections || !customForm.id) return;

      customForm.formStructure.sections.forEach((section) => {
        if (!section.fields || !section.id) return;

        section.fields.forEach((field) => {
          if (!field.id) return;

          const controlKey = `${customForm.id}_${section.id}_${field.id}`;
          const control = controls.get(controlKey);

          // Si le FormControl existe, utiliser sa valeur
          if (control) {
            values.set(controlKey, {
              fieldId: field.id,
              value: control.value,
            });
          } else {
            // Sinon, chercher dans les données sauvegardées
            const savedValue = this.findFieldValue(customForm.savedData, section.id || '', field.id);
            values.set(controlKey, {
              fieldId: field.id,
              value: savedValue || '',
            });
          }
        });
      });
    });

    return values;
  });

  constructor() {
    // Effect to initialize custom forms when data changes
    effect(() => {
      const customForms = this.customFormsData();
      if (customForms.length > 0) {
        this.createCustomFormControls(customForms);
      }
    });
  }

  /**
   * Organise les données des custom forms et crée les FormControls pour l'édition
   */
  setupCustomFormsData(customForms: CustomFormWithSavedDataOutput[]): void {
    if (!customForms || customForms.length === 0) {
      this.customFormsData.set([]);
      this.customFormControls.set(new Map());
      return;
    }

    // Stocker directement les données du modèle existant
    this.customFormsData.set(customForms);

    // Créer les FormControls pour chaque champ
    this.createCustomFormControls(customForms);
  }

  /**
   * Crée les FormControls pour tous les champs des custom forms
   */
  private createCustomFormControls(customForms: CustomFormWithSavedDataOutput[]): void {
    const controlsMap = new Map<string, FormControl>();
    customForms.forEach((customForm) => {
      if (!customForm.formStructure?.sections) {
        return;
      }

      customForm.formStructure.sections.forEach((section: SectionOutput) => {
        if (!section.fields || !section.id) return;

        section.fields.forEach((field: FieldOutput) => {
          if (!field.id) return;

          // Créer une clé unique pour le FormControl
          const controlKey = `${customForm.id}_${section.id}_${field.id}`;

          // Trouver la valeur existante dans savedData
          const existingValue = this.findFieldValue(customForm.savedData, section.id || '', field.id);

          // Créer le FormControl avec la valeur existante
          const validators = field.isRequired ? [Validators.required] : [];
          const control = new FormControl(existingValue || '', validators);

          controlsMap.set(controlKey, control);
        });
      });
    });

    this.customFormControls.set(controlsMap);
  }

  /**
   * Trouve la valeur d'un champ dans les données sauvegardées
   */
  private findFieldValue(savedData: CustomFormData | undefined, sectionId: string, fieldId: string): any {
    if (!savedData?.sections) return null;

    const section = savedData.sections.find((s: SectionResponse) => s.sectionId === sectionId);
    if (!section?.fields) return null;

    const field = section.fields.find((f: FieldResponse) => f.fieldId === fieldId);
    if (!field) return null;

    // Gérer les structures imbriquées
    if (field.value && typeof field.value === 'object' && field.value.value) {
      // Si c'est un objet avec une propriété value (structure imbriquée)
      return field.value.value;
    }

    return field.value || null;
  }

  /**
   * Récupère le FormControl pour un champ spécifique
   */
  getFieldControl(customFormId: string, sectionId: string, fieldId: string): FormControl {
    const controlKey = `${customFormId}_${sectionId}_${fieldId}`;
    const control = this.customFormControls().get(controlKey);

    if (!control) {
      // Créer un FormControl par défaut si non trouvé
      const defaultControl = new FormControl('');
      this.customFormControls().set(controlKey, defaultControl);
      return defaultControl;
    }

    return control;
  }

  /**
   * Récupère la réponse pour un champ spécifique depuis le signal computed
   */
  getFieldValueFromSignal(
    customForm: CustomFormWithSavedDataOutput,
    sectionId: string,
    fieldId: string,
  ): FieldResponse {
    const controlKey = `${customForm.id}_${sectionId}_${fieldId}`;
    const fieldValues = this.customFormFieldValues();
    const fieldResponse = fieldValues.get(controlKey);

    if (fieldResponse) {
      return fieldResponse;
    }

    // Fallback si pas trouvé dans le signal
    return {
      fieldId: fieldId,
      value: '',
    };
  }

  /**
   * Récupère la réponse pour un champ spécifique
   */
  getFieldResponse(customForm: CustomFormWithSavedDataOutput, sectionId: string, fieldId: string): FieldResponse {
    const controlKey = `${customForm.id}_${sectionId}_${fieldId}`;
    const control = this.customFormControls().get(controlKey);

    // Si le FormControl existe, utiliser sa valeur
    if (control) {
      return {
        fieldId: fieldId,
        value: control.value,
      };
    }

    // Sinon, chercher dans les données sauvegardées
    const savedValue = this.findFieldValue(customForm.savedData, sectionId, fieldId);

    return {
      fieldId: fieldId,
      value: savedValue || '',
    };
  }

  /**
   * Gère les changements de valeur des champs de custom forms
   */
  onCustomFormFieldChange(customFormId: string, sectionId: string, fieldResponse: FieldResponse): void {
    const controlKey = `${customFormId}_${sectionId}_${fieldResponse.fieldId}`;
    const control = this.customFormControls().get(controlKey);

    // Vérifier si c'est un champ de fichiers (Photo, PhotoMultiple, Signature)
    const isFileField = this.isFileField(fieldResponse.value);

    if (isFileField) {
      this.processFileFieldAsync(customFormId, sectionId, fieldResponse);
    } else {
      // Pour les champs non-fichiers, traitement synchrone
      this.updateControlValue(controlKey, fieldResponse.value, control);
    }
  }

  private isFileField(value: any): boolean {
    // Vérifier si c'est un File direct
    if (value instanceof File) {
      return true;
    }

    // Vérifier si c'est un tableau contenant des FileInfo avec originalFile
    if (Array.isArray(value)) {
      return value.some(
        (item: any) => item instanceof File || (item && typeof item === 'object' && item.originalFile instanceof File),
      );
    }

    // Vérifier si c'est un objet FileInfo avec originalFile
    if (value && typeof value === 'object' && value.originalFile instanceof File) {
      return true;
    }

    // Vérifier si c'est une data URL base64 (signature)
    if (typeof value === 'string' && value.startsWith('data:image/')) {
      return true;
    }

    return false;
  }

  /**
   * Convertit une data URL base64 en File
   */
  private dataURLtoFile(dataURL: string, filename: string): File {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  private async processFileFieldAsync(
    customFormId: string,
    sectionId: string,
    fieldResponse: FieldResponse,
  ): Promise<void> {
    const controlKey = `${customFormId}_${sectionId}_${fieldResponse.fieldId}`;
    const control = this.customFormControls().get(controlKey);

    let processedValue = fieldResponse.value;

    // Upload les fichiers et obtenir les URLs
    if (fieldResponse.value instanceof File) {
      // Fichier unique (Photo, Signature)
      const fileUrl = await this.uploadFile(fieldResponse.value, customFormId);
      processedValue = fileUrl;
    } else if (Array.isArray(fieldResponse.value)) {
      // Extraire les fichiers originaux des FileInfo
      const files: File[] = [];
      fieldResponse.value.forEach((item: any) => {
        if (item instanceof File) {
          files.push(item);
        } else if (item && typeof item === 'object' && item.originalFile instanceof File) {
          files.push(item.originalFile);
        }
      });

      if (files.length > 0) {
        const fileUrls = await this.uploadMultipleFiles(files, customFormId);
        processedValue = fileUrls;
      }
    } else if (
      fieldResponse.value &&
      typeof fieldResponse.value === 'object' &&
      fieldResponse.value.originalFile instanceof File
    ) {
      // FileInfo unique
      const fileUrl = await this.uploadFile(fieldResponse.value.originalFile, customFormId);
      processedValue = fileUrl;
    } else if (typeof fieldResponse.value === 'string' && fieldResponse.value.startsWith('data:image/')) {
      // Data URL base64 (signature)
      const file = this.dataURLtoFile(fieldResponse.value, 'signature.png');
      const fileUrl = await this.uploadFile(file, customFormId);
      processedValue = fileUrl;
    }

    this.updateControlValue(controlKey, processedValue, control);
  }

  /**
   * Upload un fichier unique et retourne l'URL
   */
  private async uploadFile(file: File, customFormId: string): Promise<string> {
    try {
      const missionId = this.missionId();
      const minioFolderName = 'missions';
      const entityId = `${missionId}/customForms/${customFormId}/responses`;

      const uploadedFile = await firstValueFrom(
        this.filesService.filesPost$FormData({
          body: { file },
          minioFolderName: minioFolderName,
          entityId: entityId,
        }),
      );

      if (uploadedFile && uploadedFile.url) {
        return uploadedFile.url;
      }

      throw new Error('Upload failed: no URL returned');
    } catch (error) {
      console.error('Error uploading file:', error);
      this.toastr.error("Erreur lors de l'upload du fichier");
      throw error;
    }
  }

  /**
   * Upload plusieurs fichiers et retourne les URLs
   */
  private async uploadMultipleFiles(files: File[], customFormId: string): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, customFormId));
    return await Promise.all(uploadPromises);
  }

  private updateControlValue(controlKey: string, value: any, control: FormControl | undefined): void {
    if (control) {
      control.setValue(value);
      control.markAsDirty();
    } else {
      // Créer le control s'il n'existe pas
      const newControl = new FormControl(value);
      this.customFormControls().set(controlKey, newControl);
    }
  }

  /**
   * Convertit les données des FormControls en format CustomFormResponseInput pour l'API (version synchrone)
   */
  generateCustomFormResponsesSync(): CustomFormResponseInput[] {
    const customFormResponses: CustomFormResponseInput[] = [];
    const controls = this.customFormControls();

    this.customFormsData().forEach((customForm) => {
      if (!customForm.formStructure?.sections || !customForm.id) return;

      const sections: SectionResponse[] = customForm.formStructure.sections.map((section) => {
        if (!section.fields || !section.id) {
          return { sectionId: section.id, fields: [] };
        }

        const fields: FieldResponse[] = section.fields.map((field) => {
          if (!field.id) {
            return { fieldId: field.id, value: '' };
          }

          const controlKey = `${customForm.id}_${section.id}_${field.id}`;
          const control = controls.get(controlKey);
          const controlValue = control?.value;

          return {
            fieldId: field.id,
            value: controlValue || '',
          };
        });

        return {
          sectionId: section.id,
          fields: fields,
        };
      });

      customFormResponses.push({
        customFormId: customForm.id,
        data: {
          sections: sections,
        },
      });
    });

    return customFormResponses;
  }
}
