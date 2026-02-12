import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { MINIO_URL } from '../../environments/environment';
import { APP_CONSTANTS } from '../../utils/constant';
import { TranslationService } from './translation/translation.service';

export interface FileInfo {
  name: string;
  url: string;
  originalFile?: File; // Ajouter le fichier original pour pouvoir le convertir en base64
}

@Injectable({
  providedIn: 'root',
})
export class FileHelperService {
  constructor(
    protected readonly translateService: TranslationService,
    private readonly toastr: ToastrService,
  ) {}

  async fetchFileFromUrl(fileInfo: FileInfo): Promise<File> {
    const response = await fetch(fileInfo.url);
    const blob = await response.blob();
    return new File([blob], fileInfo.name, { type: blob.type });
  }

  getMinioFileUrl(directory: string = '', name: string): string {
    return `${MINIO_URL}/${directory ? `${directory}/` : ''}${name}`;
  }

  getFileInfoFromFileName(directory: string, name: string): FileInfo {
    return { name, url: this.getMinioFileUrl(directory, name) };
  }

  handleFile(file: File, acceptedMimeTypes: string[], acceptedExtensions: string[]): FileInfo | null {
    const { size, type } = file;
    const { IMAGE_TOO_BIG_MESSAGE, IMAGE_TOO_BIG, IMAGE_EXTENSION_MESSAGE, IMAGE_EXTENSION } =
      this.translateService.language();

    if (size > APP_CONSTANTS.MAX_FILE_SIZE) {
      this.toastr.error(IMAGE_TOO_BIG_MESSAGE, IMAGE_TOO_BIG);
      return null;
    }

    if (type && !acceptedMimeTypes.includes(type)) {
      this.toastr.error(IMAGE_EXTENSION_MESSAGE.replace('{0}', acceptedExtensions.join(', ')), IMAGE_EXTENSION);
      return null;
    }

    const url = URL.createObjectURL(file);
    return { name: file.name, url, originalFile: file };
  }
}
