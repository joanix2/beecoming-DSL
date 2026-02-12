import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatOption, MatSelect } from '@angular/material/select';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { APP_DATE, APP_VERSION } from '../../../environments/version';
import { AuthService } from '../../api/services';
import { PASSWORD_STARS } from '../../app.config';
import { TranslationService } from '../../services/translation/translation.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './register.component.html',
  styleUrl: '../login/login.component.scss',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage?: string;
  showPassword = false;
  PASSWORD_STARS = PASSWORD_STARS;
  APP_VERSION = APP_VERSION;
  APP_DATE = APP_DATE;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly auth: AuthService,
    protected readonly tr: TranslationService,
    protected readonly toastr: ToastrService,
    protected readonly router: Router,
  ) {
    localStorage.removeItem('token');
  }

  ngOnInit() {
    this.registerForm = this.formBuilder.group(
      {
        firstname: ['', Validators.required],
        lastname: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required],
        roleIds: ['', Validators.required],
      },
      {
        validators: this.passwordMatchValidator,
      },
    );
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched(); // Marque tous les champs comme touchés pour afficher les erreurs
      return;
    }

    const user = this.registerForm.value;
    try {
      await firstValueFrom(this.auth.authRegisterPost({ body: user }));
      this.toastr.success('Enregistrement réussi. Veuillez vérifier votre email pour confirmer votre compte.');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Registration failed. Please try again.');
    }
  }
}
