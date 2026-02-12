import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { firstValueFrom } from 'rxjs';
import { CustomFormListOutput, CustomFormListOutputListResponse } from '../../../../api/models';
import { CustomFormsService } from '../../../../api/services';
import { AppService } from '../../../../services/app.service';
import { TranslationService } from '../../../../services/translation/translation.service';
import { ActionButtonGenericComponent } from '../../../datagrid/action-button-generic/action-button-generic.component';
import { DatagridComponent, FilterParams } from '../../../datagrid/datagrid.component';

@Component({
  selector: 'app-custom-forms',
  templateUrl: './custom-forms.component.html',
  styleUrls: ['./custom-forms.component.scss'],
  imports: [MatIconModule, MatButtonModule, DatagridComponent],
})
export class CustomFormsComponent implements OnInit {
  // Services
  tr = inject(TranslationService);
  appService = inject(AppService);
  private router = inject(Router);
  private readonly customFormsService = inject(CustomFormsService);

  // Signals
  fetchParamsSignal = signal<FilterParams>({});
  customFormsSignal = signal<CustomFormListOutput[]>([]);
  customFormsCount = signal<number>(0);
  datagridName = input<string>('CUSTOM-FORMS');

  // Others
  columnDefs = computed<ColDef<CustomFormListOutput>[]>(() => [
    {
      headerName: this.tr.language().CUSTOM_FORM_NAME,
      field: 'name',
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    {
      headerName: this.tr.language().FILE_EXPORT,
      field: 'exportFileName',
      filter: false,
      sortable: false,
    },
    {
      headerName: '',
      sortable: false,
      filter: false,
      minWidth: 15,
      width: 15,
      cellClass: 'flex justify-center',
      cellRenderer: ActionButtonGenericComponent,
      cellRendererParams: {
        icon: 'delete',
        class: 'text-red-600',
        showText: false,
        actionFunction: (id: string) => this.deleteForm(id),
      },
    },
  ]);

  constructor() {
    let initialRun = true;
    effect(async () => {
      const fetchParams = this.fetchParamsSignal();

      if (initialRun) {
        initialRun = false;
        return;
      }

      await this.loadData(fetchParams);
    });
  }

  ngOnInit() {
    // this.loadData();
  }

  async loadData(fetchParams: FilterParams = {}) {
    try {
      const data: CustomFormListOutputListResponse = await firstValueFrom(
        this.customFormsService.customFormsGet(fetchParams),
      );

      this.customFormsSignal.set(data.value ?? []);
      this.customFormsCount.set(data.count ?? 0);
    } catch (error) {
      console.error(error);
    }
  }

  // Méthode pour ajuster automatiquement la taille des colonnes
  onGridReady(params: any) {
    // Auto-size toutes les colonnes pour s'adapter au contenu
    params.api.sizeColumnsToFit();

    // Ou bien auto-size seulement certaines colonnes
    // params.api.autoSizeColumns(['name', 'exportFileName']);
  }

  goToDetails(id: string | undefined): void {
    if (!id) return;
    this.appService.goTo(['administration', 'custom-forms', id]);
  }

  onRowClick(row: CustomFormListOutput) {
    this.goToDetails(row.id);
  }

  deleteForm(id: string): void {
    if (!id) return;

    // Ajout d'une confirmation avant suppression
    const confirmDelete = confirm('Êtes-vous sûr de vouloir supprimer cet élément ?');

    if (confirmDelete) {
    }
  }
}
