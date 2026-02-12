import { Injectable } from '@angular/core';
import { FieldType } from '../api/models';
import { FileHelperService } from './file-helper.service';

@Injectable({
  providedIn: 'root',
})
export class CustomFormHelperService {
  typesWithFile = [FieldType.Photo, FieldType.PhotoMultiple];

  constructor(private fileHelperService: FileHelperService) {}

  // getAnswer(
  //   customFormWithAnswerSignal: CustomFormWithBaseAnswerOutput | TicketCustomFormAnswerOutput | null,
  //   sectionIndex: number,
  //   fieldId: string | null,
  // ): FieldResponse | undefined {
  //   const answers = customFormWithAnswerSignal?.answerStructure;
  //   return answers?.sections?.[sectionIndex]?.fields?.find((a) => a.fieldId === fieldId);
  // }

  // setAnswer(
  //   customFormWithAnswerSignal: CustomFormWithBaseAnswerOutput | null,
  //   sectionIndex: number,
  //   fieldId: string | null,
  //   value: any,
  // ) {
  //   const answers = customFormWithAnswerSignal?.answerStructure;
  //   const field = answers?.sections?.[sectionIndex]?.fields?.find((a) => a.fieldId === fieldId);
  //   if (field) {
  //     field.value = value;
  //   }
  // }

  // getCustomFormFields(
  //   customFormWithAnswerSignal: CustomFormWithBaseAnswerOutput | TicketCustomFormAnswerOutput | null,
  //   sectionIndex: number,
  // ) {
  //   return customFormWithAnswerSignal?.formStructure?.sections?.[sectionIndex]?.fields;
  // }

  // getAllFiles(customFormWithAnswerSignal: CustomFormWithBaseAnswerOutput | null): FileInfo[] {
  //   const allFiles: FileInfo[] = [];

  //   if (customFormWithAnswerSignal?.formStructure?.sections) {
  //     for (const [index, section] of customFormWithAnswerSignal.formStructure.sections.entries()) {
  //       if (!section.fields) continue;
  //       for (const field of section.fields) {
  //         if (this.typesWithFile.includes(field.type)) {
  //           const answer = this.getAnswer(customFormWithAnswerSignal, index, field.id);
  //           if (answer?.value) {
  //             allFiles.push(...answer.value);
  //             answer.value = answer.value.map((v: FileInfo) => v.name);
  //           }
  //         } else if (field.type === FieldType.Signature) {
  //           const answer = this.getAnswer(customFormWithAnswerSignal, index, field.id);
  //           if (answer?.value) {
  //             const signatureNameWithDate = `signature_${new Date().getTime()}.png`;
  //             allFiles.push({ url: answer.value, name: signatureNameWithDate });
  //             answer.value = signatureNameWithDate;
  //           }
  //         }
  //       }
  //     }
  //   }
  //   return allFiles;
  // }

  // mapAnswerToFileInfo(customFormWithAnswerSignal: TicketCustomFormAnswerOutput | null, directory: string) {
  //   if (customFormWithAnswerSignal?.formStructure?.sections) {
  //     for (const [index, section] of customFormWithAnswerSignal.formStructure.sections.entries()) {
  //       if (!section.fields) continue;
  //       for (const field of section.fields) {
  //         if (this.typesWithFile.includes(field.type)) {
  //           const answer = this.getAnswer(customFormWithAnswerSignal, index, field.id);
  //           if (answer?.value) {
  //             answer.value = answer.value.map((v: string) =>
  //               this.fileHelperService.getFileInfoFromFileName(directory, v),
  //             );
  //           }
  //         } else if (field.type === FieldType.Signature) {
  //           const answer = this.getAnswer(customFormWithAnswerSignal, index, field.id);
  //           if (answer?.value) {
  //             answer.value = this.fileHelperService.getFileInfoFromFileName(directory, answer.value);
  //           }
  //         }
  //       }
  //     }
  //   }
  // }
}
