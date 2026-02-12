import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom, Observable } from 'rxjs';
import { ROLE } from '../../../../utils/constant';
import { UsersRolesGet$Params } from '../../../api/fn/users/users-roles-get';
import { RoleOutput, UserInput, UserOutput } from '../../../api/models';
import { EmployeesService, UsersService } from '../../../api/services';
import { DetailTopbarComponent } from '../../../components/detail-topbar/detail-topbar.component';
import { Option } from '../../../components/fields/custom-types';
import { EditMultiSelectFieldComponent } from '../../../components/fields/edit-multi-select-field/edit-multi-select-field.component';
import { EditTextFieldComponent } from '../../../components/fields/edit-text-field/edit-text-field.component';
import { ErrorMessageComponent } from '../../../components/fields/error-message/error-message.component';
import { AbsencesListComponent } from '../../../components/users/absences-list/absences-list.component';
import { AbstractForm } from '../../abstract-form.component';
import { MissionsListComponent } from '../../orders-missions/missions/missions-list/missions-list.component';
import { EditSelectFieldComponent } from '../../../components/fields/edit-select-field/edit-select-field.component';
import { RequestConfirmationDialogComponent } from '../../../components/request-confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatLabel,
    EditTextFieldComponent,
    EditMultiSelectFieldComponent,
    DetailTopbarComponent,
    MissionsListComponent,
    AbsencesListComponent,
    ReactiveFormsModule,
    DetailTopbarComponent,
    ErrorMessageComponent,
    EditSelectFieldComponent,
  ],
})
export class UserDetailsComponent extends AbstractForm<UserInput, UserOutput> {
  usersService = inject(UsersService);
  employeesService = inject(EmployeesService);
  matDialog = inject(MatDialog);
  // AbstractForm properties
  override entityListRouteName = ['users'];
  override entityRouteName = ['users'];
  override onCreateSuccessMessage = this.tr.language().USER_CREATED;
  override onCreateErrorMessage = this.tr.language().ERROR;
  override onUpdateSuccessMessage = this.tr.language().USER_UPDATED;
  override onUpdateErrorMessage = this.tr.language().ERROR;
  override onArchivedMessage = this.tr.language().USER_ARCHIVED;
  override onUnarchivedMessage = this.tr.language().USER_UNARCHIVED;
  override onArchivedErrorMessage = this.tr.language().USER_ARCHIVED;
  override onUnarchivedErrorMessage = this.tr.language().USER_UNARCHIVED;

  // Form Controls
  lastNameControl = new FormControl('', [Validators.required]);
  firstNameControl = new FormControl('', [Validators.required]);
  teamLeaderControl = new FormControl<Option<UserOutput> | null>(null);
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  colorControl = new FormControl<string>('#000000', [Validators.required]);
  rolesControl: FormControl<Option<RoleOutput>[] | null> = new FormControl([], [Validators.required]);

  // Options
  rolesOptions = signal<Option<RoleOutput>[]>([]);
  teamLeaders = signal<Option<UserOutput>[]>([]);
  // Affichage dynamique du champ chef d'équipe
  isOperator = signal(false);

  // Titre dynamique
  override title = computed(() => {
    const user = this.entitySignal();
    if (this.isNew()) return this.tr.language().NEW_USER;
    const firstname = user?.firstname ?? '';
    const lastname = user?.lastname ?? '';
    return this.editMode() ? `${this.tr.language().EDIT_USER} - ${firstname} ${lastname}` : `${firstname} ${lastname}`;
  });

  constructor() {
    super();
    this.form = this.fb.group({
      archivedAt: this.archivedAtControl,
      lastName: this.lastNameControl,
      firstName: this.firstNameControl,
      email: this.emailControl,
      roles: this.rolesControl,
      teamLeader: this.teamLeaderControl,
      color: this.colorControl,
    });

    // Charger les rôles et chefs d'équipe
    this.fetchRoles();
    this.fetchTeamLeaders();

    // Affichage dynamique du champ chef d'équipe
    this.rolesControl.valueChanges.subscribe((value) => {
      const isOp = Boolean((value as Option<RoleOutput>[] | null)?.some((role) => role.value?.name === ROLE.OPERATOR));
      this.isOperator.set(isOp);
      if (isOp) {
        this.teamLeaderControl.setValidators([Validators.required]);
      } else {
        this.teamLeaderControl.clearValidators();
        this.teamLeaderControl.setValue(null);
      }
      this.teamLeaderControl.updateValueAndValidity();
    });
  }

