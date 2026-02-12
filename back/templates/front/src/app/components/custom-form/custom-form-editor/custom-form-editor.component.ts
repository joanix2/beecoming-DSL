import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgClass, NgStyle } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { Field } from '../../../api/models/field';
import { FieldType, FieldTypeDefinition } from '../../../api/models/field-type';
import { FormStructure } from '../../../api/models/form-structure';
import { Option } from '../../../api/models/option';
import { Section } from '../../../api/models/section';
import { TranslationService } from '../../../services/translation/translation.service';

@Component({
  standalone: true,
  selector: 'app-custom-form-editor',
  templateUrl: 'custom-form-editor.component.html',
  styleUrls: ['custom-form-editor.component.scss'],
  imports: [
    MatIconModule,
    CdkDropList,
    CdkDrag,
    NgClass,
    NgStyle,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    FormsModule,
    MatTooltip,
  ],
})
export class CustomFormEditorComponent {
  @Input({ required: true }) formTitle = '';
  @Input({ required: true }) titleTooltipContent = '';
  @Input({ required: true }) editMode = signal<boolean>(false);
  @Input({ required: true }) customFormStructureSignal = signal<FormStructure | null>(null);

  fieldType = Object.keys(FieldType);
  fieldTypeDefinition = FieldTypeDefinition;

  orderedFieldType = this.fieldType.map((key) => ({
    key,
    ...this.fieldTypeDefinition[key as keyof typeof FieldTypeDefinition],
  }));
  dropSectionIdSignal = signal<string>('');
  editedSectionIndex = signal<number | null>(null);
  editedFieldIndex = signal<number | null>(null);
  optionValue = signal<string | null>(null);

  constructor(public readonly translateService: TranslationService) {}

  drop(event: CdkDragDrop<Field[] | null, any, any>) {
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
  }

  editSection(event: MouseEvent | Event, sectionToEdit: number) {
    event.stopPropagation();
    const section = this.customFormStructureSignal()?.sections?.[sectionToEdit];
    if (this.editedSectionIndex() === sectionToEdit) {
      this.editedSectionIndex.set(null);
    } else if (section) {
      this.editedSectionIndex.set(sectionToEdit);
      this.dropSectionIdSignal.set(section.id ?? '');
    }
  }

  createField(sectionIndex: number, fieldType: string, index?: number) {
    const section = this.customFormStructureSignal()?.sections?.[sectionIndex];
    if (!section?.fields) return;

    const type = FieldType[fieldType as keyof typeof FieldType];
    const newField: Field = {
      id: null,
      isReadOnly: false,
      isRequired: false,
      isDeleted: false,
      type: type,
      label: this.translateService.get(type),
      order: index ?? section.fields.length,
      options: this.typeWithOption(fieldType) ? [] : null,
    };

    if (index !== undefined) {
      section.fields.splice(index, 0, newField);
    } else {
      section.fields.push(newField);
    }
  }

  addField(fieldType: string) {
    const sectionIndex = this.editedSectionIndex();
    if (sectionIndex !== null) {
      this.createField(sectionIndex, fieldType);
    }
  }

  editField(event: MouseEvent | Event, fieldIndex: number) {
    event.stopPropagation();
    this.editedFieldIndex.set(this.editedFieldIndex() === fieldIndex ? null : fieldIndex);
  }

  removeField(field: Field) {
    const editedSectionIndex = this.editedSectionIndex();
    if (editedSectionIndex === null) return;

    const customForm = this.customFormStructureSignal();
    const section = customForm?.sections?.[editedSectionIndex];
    if (section?.fields) {
      const fieldToDelete = section.fields.find((f: Field) => f === field);
      if (fieldToDelete?.id) {
        fieldToDelete.isDeleted = true;
      } else {
        section.fields = section.fields.filter((f: Field) => f !== field);
      }
    }
  }

  addSection() {
    const customForm = this.customFormStructureSignal();
    if (!customForm?.sections) return;

    const newSection: Section = {
      id: null,
      name: `Section ${customForm.sections.length + 1}`,
      fields: [],
    };

    customForm.sections.push(newSection);
  }

  addOption(field: Field) {
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
  }

  removeOption(field: Field, option: Option) {
    option.isDeleted = true;
  }

  dropOption(event: CdkDragDrop<Option[] | null | undefined>) {
    const { previousContainer, container, previousIndex, currentIndex } = event;
    const data = container.data;

    if (previousContainer === container && data) {
      moveItemInArray(data, previousIndex, currentIndex);
      data.forEach((option, index) => (option.order = index));
    }
  }

  typeWithOption(fieldType: string) {
    const typeWithOption = ['Radio', 'Checkbox', 'Select'];
    return typeWithOption.includes(fieldType);
  }

  emptyOrAllFieldsDeleted(section: Section) {
    return !section.fields?.length || section.fields.every((field) => field.isDeleted);
  }
}
