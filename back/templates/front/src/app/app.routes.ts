import { Routes } from '@angular/router';
import { RoleGuard } from './guards/auth.guard';
import { CanDeactivateGuard } from './guards/can-deactivate.guard';

export const routes: Routes = [
  // Routes d'authentification
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },

  // Routes principales protégées
  {
    path: '',
    loadComponent: () => import('./pages/main/main.component').then((m) => m.MainComponent),
    canActivate: [RoleGuard],
    children: [
      // Commandes et missions
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/orders-missions/orders-missions.component').then((m) => m.OrdersMissionsComponent),
        data: { isMission: false },
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./pages/orders-missions/orders/order-details/order-details.component').then(
            (m) => m.OrderDetailsComponent,
          ),
        canDeactivate: [CanDeactivateGuard],
      },
      {
        path: 'missions',
        loadComponent: () =>
          import('./pages/orders-missions/orders-missions.component').then((m) => m.OrdersMissionsComponent),
        data: { isMission: true },
      },
      {
        path: 'missions/:id',
        loadComponent: () =>
          import('./pages/orders-missions/missions/mission-details/mission-details.component').then(
            (m) => m.MissionDetailsComponent,
          ),
        canDeactivate: [CanDeactivateGuard],
      },

      // Clients
      {
        path: 'clients',
        loadComponent: () =>
          import('./pages/clients/clients-list/clients-list.component').then((m) => m.ClientsListComponent),
      },
      {
        path: 'clients/:id',
        loadComponent: () =>
          import('./pages/clients/client-details/client-details.component').then((m) => m.ClientDetailsComponent),
        canDeactivate: [CanDeactivateGuard],
      },

      // Utilisateurs
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users-list/users-list.component').then((m) => m.UsersListComponent),
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./pages/users/user-details/user-details.component').then((m) => m.UserDetailsComponent),
        canDeactivate: [CanDeactivateGuard],
      },

      // Administration
      {
        path: 'administration',
        loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent),
      },
      {
        path: 'administration/custom-forms/:id',
        loadComponent: () =>
          import('./pages/admin/custom-form-details/custom-form-details.component').then(
            (m) => m.CustomFormDetailsComponent,
          ),
        canDeactivate: [CanDeactivateGuard],
      },
      {
        path: 'administration/order-types/:id',
        loadComponent: () =>
          import('./pages/admin/order-type-details/order-type-details.component').then(
            (m) => m.OrderTypeDetailsComponent,
          ),
        canDeactivate: [CanDeactivateGuard],
      },
      {
        path: 'administration/mission-types/:id',
        loadComponent: () =>
          import('./pages/admin/mission-type-details/mission-type-details.component').then(
            (m) => m.MissionTypeDetailsComponent,
          ),
        canDeactivate: [CanDeactivateGuard],
      },

      // Planning
      {
        path: 'planning',
        loadComponent: () => import('./pages/planning/planning.component').then((m) => m.PlanningComponent),
      },

      // Routes opérateur
      {
        path: 'sav-ticket',
        loadComponent: () => {
          // TODO: Créer le composant SAV
          console.warn('SAV Ticket component not implemented yet');
          return import('./pages/main/main.component').then((m) => m.MainComponent);
        },
      },
      {
        path: 'returns',
        loadComponent: () => {
          // TODO: Créer le composant Returns
          console.warn('Returns component not implemented yet');
          return import('./pages/main/main.component').then((m) => m.MainComponent);
        },
      },

      // Redirection par défaut vers orders
      { path: '', redirectTo: 'orders', pathMatch: 'full' },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'orders' },
];
