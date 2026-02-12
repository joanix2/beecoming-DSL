import { Component, computed, effect, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { firstValueFrom } from 'rxjs';
import { ClientListOutput, ClientListOutputListResponse } from '../../../api/models';
import { ClientsService } from '../../../api/services';
import { DatagridComponent, FilterParams } from '../../../components/datagrid/datagrid.component';
import { HeaderListComponent } from '../../../components/header-list/header-list.component';
import { AppService } from '../../../services/app.service';
import { LoadingService } from '../../../services/loading.service';
import { TranslationService } from '../../../services/translation/translation.service';
@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.component.html',
  standalone: true,
  imports: [DatagridComponent, HeaderListComponent],
})
export class ClientsListComponent {
  clientsSignal = signal<ClientListOutputListResponse | null>(null);
  fetchParamsSignal = signal<FilterParams>({});
  clientsCount = signal<number>(0);

  // reference datagrid parent
  datagrid = viewChild<DatagridComponent<ClientListOutput>>('datagrid');

  columnDefs = computed<ColDef<ClientListOutput>[]>(() => [
    {
      headerName: this.translateService.language().CLIENT_COMPANY,
      sort: 'asc',
      sortIndex: 0,
      field: 'company',
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: 'company',
        maxNumConditions: 1,
      },
      type: 'text',
      sortable: true,
      filter: true,
    },
    {
      headerName: this.translateService.language().CLIENT_BUSINESS_MANAGER,
      sortIndex: 0,
      type: 'text',
      sortable: true,
      field: 'contactName',
      filter: true,
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: 'contactName',
        maxNumConditions: 1,
      },
    },
    {
      headerName: this.translateService.language().CLIENT_EMAIL,
      sortIndex: 0,
      field: 'email',
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: 'email',
        maxNumConditions: 1,
      },
      type: 'text',
      sortable: true,
      filter: true,
    },
    {
      headerName: this.translateService.language().CLIENT_PHONE,
      sortIndex: 0,
      field: 'phoneNumber',
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        filterKey: 'phoneNumber',
        maxNumConditions: 1,
      },
      type: 'text',
      sortable: true,
      filter: true,
    },
    {
      headerName: this.translateService.language().CLIENT_LAST_ORDER,
      sortIndex: 0,
      field: 'lastOrderId',
      valueGetter: (params) => {
        if (!params.data) return 'Aucune commande';
        return params.data.lastOrderId ? params.data.lastOrderId : 'Aucune commande';
      },
      type: 'text',
      sortable: false,
      filter: false,
      headerClass: 'no-actions',
    },
  ]);

  constructor(
    protected readonly router: Router,
    protected readonly translateService: TranslationService,
    private readonly clientsService: ClientsService,
    private readonly appService: AppService,
    private readonly loadingService: LoadingService,
  ) {
    let initialRun = true;
    effect(async () => {
      const fetchParams = this.fetchParamsSignal();
      if (initialRun) {
        initialRun = false;
        return;
      }
      await this.loadData(fetchParams);
    });

    effect(() => {
      this.clientsCount.set(this.clientsSignal()?.count ?? 0);
    });
  }

  async loadData(fetchParams: FilterParams = {}) {
    try {
      this.loadingService.show();
      const clients = await firstValueFrom(this.clientsService.clientsDatagridPost(fetchParams));
      this.clientsSignal.set(clients);
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingService.hide();
    }
  }

  goToClientDetails(clientId: string | undefined): void {
    if (!clientId) return;
    this.appService.goTo(['clients', clientId]);
  }

  onSearchInput($event: string) {
    // reset pagination
    this.datagrid()?.agGrid.api?.paginationGoToFirstPage();
    this.datagrid()?.paginator.firstPage();

    if ($event === '') {
      this.fetchParamsSignal.update((params) => ({
        ...params,
        $search: undefined,
      }));
    } else {
      this.fetchParamsSignal.update((params) => ({
        ...params,
        $search: $event,
      }));
    }
  }
}
