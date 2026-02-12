import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../api/services';
import { AppService } from '../services/app.service';

export const RoleGuard: CanActivateFn = async (route, state) => {
  const appService = inject(AppService);
  const router = inject(Router);
  const authService = inject(AuthService);

  try {
    // Si on a déjà les infos utilisateur, pas besoin de refaire l'appel API
    if (appService.me) {
      return true;
    }

    // Sinon, récupérer les infos utilisateur
    const me = await firstValueFrom(authService.authMeGet());
    appService.me = me;

    if (!me) {
      await router.navigate(['/login']);
      return false;
    }

    return true;
  } catch (error) {
    await router.navigate(['/login']);
    return false;
  }
};
