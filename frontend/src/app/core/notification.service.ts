import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

/** Global toast notifications. Any component/service can push, the ToastComponent renders. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  private readonly _toasts$ = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this._toasts$.asObservable();

  success(message: string) { this.push('success', message); }
  error(message: string) { this.push('error', message, 7000); }
  info(message: string) { this.push('info', message); }

  dismiss(id: number) {
    this._toasts$.next(this._toasts$.value.filter(t => t.id !== id));
  }

  private push(type: Toast['type'], message: string, ttl = 4000) {
    const toast = { id: this.nextId++, type, message };
    this._toasts$.next([...this._toasts$.value, toast]);
    setTimeout(() => this.dismiss(toast.id), ttl);
  }
}
