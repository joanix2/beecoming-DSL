import { afterRender, Component, ElementRef, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom, Subscription } from 'rxjs';
import { APP_DATE, APP_VERSION } from '../../../environments/version';
import { AuthService } from '../../api/services';
import { PASSWORD_STARS } from '../../app.config';
import { ForgotPasswordDialogComponent } from '../../components/forgot-password-dialog/forgot-password-dialog.component';
import { RequestConfirmationDialogComponent } from '../../components/request-confirmation-dialog.component';
import { AppService } from '../../services/app.service';
import { DeviceDetectionService } from '../../services/device-detection.service';
import { TranslationService } from '../../services/translation/translation.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormField,
    MatInput,
    MatSuffix,
    MatLabel,
    MatButton,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnDestroy {
  loginForm?: FormGroup;
  showPassword = false;
  PASSWORD_STARS = PASSWORD_STARS;
  APP_VERSION = APP_VERSION;
  APP_DATE = APP_DATE;

  // Propriétés pour la détection de device
  isMobile = false;
  isDesktop = false;

  @ViewChild('rightSide') rightSide!: ElementRef;

  routeSubscription: Subscription;
  deviceSubscription!: Subscription;
  loading = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    public appService: AppService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog,
    private readonly toastr: ToastrService,
    protected readonly tr: TranslationService,
    private readonly renderer: Renderer2,
    private readonly deviceDetection: DeviceDetectionService,
  ) {
    localStorage.clear();

    // Initialisation de la détection de device
    this.initializeDeviceDetection();

    afterRender(() => {
      const backgroundImageName = 'opteeam';
      this.renderer.setStyle(
        this.rightSide.nativeElement,
        'background-image',
        `url("../../../assets/backgrounds/${backgroundImageName}.svg")`,
      );
      this.renderer.setStyle(this.rightSide.nativeElement, 'background-color', '#102D4A');
    });

    this.routeSubscription = this.route.queryParamMap.subscribe((a) => {
      const confirmEmail = a.get('confirm-email');
      if (confirmEmail) {
        this.toastr.success(this.tr.language().EMAIL_CONFIRMED, this.tr.language().CONFIRM_EMAIL);
      }
    });

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
    if (this.deviceSubscription) {
      this.deviceSubscription.unsubscribe();
    }
  }

  /**
   * Initialise la détection de device
   */
  private initializeDeviceDetection(): void {
    // Détection initiale
    this.updateDeviceInfo();

    // Écoute les changements de device
    this.deviceSubscription = this.deviceDetection.deviceInfo$.subscribe(() => {
      this.updateDeviceInfo();
    });
  }

  /**
   * Met à jour les informations du device
   */
  private updateDeviceInfo(): void {
    this.isMobile = this.deviceDetection.isMobile;
    this.isDesktop = this.deviceDetection.isDesktop;
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm?.valid) {
      const loginData = this.loginForm.value;
      try {
        this.loading = true;
        const token = await firstValueFrom(this.authService.authLoginPost({ body: loginData }));
        this.appService.token = token;

        // Rediriger vers la page d'accueil qui gérera l'affichage selon le rôle
        this.router.navigate(['/']);
      } catch (error: any) {
        this.toastr.error(this.tr.get(error.error), this.tr.language().CONNEXION_ERROR);
        if (error.error == 'EMAIL_NEEDS_CONFIRMATION') {
          const dialogRef = this.dialog.open(RequestConfirmationDialogComponent, {
            width: '50%',
          });

          firstValueFrom(dialogRef.afterClosed()).then(async (result) => {
            if (result) {
              try {
                await firstValueFrom(this.authService.authRequestEmailConfirmationGet({ email: loginData.email }));
                this.toastr.success(this.tr.language().CONFIRMATION_LINK_SENT, this.tr.language().CONFIRM_EMAIL);
              } catch (error: any) {
                this.toastr.error(error.error, this.tr.language().ERROR_CONFIRMATION_MAIL);
              }
            }
          });
        }
      } finally {
        this.loading = false;
      }
    }
  }

  forgotPassword(): void {
    const dialogRef = this.dialog.open(ForgotPasswordDialogComponent, {
      width: '530px',
      data: { email: '' },
    });

    firstValueFrom(dialogRef.afterClosed()).then(async (email) => {
      if (email) {
        await firstValueFrom(
          this.authService.authForgotPasswordPost({
            body: { email },
          }),
        );
        this.toastr.success(this.tr.language().FORGOT_PASSWORD_EMAIL_SENT, this.tr.language().FORGOT_PASSWORD);
      }
    });
  }
}
