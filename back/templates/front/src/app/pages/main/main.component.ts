import { CommonModule, NgClass, NgForOf } from '@angular/common';
import { Component, computed, effect, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from '@angular/material/sidenav';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { API_URL } from '../../../environments/environment';
import { ROLE } from '../../../utils/constant';
import { ApiConfiguration } from '../../api/api-configuration';
import { NotificationsUserIdGet$Params } from '../../api/fn/notifications/notifications-user-id-get';
import { NotificationOutput, SettingOutput } from '../../api/models';
import { AuthService, NotificationsService } from '../../api/services';
import { FullNameInitialPipe } from '../../pipes/initial.pipe';
import { TranslateRolePipe } from '../../pipes/translate-role.pipe';
import { AppService } from '../../services/app.service';
import { LoadingService } from '../../services/loading.service';
import { NotificationService } from '../../services/notification.service';
import { TranslationService } from '../../services/translation/translation.service';
import { SettingsService } from './../../api/services/settings.service';
import { PlanningService } from '../../services/planning.service';

interface Link {
  label: string;
  url: string;
  icon: string;
  hidden?: boolean;
  roles: string[];
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatTabNavPanel,
    MatTabLink,
    MatTabNav,
    RouterLink,
    NgForOf,
    MatMenu,
    MatMenuItem,
    MatIcon,
    MatButton,
    MatMenuTrigger,
    NgClass,
    MatIconButton,
    MatCheckboxModule,
    MatDrawerContainer,
    MatDrawer,
    MatDrawerContent,
    MatTooltipModule,
    FullNameInitialPipe,
    TranslateRolePipe,
    MatProgressBarModule,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit, OnDestroy {
  // servicces
  appService = inject(AppService);
  tr = inject(TranslationService);
  authService = inject(AuthService);
  settingsService = inject(SettingsService);
  loadingService = inject(LoadingService);
  router = inject(Router);
  notificationEventSource = inject(NotificationService);
  notificationsService = inject(NotificationsService);
  apiConfig = inject(ApiConfiguration);
  planningService = inject(PlanningService);

  // variables
  links: Link[] = [];
  activeLink = signal<Link | null>(this.links[0]);
  profileIcon = 'clients';
  notificationsSignal = signal<NotificationOutput[] | null>(null);
  setting = signal<SettingOutput | null>(null);
  logo = this.appService.logoSignal;

  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger | undefined;

  orderedNotifications = computed(() => {
    const notifications = this.notificationsSignal();
    if (!notifications) return [];

    return notifications.sort((a, b) => {
      if (!a.seenAt && b.seenAt) return -1;
      if (a.seenAt && !b.seenAt) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });
  routerSubcription: Subscription | undefined;

  computedUserRole = computed(() => this.appService.me?.role ?? '');

  constructor() {
    this.apiConfig.rootUrl = API_URL;
    this.links = [
      {
        label: this.tr.language().PLANNING,
        url: './planning',
        icon: 'calendar',
        roles: [ROLE.SUPERVISOR, ROLE.TEAMLEADER],
      },
      {
        label: this.tr.language().COMMANDES_MISSIONS,
        url: './orders',
        icon: 'mission',
        roles: [ROLE.SUPERVISOR, ROLE.TEAMLEADER],
      },
      {
        label: this.tr.language().CLIENTS,
        url: './clients',
        icon: 'headshake',
        roles: [ROLE.SUPERVISOR, ROLE.TEAMLEADER],
      },
      { label: this.tr.language().USERS, url: './users', icon: 'team', roles: [ROLE.SUPERVISOR, ROLE.TEAMLEADER] },
      {
        label: this.tr.language().ADMIN,
        url: './administration',
        icon: 'admin',
        roles: [ROLE.SUPERVISOR, ROLE.TEAMLEADER],
      },
      { label: this.tr.language().DEMANDES_SAV, url: './sav-ticket', icon: '', roles: [ROLE.OPERATOR] },
      { label: this.tr.language().RETOURS, url: './returns', icon: '', roles: [ROLE.OPERATOR] },
    ];
    this.profileIcon = 'opteeam';

    effect(() => {
      const setting = this.appService.applicationSetting();
      if (setting) {
        this.appService.settings.set(setting);
        this.planningService.isShowWeekendSignal.set(setting.showWeekendsInPlanning ?? false);
        this.planningService.isWeeklyViewSignal.set(setting.defaultPlanningMode === 'weekly');
      }
    });
  }

  ngOnInit() {
    this.routerSubcription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateActiveLink();
      }
    });
    this.updateActiveLink();
    this.loadSettings();
  }

  ngOnDestroy() {
    this.routerSubcription?.unsubscribe();
  }

  async logout() {
    this.appService.token = null;
    await this.router.navigate(['/login']);
  }

  async loadNotifications() {
    if (!this.appService.me?.id) return;
    const params: NotificationsUserIdGet$Params = {
      userId: this.appService.me?.id,
    };
    const result = await firstValueFrom(this.notificationsService.notificationsUserIdGet(params));
    this.notificationsSignal.set(result);
  }

  async markAsSeen(notification: NotificationOutput) {
    try {
      await firstValueFrom(
        this.notificationsService.notificationsNotificationIdPut({ notificationId: notification.id }),
      );
      notification.seenAt = notification.seenAt ? null : new Date().toISOString();
      const notifs = this.notificationsSignal();
      if (notifs) {
        this.notificationsSignal.set([...notifs]);
      }
    } catch (error) {
      console.error('Error marking notification as seen:', error);
    }
  }

  async archiveNotification(notification: NotificationOutput) {
    try {
      await firstValueFrom(
        this.notificationsService.notificationsNotificationIdDelete({ notificationId: notification.id }),
      );
      const notifs = this.notificationsSignal();
      if (notifs) {
        this.notificationsSignal.set(notifs.filter((n) => n.id !== notification.id));
      }
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  }

  async redirectTo(notification: NotificationOutput) {
    try {
      await this.router.navigate([notification.targetLink]);
      if (this.trigger) {
        this.trigger.closeMenu();
      }
    } catch (error) {
      console.error('Error redirecting to notification target:', error);
    }
  }

  private updateActiveLink() {
    const currentUrl = this.router.url;

    // Groupes d'URLs qui correspondent au même lien actif
    const urlGroups: Record<string, string[]> = {
      orders: ['/orders', '/missions'], // Commandes et missions sont sur le même onglet
    };

    // Trier les liens visibles par longueur décroissante pour prioriser les plus spécifiques
    const visibleLinks = this.links.filter((link) => !link.hidden);
    const sortedLinks = [...visibleLinks].sort((a, b) => {
      const pathA = a.url.startsWith('./') ? a.url.slice(2) : a.url;
      const pathB = b.url.startsWith('./') ? b.url.slice(2) : b.url;
      return pathB.length - pathA.length;
    });

    const newActive =
      sortedLinks.find((link) => {
        const linkPath = link.url.startsWith('./') ? link.url.slice(2) : link.url;

        // Vérifier d'abord les groupes d'URLs
        const group = urlGroups[linkPath];
        if (group) {
          return group.some((groupUrl: string) => currentUrl === groupUrl || currentUrl.startsWith(`${groupUrl}/`));
        }

        // Vérification normale pour les autres liens
        return currentUrl === `/${linkPath}` || currentUrl.startsWith(`/${linkPath}/`);
      }) ?? null;

    this.activeLink.set(newActive);
  }

  hasBackground() {
    const currentUrl = this.router.url;
    return currentUrl.includes('sav-ticket/new') || currentUrl.includes('returns/new');
  }

  async loadSettings() {
    const result = await firstValueFrom(this.settingsService.settingsGet());
    this.appService.settings.set(result);
    this.appService.applicationSetting.set(result);
  }
}
