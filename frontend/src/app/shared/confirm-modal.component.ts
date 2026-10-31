import { AsyncPipe } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { ConfirmService } from '../core/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.css',
})
export class ConfirmModalComponent {
  readonly confirm = inject(ConfirmService);

  @HostListener('document:keydown.escape')
  onEscape() {
    this.confirm.answer(false);
  }
}
