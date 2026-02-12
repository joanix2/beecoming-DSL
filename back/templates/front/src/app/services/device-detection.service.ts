import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DeviceInfo {
  isMobile: boolean;
  isDesktop: boolean;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
}

@Injectable({
  providedIn: 'root',
})
export class DeviceDetectionService {
  private deviceInfoSubject: BehaviorSubject<DeviceInfo>;
  public deviceInfo$: Observable<DeviceInfo>;

  constructor(private platform: Platform) {
    this.deviceInfoSubject = new BehaviorSubject<DeviceInfo>(this.getInitialDeviceInfo());
    this.deviceInfo$ = this.deviceInfoSubject.asObservable();
    this.initializeDeviceDetection();
  }

  /**
   * Retourne true si l'appareil est mobile
   */
  get isMobile(): boolean {
    return this.deviceInfoSubject.value.isMobile;
  }

  /**
   * Retourne true si l'appareil est desktop
   */
  get isDesktop(): boolean {
    return this.deviceInfoSubject.value.isDesktop;
  }

  /**
   * Retourne la plateforme actuelle
   */
  get currentPlatform(): 'ios' | 'android' | 'web' | 'unknown' {
    return this.deviceInfoSubject.value.platform;
  }

  /**
   * Retourne l'orientation actuelle
   */
  get orientation(): 'portrait' | 'landscape' {
    return this.deviceInfoSubject.value.orientation;
  }

  /**
   * Retourne les informations complètes du device
   */
  get deviceInfo(): DeviceInfo {
    return this.deviceInfoSubject.value;
  }

  /**
   * Initialise la détection du device
   */
  private initializeDeviceDetection(): void {
    // Détection initiale
    this.updateDeviceInfo();

    // Écoute les changements de taille d'écran
    window.addEventListener('resize', () => {
      this.updateDeviceInfo();
    });

    // Écoute les changements d'orientation
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.updateDeviceInfo();
      }, 100);
    });

    // Écoute les changements de plateforme Ionic
    this.platform.ready().then(() => {
      this.updateDeviceInfo();
    });
  }

  /**
   * Met à jour les informations du device
   */
  private updateDeviceInfo(): void {
    const deviceInfo = this.getDeviceInfo();
    this.deviceInfoSubject.next(deviceInfo);
  }

  /**
   * Obtient les informations initiales du device
   */
  private getInitialDeviceInfo(): DeviceInfo {
    return this.getDeviceInfo();
  }

  /**
   * Détecte les informations du device
   */
  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Détection de la plateforme
    let platform: 'ios' | 'android' | 'web' | 'unknown' = 'unknown';

    if (this.platform && this.platform.is('ios')) {
      platform = 'ios';
    } else if (this.platform && this.platform.is('android')) {
      platform = 'android';
    } else if (this.platform && (this.platform.is('desktop') || this.platform.is('mobileweb'))) {
      platform = 'web';
    }

    // Détection mobile basée sur plusieurs critères
    const isMobile = this.isMobileDevice(userAgent, screenWidth);
    const isDesktop = !isMobile;

    // Détection de l'orientation
    const orientation: 'portrait' | 'landscape' = screenWidth > screenHeight ? 'landscape' : 'portrait';

    return {
      isMobile,
      isDesktop,
      platform,
      userAgent,
      screenWidth,
      screenHeight,
      orientation,
    };
  }

  /**
   * Détecte si l'appareil est mobile basé sur plusieurs critères
   */
  private isMobileDevice(userAgent: string, screenWidth: number): boolean {
    // 1. Détection via Ionic Platform
    if (this.platform && this.platform.is('mobile')) {
      return true;
    }

    // 2. Détection via User Agent
    const mobileKeywords = [
      'android',
      'iphone',
      'ipad',
      'ipod',
      'blackberry',
      'windows phone',
      'mobile',
      'tablet',
      'opera mini',
      'opera mobi',
    ];

    const isMobileUA = mobileKeywords.some((keyword) => userAgent.includes(keyword));

    // 3. Détection via taille d'écran (breakpoint mobile)
    const isMobileScreen = screenWidth <= 768;

    // 4. Détection via touch capability
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Logique de décision : si au moins 2 critères sont vrais, c'est un mobile
    let mobileScore = 0;
    if (isMobileUA) mobileScore++;
    if (isMobileScreen) mobileScore++;
    if (hasTouchScreen) mobileScore++;

    return mobileScore >= 2;
  }

  /**
   * Vérifie si l'écran est en mode portrait
   */
  isPortrait(): boolean {
    return this.orientation === 'portrait';
  }

  /**
   * Vérifie si l'écran est en mode paysage
   */
  isLandscape(): boolean {
    return this.orientation === 'landscape';
  }

  /**
   * Vérifie si l'écran est petit (mobile)
   */
  isSmallScreen(): boolean {
    return this.deviceInfoSubject.value.screenWidth <= 768;
  }

  /**
   * Vérifie si l'écran est moyen (tablet)
   */
  isMediumScreen(): boolean {
    const width = this.deviceInfoSubject.value.screenWidth;
    return width > 768 && width <= 1024;
  }

  /**
   * Vérifie si l'écran est grand (desktop)
   */
  isLargeScreen(): boolean {
    return this.deviceInfoSubject.value.screenWidth > 1024;
  }

  /**
   * Retourne un observable qui émet true quand on est sur mobile
   */
  get isMobile$(): Observable<boolean> {
    return new Observable((observer) => {
      const subscription = this.deviceInfo$.subscribe((deviceInfo) => {
        observer.next(deviceInfo.isMobile);
      });
      return () => subscription.unsubscribe();
    });
  }

  /**
   * Retourne un observable qui émet true quand on est sur desktop
   */
  get isDesktop$(): Observable<boolean> {
    return new Observable((observer) => {
      const subscription = this.deviceInfo$.subscribe((deviceInfo) => {
        observer.next(deviceInfo.isDesktop);
      });
      return () => subscription.unsubscribe();
    });
  }
}
