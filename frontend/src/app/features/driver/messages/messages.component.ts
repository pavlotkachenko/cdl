import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';

import { MessagingService, Conversation, Message } from '../../../core/services/messaging.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-messages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatBadgeModule,
  ],
  template: `
    <div class="messages-page">

      <!-- Conversation list -->
      @if (!selectedConv()) {
        <header class="page-header">
          <mat-icon aria-hidden="true">chat</mat-icon>
          <h1>Messages</h1>
        </header>

        @if (loadingConvs()) {
          <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
        } @else if (convError()) {
          <div class="error-state" role="alert">
            <p>{{ convError() }}</p>
            <button mat-raised-button color="primary" (click)="loadConversations()">Retry</button>
          </div>
        } @else if (conversations().length === 0) {
          <div class="empty-state">
            <mat-icon aria-hidden="true">chat_bubble_outline</mat-icon>
            <p>No conversations yet.</p>
          </div>
        } @else {
          <div class="conv-list" role="list">
            @for (c of conversations(); track c.id) {
              <mat-card class="conv-item" role="listitem" (click)="selectConversation(c)"
                        [class.unread]="c.unreadCount > 0">
                <mat-card-content>
                  <div class="conv-info">
                    <mat-icon aria-hidden="true">person</mat-icon>
                    <div>
                      <p class="conv-name">{{ otherPartyName(c) }}</p>
                      @if (c.lastMessage) {
                        <p class="conv-preview">{{ c.lastMessage }}</p>
                      }
                    </div>
                  </div>
                  @if (c.unreadCount > 0) {
                    <span class="unread-badge" [attr.aria-label]="c.unreadCount + ' unread messages'">
                      {{ c.unreadCount }}
                    </span>
                  }
                </mat-card-content>
              </mat-card>
            }
          </div>
        }
      }

      <!-- Message thread -->
      @if (selectedConv()) {
        <header class="thread-header">
          <button mat-icon-button (click)="closeThread()" aria-label="Back to conversations">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h2>{{ otherPartyName(selectedConv()!) }}</h2>
        </header>

        @if (loadingMsgs()) {
          <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
        } @else {
          <div class="message-thread" role="log" aria-live="polite">
            @if (messages().length === 0) {
              <p class="empty-thread">No messages yet. Say hello!</p>
            }
            @for (m of messages(); track m.id) {
              <div [class]="'bubble ' + (isMyMessage(m) ? 'mine' : 'theirs')"
                   [attr.aria-label]="(isMyMessage(m) ? 'You' : otherPartyName(selectedConv()!)) + ': ' + m.content">
                {{ m.content }}
              </div>
            }
            @if (typingIndicator()) {
              <div class="bubble theirs typing" aria-live="polite">Typing…</div>
            }
          </div>

          <form [formGroup]="msgForm" (ngSubmit)="sendMessage()" class="send-row">
            <mat-form-field appearance="outline" class="msg-field">
              <mat-label>Message</mat-label>
              <input matInput formControlName="content" placeholder="Type a message…"
                     autocomplete="off" (keydown.enter)="$event.preventDefault(); sendMessage()">
            </mat-form-field>
            <button mat-fab color="primary" type="submit" [disabled]="sending()"
                    aria-label="Send message">
              @if (sending()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <mat-icon>send</mat-icon>
              }
            </button>
          </form>
        }
      }
    </div>
  `,
  styles: [`
    .messages-page { max-width: 640px; margin: 0 auto; padding: 24px 16px; display: flex; flex-direction: column; height: calc(100vh - 80px); }
    .page-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .page-header h1 { margin: 0; font-size: 1.4rem; }
    .thread-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .thread-header h2 { margin: 0; font-size: 1.1rem; }
    .loading { display: flex; justify-content: center; padding: 32px; }
    .error-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px; color: #c62828; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px; color: #999; text-align: center; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .conv-list { display: flex; flex-direction: column; gap: 8px; }
    .conv-item { cursor: pointer; transition: box-shadow 0.2s; }
    .conv-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
    .conv-item.unread { border-left: 3px solid #1976d2; }
    .conv-item mat-card-content { display: flex; justify-content: space-between; align-items: center; }
    .conv-info { display: flex; align-items: center; gap: 12px; }
    .conv-name { margin: 0; font-weight: 500; font-size: 0.95rem; }
    .conv-preview { margin: 2px 0 0; font-size: 0.8rem; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
    .unread-badge { background: #1976d2; color: #fff; border-radius: 12px; padding: 2px 7px; font-size: 0.72rem; font-weight: 700; }

    .message-thread { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 8px 0 12px; min-height: 200px; max-height: calc(100vh - 260px); }
    .empty-thread { color: #999; text-align: center; font-size: 0.85rem; padding: 24px 0; }
    .bubble { padding: 10px 14px; border-radius: 18px; max-width: 75%; font-size: 0.9rem; line-height: 1.4; word-break: break-word; }
    .bubble.mine { background: #1976d2; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
    .bubble.theirs { background: #f0f0f0; color: #222; align-self: flex-start; border-bottom-left-radius: 4px; }
    .bubble.typing { font-style: italic; color: #888; }

    .send-row { display: flex; align-items: flex-start; gap: 8px; padding-top: 8px; }
    .msg-field { flex: 1; }
  `],
})
export class MessagesComponent implements OnInit {
  private messagingService = inject(MessagingService);
  private authService      = inject(AuthService);
  private route            = inject(ActivatedRoute);
  private fb               = inject(FormBuilder);

