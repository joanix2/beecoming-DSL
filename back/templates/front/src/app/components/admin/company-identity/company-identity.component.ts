import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { SettingCompanyOutput } from '../../../api/models';
import { SettingsService } from '../../../api/services';
import { TranslationService } from '../../../services/translation/translation.service';

@Component({
  selector: 'app-company-identity',
  templateUrl: './company-identity.component.html',
  styleUrls: ['./company-identity.component.scss'],
  imports: [MatIconModule],
})
export class CompanyIdentityComponent implements OnInit {
  // Services
  tr = inject(TranslationService);
  settingsService = inject(SettingsService);

  // Data
  settings = signal<SettingCompanyOutput | null>(null);

  async ngOnInit() {
    await this.loadSettings();
  }

  private async loadSettings() {
    const settings = await firstValueFrom(this.settingsService.settingsCompanyGet());
    this.settings.set(settings);
  }

  callPhone() {
    const phone = this.settings()?.phone;
    if (phone) {
      window.open(`tel:${phone}`, '_blank');
    }
  }

  openUrl() {
    const url = this.settings()?.url;
    if (url) {
      window.open(url, '_blank');
    }
  }

  openEmail() {
    const email = this.settings()?.email;
    if (email) {
      window.open(`mailto:${email}`, '_blank');
    }
  }
}
