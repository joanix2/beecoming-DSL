import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { firstValueFrom } from 'rxjs';
import { AbsenceTypeOutput, UserAbsenceOutput, UserAbsenceOutputListResponse, UserOutput } from '../../../api/models';
import { AbsenceTypesService, UserAbsencesService } from '../../../api/services';
import {
  CheckboxFilterComponent,
  ColorCheckbox,
  ColorCheckboxAndCount,
} from '../../datagrid/checkbox-filter/checkbox-filter.component';
import { DatagridComponent, FilterParams, textFilterToReplace } from '../../datagrid/datagrid.component';
import { AppService } from '../../../services/app.service';
import { TranslationService } from '../../../services/translation/translation.service';

@Component({
  selector: 'app-absences-list',
  templateUrl: './absences-list.component.html',
  imports: [DatagridComponent],
  providers: [DatePipe, TranslationService],
})
export class AbsencesListComponent {
  absencesSignal = signal<UserAbsenceOutputListResponse | null>(null);
  fetchParamsSignal = signal<FilterParams>({});
  absencesCount = signal<number>(0);
  userId = input<string | undefined>(undefined);
  dataGridName = input<string>('ABSENCE_LIST');
  private readonly datePipe = inject(DatePipe);
  private readonly absenceTypesService = inject(AbsenceTypesService);
  public readonly translateService = inject(TranslationService);
  columnDefs = computed<ColDef<UserAbsenceOutput & { entity?: UserOutput }>[]>(() => [
    // {
    //   headerName: this.translateService.language().USERS,
    //   field: 'entity',
    //   valueGetter: (params) => {
    //     const user = params.data?.entity;
    //     return user && user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : 'N/A';
    //   },
    //   filterParams: {
    //     filterOptions: ['contains', 'startsWith', 'endsWith'],
    //     filterKey: "concat(concat(entity/firstname, ' '), entity/lastname)",
    //     maxNumConditions: 1,
    //   },
    //   type: 'text',
    //   sortable: true,
    //   filter: true,
    // },
    {
      headerName: this.translateService.language().ABSENCE_TYPE,
      sortable: false,
      field: 'type' as keyof UserAbsenceOutput,
      type: 'array',
      filter: CheckboxFilterComponent,
      filterParams: {
        fetchFilterValues: this.getAbsenceTypes.bind(this),
        filterKey: `type/id in (${textFilterToReplace})`,
        sortKey: 'type/name',
      },
      cellRenderer: 'ChipComponent',
      cellRendererParams: (params: ICellRendererParams) => ({
        value: params.data?.type?.name,
        color: params.data?.type?.color,
      }),
    },
    {
      headerName: this.translateService.language().ABSENCE_START_DATE,
      field: 'startDate',
      sortIndex: 0,
      sort: 'desc',
      type: 'date',
      sortable: true,
      filter: 'agDateColumnFilter',
      valueFormatter: (params: any) => this.datePipe.transform(params.value, 'dd/MM/yyyy') || '-',
    },
    {
      headerName: this.translateService.language().ABSENCE_END_DATE,
      field: 'endDate',
      type: 'date',
      sortable: true,
      filter: 'agDateColumnFilter',
      valueFormatter: (params: any) => this.datePipe.transform(params.value, 'dd/MM/yyyy') || '-',
    },
    {
      headerName: this.translateService.language().ABSENCE_REASON,
      field: 'comments',
      type: 'text',
      sortable: false,
      filter: true,
      filterParams: {
        filterOptions: ['contains'],
        filterKey: 'comments',
        maxNumConditions: 1,
      },
    },
  ]);
  constructor() {
    const router = inject(Router);
    const userAbsenceService = inject(UserAbsencesService);
    const appService = inject(AppService);
    let initialRun = true;
    effect(async () => {
      const fetchParams = this.fetchParamsSignal();
      if (initialRun) {
        initialRun = false;
        return;
      }
      await this.loadData(fetchParams, userAbsenceService);
    });
    effect(() => {
      this.absencesCount.set(this.absencesSignal()?.count ?? 0);
    });
  }
  async loadData(fetchParams: FilterParams = {}, userAbsenceService: UserAbsencesService): Promise<void> {
    if (this.userId() !== null && this.userId() !== undefined) {
      fetchParams.userId = this.userId();
    }
    const absences = await firstValueFrom(userAbsenceService.userAbsencesDatagridPost(fetchParams));
    this.absencesSignal.set(absences);
  }
  async getAbsenceTypes(): Promise<ColorCheckboxAndCount> {
    const types: AbsenceTypeOutput[] | undefined = await firstValueFrom(this.absenceTypesService.absenceTypesGet());
    return {
      colorCheckbox:
        types?.map<ColorCheckbox>((c: AbsenceTypeOutput) => ({
          value: c.id ?? '',
          color: c.color ?? '',
          label: c.name ?? '',
          icon: c.icon ?? '',
        })) ?? [],
      count: types?.length ?? 0,
    };
  }
}
