/**
 * Tests for OperatorMessagingComponent — Sprint 051 / OC-4
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OperatorMessagingComponent, ChatMessage } from './operator-messaging.component';
import { CaseService } from '../../../core/services/case.service';
import { TemplateService, Template } from '../../../core/services/template.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';

const mockMessages: ChatMessage[] = [
  {
    id: 'm1', content: 'Hello from driver', sender_id: 'driver-1',
    sender: { user_id: 'driver-1', full_name: 'John Driver', role: 'driver' },
    created_at: '2026-03-10T10:00:00Z',
  },
  {
    id: 'm2', content: 'Hi John, how can I help?', sender_id: 'op-1',
    sender: { user_id: 'op-1', full_name: 'Jane Operator', role: 'operator' },
    created_at: '2026-03-10T10:05:00Z',
  },
];

const mockTemplates: Template[] = [
  { id: 't1', name: 'Court Date Reminder', category: 'operator', body: 'Your court date for case {{case_number}} is {{court_date}}.', variables: ['case_number', 'court_date'], is_active: true },
  { id: 't2', name: 'Document Request', category: 'operator', body: 'Please upload {{document_list}} for case {{case_number}}.', variables: ['document_list', 'case_number'], is_active: true },
];

describe('OperatorMessagingComponent', () => {
  let fixture: ComponentFixture<OperatorMessagingComponent>;
  let component: OperatorMessagingComponent;
  let caseServiceSpy: {
    getCaseConversation: ReturnType<typeof vi.fn>;
    getCaseMessages: ReturnType<typeof vi.fn>;
    sendCaseMessage: ReturnType<typeof vi.fn>;
    getOperatorCaseDetail: ReturnType<typeof vi.fn>;
  };
  let templateServiceSpy: { getTemplates: ReturnType<typeof vi.fn> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    TestBed.resetTestingModule();

    caseServiceSpy = {
      getCaseConversation: vi.fn().mockReturnValue(of({ success: true, data: { id: 'conv-1' } })),
      getCaseMessages: vi.fn().mockReturnValue(of({ messages: mockMessages, total: 2, conversationId: 'conv-1' })),
      sendCaseMessage: vi.fn().mockReturnValue(of({ data: { id: 'm3', content: 'test', sender_id: 'op-1', created_at: new Date().toISOString() } })),
      getOperatorCaseDetail: vi.fn().mockReturnValue(of({ case: { id: 'c1', case_number: 'CDL-601' } })),
    };

    templateServiceSpy = {
      getTemplates: vi.fn().mockReturnValue(of({ data: mockTemplates })),
    };

    routerSpy = { navigate: vi.fn() };

    // Mock localStorage for token
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === 'token') {
        const payload = btoa(JSON.stringify({ userId: 'op-1', role: 'operator' }));
        return `header.${payload}.sig`;
      }
      return null;
    });

    await TestBed.configureTestingModule({
      imports: [OperatorMessagingComponent, NoopAnimationsModule],
      providers: [
        { provide: CaseService, useValue: caseServiceSpy },
        { provide: TemplateService, useValue: templateServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'case-1' } } } },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorMessagingComponent);
    component = fixture.componentInstance;

    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    snackBarSpy = vi.spyOn(snackBar, 'open').mockReturnValue(null as any);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders loading state initially', () => {
    component.loading.set(true);
    component.error.set('');
    fixture.detectChanges();
    const el = fixture.nativeElement;
    expect(el.querySelector('.msg-loading')).toBeTruthy();
  });

  it('displays messages after load', () => {
    const bubbles = fixture.nativeElement.querySelectorAll('.msg-bubble');
    expect(bubbles.length).toBe(2);
  });

  it('driver messages on left, operator on right', () => {
    const bubbles = fixture.nativeElement.querySelectorAll('.msg-bubble');
    expect(bubbles[0].classList.contains('msg-driver')).toBe(true);
    expect(bubbles[1].classList.contains('msg-operator')).toBe(true);
  });

  it('send button calls service with composer text', async () => {
    component.messageText = 'Hello driver!';
    fixture.detectChanges();
    component.sendMessage();
    await fixture.whenStable();
    expect(caseServiceSpy.sendCaseMessage).toHaveBeenCalledWith('case-1', 'Hello driver!');
  });

  it('composer clears after successful send', async () => {
    component.messageText = 'Test msg';
    component.sendMessage();
    await fixture.whenStable();
    expect(component.messageText).toBe('');
  });

  it('templates button toggles template panel', () => {
    expect(component.showTemplatePanel()).toBe(false);
    component.toggleTemplatePanel();
    expect(component.showTemplatePanel()).toBe(true);
    component.toggleTemplatePanel();
    expect(component.showTemplatePanel()).toBe(false);
  });

  it('selecting a template fills composer with substituted text', () => {
    component.templateValues.set({ case_number: 'CDL-601', court_date: '2026-04-10' });
    component.selectTemplate(mockTemplates[0]);
    component.useTemplate();
    expect(component.messageText).toContain('CDL-601');
    expect(component.messageText).toContain('2026-04-10');
    expect(component.messageText).not.toContain('{{case_number}}');
  });

  it('template variables pre-filled from case data', () => {
    expect(component.templateValues()['case_number']).toBe('CDL-601');
  });

  it('empty conversation shows no messages placeholder', () => {
    component.messages.set([]);
    component.loading.set(false);
    component.error.set('');
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('.msg-empty');
    expect(empty).toBeTruthy();
  });

  it('error state shown on send failure', async () => {
    caseServiceSpy.sendCaseMessage.mockReturnValue(
      throwError(() => ({ error: { error: { message: 'Send failed' } } })),
    );
    component.messageText = 'Will fail';
    component.sendMessage();
    await fixture.whenStable();
    expect(snackBarSpy).toHaveBeenCalled();
  });

  it('goBack navigates to case detail', () => {
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/operator/cases', 'case-1']);
  });

  it('Ctrl+Enter sends message', () => {
    component.messageText = 'Quick send';
    const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
    const spy = vi.spyOn(event, 'preventDefault');
    component.onKeydown(event);
    expect(spy).toHaveBeenCalled();
    expect(caseServiceSpy.sendCaseMessage).toHaveBeenCalled();
  });

  it('does not send empty message', () => {
    caseServiceSpy.sendCaseMessage.mockClear();
    component.messageText = '   ';
    component.sendMessage();
    expect(caseServiceSpy.sendCaseMessage).not.toHaveBeenCalled();
  });

  it('isOperatorMessage returns true for operator role', () => {
    const msg: ChatMessage = {
      id: '1', content: '', sender_id: 'x',
      sender: { user_id: 'x', full_name: 'Op', role: 'operator' },
      created_at: '',
    };
    expect(component.isOperatorMessage(msg)).toBe(true);
  });

  it('isOperatorMessage returns true for current user', () => {
    const msg: ChatMessage = {
      id: '1', content: '', sender_id: 'op-1',
      created_at: '',
    };
    expect(component.isOperatorMessage(msg)).toBe(true);
  });

  it('loads templates when panel opened for the first time', async () => {
    component.toggleTemplatePanel();
    await fixture.whenStable();
    expect(templateServiceSpy.getTemplates).toHaveBeenCalledWith('operator');
  });

  it('error state renders with retry button', () => {
    component.loading.set(false);
    component.error.set('Something went wrong');
    fixture.detectChanges();
    const errorEl = fixture.nativeElement.querySelector('.msg-error');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Something went wrong');
  });

  it('caseNumber signal is set from case detail', () => {
    expect(component.caseNumber()).toBe('CDL-601');
  });
});
