import {
  Component, OnInit, OnDestroy, signal, computed,
  ChangeDetectionStrategy, inject, ElementRef, viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of, finalize, Subscription } from 'rxjs';

import { CaseService } from '../../../core/services/case.service';
import { TemplateService, Template } from '../../../core/services/template.service';

export interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  sender?: { user_id: string; full_name: string; role: string };
  created_at: string;
  is_read?: boolean;
}

@Component({
  selector: 'app-operator-messaging',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatTooltipModule, MatChipsModule,
    TranslateModule,
  ],
  template: `
    <!-- Header -->
    <div class="msg-header">
      <button mat-icon-button (click)="goBack()" [attr.aria-label]="'OPR.MSG.BACK' | translate">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1 class="msg-title">{{ 'OPR.MSG.TITLE' | translate }} {{ caseNumber() }}</h1>
    </div>

    <!-- Loading -->
    @if (loading()) {
      <div class="msg-loading" role="status">
        <mat-spinner diameter="40"></mat-spinner>
        <p>{{ 'OPR.MSG.LOADING' | translate }}</p>
      </div>
    }

    <!-- Error -->
    @if (error()) {
      <div class="msg-error" role="alert">
        <mat-icon>error_outline</mat-icon>
        <p>{{ error() }}</p>
        <button mat-flat-button (click)="loadMessages()">{{ 'OPR.MSG.RETRY' | translate }}</button>
      </div>
    }

    <!-- Chat area -->
    @if (!loading() && !error()) {
      <div class="chat-container">
        <!-- Template panel -->
        @if (showTemplatePanel()) {
          <div class="template-panel" role="complementary" [attr.aria-label]="'OPR.MSG.TEMPLATES' | translate">
            <div class="template-panel-header">
              <h2>{{ 'OPR.MSG.TEMPLATES' | translate }}</h2>
              <button mat-icon-button (click)="showTemplatePanel.set(false)" [attr.aria-label]="'OPR.MSG.CLOSE' | translate">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            @if (templatesLoading()) {
              <mat-spinner diameter="24" class="tpl-spinner"></mat-spinner>
            } @else {
              <div class="template-list">
                @for (tpl of templates(); track tpl.id) {
                  <button class="template-item" [class.template-selected]="selectedTemplate()?.id === tpl.id"
                          (click)="selectTemplate(tpl)">
                    <span class="template-name">{{ tpl.name }}</span>
                    <span class="template-category">{{ tpl.category }}</span>
                  </button>
                }
                @if (templates().length === 0) {
                  <p class="empty-text">{{ 'OPR.MSG.NO_TEMPLATES' | translate }}</p>
                }
              </div>

              <!-- Template preview + variables -->
              @if (selectedTemplate()) {
                <div class="template-preview">
                  <h3>{{ selectedTemplate()!.name }}</h3>
                  <p class="template-body">{{ selectedTemplate()!.body }}</p>

                  @if (templateVariables().length > 0) {
                    <div class="template-vars">
                      @for (v of templateVariables(); track v) {
                        <mat-form-field appearance="outline" class="var-field">
                          <mat-label>{{ v }}</mat-label>
                          <input matInput [value]="templateValues()[v] || ''"
                                 (input)="onVariableChange(v, $event)" />
                        </mat-form-field>
                      }
                    </div>
                  }
                  <button mat-flat-button color="primary" (click)="useTemplate()" class="use-tpl-btn" data-cy="use-template-btn">
                    {{ 'OPR.MSG.USE_TEMPLATE' | translate }}
                  </button>
                </div>
              }
            }
          </div>
        }

        <!-- Messages thread -->
        <div class="msg-thread" #messageThread role="log" [attr.aria-label]="'OPR.MSG.THREAD' | translate">
          @if (messages().length === 0) {
            <div class="msg-empty">
              <mat-icon>chat_bubble_outline</mat-icon>
              <p>{{ 'OPR.MSG.NO_MESSAGES' | translate }}</p>
            </div>
          }
          @for (msg of messages(); track msg.id) {
            <div class="msg-bubble" data-cy="message-bubble" [class.msg-operator]="isOperatorMessage(msg)"
                 [class.msg-driver]="!isOperatorMessage(msg)">
              <div class="msg-meta">
                <span class="msg-sender">{{ msg.sender?.full_name || (isOperatorMessage(msg) ? 'Operator' : 'Driver') }}</span>
                <span class="msg-time">{{ msg.created_at | date:'short' }}</span>
              </div>
              <div class="msg-content">{{ msg.content }}</div>
            </div>
          }
        </div>

        <!-- Composer -->
        <div class="msg-composer">
          <button mat-icon-button (click)="toggleTemplatePanel()"
                  [matTooltip]="'OPR.MSG.TEMPLATES' | translate"
                  [attr.aria-label]="'OPR.MSG.TEMPLATES' | translate"
                  class="tpl-toggle-btn" data-cy="templates-btn">
            <mat-icon>description</mat-icon>
          </button>
          <mat-form-field appearance="outline" class="composer-field">
            <textarea matInput [(ngModel)]="messageText" (keydown)="onKeydown($event)"
                      [placeholder]="'OPR.MSG.PLACEHOLDER' | translate"
                      data-cy="message-composer"
                      rows="2" cdkTextareaAutosize></textarea>
          </mat-form-field>
          <button mat-fab color="primary" (click)="sendMessage()"
                  [disabled]="sending() || !messageText.trim()"
                  [attr.aria-label]="'OPR.MSG.SEND' | translate"
                  class="send-btn" data-cy="send-btn">
            @if (sending()) {
              <mat-spinner diameter="24"></mat-spinner>
            } @else {
              <mat-icon>send</mat-icon>
            }
          </button>
        </div>
        <span class="char-count">{{ messageText.length }} / 2000</span>
      </div>
    }
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; max-width: 900px; margin: 0 auto; padding: 16px; }

    .msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .msg-title { font-size: 1.25rem; font-weight: 600; margin: 0; }

    .msg-loading, .msg-error {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 64px 16px; gap: 16px; text-align: center;
    }
    .msg-error mat-icon { font-size: 48px; width: 48px; height: 48px; color: #E53935; }

    .chat-container { display: flex; flex: 1; gap: 12px; min-height: 0; flex-direction: row; }

    /* Template panel */
    .template-panel {
      width: 280px; flex-shrink: 0; border: 1px solid #e0e0e0; border-radius: 8px;
      display: flex; flex-direction: column; overflow-y: auto; background: #fafafa;
    }
    .template-panel-header {
      display: flex; align-items: center; justify-content: space-between; padding: 8px 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    .template-panel-header h2 { font-size: 0.95rem; font-weight: 600; margin: 0; }
    .tpl-spinner { margin: 16px auto; }
    .template-list { flex: 1; overflow-y: auto; }
    .template-item {
      display: flex; flex-direction: column; width: 100%; padding: 10px 12px;
      border: none; background: transparent; cursor: pointer; text-align: left;
      border-bottom: 1px solid #eee; transition: background 0.15s;
    }
    .template-item:hover { background: #e3f2fd; }
    .template-selected { background: #bbdefb !important; }
    .template-name { font-weight: 500; font-size: 0.9rem; }
    .template-category { font-size: 0.75rem; color: #888; }
    .template-preview { padding: 12px; border-top: 1px solid #e0e0e0; }
    .template-preview h3 { font-size: 0.9rem; margin: 0 0 6px; }
    .template-body { font-size: 0.85rem; color: #555; white-space: pre-wrap; margin: 0 0 8px; }
    .template-vars { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
    .var-field { width: 100%; font-size: 0.85rem; }
    .use-tpl-btn { min-height: 36px; width: 100%; }
    .empty-text { color: #999; font-style: italic; padding: 16px 12px; margin: 0; }

    /* Thread */
    .msg-thread {
      flex: 1; display: flex; flex-direction: column; gap: 8px;
      overflow-y: auto; padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px;
      background: #fff; min-height: 200px;
    }
    .msg-empty {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: #999; gap: 8px;
    }
    .msg-empty mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.5; }
    .msg-bubble { max-width: 75%; padding: 10px 14px; border-radius: 12px; }
    .msg-operator { align-self: flex-end; background: #e3f2fd; border-bottom-right-radius: 2px; }
    .msg-driver { align-self: flex-start; background: #f5f5f5; border-bottom-left-radius: 2px; }
    .msg-meta { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
    .msg-sender { font-size: 0.75rem; font-weight: 600; color: #555; }
    .msg-time { font-size: 0.7rem; color: #999; }
    .msg-content { font-size: 0.9rem; white-space: pre-wrap; word-break: break-word; }

    /* Composer */
    .msg-composer { display: flex; align-items: flex-end; gap: 8px; margin-top: 8px; }
    .composer-field { flex: 1; }
    .tpl-toggle-btn { flex-shrink: 0; }
    .send-btn { flex-shrink: 0; min-width: 56px; min-height: 56px; }
    .char-count { font-size: 0.7rem; color: #999; text-align: right; margin-top: 2px; }

    @media (max-width: 768px) {
      .chat-container { flex-direction: column; }
      .template-panel { width: 100%; max-height: 50vh; }
      .msg-bubble { max-width: 90%; }
    }
  `],
})
export class OperatorMessagingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private caseService = inject(CaseService);
  private templateService = inject(TemplateService);
  private snackBar = inject(MatSnackBar);

  private messageThread = viewChild<ElementRef>('messageThread');

  messages = signal<ChatMessage[]>([]);
  loading = signal(true);
  error = signal('');
  sending = signal(false);
  messageText = '';

  templates = signal<Template[]>([]);
  templatesLoading = signal(false);
  showTemplatePanel = signal(false);
  selectedTemplate = signal<Template | null>(null);
  templateVariables = computed(() => {
    const tpl = this.selectedTemplate();
    if (!tpl) return [];
    return tpl.variables ?? this.extractVariables(tpl.body);
  });
  templateValues = signal<Record<string, string>>({});

  caseNumber = signal('');
  private caseId = '';
  private currentUserId = '';
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.caseId = this.route.snapshot.paramMap.get('id') || '';
    // Read user ID from stored token
    try {
      const token = localStorage.getItem('token') || '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.currentUserId = payload.userId || payload.id || payload.sub || '';
    } catch { /* no token */ }

    this.loadMessages();

    // Poll for new messages every 10 seconds
    this.pollInterval = setInterval(() => {
      if (!this.loading() && !this.error()) this.refreshMessages();
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadMessages(): void {
    if (!this.caseId) {
      this.error.set('No case ID provided');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    // First get conversation (ensures it exists), then load messages
    this.caseService.getCaseConversation(this.caseId).pipe(
      catchError(() => of(null)),
    ).subscribe(() => {
      this.caseService.getCaseMessages(this.caseId).pipe(
        catchError(err => {
          this.error.set(err?.error?.error?.message || 'Failed to load messages');
          return of(null);
        }),
      ).subscribe(result => {
        if (result) {
          this.messages.set(result.messages || []);
        }
        this.loading.set(false);
        this.scrollToBottom();
      });
    });

    // Load case number for the header
    this.caseService.getOperatorCaseDetail(this.caseId).pipe(
      catchError(() => of(null)),
    ).subscribe(result => {
      if (result?.case) {
        this.caseNumber.set(result.case.case_number || '');
        // Pre-fill template values from case data
        this.templateValues.update(v => ({
          ...v,
          case_number: result.case.case_number || '',
          ...(result.case.court_date ? { court_date: result.case.court_date } : {}),
          ...(result.case.courthouse ? { courthouse: result.case.courthouse } : {}),
          ...(result.case.attorney?.full_name ? { attorney_name: result.case.attorney.full_name } : {}),
        }));
      }
    });
  }

  refreshMessages(): void {
    this.caseService.getCaseMessages(this.caseId).pipe(
      catchError(() => of(null)),
    ).subscribe(result => {
      if (result?.messages) {
        const current = this.messages();
        if (result.messages.length !== current.length) {
          this.messages.set(result.messages);
          this.scrollToBottom();
        }
      }
    });
  }

  sendMessage(): void {
    const text = this.messageText.trim();
    if (!text || this.sending()) return;

    this.sending.set(true);

    this.caseService.sendCaseMessage(this.caseId, text).pipe(
      finalize(() => this.sending.set(false)),
      catchError(err => {
        this.snackBar.open(
          err?.error?.error?.message || 'Failed to send message',
          'OK',
          { duration: 4000, panelClass: 'snack-error' },
        );
        return of(null);
      }),
    ).subscribe(result => {
      if (result) {
        this.messageText = '';
        // Append optimistically
        const msg = result.data ?? result;
        this.messages.update(list => [...list, msg]);
        this.scrollToBottom();
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.sendMessage();
    }
  }

  goBack(): void {
    this.router.navigate(['/operator/cases', this.caseId]);
  }

  isOperatorMessage(msg: ChatMessage): boolean {
    if (msg.sender?.role === 'operator' || msg.sender?.role === 'admin') return true;
    return msg.sender_id === this.currentUserId;
  }

  // ── Template methods ────────────────────────────────────────────

  toggleTemplatePanel(): void {
    const show = !this.showTemplatePanel();
    this.showTemplatePanel.set(show);
    if (show && this.templates().length === 0) {
      this.loadTemplates();
    }
  }

  private loadTemplates(): void {
    this.templatesLoading.set(true);
    this.templateService.getTemplates('operator').pipe(
      catchError(() => of({ data: [] })),
      finalize(() => this.templatesLoading.set(false)),
    ).subscribe(result => {
      const list = result?.data?.templates ?? result?.data ?? result?.templates ?? [];
      this.templates.set(Array.isArray(list) ? list : []);
    });
  }

  selectTemplate(tpl: Template): void {
    this.selectedTemplate.set(tpl);
    // Merge known values but don't overwrite user edits
    const vars = tpl.variables ?? this.extractVariables(tpl.body);
    const current = this.templateValues();
    const merged: Record<string, string> = {};
    for (const v of vars) {
      merged[v] = current[v] || '';
    }
    this.templateValues.set(merged);
  }

  onVariableChange(variable: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.templateValues.update(v => ({ ...v, [variable]: val }));
  }

  useTemplate(): void {
    const tpl = this.selectedTemplate();
    if (!tpl) return;

    let text = tpl.body;
    const vals = this.templateValues();
    for (const [key, value] of Object.entries(vals)) {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
    }
    this.messageText = text;
    this.showTemplatePanel.set(false);
  }

  private extractVariables(body: string): string[] {
    const matches = body.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messageThread()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
}
