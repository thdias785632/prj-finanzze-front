import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../infra/notification/notification.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  imports: [
    CommonModule
  ],
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  message: string | null = null;
  type: 'success' | 'error' = 'success';

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.register(this);
  }

  showMessage(message: string, type: 'success' | 'error', duration: number = 3000): void {
    this.message = message;
    this.type = type;

    setTimeout(() => this.clearMessage(), duration);
  }

  clearMessage(): void {
    this.message = null;
  }
}
