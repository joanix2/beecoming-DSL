import { Injectable, signal } from '@angular/core';
import { API_URL } from '../../environments/environment';
import { AppService } from './app.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  notificationNumberSignal = signal<number>(0);
  constructor(private readonly app: AppService) {}
  getNotifications() {
    const url = API_URL + '/notifications/' + this.app.me?.id + '/count';

    const test: EventSourceInit = {
      withCredentials: true,
    };
    const eventSource = new EventSource(url, test);
    eventSource.onmessage = (event) => {
      this.notificationNumberSignal.set(event.data);
    };

    eventSource.onerror = (error) => {
      console.error('Erreur SSE:', error);
      eventSource.close();
    };

    return eventSource;
  }

  get notificationNumber() {
    return this.notificationNumberSignal();
  }
}
