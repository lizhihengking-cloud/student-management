import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NotificationService } from '../core/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastComponent {
  readonly notifications = inject(NotificationService);
}
