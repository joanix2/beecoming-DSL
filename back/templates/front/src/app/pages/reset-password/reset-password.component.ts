import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, Renderer2, signal, ViewChild } from '@angular/core';
import { AbstractControlOptions, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatError, MatFormField, MatFormFieldModule, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom, Subscription } from 'rxjs';
import { APP_DATE, APP_VERSION } from '../../../environments/version';
import { AuthService } from '../../api/services';
import { PASSWORD_MIN_LENGTH, PASSWORD_PATTERN, PASSWORD_STARS } from '../../app.config';
import { AppService } from '../../services/app.service';
import { TranslationService } from '../../services/translation/translation.service';

@Component({
  selector: 'app-reset-password',
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
    MatError,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnDestroy {
  @ViewChild('leftSide') leftSide!: ElementRef;

  readonly PASSWORD_STARS = PASSWORD_STARS;
  readonly APP_VERSION = APP_VERSION;
  readonly APP_DATE = APP_DATE;

  form: FormGroup;
  showPassword = false;
  showConfirmation = false;
  errorMessage?: string;
  token?: string;
  email?: string;

  private readonly routeSubscription: Subscription;

  hide = signal(true);
  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly renderer: Renderer2,
    private readonly authService: AuthService,
    private readonly appService: AppService,
    protected readonly tr: TranslationService,
    private readonly toastr: ToastrService,
  ) {
    this.form = this.fb.group(
      {
        newPassword: [
          '',
          [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH), Validators.pattern(PASSWORD_PATTERN)],
        ],
        newPasswordConfirmation: ['', [Validators.required]],
      },
      { validators: [this.passwordMatchValidator] } as AbstractControlOptions,
    );

    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      const token = params.get('token');
      const email = params.get('email');
      if (token && email) {
        this.token = token;
        this.email = email;
      } else {
        this.router.navigate(['/login']);
      }
    });

    this.setLeftBackground();
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  get newPasswordControl() {
    return this.form.get('newPassword');
  }

  get newPasswordConfirmationControl() {
    return this.form.get('newPasswordConfirmation');
  }

  private setLeftBackground(): void {
    requestAnimationFrame(() => {
      this.renderer.setStyle(
        this.leftSide.nativeElement,
        'background-image',
        'url("../../../assets/backgrounds/opteeam.jpg")',
      );
    });
  }

  private passwordMatchValidator(group: FormGroup): { mismatch: true } | null {
    const password = group.get('newPassword')?.value;
    const confirmation = group.get('newPasswordConfirmation')?.value;
    return password === confirmation ? null : { mismatch: true };
  }

  async backToLogin(): Promise<void> {
    await this.appService.goTo(['login']);
  }

  async onSubmit(): Promise<void> {
    if (!this.token || !this.email || this.form.invalid) return;

    const title = this.tr.language().RESET_PASSWORD_TITLE;

    try {
      const { newPassword } = this.form.value;
      await firstValueFrom(
        this.authService.authResetPasswordPost({
          body: {
            newPassword,
            token: this.token,
            email: this.email,
            newPasswordConfirmation: newPassword,
          },
        }),
      );
      this.router.navigate(['login']);
      const successMessage = this.tr.language().REGISTER_CONFIRMATION;
      this.toastr.success(successMessage, title);
    } catch {
      const errorTitle = this.tr.language().RESET_PASSWORD_TITLE;
      const errorMessage = this.tr.language().RESET_PASSWORD_ERROR;
      this.toastr.error(errorMessage, errorTitle);
    }
  }
}
