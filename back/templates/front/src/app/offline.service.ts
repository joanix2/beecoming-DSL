import { Injectable, inject } from "@angular/core";
import { NgxIndexedDBService } from "ngx-indexed-db";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class OfflineService {
  private dbService = inject(NgxIndexedDBService);

  saveOffline(data: any) {
    return this.dbService.add("offlineData", { formData: data, timestamp: new Date() });
  }

  getOfflineData(): Observable<any[]> {
    return this.dbService.getAll("offlineData");
  }

  deleteOfflineData(id: number) {
    return this.dbService.delete("offlineData", id);
  }
}
