import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { of } from 'rxjs';
import { ConfirmService } from './confirm.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/** Asks for confirmation (modal) before leaving a route that has unsaved edits. */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = component => {
  if (!component.hasUnsavedChanges()) return of(true);
  return inject(ConfirmService).confirm({
    title: 'Discard unsaved changes?',
    message: 'You have unsaved changes. If you leave this page they will be lost.',
    confirmText: 'Discard changes',
    cancelText: 'Keep editing',
    danger: true,
  });
};
