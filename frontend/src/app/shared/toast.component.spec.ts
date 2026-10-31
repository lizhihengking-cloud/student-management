import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationService } from '../core/notification.service';
import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ToastComponent] });
    fixture = TestBed.createComponent(ToastComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders pushed notifications and dismisses them', () => {
    const notify = TestBed.inject(NotificationService);
    notify.success('Saved!');
    fixture.detectChanges();
    const toast: HTMLElement = fixture.nativeElement.querySelector('.toast.success');
    expect(toast.textContent).toContain('Saved!');
    (toast.querySelector('.toast-close') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.toast')).toBeNull();
  });
});
