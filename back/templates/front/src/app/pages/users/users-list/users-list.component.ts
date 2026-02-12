import { Component, computed, effect, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { firstValueFrom } from 'rxjs';
import { ROLE } from '../../../../utils/constant';
import { RoleOutput, UserOutput, UserOutputListResponse } from '../../../api/models';
import { UsersService } from '../../../api/services';
import {
  CheckboxFilterComponent,
  ColorCheckbox,
  ColorCheckboxAndCount,
} from '../../../components/datagrid/checkbox-filter/checkbox-filter.component';
import { ColorCellComponent } from '../../../components/datagrid/color-cell/color-cell.component';
import { DatagridComponent, FilterParams, textFilterToReplace } from '../../../components/datagrid/datagrid.component';
import { HeaderListComponent } from '../../../components/header-list/header-list.component';
import { AppService } from '../../../services/app.service';
import { TranslationService } from '../../../services/translation/translation.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [HeaderListComponent, DatagridComponent],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent {
  roles: RoleOutput[] = [];
  usersSignal = signal<UserOutputListResponse | null>(null);
  fetchParamsSignal = signal<FilterParams>({});

  usersCount = signal<number>(0);

  // reference datagrid parent
  datagrid = viewChild<DatagridComponent<UserOutput>>('datagrid');

  private translateRole(roleName: string | null | undefined): string {
    if (roleName === null || roleName === undefined) return '';

    switch (roleName) {
      case ROLE.SUPERVISOR:
        return this.translateService.get('SUPERVISOR');
      case ROLE.TEAMLEADER:
        return this.translateService.get('TEAMLEADER');
      case ROLE.OPERATOR:
        return this.translateService.get('OPERATOR');
      default:
        return roleName;
    }
  }

  columnDefs = computed<ColDef<UserOutput>[]>(() => [
    {
      headerName: this.translateService.language().USER_FORM_LASTNAME,
      sort: 'asc',
      sortIndex: 0,
      field: 'lastname',
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: 'lastname',
        maxNumConditions: 1,
      },
      type: 'text',
      sortable: true,
      filter: true,
    },
    {
      headerName: this.translateService.language().USER_FORM_FIRSTNAME,
      sortIndex: 0,
      field: 'firstname',
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: 'firstname',
        maxNumConditions: 1,
      },
      type: 'text',
      sortable: true,
      filter: true,
    },
    {
      headerName: this.translateService.language().USER_FORM_ROLE,
      field: 'roles',
      sortable: false,
      type: 'array',
      filter: CheckboxFilterComponent,
      filterParams: {
        fetchFilterValues: async () => {
          return await this.getColorCheckboxRoles();
        },
        displaySearchBar: false,
        filterKey: `UserRoles/any(ur: ur/Role/Id in (${textFilterToReplace}))`,
      },
      cellRenderer: 'ChipComponent',
      cellRendererParams: (params: ICellRendererParams) => {
        return {
          value: params.data?.roles?.map((role: RoleOutput) => ({
            label: this.translateRole(role.name),
            color: role.color,
          })),
        };
      },
    },
    {
      headerName: this.translateService.language().USER_FORM_EMAIL,
      field: 'email',
      type: 'text',
      sortable: true,
      filter: true,
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        maxNumConditions: 1,
      },
    },
    {
      headerName: this.translateService.language().CUSTOM_FORM_COLOR,
      field: 'color',
      type: 'text',
      filter: true,
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: 'color',
        maxNumConditions: 1,
      },
      sortable: false,
      cellRendererSelector: (params: ICellRendererParams) => {
        return {
          component: ColorCellComponent,
          params: {
            color: params.value,
          },
        };
      },
    },
    {
      headerName: this.translateService.language().USER_FORM_ARCHIVE,
      field: 'archivedAt',
      cellRenderer: (params: { value: boolean }) =>
        params.value ? this.translateService.language().YES : this.translateService.language().NO,
      type: 'array',
      sortable: false,
      filter: CheckboxFilterComponent,
      filterParams: {
        fetchFilterValues: async (fetchParams: FilterParams) => {
          return {
            colorCheckbox: [
              { label: this.translateService.language().YES, value: 'true', color: '' },
              { label: this.translateService.language().NO, value: 'false', color: '' },
            ],
            count: 2,
          };
        },
        displaySearchBar: false,
        filterKey: `(not(ArchivedAt eq null) in (${textFilterToReplace}))`,
        sortKey: 'ArchivedAt',
      },
    },
  ]);

  constructor(
    protected readonly router: Router,
    protected readonly translateService: TranslationService,
    private readonly usersService: UsersService,
    private readonly appService: AppService,
  ) {
    let firstLoad = true;
    effect(async () => {
      const fetchParams = this.fetchParamsSignal();
      if (this.roles.length === 0) {
        this.roles = await this.fetchRoles();
      }
      if (firstLoad) {
        firstLoad = false;
        return;
      }
      await this.loadData(fetchParams);
    });

    effect(() => {
      this.usersCount.set(this.usersSignal()?.count ?? 0);
    });
  }

  async fetchRoles(): Promise<RoleOutput[]> {
    if (this.roles.length > 0) return this.roles;
    this.roles = await firstValueFrom(this.usersService.usersRolesGet());
    return this.roles;
  }

  mapRoles(roles: RoleOutput[]): ColorCheckboxAndCount {
    return {
      colorCheckbox: roles.map<ColorCheckbox>((role) => ({
        label: this.translateRole(role.name),
        value: role.id ?? '',
        color: role.color ?? '',
      })),
      count: roles.length,
    };
  }

  async getColorCheckboxRoles(): Promise<ColorCheckboxAndCount> {
    if (this.roles.length === 0) {
      await this.fetchRoles();
    }
    return this.mapRoles(this.roles);
  }

  createChip(name: string, color: string): string {
    if (this.isNullOrEmpty(name) || this.isNullOrEmpty(color)) return '';

    const height = 19;

    return `
      <span style="
        background-color: ${color};
        color: white;
        padding: 0px ${height / 2 + 2}px;
        border-radius: ${height / 2 + 2}px;
        height: ${height}px;
        text-align: center;
        display: flex;
        align-items: center;
        width: fit-content;
      ">
        ${name}
      </span>
    `;
  }

  isNullOrEmpty(value: string | null | undefined): boolean {
    return value == null || value.trim() === '';
  }

  async loadData(fetchParams: FilterParams = {}) {
    const users = await firstValueFrom(this.usersService.usersDatagridPost(fetchParams));
    this.usersSignal.set(users);
  }

  goToUserDetails(UserId: string): void {
    this.appService.goTo(['users', UserId]);
  }

  onSearchInput($event: string) {
    // reset pagination
    this.datagrid()?.agGrid.api?.paginationGoToFirstPage();
    this.datagrid()?.paginator.firstPage();

    this.fetchParamsSignal.update((params) => ({
      ...params,
      $search: $event,
    }));
  }
}