  conversations   = signal<Conversation[]>([]);
  messages        = signal<Message[]>([]);
  selectedConv    = signal<Conversation | null>(null);
  loadingConvs    = signal(true);
  loadingMsgs     = signal(false);
  sending         = signal(false);
  convError       = signal('');
  typingIndicator = signal(false);

  currentUserId = computed(() => this.authService.currentUserValue?.id ?? '');

  msgForm = this.fb.group({ content: ['', Validators.required] });

  ngOnInit(): void {
    this.loadConversations();
    // Subscribe to real-time events
    this.messagingService.newMessage$.subscribe(msg => {
      if (this.selectedConv()?.id === msg.conversationId) {
        this.messages.update(list => [...list, msg]);
      }
      // Update unread count on conversation list
      this.conversations.update(list =>
        list.map(c => c.id === msg.conversationId && c.id !== this.selectedConv()?.id
          ? { ...c, unreadCount: c.unreadCount + 1, lastMessage: msg.content }
          : c),
      );
    });
    this.messagingService.typing$.subscribe(e => {
      if (this.selectedConv()?.id === e.conversationId) {
        this.typingIndicator.set(true);
        setTimeout(() => this.typingIndicator.set(false), 3000);
      }
    });
  }

  loadConversations(): void {
    this.loadingConvs.set(true);
    this.convError.set('');
    this.messagingService.getConversations().subscribe({
      next: (list) => {
        this.conversations.set(list);
        this.loadingConvs.set(false);
        // Auto-select if route param present
        const id = this.route.snapshot.paramMap.get('conversationId');
        if (id) {
          const found = list.find(c => c.id === id);
          if (found) this.selectConversation(found);
        }
      },
      error: () => { this.convError.set('Failed to load conversations.'); this.loadingConvs.set(false); },
    });
  }

  selectConversation(conv: Conversation): void {
    if (this.selectedConv()) this.messagingService.leaveConversation(this.selectedConv()!.id);
    this.selectedConv.set(conv);
    this.loadingMsgs.set(true);
    this.messagingService.joinConversation(conv.id);
    this.messagingService.markAsRead(conv.id).subscribe();
    this.conversations.update(list =>
      list.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c),
    );
    this.messagingService.getMessages(conv.id).subscribe({
      next: (msgs) => { this.messages.set(msgs); this.loadingMsgs.set(false); },
      error: ()     => { this.loadingMsgs.set(false); },
    });
  }

  closeThread(): void {
    if (this.selectedConv()) this.messagingService.leaveConversation(this.selectedConv()!.id);
    this.selectedConv.set(null);
    this.messages.set([]);
  }

  sendMessage(): void {
    const content = this.msgForm.value.content?.trim();
    if (!content || !this.selectedConv()) return;
    this.sending.set(true);
    this.messagingService.sendMessage(this.selectedConv()!.id, content).subscribe({
      next: (msg) => {
        this.messages.update(list => [...list, msg]);
        this.msgForm.reset();
        this.sending.set(false);
      },
      error: () => this.sending.set(false),
    });
  }

  otherPartyName(conv: Conversation): string {
    const uid = this.currentUserId();
    return conv.driverId === uid ? (conv.attorney?.name ?? 'Attorney') : (conv.driver?.name ?? 'Driver');
  }

  isMyMessage(msg: Message): boolean {
    return msg.senderId === this.currentUserId();
  }
}
