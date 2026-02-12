import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { SettingsIdPatch$Params } from '../../../api/fn/settings/settings-id-patch';
import { SettingPreferenceOutput } from '../../../api/models';
import { SettingsService } from '../../../api/services';
import { TranslationService } from '../../../services/translation/translation.service';
import { SwitchButtonComponent } from '../../fields/switch-button/switch-button.component';

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss'],
  imports: [MatIconModule, MatRadioModule, SwitchButtonComponent],
})
export class PreferencesComponent implements OnInit {
  //services
  tr = inject(TranslationService);
  settingsService = inject(SettingsService);
  toastService = inject(ToastrService);

  //signals
  settingsPreferences = signal<SettingPreferenceOutput | null>(null);

  //others
  defaultPlanningMode = signal<'daily' | 'weekly'>('daily');
  showWeekendsInPlanning = signal<boolean>(true);
  grayOutFinishedMissions = signal<boolean>(true);
  missionAsAppointment = signal<boolean>(true);

  constructor() {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    const settings = await firstValueFrom(this.settingsService.settingsPreferenceGet());
    this.settingsPreferences.set(settings);
    this.defaultPlanningMode.set(settings.defaultPlanningMode as 'daily' | 'weekly');
    this.showWeekendsInPlanning.set(settings.showWeekendsInPlanning ?? false);
    this.grayOutFinishedMissions.set(settings.grayOutFinishedMissions ?? false);
    this.missionAsAppointment.set(settings.missionAsAppointment ?? false);

    this.settingsPreferences.set(settings);
  }

  async changePlanningShowWeekend(event: any) {
    this.settingsPreferences.update((settings) => {
      if (settings) {
        settings.showWeekendsInPlanning = event;
      }
      return settings;
    });

    const params: SettingsIdPatch$Params = {
      id: this.settingsPreferences()?.id ?? '',
      body: { ...this.settingsPreferences() },
    };
    try {
      await firstValueFrom(this.settingsService.settingsIdPatch(params));
    } catch (error) {
      console.error(error);
    } finally {
      this.loadData();
    }
  }

  async changePlanningMode(event: any) {
    this.settingsPreferences.update((settings) => {
      if (settings) {
        settings.defaultPlanningMode = event.value;
      }
      return settings;
    });

    const params: SettingsIdPatch$Params = {
      id: this.settingsPreferences()?.id ?? '',
      body: { ...this.settingsPreferences() },
    };
    try {
      await firstValueFrom(this.settingsService.settingsIdPatch(params));
    } catch (error) {
      console.error(error);
    } finally {
      this.loadData();
    }
  }

  async changePlanningShowFinishedMissions(event: any) {
    this.settingsPreferences.update((settings) => {
      if (settings) {
        settings.grayOutFinishedMissions = event;
      }
      return settings;
    });

    const params: SettingsIdPatch$Params = {
      id: this.settingsPreferences()?.id ?? '',
      body: { ...this.settingsPreferences() },
    };

    try {
      await firstValueFrom(this.settingsService.settingsIdPatch(params));
    } catch (error) {
      console.error(error);
    } finally {
      this.loadData();
    }
  }

  async changePlanningMissionsAsAppointment(event: any) {
    this.settingsPreferences.update((settings) => {
      if (settings) {
        settings.missionAsAppointment = event;
      }
      return settings;
    });

    const params: SettingsIdPatch$Params = {
      id: this.settingsPreferences()?.id ?? '',
      body: { ...this.settingsPreferences() },
    };
    try {
      await firstValueFrom(this.settingsService.settingsIdPatch(params));
    } catch (error) {
      console.error(error);
    } finally {
      this.loadData();
    }
  }
}
