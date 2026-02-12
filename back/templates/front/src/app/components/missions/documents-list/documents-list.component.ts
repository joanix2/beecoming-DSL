import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, model, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ColDef } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { FileInfoResponse } from '../../../api/models';
import { MissionsService, OrdersService } from '../../../api/services';
import { TranslationService } from '../../../services/translation/translation.service';
import { ActionButtonGenericComponent } from '../../datagrid/action-button-generic/action-button-generic.component';
import { DatagridComponent, FilterParams } from '../../datagrid/datagrid.component';
import { DeleteConfirmationDialogComponent } from '../../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { HttpErrorResponse } from '@angular/common/http';
import { RequestConfirmationDialogComponent } from '../../request-confirmation-dialog.component';

@Component({
  selector: 'app-list-documents',
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.scss'],
  imports: [DatagridComponent, MatButtonModule, MatIconModule, MatLabel],
  providers: [DatePipe],
})
export class DocumentsListComponent {
  // Services
  tr = inject(TranslationService);
  missionsService = inject(MissionsService);
  toastr = inject(ToastrService);
  dialog = inject(MatDialog);
  datePipe = inject(DatePipe);
  ordersService = inject(OrdersService);
  matDialog = inject(MatDialog);
  // Inputs
  entityId = input.required<string>();
  identityType = input<'missions' | 'orders'>('missions');
  active = input<boolean>(true);
  hideHeader = input<boolean>(true);

  // Signals
  documents = model<FileInfoResponse[]>([]);
  fetchParamsSignal = signal<FilterParams>({});
  documentsCount = signal<number>(0);
  paginationEnabledSignal = signal<boolean>(false);

  allowedDocumentExtensions: string[] = ['.pdf', '.xls', '.xlsx', '.csv', '.doc', '.docx', '.zip', '.rar'];
  // Max volume of files
  maxVolume = 10 * 1024 * 1024; // 10MB

  // Max number of files
  maxNumber = 10;

  // Computed
  columnDefs = computed<ColDef<FileInfoResponse>[]>(() => [
    {
      headerName: this.tr.language().MISSION_DOCUMENT_NAME,
      field: 'name',
      filter: 'agTextColumnFilter',
      sortable: true,
      flex: 1,
    },
    {
      headerName: this.tr.language().MISSION_DOCUMENT_UPLOADED_AT,
      field: 'uploadDate',
      flex: 1,
      sortIndex: 1,
      sort: 'desc',
      type: 'date',
      sortable: true,
      filter: 'agDateColumnFilter',
      valueGetter: (params: any) => this.datePipe.transform(params.data.uploadDate, 'dd/MM/yyyy') || '-',
    },
    {
      headerName: '',
      sortable: false,
      filter: false,
      minWidth: 50,
      width: 50,
      cellClass: 'flex justify-center',
      cellRenderer: ActionButtonGenericComponent,
      cellRendererParams: {
        icon: 'delete',
        class: 'text-red-600',
        showText: false,
        key: 'name',
        tooltipLabel: 'Supprimer le document',
        actionFunction: (id: string) => this.deleteDocument(id),
      },
    },
  ]);

  constructor() {
    // Effect to update documents count
    effect(() => {
      this.documentsCount.set(this.documents().length);
    });

    // Effect to load documents when missionId changes
    effect(() => {
      const missionId = this.entityId();
      if (missionId && missionId !== 'new') {
        this.loadDocuments(missionId);
      }
    });
  }

