import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { APP_CONSTANTS } from '../../../../utils/constant';
import { AddressInput, SettingCustomizationOutput } from '../../../api/models';
import { SettingsService } from '../../../api/services';
import { FileHelperService, FileInfo } from '../../../services/file-helper.service';
import { TranslationService } from '../../../services/translation/translation.service';
import { AddressComponent } from '../../fields/address/address.component';
import { FilesService } from './../../../api/services/files.service';
import { AppService } from '../../../services/app.service';
import { EditTextFieldComponent } from '../../fields/edit-text-field/edit-text-field.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customization',
  templateUrl: './customization.component.html',
  styleUrls: ['./customization.component.scss'],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    AddressComponent,
    FormsModule,
    EditTextFieldComponent,
    ReactiveFormsModule,
  ],
})
export class CustomizationComponent implements OnInit {
  // Services
  tr = inject(TranslationService);
  fb = inject(FormBuilder);
  settingsService = inject(SettingsService);
  filesService = inject(FilesService);
  fileHelperService = inject(FileHelperService);
  toastService = inject(ToastrService);
  cdr = inject(ChangeDetectorRef);
  appService = inject(AppService);

  // Signals
  settings = this.appService.settings;
  isEditingAddress = signal(false);
  isEditingColors = signal(false);

  // Others
  logoFormControl: FormControl<FileInfo | null> = new FormControl(null);
  flaviconFormControl: FormControl<FileInfo | null> = new FormControl(null);
  addressFormControl: FormControl<AddressInput | null> = new FormControl(null);
  // colors
  primaryColorFormControl: FormControl<string | null> = new FormControl('#000000');
  secondaryColorFormControl: FormControl<string | null> = new FormControl('#000000');
  tertiaryColorFormControl: FormControl<string | null> = new FormControl('#000000');

  defaultLogo = signal<string | null>(null);
  defaultFlavicon = signal<string | null>('assets/icons/base_logo.svg');

  form = this.fb.group({
    address: this.addressFormControl,
  });

  async ngOnInit() {
    await this.loadSettings();
  }

  private async loadSettings() {
    const settings = await firstValueFrom(this.settingsService.settingsCustomizationGet());
    console.log('settings', settings);

    this.settings.set(settings);

    if (settings.operatorStartAddress) {
      this.addressFormControl.setValue({
        street: settings.operatorStartAddress.street || null,
        additionalInfo: settings.operatorStartAddress.additionalInfo || null,
        city: settings.operatorStartAddress.city || null,
        country: settings.operatorStartAddress.country || null,
        postalCode: settings.operatorStartAddress.postalCode || null,
        latitude: settings.operatorStartAddress.latitude || null,
        longitude: settings.operatorStartAddress.longitude || null,
      });
    }

    if (settings.applicationLogo) {
      this.defaultLogo.set(settings.applicationLogo);
    }
    if (settings.applicationFlavicon) {
      this.defaultFlavicon.set(settings.applicationFlavicon);
    }
    if (settings.primaryColor) {
      this.primaryColorFormControl.setValue(settings.primaryColor);
    }
    if (settings.secondaryColor) {
      this.secondaryColorFormControl.setValue(settings.secondaryColor);
    }
    if (settings.tertiaryColor) {
      this.tertiaryColorFormControl.setValue(settings.tertiaryColor);
    }
  }
  // logo et flavicon
  importLogo() {
    const acceptedMimeTypes = APP_CONSTANTS.ACCEPTED_MIME_TYPES;
    const acceptedExtensions = APP_CONSTANTS.ACCEPTED_EXTENSIONS;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptedMimeTypes.join(',');
    input.multiple = false;
    input.click();

    input.addEventListener('change', (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (!files) return;

      const fileInfos = Array.from(files).map(
        (file) => this.fileHelperService.handleFile(file, acceptedMimeTypes, acceptedExtensions)!,
      );

      if (fileInfos.length > 0) {
        this.logoFormControl.setValue(fileInfos[0]);
        this.cdr.detectChanges();
      }
    });
  }

  importFlavicon() {
    const acceptedMimeTypes = APP_CONSTANTS.ACCEPTED_MIME_TYPES;
    const acceptedExtensions = APP_CONSTANTS.ACCEPTED_EXTENSIONS;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptedMimeTypes.join(',');
    input.multiple = false;
    input.click();

    input.addEventListener('change', (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (!files) return;

      const fileInfos = Array.from(files).map(
        (file) => this.fileHelperService.handleFile(file, acceptedMimeTypes, acceptedExtensions)!,
      );

      if (fileInfos.length > 0) {
        this.flaviconFormControl.setValue(fileInfos[0]);
        this.cdr.detectChanges();
      }
    });
  }

