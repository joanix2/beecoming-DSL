import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import SignaturePad from 'signature_pad';
import { FieldResponse } from '../../../api/models';
import { FilesService } from '../../../api/services';
import { TranslationService } from '../../../services/translation/translation.service';

@Component({
  standalone: true,
  selector: 'app-signature-field',
  templateUrl: 'signature-field.component.html',
  styleUrls: ['signature-field.component.scss'],
  imports: [MatIconModule],
})
export class SignatureFieldComponent implements AfterViewInit {
  @Input() disabled = false;
  @Input() answerValue!: FieldResponse | undefined;
  @Input() customFormId?: string; // Ajouter l'ID du custom form pour construire le chemin Minio
  @Output() signatureChange = new EventEmitter<FieldResponse>();

  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement> | undefined;
  signaturePad: SignaturePad | undefined;

  constructor(
    public readonly tr: TranslationService,
    private filesService: FilesService,
    private toastr: ToastrService,
  ) {}

  /**
   * Vérifie si une valeur est une data URL base64
   */
  isDataURL(value: any): boolean {
    return typeof value === 'string' && value.startsWith('data:image/');
  }

  ngAfterViewInit() {
    if (this.canvas) {
      this.signaturePad = new SignaturePad(this.canvas.nativeElement);
      this.resizeCanvas();
      if (this.answerValue?.value) {
        this.signaturePad.fromDataURL(this.answerValue.value);
      }
      if (this.disabled) {
        this.signaturePad.off();
      }
    }
  }

  clearSignature() {
    this.signaturePad?.clear();
    if (this.answerValue) {
      const newFieldResponse: FieldResponse = {
        fieldId: this.answerValue.fieldId,
        value: '',
      };
      // Mettre à jour answerValue pour que le template se mette à jour
      this.answerValue.value = '';
      this.signatureChange.emit(newFieldResponse);
    }
  }

  saveSignature() {
    if (this.signaturePad && this.answerValue) {
      const signatureDataUrl = this.signaturePad.toDataURL();
      const newFieldResponse: FieldResponse = {
        fieldId: this.answerValue.fieldId,
        value: signatureDataUrl,
      };
      // Mettre à jour answerValue pour que le template se mette à jour
      this.answerValue.value = signatureDataUrl;
      this.signatureChange.emit(newFieldResponse);
    }
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

  /**
   * Upload la signature vers Minio et retourne l'URL
   */
  private async uploadSignature(signatureDataUrl: string): Promise<string> {
    try {
      const file = this.dataURLtoFile(signatureDataUrl, 'signature.png');

      const uploadedFile = await firstValueFrom(
        this.filesService.filesPost$FormData({
          body: { file },
          minioFolderName: 'missions',
          entityId: `temp/customForms/${this.customFormId || 'unknown'}/responses`,
        }),
      );

      if (uploadedFile && uploadedFile.url) {
        return uploadedFile.url;
      }

      throw new Error('Upload failed: no URL returned');
    } catch (error) {
      console.error('Error uploading signature:', error);
      this.toastr.error("Erreur lors de l'upload de la signature");
      throw error;
    }
  }

  /**
   * Valide et upload la signature
   */
  async validateAndUploadSignature() {
    if (!this.signaturePad || !this.answerValue) {
      this.toastr.warning('Aucune signature à valider');
      return;
    }

    if (this.signaturePad.isEmpty()) {
      this.toastr.warning('Veuillez signer avant de valider');
      return;
    }

    try {
      const signatureDataUrl = this.signaturePad.toDataURL();
      const fileUrl = await this.uploadSignature(signatureDataUrl);

      const newFieldResponse: FieldResponse = {
        fieldId: this.answerValue.fieldId,
        value: fileUrl,
      };

      // Mettre à jour answerValue pour que le template se mette à jour
      this.answerValue.value = fileUrl;
      this.signatureChange.emit(newFieldResponse);

      this.toastr.success('Signature validée et enregistrée');
    } catch (error) {
      console.error('Error validating signature:', error);
    }
  }

  resizeCanvas() {
    if (this.canvas) {
      const canvas = this.canvas.nativeElement;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);

      // Attendre que les dimensions CSS soient calculées
      const rect = canvas.getBoundingClientRect();
      let width = rect.width;
      let height = rect.height;

      // Si les dimensions sont encore 0, attendre un peu plus
      if (width === 0 || height === 0) {
        setTimeout(() => {
          this.resizeCanvas();
        }, 50);
        return;
      }

      // Définir les dimensions internes du canvas
      canvas.width = width * ratio;
      canvas.height = height * ratio;

      // Mettre à l'échelle le contexte
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }

      this.signaturePad?.clear();
    }
  }
}
