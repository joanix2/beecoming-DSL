import { computed, effect, Injectable, signal } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import {
  OrderStatusOutput,
  OrderTypeOutput,
  SettingCustomizationOutput,
  SettingOutput,
  TokenOutput,
  UserInfoOutput,
} from '../api/models';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  applicationSetting = signal<SettingOutput | null>(null); // Signal pour les paramètres de l'application
  private readonly _token = signal<TokenOutput | null>(null); // Signal pour le token
  private readonly _me = signal<UserInfoOutput | null>(null); // Signal pour l'utilisateur connecté
  private readonly _primaryColor = signal<string>('#2670a1'); // Signal pour la couleur principale du thème
  private readonly _secondaryColor = signal<string>('#052f4a'); // Signal pour la couleur secondaire du thème
  private readonly _tertiaryColor = signal<string>('#d29e47'); // Signal pour la couleur tertiaire du thème

  // store order statuses
  orderStatuses = signal<OrderStatusOutput[]>([]);
  orderTypes = signal<OrderTypeOutput[]>([]);

  // store settings
  settings = signal<SettingCustomizationOutput | null>(null);
  logoSignal = computed(() => this.settings()?.applicationLogo || '../assets/logos/groupe.svg');

  constructor(private readonly router: Router) {
    this.loadTokenFromStorage();
    this.initialize();

    effect(() => {
      const favicon = this.settings()?.applicationFlavicon;
      const faviconLink: HTMLLinkElement | null = document.head.querySelector('link[rel="icon"]');
      if (faviconLink) {
        faviconLink.href = favicon || '../assets/icons/base_flavicon.svg';
      }
      console.log('settings', this.settings());

      if (this.settings()?.primaryColor) {
        document.documentElement.style.setProperty('--custom-primary', this.settings()?.primaryColor || '#2670a1');
      }
      if (this.settings()?.secondaryColor) {
        document.documentElement.style.setProperty('--custom-secondary', this.settings()?.secondaryColor || '#052f4a');
      }
      if (this.settings()?.tertiaryColor) {
        document.documentElement.style.setProperty('--custom-tertiary', this.settings()?.tertiaryColor || '#d29e47');
      }
    });
  }

  get token(): TokenOutput | null {
    return this._token();
  }

  set token(value: TokenOutput | null) {
    this._token.set(value);
  }

  get me(): UserInfoOutput | null {
    return this._me();
  }

  set me(value: UserInfoOutput | null) {
    this._me.set(value);
  }

  get primaryColor(): string {
    return this._primaryColor();
  }

  set primaryColor(color: string) {
    this._primaryColor.set(color);
    document.documentElement.style.setProperty('--color-primary', color);
  }

  get secondaryColor(): string {
    return this._secondaryColor();
  }

  set secondaryColor(color: string) {
    this._secondaryColor.set(color);
    document.documentElement.style.setProperty('--color-secondary', color);
  }

  get tertiaryColor(): string {
    return this._tertiaryColor();
  }

  set tertiaryColor(color: string) {
    this._tertiaryColor.set(color);
    document.documentElement.style.setProperty('--color-tertiary', color);
  }

  async goTo(route: any[], extra?: NavigationExtras): Promise<void> {
    await this.router.navigate(route, extra);
  }

  private async initialize() {
    effect(async () => {
      const tokenValue = this._token();

      if (tokenValue) {
        localStorage.setItem('token', JSON.stringify(tokenValue));
      } else {
        localStorage.removeItem('token');
      }
    });

    effect(async () => {
      const setting = this.applicationSetting();
      if (setting) {
        const updateColor = (color: string | undefined, cssVar: string) => {
          if (color) {
            // Update la variable css pour la couleur
            document.documentElement.style.setProperty(cssVar, color);
            // Update la variable css pour la couleur au survol, on utilise la couleur avec 70% de transparence
            document.documentElement.style.setProperty(`${cssVar}-hover`, `${color}70`);
          }
        };

        if (setting.primaryColor) {
          this.primaryColor = setting.primaryColor;
          updateColor(setting.primaryColor, '--custom-primary');
        }
        if (setting.secondaryColor) {
          this.secondaryColor = setting.secondaryColor;
          updateColor(setting.secondaryColor, '--custom-secondary');
        }
        if (setting.tertiaryColor) {
          this.tertiaryColor = setting.tertiaryColor;
          updateColor(setting.tertiaryColor, '--custom-tertiary');
        }
      }
    });
  }

  private loadTokenFromStorage(): void {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        this._token.set(JSON.parse(storedToken) as TokenOutput);
      } catch (error) {
        console.error('Erreur lors du chargement du token depuis le localStorage', error);
      }
    }
  }
}
