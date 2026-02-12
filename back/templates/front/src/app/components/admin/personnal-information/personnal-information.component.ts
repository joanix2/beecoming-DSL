import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ProfileInput, UserOutput } from '../../../api/models';
import { UsersService } from '../../../api/services';
import { TranslationService } from '../../../services/translation/translation.service';
import { EditTextFieldComponent } from '../../fields/edit-text-field/edit-text-field.component';

@Component({
  selector: 'app-personnal-information',
  templateUrl: './personnal-information.component.html',
  styleUrls: ['./personnal-information.component.scss'],
  imports: [MatIconModule, MatButtonModule, ReactiveFormsModule, EditTextFieldComponent],
})
export class PersonnalInformationComponent implements OnInit {
  // Services
  tr = inject(TranslationService);
  userService = inject(UsersService);
  formBuilder = inject(FormBuilder);

  // Data
  user = signal<UserOutput | null>(null);

  // Form management
  profileForm: FormGroup;
  isEditMode = signal(false);
  isSubmitting = signal(false);

  constructor() {
    // Initialize form with validation
    this.profileForm = this.formBuilder.group({
      firstname: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
    });
  }

  // Form control getters
  get firstnameControl() {
    return this.profileForm.get('firstname') as FormControl;
  }

  get lastnameControl() {
    return this.profileForm.get('lastname') as FormControl;
  }

  get emailControl() {
    return this.profileForm.get('email') as FormControl;
  }

  get phoneNumberControl() {
    return this.profileForm.get('phoneNumber') as FormControl;
  }

  async ngOnInit() {
    await this.loadProfile();
  }

  private async loadProfile() {
    try {
      const profile = await firstValueFrom(this.userService.usersProfileGet());
      this.user.set(profile);

      // Populate form with current user data
      this.profileForm.patchValue({
        firstname: profile.firstname || '',
        lastname: profile.lastname || '',
        email: profile.email || '',
        phoneNumber: '', // phoneNumber not in UserOutput, will be empty initially
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  enableEditMode() {
    this.isEditMode.set(true);
  }

  cancelEdit() {
    this.isEditMode.set(false);
    // Reset form to original values
    const user = this.user();
    if (user) {
      this.profileForm.patchValue({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || '',
        phoneNumber: '', // Reset phone number
      });
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const formValue = this.profileForm.value;
      const profileInput: ProfileInput = {
        firstname: formValue.firstname,
        lastname: formValue.lastname,
        email: formValue.email,
        phoneNumber: formValue.phoneNumber,
      };

      const updatedUser = await firstValueFrom(this.userService.usersProfilePut({ body: profileInput }));

      this.user.set(updatedUser);
      this.isEditMode.set(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
