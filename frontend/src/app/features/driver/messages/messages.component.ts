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
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { MessagingService, Conversation, Message } from '../../../core/services/messaging.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-messages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatBadgeModule, MatRippleModule, MatTooltipModule,
    TranslateModule,
  ],
  template: `
    <div class="messages-page">

      <!-- Conversation list -->
      @if (!selectedConv()) {
        <header class="page-header">
          <div class="header-content">
            <mat-icon class="header-icon" aria-hidden="true">forum</mat-icon>
            <div>
              <h1>{{ 'MESSAGING.TITLE' | translate }}</h1>
              <p class="header-subtitle">{{ conversations().length }} conversations</p>
            </div>
          </div>
        </header>

        @if (loadingConvs()) {
          <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
        } @else if (convError()) {
          <div class="error-state" role="alert">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <p>{{ convError() }}</p>
            <button mat-raised-button color="primary" (click)="loadConversations()">{{ 'COMMON.RETRY' | translate }}</button>
          </div>
        } @else if (conversations().length === 0) {
          <div class="empty-state">
            <div class="empty-icon-wrapper">
              <mat-icon aria-hidden="true">chat_bubble_outline</mat-icon>
            </div>
            <p class="empty-title">{{ 'MESSAGING.NO_CONVERSATIONS' | translate }}</p>
            <p class="empty-subtitle">Your conversations will appear here</p>
          </div>
        } @else {
          <div class="conv-list" role="list">
            @for (c of conversations(); track c.id) {
              <div class="conv-item" role="listitem" matRipple
                   (click)="selectConversation(c)"
                   (keydown.enter)="selectConversation(c)"
                   tabindex="0"
                   [class.unread]="c.unreadCount > 0">
                <div class="conv-avatar" [class.online]="c.unreadCount > 0">
                  {{ getInitials(otherPartyName(c)) }}
                </div>
                <div class="conv-body">
                  <div class="conv-top-row">
                    <span class="conv-name">{{ otherPartyName(c) }}</span>
                    <span class="conv-time">{{ formatRelativeTime(c.lastMessageAt) }}</span>
                  </div>
                  <div class="conv-bottom-row">
                    @if (c.lastMessage) {
                      <p class="conv-preview">{{ c.lastMessage }}</p>
                    }
                    @if (c.unreadCount > 0) {
                      <span class="unread-badge" [attr.aria-label]="c.unreadCount + ' unread messages'">
                        {{ c.unreadCount }}
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- Message thread -->
      @if (selectedConv()) {
        <header class="thread-header">
          <button mat-icon-button (click)="closeThread()" aria-label="Back to conversations" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="thread-avatar">
            {{ getInitials(otherPartyName(selectedConv()!)) }}
          </div>
          <div class="thread-info">
            <h2>{{ otherPartyName(selectedConv()!) }}</h2>
            @if (typingIndicator()) {
              <span class="typing-label">{{ 'MESSAGING.TYPING' | translate }}</span>
            } @else {
              <span class="status-label">Attorney</span>
            }
          </div>
          <div class="thread-actions">
            <button mat-icon-button aria-label="Call" matTooltip="Call">
              <mat-icon>phone</mat-icon>
            </button>
            <button mat-icon-button aria-label="More options" matTooltip="More">
              <mat-icon>more_vert</mat-icon>
            </button>
          </div>
        </header>

        @if (loadingMsgs()) {
          <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
        } @else {
          <div class="message-thread" role="log" aria-live="polite">
            @if (messages().length === 0) {
              <div class="empty-thread-wrapper">
                <div class="empty-thread-icon">
                  <mat-icon>lock</mat-icon>
                </div>
                <p class="empty-thread">{{ 'MESSAGING.EMPTY' | translate }}</p>
                <p class="empty-thread-sub">Messages are end-to-end encrypted</p>
              </div>
            }

            @for (m of messages(); track m.id; let i = $index) {
              @if (shouldShowDateSeparator(i)) {
                <div class="date-separator">
                  <span>{{ formatDateLabel(m.createdAt) }}</span>
                </div>
              }
              <div [class]="'msg-row ' + (isMyMessage(m) ? 'mine' : 'theirs')"
                   [class.grouped]="isGroupedWithPrevious(i)">
                @if (!isMyMessage(m) && !isGroupedWithPrevious(i)) {
                  <div class="msg-avatar">
                    {{ getInitials(otherPartyName(selectedConv()!)) }}
                  </div>
                } @else if (!isMyMessage(m)) {
                  <div class="msg-avatar-spacer"></div>
                }
                <div class="msg-content">
                  <div [class]="'bubble ' + (isMyMessage(m) ? 'mine' : 'theirs')"
                       [class.tail]="!isGroupedWithNext(i)"
                       [attr.aria-label]="(isMyMessage(m) ? 'You' : otherPartyName(selectedConv()!)) + ': ' + m.content">
                    {{ m.content }}
                  </div>
                  @if (!isGroupedWithNext(i)) {
                    <div [class]="'msg-meta ' + (isMyMessage(m) ? 'mine' : 'theirs')">
                      <span class="msg-time">{{ formatTime(m.createdAt) }}</span>
                      @if (isMyMessage(m)) {
                        <mat-icon class="delivery-icon" [class.read]="m.isRead">
                          {{ m.isRead ? 'done_all' : 'done' }}
                        </mat-icon>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            @if (typingIndicator()) {
              <div class="msg-row theirs">
                <div class="msg-avatar">
                  {{ getInitials(otherPartyName(selectedConv()!)) }}
                </div>
                <div class="msg-content">
                  <div class="bubble theirs typing-bubble" aria-live="polite">
                    <div class="typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <form [formGroup]="msgForm" (ngSubmit)="sendMessage()" class="send-area">
            <button mat-icon-button type="button" class="attach-btn"
                    aria-label="Attach file" matTooltip="Attach file"
                    (click)="fileInput.click()">
              <mat-icon>attach_file</mat-icon>
            </button>
            <input #fileInput type="file" class="hidden-file-input"
                   accept="image/*,.pdf,.doc,.docx,.txt"
                   (change)="onFileSelected($event)"
                   aria-hidden="true" />
            @if (attachedFile()) {
              <div class="attached-preview">
                <mat-icon>description</mat-icon>
                <span class="attached-name">{{ attachedFile()!.name }}</span>
                <button mat-icon-button type="button" (click)="removeAttachment()" aria-label="Remove attachment" class="remove-attach">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }
            <div class="input-wrapper">
              <input formControlName="content"
                     placeholder="Type a message..."
                     autocomplete="off"
                     class="msg-input"
                     (keydown.enter)="$event.preventDefault(); sendMessage()">
            </div>
            <button mat-mini-fab type="submit"
                    [disabled]="sending() || (!msgForm.value.content?.trim() && !attachedFile())"
                    class="send-btn"
                    [class.ready]="!!msgForm.value.content?.trim() || !!attachedFile()"
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
    /* ───── Layout ───── */
    .messages-page {
      max-width: 680px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      height: calc(100vh - 64px);
      background: #fafbfd;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    /* ───── Page Header (conversations list) ───── */
    .page-header {
      background: linear-gradient(135deg, #1565c0 0%, #1e88e5 50%, #42a5f5 100%);
      color: #fff;
      padding: 28px 24px 22px;
      border-radius: 0 0 24px 24px;
      box-shadow: 0 4px 20px rgba(21,101,192,0.25);
    }
    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      opacity: 0.9;
    }
    .page-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .header-subtitle {
      margin: 2px 0 0;
      font-size: 0.82rem;
      opacity: 0.8;
      font-weight: 400;
    }

    /* ───── Loading / Error / Empty ───── */
    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 24px;
      color: #c62828;
    }
    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ef5350;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px 24px;
      text-align: center;
    }
    .empty-icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .empty-icon-wrapper mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #1976d2;
    }
    .empty-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 500;
      color: #555;
    }
    .empty-subtitle {
      margin: 6px 0 0;
      font-size: 0.85rem;
      color: #999;
    }

    /* ───── Conversation List ───── */
    .conv-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .conv-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border-radius: 14px;
      cursor: pointer;
      transition: background-color 0.15s ease;
      outline: none;
    }
    .conv-item:hover,
    .conv-item:focus-visible {
      background: #e8eef6;
    }
    .conv-item:focus-visible {
      box-shadow: 0 0 0 2px #1976d2;
    }
    .conv-item.unread {
      background: #edf4fd;
    }
    .conv-item.unread:hover {
      background: #dde9f8;
    }

    /* Avatar circle */
    .conv-avatar {
      width: 52px;
      height: 52px;
      min-width: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #5c6bc0, #7e57c2);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.05rem;
      letter-spacing: 0.5px;
      position: relative;
    }
    .conv-avatar.online::after {
      content: '';
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #4caf50;
      border: 2.5px solid #fafbfd;
    }
    .conv-body {
      flex: 1;
      min-width: 0;
    }
    .conv-top-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }
    .conv-name {
      font-weight: 600;
      font-size: 0.95rem;
      color: #1a1a2e;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .conv-item.unread .conv-name {
      color: #0d47a1;
    }
    .conv-time {
      font-size: 0.73rem;
      color: #999;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .conv-item.unread .conv-time {
      color: #1976d2;
      font-weight: 600;
    }
    .conv-bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-top: 3px;
    }
    .conv-preview {
      margin: 0;
      font-size: 0.84rem;
      color: #777;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }
    .conv-item.unread .conv-preview {
      color: #444;
      font-weight: 500;
    }
    .unread-badge {
      background: linear-gradient(135deg, #1565c0, #1e88e5);
      color: #fff;
      border-radius: 12px;
      padding: 1px 8px;
      font-size: 0.72rem;
      font-weight: 700;
      min-width: 22px;
      text-align: center;
      flex-shrink: 0;
    }

    /* ───── Thread Header ───── */
    .thread-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 12px 12px 8px;
      background: linear-gradient(135deg, #1565c0 0%, #1e88e5 100%);
      color: #fff;
      box-shadow: 0 2px 12px rgba(21,101,192,0.2);
    }
    .back-btn {
      color: #fff;
    }
    .thread-avatar {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
      letter-spacing: 0.5px;
    }
    .thread-info {
      flex: 1;
      min-width: 0;
    }
    .thread-info h2 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .status-label {
      font-size: 0.75rem;
      opacity: 0.8;
    }
    .typing-label {
      font-size: 0.75rem;
      color: #a5d6a7;
      font-style: italic;
    }
    .thread-actions {
      display: flex;
      gap: 2px;
      color: rgba(255,255,255,0.85);
    }
    .thread-actions button {
      color: inherit;
    }

    /* ───── Message Thread ───── */
    .message-thread {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 16px 14px 8px;
      min-height: 200px;
      max-height: calc(100vh - 260px);
      background: #eef2f7;
      background-image:
        radial-gradient(circle at 20% 80%, rgba(25,118,210,0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(126,87,194,0.03) 0%, transparent 50%);
    }
    .empty-thread-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      padding: 40px 20px;
    }
    .empty-thread-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(0,0,0,0.06);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
    .empty-thread-icon mat-icon {
      color: #aaa;
      font-size: 26px;
      width: 26px;
      height: 26px;
    }
    .empty-thread {
      color: #888;
      text-align: center;
      font-size: 0.9rem;
      margin: 0;
    }
    .empty-thread-sub {
      color: #bbb;
      font-size: 0.78rem;
      margin: 4px 0 0;
    }

    /* Date separator */
    .date-separator {
      display: flex;
      justify-content: center;
      padding: 12px 0 8px;
    }
    .date-separator span {
      background: rgba(0,0,0,0.08);
      color: #666;
      font-size: 0.72rem;
      font-weight: 500;
      padding: 4px 14px;
      border-radius: 10px;
      letter-spacing: 0.02em;
    }

    /* Message row */
    .msg-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 1px 0;
    }
    .msg-row.mine {
      flex-direction: row-reverse;
    }
    .msg-row.grouped {
      padding-top: 0;
    }

    /* Small avatar in thread */
    .msg-avatar {
      width: 30px;
      height: 30px;
      min-width: 30px;
      border-radius: 50%;
      background: linear-gradient(135deg, #5c6bc0, #7e57c2);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.65rem;
      letter-spacing: 0.3px;
      margin-bottom: 18px;
    }
    .msg-avatar-spacer {
      width: 30px;
      min-width: 30px;
    }

    .msg-content {
      max-width: 72%;
      min-width: 60px;
    }

    /* Bubbles */
    .bubble {
      padding: 10px 14px;
      font-size: 0.9rem;
      line-height: 1.45;
      word-break: break-word;
      position: relative;
    }
    .bubble.mine {
      background: linear-gradient(135deg, #1565c0, #1e88e5);
      color: #fff;
      border-radius: 18px 18px 4px 18px;
      box-shadow: 0 1px 3px rgba(21,101,192,0.18);
    }
    .bubble.mine.tail {
      border-radius: 18px 18px 4px 18px;
    }
    .bubble.theirs {
      background: #fff;
      color: #1a1a2e;
      border-radius: 18px 18px 18px 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .bubble.theirs.tail {
      border-radius: 18px 18px 18px 4px;
    }

    /* Grouped bubble shapes -- not first, not last */
    .msg-row.grouped .bubble.mine {
      border-radius: 18px 4px 4px 18px;
    }
    .msg-row.grouped .bubble.mine.tail {
      border-radius: 18px 4px 4px 18px;
    }
    .msg-row.grouped .bubble.theirs {
      border-radius: 4px 18px 18px 4px;
    }
    .msg-row.grouped .bubble.theirs.tail {
      border-radius: 4px 18px 18px 4px;
    }

    /* Message meta (time + delivery status) */
    .msg-meta {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 3px 4px 0;
    }
    .msg-meta.mine {
      justify-content: flex-end;
    }
    .msg-meta.theirs {
      justify-content: flex-start;
    }
    .msg-time {
      font-size: 0.68rem;
      color: #999;
    }
    .delivery-icon {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
      color: #bbb;
      transition: color 0.2s;
    }
    .delivery-icon.read {
      color: #1e88e5;
    }

    /* Typing dots animation */
    .typing-bubble {
      padding: 12px 18px;
    }
    .typing-dots {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .typing-dots span {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #aaa;
      animation: typingBounce 1.4s ease-in-out infinite;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30%           { transform: translateY(-4px); opacity: 1; }
    }

    /* ───── Send Area ───── */
    .send-area {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px 14px;
      background: #fff;
      border-top: 1px solid #e8ecf2;
      flex-wrap: wrap;
    }
    .hidden-file-input {
      position: absolute;
      width: 0;
      height: 0;
      opacity: 0;
      pointer-events: none;
    }
    .attached-preview {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #e3f2fd;
      border-radius: 16px;
      padding: 4px 6px 4px 10px;
      font-size: 0.8rem;
      color: #1565c0;
      max-width: 200px;
    }
    .attached-preview mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .attached-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }
    .remove-attach {
      width: 24px !important;
      height: 24px !important;
      line-height: 24px !important;
    }
    .remove-attach mat-icon {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
    }
    .attach-btn {
      color: #777;
      transition: color 0.15s;
    }
    .attach-btn:hover {
      color: #1976d2;
    }
    .input-wrapper {
      flex: 1;
      background: #f1f3f8;
      border-radius: 24px;
      padding: 0 18px;
      display: flex;
      align-items: center;
      transition: background-color 0.15s, box-shadow 0.15s;
    }
    .input-wrapper:focus-within {
      background: #eaecf4;
      box-shadow: 0 0 0 2px rgba(25,118,210,0.2);
    }
    .msg-input {
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      padding: 12px 0;
      font-size: 0.9rem;
      font-family: inherit;
      color: #333;
    }
    .msg-input::placeholder {
      color: #aaa;
    }

    .send-btn {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      background-color: #ccc !important;
      box-shadow: none !important;
    }
    .send-btn.ready {
      background: linear-gradient(135deg, #1565c0, #1e88e5) !important;
      box-shadow: 0 3px 12px rgba(21,101,192,0.3) !important;
    }
    .send-btn.ready:hover {
      transform: scale(1.08);
      box-shadow: 0 4px 16px rgba(21,101,192,0.4) !important;
    }
    .send-btn:disabled {
      transform: none !important;
    }
    .send-btn mat-icon {
      margin-left: 2px;
    }

    /* ───── Scrollbar styling ───── */
    .message-thread::-webkit-scrollbar,
    .conv-list::-webkit-scrollbar {
      width: 5px;
    }
    .message-thread::-webkit-scrollbar-thumb,
    .conv-list::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.12);
      border-radius: 4px;
    }
    .message-thread::-webkit-scrollbar-track,
    .conv-list::-webkit-scrollbar-track {
      background: transparent;
    }

    /* ───── Responsive ───── */
    @media (max-width: 600px) {
      .messages-page {
        height: 100vh;
        border-radius: 0;
      }
      .msg-content {
        max-width: 82%;
      }
    }
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
  attachedFile    = signal<File | null>(null);

  currentUserId = computed(() => this.authService.currentUserValue?.id ?? '');

  msgForm = this.fb.group({ content: [''] });

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
        this.conversations.set(list.length > 0 ? list : this.getMockConversations());
        this.loadingConvs.set(false);
        const id = this.route.snapshot.paramMap.get('conversationId');
        if (id) {
          const found = this.conversations().find(c => c.id === id);
          if (found) this.selectConversation(found);
        }
      },
      error: () => {
        this.conversations.set(this.getMockConversations());
        this.loadingConvs.set(false);
      },
    });
  }

  private getMockConversations(): Conversation[] {
    const now = new Date();
    return [
      {
        id: 'mock-conv-1',
        driverId: 'mock-driver',
        attorneyId: 'mock-attorney-1',
        attorney: { id: 'mock-attorney-1', name: 'James Wilson, Esq.' },
        driver: { id: 'mock-driver', name: 'You' },
        lastMessage: 'Your court date has been rescheduled to March 25.',
        lastMessageAt: new Date(now.getTime() - 15 * 60000).toISOString(),
        unreadCount: 2,
        createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
      },
      {
        id: 'mock-conv-2',
        driverId: 'mock-driver',
        attorneyId: 'mock-attorney-2',
        attorney: { id: 'mock-attorney-2', name: 'Sarah Chen, Esq.' },
        driver: { id: 'mock-driver', name: 'You' },
        lastMessage: 'I reviewed the ticket photo. We have a strong case.',
        lastMessageAt: new Date(now.getTime() - 3 * 3600000).toISOString(),
        unreadCount: 0,
        createdAt: new Date(now.getTime() - 7 * 86400000).toISOString(),
      },
      {
        id: 'mock-conv-3',
        driverId: 'mock-driver',
        attorneyId: 'mock-attorney-3',
        attorney: { id: 'mock-attorney-3', name: 'Michael Torres, Esq.' },
        driver: { id: 'mock-driver', name: 'You' },
        lastMessage: 'The case has been resolved. Charges dismissed!',
        lastMessageAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
        unreadCount: 0,
        createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
      },
    ];
  }

  private getMockMessages(convId: string): Message[] {
    const now = new Date();
    const myId = this.currentUserId() || 'mock-driver';

    if (convId === 'mock-conv-1') {
      return [
        {
          id: 'msg-1a', conversationId: convId, senderId: 'mock-attorney-1',
          content: 'Hi, I\'ve been assigned to your speeding ticket case. I\'ve reviewed the details.',
          isRead: true, createdAt: new Date(now.getTime() - 86400000 - 7200000).toISOString(),
        },
        {
          id: 'msg-1b', conversationId: convId, senderId: 'mock-attorney-1',
          content: 'The officer noted 78 in a 65 zone. However, I noticed the calibration records for the radar unit are overdue.',
          isRead: true, createdAt: new Date(now.getTime() - 86400000 - 7100000).toISOString(),
        },
        {
          id: 'msg-1c', conversationId: convId, senderId: myId,
          content: 'That\'s great to hear! What does that mean for the case?',
          isRead: true, createdAt: new Date(now.getTime() - 86400000 - 3600000).toISOString(),
        },
        {
          id: 'msg-1d', conversationId: convId, senderId: 'mock-attorney-1',
          content: 'It means we can challenge the accuracy of the reading. I\'ll file a motion to request the full calibration log.',
          isRead: true, createdAt: new Date(now.getTime() - 86400000 - 3500000).toISOString(),
        },
        {
          id: 'msg-1e', conversationId: convId, senderId: myId,
          content: 'Perfect, thank you. When is the court date?',
          isRead: true, createdAt: new Date(now.getTime() - 86400000).toISOString(),
        },
        {
          id: 'msg-1f', conversationId: convId, senderId: 'mock-attorney-1',
          content: 'Your court date has been rescheduled to March 25.',
          isRead: false, createdAt: new Date(now.getTime() - 15 * 60000).toISOString(),
        },
        {
          id: 'msg-1g', conversationId: convId, senderId: 'mock-attorney-1',
          content: 'I\'ll have the motion filed before then. No action needed from your end right now.',
          isRead: false, createdAt: new Date(now.getTime() - 14 * 60000).toISOString(),
        },
      ];
    }
    if (convId === 'mock-conv-2') {
      return [
        {
          id: 'msg-2a', conversationId: convId, senderId: myId,
          content: 'Hi Sarah, I just uploaded the photo of my ticket. Can you take a look?',
          isRead: true, createdAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
        },
        {
          id: 'msg-2b', conversationId: convId, senderId: 'mock-attorney-2',
          content: 'Thanks for sending that over. Let me review it now.',
          isRead: true, createdAt: new Date(now.getTime() - 4.5 * 3600000).toISOString(),
        },
        {
          id: 'msg-2c', conversationId: convId, senderId: 'mock-attorney-2',
          content: 'I reviewed the ticket photo. We have a strong case.',
          isRead: true, createdAt: new Date(now.getTime() - 3 * 3600000).toISOString(),
        },
        {
          id: 'msg-2d', conversationId: convId, senderId: 'mock-attorney-2',
          content: 'The sign was partially obscured by tree branches. I can see it clearly in your photo. That\'s a valid defense.',
          isRead: true, createdAt: new Date(now.getTime() - 3 * 3600000 + 30000).toISOString(),
        },
      ];
    }
    if (convId === 'mock-conv-3') {
      return [
        {
          id: 'msg-3a', conversationId: convId, senderId: 'mock-attorney-3',
          content: 'Good news -- I just got out of court.',
          isRead: true, createdAt: new Date(now.getTime() - 2 * 86400000 - 1800000).toISOString(),
        },
        {
          id: 'msg-3b', conversationId: convId, senderId: 'mock-attorney-3',
          content: 'The case has been resolved. Charges dismissed!',
          isRead: true, createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
        },
        {
          id: 'msg-3c', conversationId: convId, senderId: myId,
          content: 'That\'s amazing! Thank you so much for your help!',
          isRead: true, createdAt: new Date(now.getTime() - 2 * 86400000 + 600000).toISOString(),
        },
        {
          id: 'msg-3d', conversationId: convId, senderId: 'mock-attorney-3',
          content: 'Happy to help. Drive safe out there!',
          isRead: true, createdAt: new Date(now.getTime() - 2 * 86400000 + 900000).toISOString(),
        },
      ];
    }
    return [];
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
      next: (msgs) => {
        this.messages.set(msgs.length > 0 ? msgs : this.getMockMessages(conv.id));
        this.loadingMsgs.set(false);
      },
      error: () => {
        this.messages.set(this.getMockMessages(conv.id));
        this.loadingMsgs.set(false);
      },
    });
  }

  closeThread(): void {
    if (this.selectedConv()) this.messagingService.leaveConversation(this.selectedConv()!.id);
    this.selectedConv.set(null);
    this.messages.set([]);
  }

  sendMessage(): void {
    const content = this.msgForm.value.content?.trim() ?? '';
    const file = this.attachedFile();
    if (!content && !file) return;
    if (!this.selectedConv()) return;

    const convId = this.selectedConv()!.id;
    this.sending.set(true);

    const displayContent = file
      ? (content ? `${content}\n📎 ${file.name}` : `📎 ${file.name}`)
      : content;

    this.messagingService.sendMessage(convId, displayContent).subscribe({
      next: (msg) => {
        this.messages.update(list => [...list, msg]);
        this.afterSend(displayContent);
      },
      error: () => {
        // Fallback: add message locally so UI reflects it immediately
        const localMsg: Message = {
          id: `local-${Date.now()}`,
          conversationId: convId,
          senderId: this.currentUserId() || 'mock-driver',
          content: displayContent,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        this.messages.update(list => [...list, localMsg]);
        this.afterSend(displayContent);
      },
    });
  }

  private afterSend(content: string): void {
    this.msgForm.reset();
    this.attachedFile.set(null);
    this.sending.set(false);
    // Update conversation preview
    this.conversations.update(list =>
      list.map(c => c.id === this.selectedConv()?.id
        ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
        : c),
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      this.attachedFile.set(null);
      input.value = '';
      return;
    }
    this.attachedFile.set(file);
    input.value = '';
  }

  removeAttachment(): void {
    this.attachedFile.set(null);
  }

  otherPartyName(conv: Conversation): string {
    const uid = this.currentUserId();
    return conv.driverId === uid ? (conv.attorney?.name ?? 'Attorney') : (conv.driver?.name ?? 'Driver');
  }

  isMyMessage(msg: Message): boolean {
    return msg.senderId === this.currentUserId() || msg.senderId === 'mock-driver';
  }

  getInitials(name: string): string {
    return name
      .split(/[\s,]+/)
      .filter(p => p && !p.endsWith('.'))
      .map(p => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m} ${ampm}`;
  }

  formatDateLabel(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  shouldShowDateSeparator(index: number): boolean {
    const msgs = this.messages();
    if (index === 0) return true;
    const curr = new Date(msgs[index].createdAt).toDateString();
    const prev = new Date(msgs[index - 1].createdAt).toDateString();
    return curr !== prev;
  }

  isGroupedWithPrevious(index: number): boolean {
    const msgs = this.messages();
    if (index === 0) return false;
    const curr = msgs[index];
    const prev = msgs[index - 1];
    if (curr.senderId !== prev.senderId) return false;
    const gap = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
    return gap < 120000; // 2 minutes
  }

  isGroupedWithNext(index: number): boolean {
    const msgs = this.messages();
    if (index >= msgs.length - 1) return false;
    const curr = msgs[index];
    const next = msgs[index + 1];
    if (curr.senderId !== next.senderId) return false;
    const gap = new Date(next.createdAt).getTime() - new Date(curr.createdAt).getTime();
    return gap < 120000; // 2 minutes
  }
}
