import { Injectable, inject } from '@angular/core';
import { OfflineService } from './offline.service';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private offlineService = inject(OfflineService);
  private http = inject(HttpClient);

  constructor() {
    window.addEventListener('online', () => {
      this.syncData();
    });
  }

  syncData() {
    this.offlineService.getOfflineData().subscribe((data) => {
      data.forEach((item) => {
        this.sendToServer(item.formData);
        this.offlineService.deleteOfflineData(item.id).subscribe();
      });
    });
  }

  sendToServer(formData: any) {
    this.http.post(API_URL + '/clients', formData).subscribe({
      next: () => console.log('Données envoyées avec succès'),
      error: (err) => console.error('Erreur lors de l’envoi des données', err),
    });
  }
}
