import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { FileInfo } from '../../services/file-helper.service';
import { TranslationService } from '../../services/translation/translation.service';

@Component({
  standalone: true,
  selector: 'app-file-display',
  templateUrl: 'file-display.component.html',
  styleUrls: ['file-display.component.scss'],
  imports: [CommonModule, MatIconModule, MatTooltip],
})
export class FileDisplayComponent {
  @Input({ required: true }) file!: FileInfo | string;
  @Input() editMode = true;
  @Output() fileRemovedEvent = new EventEmitter();

  constructor(public readonly translateService: TranslationService) {}

  get fileUrl(): string {
    if (typeof this.file === 'string') {
      return this.file;
    }
    return this.file.url;
  }

  get fileName(): string {
    if (typeof this.file === 'string') {
      // Extraire le nom du fichier de l'URL
      const url = new URL(this.file);
      const pathParts = url.pathname.split('/');
      return pathParts[pathParts.length - 1] || 'Fichier';
    }
    return this.file.name;
  }

  isFileImage() {
    const fileName = this.fileName;
    if (!fileName) return false;
    return fileName.match(/\.(jpg|jpeg|png|gif|svg|pdf)$/i);
  }

  removeFile(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.fileRemovedEvent.emit();
  }
}
