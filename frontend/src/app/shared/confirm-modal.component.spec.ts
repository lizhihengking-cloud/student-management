import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmService } from '../core/confirm.service';
import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  let fixture: ComponentFixture<ConfirmModalComponent>;
  let confirm: ConfirmService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConfirmModalComponent] });
    fixture = TestBed.createComponent(ConfirmModalComponent);
    confirm = TestBed.inject(ConfirmService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.modal')).toBeNull();
  });

  it('opens on request and resolves true when confirmed', () => {
    let answer: boolean | undefined;
    confirm.confirm({ title: 'Delete?', message: 'Sure?', confirmText: 'Yes' }).subscribe(a => (answer = a));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal h2').textContent).toContain('Delete?');
    (fixture.nativeElement.querySelector('.modal-actions .btn.primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(answer).toBeTrue();
    expect(fixture.nativeElement.querySelector('.modal')).toBeNull();
  });

  it('resolves false on Escape', () => {
    let answer: boolean | undefined;
    confirm.confirm({ title: 'T', message: 'M' }).subscribe(a => (answer = a));
    fixture.componentInstance.onEscape();
    expect(answer).toBeFalse();
  });
});
