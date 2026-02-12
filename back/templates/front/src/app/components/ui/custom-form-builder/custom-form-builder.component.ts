import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Section } from './../../../api/models/section';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { Field, FieldType, FormStructure, Option } from '../../../api/models';
import { FieldTypeDefinition } from '../../../api/models/field-type';
import { CustomFormsService } from '../../../api/services';
import { TranslationService } from '../../../services/translation/translation.service';

@Component({
  selector: 'app-custom-form-builder',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatIconModule,
    FormsModule,
    MatInputModule,
    MatCheckboxModule,
    MatTooltip,
    MatButtonModule,
  ],
  templateUrl: './custom-form-builder.component.html',
  styleUrl: './custom-form-builder.component.scss',
})
export class CustomFormBuilderComponent implements OnInit {
  @Input() customFormStructure!: FormStructure | null;
  @Input() editMode = false;
  @Input() showFieldTypePanel = true;
  @Input() isControlPoint = false;

  @Output() formStructureChange = new EventEmitter<FormStructure>();

  editedSectionIndex: WritableSignal<number | null> = signal(null);
  editedFieldIndex: WritableSignal<number | null> = signal(null);
  dropSectionIdSignal: WritableSignal<string> = signal('');
  optionValue: WritableSignal<string | null> = signal(null);

  // Prepare field types for drag and drop
  fieldType = Object.keys(FieldType);
  fieldTypeDefinition = FieldTypeDefinition;

  orderedFieldType = this.fieldType
    .filter((x) => (this.isControlPoint ? x == 'ControlPoint' : x !== 'ControlPoint'))
    .map((key) => ({
      key,
      ...this.fieldTypeDefinition[key as keyof typeof FieldTypeDefinition],
    }));

  constructor(
    protected readonly tr: TranslationService,
    private readonly customFormsService: CustomFormsService,
  ) {}

  ngOnInit(): void {
    this.editedSectionIndex.set(0);
    this.dropSectionIdSignal.set(this.customFormStructure?.sections?.[0]?.id ?? '');

    // Ne charger la structure par défaut que si aucune structure n'a été fournie
    if (
      !this.customFormStructure ||
      !this.customFormStructure.sections ||
      this.customFormStructure.sections.length === 0
    ) {
      this.getDefaultStructure();
    }
  }

  async getDefaultStructure(): Promise<void> {
    const result = await firstValueFrom(this.customFormsService.customFormsDefaultGet());
    this.customFormStructure = {
      sections: result.sections,
    };
    this.emitFormStructureChange();
  }

  emitFormStructureChange(): void {
    if (this.customFormStructure) {
      this.formStructureChange.emit(this.customFormStructure);
    }
  }

  addSection(): void {
    this.customFormStructure?.sections?.push({
      id: null,
      name: 'Nouvelle section',
      fields: [],
    });
    this.emitFormStructureChange();
  }

  editSection(event: MouseEvent | Event, sectionToEdit: number): void {
    event.stopPropagation();
    const section = this.customFormStructure?.sections?.[sectionToEdit];
    if (this.editedSectionIndex() === sectionToEdit) {
      this.editedSectionIndex.set(null);
    } else if (section) {
      this.editedSectionIndex.set(sectionToEdit);
      this.dropSectionIdSignal.set(section.id ?? '');
    }
  }

  removeSection(event: MouseEvent | Event, sectionToRemove: number): void {
    event.stopPropagation();
    const section = this.customFormStructure?.sections?.[sectionToRemove];
    if (section) {
      section.fields = section.fields?.filter((field) => !field.isDeleted) ?? null;

      if (this.customFormStructure && this.customFormStructure.sections) {
        this.customFormStructure.sections = this.customFormStructure.sections?.filter(
          (section, index) => index !== sectionToRemove,
        );
      }
    }
    this.emitFormStructureChange();
  }

  drop(event: CdkDragDrop<Field[] | null, any, any>): void {
    const { previousContainer, container, previousIndex, currentIndex, item } = event;

    if (previousContainer === container && container.data) {
      moveItemInArray(container.data, previousIndex, currentIndex);
      // Update order
      container.data.forEach((field: Field, index: number) => {
        field.order = index;
      });
    } else {
      const sectionIndex = this.editedSectionIndex();
      if (sectionIndex !== null) {
        this.createField(sectionIndex, item.data, currentIndex);
      }
    }
    this.editedFieldIndex.set(currentIndex);
    this.emitFormStructureChange();
  }

  createField(sectionIndex: number, fieldType: string, index?: number): void {
    const section = this.customFormStructure?.sections?.[sectionIndex];
    if (!section?.fields) return;

    const type = FieldType[fieldType as keyof typeof FieldType];
    const newField: Field = {
      id: null,
      isReadOnly: false,
      isRequired: false,
      isDeleted: false,
      type: type,
      label: '',
      order: index ?? section.fields.length,
      options: this.typeWithOption(fieldType) ? [] : null,
    };

    if (index !== undefined) {
      section.fields.splice(index, 0, newField);
    } else {
      section.fields.push(newField);
    }
    this.emitFormStructureChange();
  }

  addField(fieldType: string): void {
    const sectionIndex = this.editedSectionIndex();
    if (sectionIndex !== null) {
      this.createField(sectionIndex, fieldType);
    }
  }

  typeWithOption(fieldType: string): boolean {
    const typeWithOption = ['Radio', 'Checkbox', 'Select'];
    return typeWithOption.includes(fieldType);
  }

  emptyOrAllFieldsDeleted(section: Section): boolean {
    return !section.fields?.length || section.fields.every((field) => field.isDeleted);
  }

  editField(event: MouseEvent | Event, fieldIndex: number): void {
    event.stopPropagation();
    this.editedFieldIndex.set(this.editedFieldIndex() === fieldIndex ? null : fieldIndex);
  }

  removeField(field: Field): void {
    const editedSectionIndex = this.editedSectionIndex();
    if (editedSectionIndex === null) return;

    const section = this.customFormStructure?.sections?.[editedSectionIndex];
    if (section?.fields) {
      const fieldToDelete = section.fields.find((f: Field) => f === field);
      if (fieldToDelete?.id) {
        fieldToDelete.isDeleted = true;
      } else {
        section.fields = section.fields.filter((f: Field) => f !== field);
      }
    }
    this.emitFormStructureChange();
  }

  addOption(field: Field): void {
    if (!field.options) return;

    const label = this.optionValue();
    if (!label) return;
    const newOption: Option = {
      label,
      order: field.options.length,
      id: null,
      isDeleted: false,
    };

    field.options.push(newOption);
    this.optionValue.set(null);
    this.emitFormStructureChange();
  }

  removeOption(field: Field, option: Option): void {
    option.isDeleted = true;
    this.emitFormStructureChange();
  }

  dropOption(event: CdkDragDrop<Option[] | null | undefined>): void {
    const { previousContainer, container, previousIndex, currentIndex } = event;
    const data = container.data;

    if (previousContainer === container && data) {
      moveItemInArray(data, previousIndex, currentIndex);
      data.forEach((option, index) => (option.order = index));
    }
    this.emitFormStructureChange();
  }

  addControlPoint(): void {
    this.addField('ControlPoint');
  }
}
