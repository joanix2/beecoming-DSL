import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, tap, throwError } from 'rxjs';
import { API_URL } from '../environments/environment';
import { AuthService } from './api/services';
import { AppService } from './services/app.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TranslationService } from './services/translation/translation.service';
import { MatDialog } from '@angular/material/dialog';

// Variables partagées entre toutes les requêtes
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) return next(req);

  const appService = inject(AppService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastrService = inject(ToastrService);
  const translateService = inject(TranslationService);
  const matDialog = inject(MatDialog);

  const accessToken = 'Bearer ' + appService.token?.accessToken;
  req = req.clone({
    headers: req.headers.set('Authorization', accessToken),
  });

  return next(req).pipe(
    catchError((err) => {
      if (
        err.status === 401 &&
        !!appService.token &&
        !req.url.includes('/auth/refresh-token') &&
        !req.url.includes('/auth/login')
      ) {
        if (!isRefreshing) {
          // Premier refresh lancé
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService
            .authRefreshTokenPost({
              body: { refreshToken: appService.token?.refreshToken! },
            })
            .pipe(
              tap((response) => {
                appService.token = response;
                refreshTokenSubject.next(response.accessToken);
              }),
              switchMap((response) => {
                isRefreshing = false;
                const clonedRequest = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${response.accessToken}`,
                  },
                });
                return next(clonedRequest);
              }),
              catchError((refreshError) => {
                isRefreshing = false;
                matDialog.closeAll();
                router.navigate(['/login']);
                return throwError(() => err);
              }),
            );
        } else {
          // Si refresh déjà en cours → attendre qu’il finisse
          return refreshTokenSubject.pipe(
            filter((token) => token !== null), // Attendre qu’on ait un nouveau token
            take(1),
            switchMap((token) => {
              const clonedRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${token}`,
                },
              });
              return next(clonedRequest);
            }),
          );
        }
      }

      // Gestion erreurs non-401
      if (err.status != 401 && err.status >= 400 && err.error) {
        toastrService.error(translateService.get(err.error));
      }

      return throwError(() => err);
    }),
  );
};