  /**
   * Load documents for the given mission
   */
  private async loadDocuments(identityId: string): Promise<void> {
    try {
      if (this.identityType() == 'missions') {
        const fileInfos = await firstValueFrom(
          this.missionsService.missionsMissionIdFilesGet({ missionId: identityId }),
        );

        if (fileInfos.length > 0) {
          this.documents.set(fileInfos);
        }
      } else if (this.identityType() == 'orders') {
        const fileInfos = await firstValueFrom(this.ordersService.ordersOrderIdFilesGet({ orderId: identityId }));
        if (fileInfos.length > 0) {
          this.documents.set(fileInfos);
        }
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      this.toastr.error('Erreur lors du chargement des documents');
    }
  }

  /**
   * Handle file upload
   */
  async onFileChange(event: Event, forceReplace: boolean = false): Promise<void> {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    // volume total
    const totalSize = Array.from(files).reduce((acc, file) => acc + file.size, 0);
    if (totalSize > this.maxVolume) {
      this.toastr.error(`Le volume total des fichiers dépasse la limite de ${this.maxVolume / 1024 / 1024}MB`);
      return;
    }
    // nombre max de fichiers
    if (files.length > this.maxNumber) {
      this.toastr.error(`Le nombre de fichiers dépasse la limite de ${this.maxNumber}`);
      return;
    }

    // extension des fichiers
    const fileExtensions = Array.from(files).map((file) => file.name.split('.').pop()?.toLowerCase());
    if (
      fileExtensions &&
      fileExtensions.length > 0 &&
      fileExtensions.some((ext) => !this.allowedDocumentExtensions.includes(`.${ext}`))
    ) {
      this.toastr.error(`Les fichiers doivent être de type ${this.allowedDocumentExtensions.join(', ')}`);
      return;
    }
    const fileName = files[0].name;

    const missionId = this.entityId();
    if (!missionId) {
      this.toastr.error('ID de mission manquant');
      return;
    }

    try {
      if (this.identityType() === 'missions') {
        for (const file of Array.from(files)) {
          const uploadedFileInfo = await firstValueFrom(
            this.missionsService.missionsMissionIdFilesPost$FormData({
              missionId,
              forceReplace: forceReplace,
              body: {
                file: file,
              },
            }),
          );

          await this.loadDocuments(missionId);
        }
      } else if (this.identityType() === 'orders') {
        for (const file of Array.from(files)) {
          const uploadedFileInfo = await firstValueFrom(
            this.ordersService.ordersOrderIdFilesPost$FormData({
              orderId: this.entityId(),
              body: {
                file: file,
              },
            }),
          );

          this.documents.update((prev) => [...prev, uploadedFileInfo]);
        }
      }

      this.toastr.success('Document(s) uploadé(s) avec succès');

      // Reset file input
      (event.target as HTMLInputElement).value = '';
    } catch (error: any) {
      if (error.status === 409 && !forceReplace) {
        const dialogRef = this.matDialog.open(RequestConfirmationDialogComponent, {
          data: {
            title: `Le document \"${fileName}\" existe déjà`,
            message: `Le document \"${fileName}\" existe déjà. Voulez-vous le remplacer ?`,
          },
        });
        const confirmed = await firstValueFrom(dialogRef.afterClosed());
        if (confirmed) {
          this.onFileChange(event, true);
        } else {
          this.toastr.info("L'opération a été annulée");
          (event.target as HTMLInputElement).value = '';
        }
      } else {
        console.error('Error uploading file:', error);
        this.toastr.error("Erreur lors de l'upload du document");
      }
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(document: any): Promise<void> {
    // Find the document to get its name for confirmation
    const documentToDelete = this.documents().find((doc) => doc.name === document.name);
    const fileNameToDelete = documentToDelete?.name || 'ce document';

    // Open confirmation dialog
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      data: {
        title: 'Supprimer le document',
        itemName: fileNameToDelete,
      },
      width: '400px',
    });

    // Wait for user response
    const confirmed = await firstValueFrom(dialogRef.afterClosed());

    if (confirmed) {
      try {
        await firstValueFrom(
          this.missionsService.missionsMissionIdFilesFileNameDelete({
            missionId: this.entityId(),
            fileName: fileNameToDelete,
          }),
        );
        this.documents.update((prev) => prev.filter((doc) => doc.name !== fileNameToDelete));
        this.toastr.success('Document supprimé avec succès');
      } catch (error) {
        console.error('Error deleting document:', error);
        this.toastr.error('Erreur lors de la suppression du document');
      }
    }
  }

  /**
   * Open document in new tab
   */
  onEditRow(data: FileInfoResponse): void {
    if (data.url) {
      window.open(data.url, '_blank');
    }
  }
}
