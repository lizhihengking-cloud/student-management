import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (answer: boolean) => void;
}

/**
 * Promise-like modal confirmation. `confirm()` returns a cold observable that opens the modal on
 * subscribe and emits true/false once, so it composes directly with switchMap / route guards.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _state$ = new BehaviorSubject<ConfirmState | null>(null);
  readonly state$ = this._state$.asObservable();

  confirm(options: ConfirmOptions): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      this._state$.next({
        ...options,
        resolve: answer => {
          this._state$.next(null);
          subscriber.next(answer);
          subscriber.complete();
        },
      });
      // if the subscriber goes away (e.g. navigation cancelled) make sure the modal closes
      return () => {
        if (this._state$.value) this._state$.next(null);
      };
    });
  }

  answer(value: boolean) {
    this._state$.value?.resolve(value);
  }
}