  async uploadLogo(image: FileInfo | null) {
    if (!image) return null;

    try {
      const fileToUpload = await this.fileHelperService.fetchFileFromUrl(image);
      if (fileToUpload) {
        if (this.settings()?.applicationLogo) {
          await firstValueFrom(
            this.filesService.filesFileNameDelete({
              fileName: `settings/logos/${this.settings()?.id}/${this.settings()?.applicationName}`,
            }),
          );
        }

        const file = await firstValueFrom(
          this.filesService.filesSettingsLogoPost$FormData({
            body: { file: fileToUpload },
          }),
        );

        if (file) {
          this.logoFormControl.setValue(null);
          this.toastService.success(this.tr.language().LOGO_UPDATED);

          this.defaultLogo.set(file.url);

          this.settings.set({
            ...this.settings()!,
            applicationLogo: file.url,
          });

          this.cdr.detectChanges();
        }
      }
    } catch (error) {
      console.error(error);
      this.toastService.error(this.tr.language().ERROR_UPLOADING_LOGO);
    }

    return null;
  }

  async uploadFlavicon(image: FileInfo | null) {
    if (!image) return null;

    try {
      const fileToUpload = await this.fileHelperService.fetchFileFromUrl(image);
      if (fileToUpload) {
        if (this.settings()?.applicationFlavicon) {
          await firstValueFrom(
            this.filesService.filesFileNameDelete({
              fileName: `settings/flavicons/${this.settings()?.id}/${this.settings()?.applicationName}`,
            }),
          );
        }

        const file = await firstValueFrom(
          this.filesService.filesSettingsFlaviconPost$FormData({
            body: { file: fileToUpload },
          }),
        );

        if (file) {
          this.flaviconFormControl.setValue(null);
          this.toastService.success(this.tr.language().LOGO_UPDATED);

          this.defaultFlavicon.set(file.url);

          const faviconLink: HTMLLinkElement | null = document.head.querySelector('link[rel="icon"]');
          if (faviconLink) {
            faviconLink.href = file.url;
          }

          this.settings.set({
            ...this.settings()!,
            applicationFlavicon: file.url,
          });

          this.cdr.detectChanges();
        }
      }
    } catch (error) {
      console.error(error);
      this.toastService.error(this.tr.language().ERROR_UPLOADING_LOGO);
    }

    return null;
  }
  // address
  async updateAddress() {
    if (!this.addressFormControl.value) return;

    try {
      await firstValueFrom(
        this.settingsService.settingsIdPatch({
          id: this.settings()?.id!,
          body: {
            operatorStartAddress: {
              id: this.settings()?.operatorStartAddress?.id || undefined,
              street: this.addressFormControl.value.street,
              additionalInfo: this.addressFormControl.value.additionalInfo,
              city: this.addressFormControl.value.city,
              country: this.addressFormControl.value.country,
              postalCode: this.addressFormControl.value.postalCode,
              latitude: this.addressFormControl.value.latitude,
              longitude: this.addressFormControl.value.longitude,
            },
          },
        }),
      );

      this.toastService.success(this.tr.language().ADDRESS_UPDATED);
      this.isEditingAddress.set(false);
      this.addressFormControl.reset();
      await this.loadSettings();
    } catch (error) {
      console.error(error);
    }
  }

  //colors
  async updateColors() {
    const isEditing = this.isEditingColors();
    if (!isEditing) {
      this.isEditingColors.set(true);
      return;
    } else {
      this.isEditingColors.set(false);
    }

    try {
      await firstValueFrom(
        this.settingsService.settingsIdPatch({
          id: this.settings()?.id!,
          body: {
            primaryColor: this.primaryColorFormControl.value,
            secondaryColor: this.secondaryColorFormControl.value,
            tertiaryColor: this.tertiaryColorFormControl.value,
          },
        }),
      );
      this.appService.primaryColor = this.primaryColorFormControl.value || '#2670a1';
      this.appService.secondaryColor = this.secondaryColorFormControl.value || '#052f4a';
      this.appService.tertiaryColor = this.tertiaryColorFormControl.value || '#d29e47';
      this.toastService.success(this.tr.language().COLORS_UPDATED);
      this.isEditingColors.set(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  }
}