  async fetchRoles(fetchParams: UsersRolesGet$Params = {}) {
    const roles = await firstValueFrom(this.usersService.usersRolesGet(fetchParams));
    this.rolesOptions.set(this.mapRolesToOptions(roles));
  }

  async fetchTeamLeaders() {
    const employees = await firstValueFrom(this.employeesService.employeesTeamleadersListGet());
    const teamLeadersOptions: Option<UserOutput>[] =
      employees?.map(
        (employee): Option<UserOutput> => ({
          id: employee.id ?? '',
          name: `${employee.firstname} ${employee.lastname}`,
          value: employee,
          color: null,
        }),
      ) || [];
    this.teamLeaders.set(teamLeadersOptions);
  }

  override setForm(user: UserOutput) {
    this.form.patchValue({
      archivedAt: user.archivedAt,
      lastName: user.lastname,
      firstName: user.firstname,
      email: user.email,
      roles: this.mapRolesToOptions(user.roles ?? []),
      teamLeader: user.affectedToTeamleader
        ? {
            id: user.affectedToTeamleader.id,
            name: user.affectedToTeamleader.firstname + ' ' + user.affectedToTeamleader.lastname,
            value: user.affectedToTeamleader,
            color: null,
          }
        : null,
      color: user.color,
    });
  }

  override getEntityInput(): UserInput {
    return {
      archivedAt: this.archivedAtControl.value,
      lastname: this.lastNameControl.value ?? '',
      firstname: this.firstNameControl.value ?? '',
      email: this.emailControl.value ?? '',
      roleIds: (this.rolesControl.value as Option<RoleOutput>[] | null)?.map((role) => role.id) ?? [],
      affectedToTeamleaderId: this.teamLeaderControl.value?.id ?? null,
      color: this.colorControl.value ?? '#000000',
      id: this.entityIdSignal(),
    };
  }

  override getById(id: string): Observable<UserOutput> {
    return this.usersService.usersIdGet({ id });
  }

  override async createEntity(body: UserInput): Promise<string> {
    return await firstValueFrom(this.usersService.usersPost({ body }));
  }

  override async updateEntity(id: string, body: UserInput): Promise<UserOutput> {
    return await firstValueFrom(this.usersService.usersUserIdPut({ userId: id, body }));
  }

  override async archiveOrUnarchiveEntity(id: string): Promise<void> {
    try {
      let message = '';
      let title = '';
      if (!this.isArchived()) {
        message = 'Voulez-vous archiver cette utilisateur ?';
        title = 'Archiver';
      } else {
        message = 'Voulez-vous désarchiver cette utilisateur ?';
        title = 'Désarchiver';
      }

      const dialogRef = this.matDialog.open(RequestConfirmationDialogComponent, {
        data: {
          title,
          message,
        },
      });
      const confirmed = await firstValueFrom(dialogRef.afterClosed());
      if (!confirmed) {
        return;
      }

      if (!this.isArchived()) {
        await firstValueFrom(this.usersService.usersIdDelete$Response({ id }));
      } else {
        await firstValueFrom(this.usersService.usersRestaureIdGet({ id }));
      }
    } catch (error: any) {
      this.toastr.error(this.tr.get(error.error), this.onArchivedErrorMessage);
    }
  }

  private mapRolesToOptions(roles: RoleOutput[]): Option<RoleOutput>[] {
    return roles.map((role) => ({
      id: role.id ?? '',
      name: this.translateRole(role.name),
      value: role,
      color: role.color ?? '',
    }));
  }

  private translateRole(roleName: string | null | undefined): string {
    if (roleName === null || roleName === undefined) return '';
    switch (roleName) {
      case ROLE.SUPERVISOR:
        return this.tr.get('SUPERVISOR');
      case ROLE.TEAMLEADER:
        return this.tr.get('TEAMLEADER');
      case ROLE.OPERATOR:
        return this.tr.get('OPERATOR');
      default:
        return roleName;
    }
  }
}
