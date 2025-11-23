import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationComponent!: any;

  register(notificationComponent: any): void {
    this.notificationComponent = notificationComponent;
  }

  showMessage(message: string, type: 'success' | 'error', duration: number = 3000): void {
    if (this.notificationComponent) {
      this.notificationComponent.showMessage(message, type, duration);
    }
  }
}
