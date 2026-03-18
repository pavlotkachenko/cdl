import {
  Component, OnInit, OnDestroy, inject, signal, computed,
  ChangeDetectionStrategy, ElementRef, viewChild,
} from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import {
  MessagingService, Conversation, Message, ConversationType,
} from './messaging.service';
import { AuthService } from '../../../core/services/auth.service';

type FilterTab = 'all' | 'attorneys' | 'support' | 'unread';

@Component({
  selector: 'app-messages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, TranslateModule],
  styles: `
    /* ====================== Layout ====================== */
    .messages-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      height: calc(100vh - 60px);
      background: #f8fafc;
    }

    /* ====================== Left Panel ====================== */
    .conv-panel {
      background: #fff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .conv-header {
      padding: 20px 16px 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .conv-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .conv-header-row h2 { margin: 0; font-size: 20px; font-weight: 700; color: #1e293b; }
    .unread-badge {
      background: #0d9488; color: #fff; border-radius: 12px;
      padding: 2px 8px; font-size: 12px; font-weight: 600; margin-left: 8px;
    }
    .new-conv-btn {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      background: #f1f5f9; color: #64748b; cursor: pointer; font-size: 18px;
      display: flex; align-items: center; justify-content: center;
    }
    .new-conv-btn:hover { background: #e2e8f0; }

    /* Search */
    .search-wrap {
      position: relative; margin-bottom: 12px;
    }
    .search-wrap input {
      width: 100%; padding: 8px 12px 8px 36px; border: 1px solid #e2e8f0;
      border-radius: 8px; font-size: 13px; background: #f8fafc;
      box-sizing: border-box;
    }
    .search-wrap input:focus { outline: none; border-color: #0d9488; background: #fff; }
    .search-icon {
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      color: #94a3b8; font-size: 16px; pointer-events: none;
    }

    /* Filter tabs */
    .filter-tabs {
      display: flex; gap: 4px; padding: 0;
      border-bottom: 1px solid #f1f5f9; margin: 0 0 4px;
    }
    .filter-tab {
      flex: 1; padding: 8px 0; border: none; background: none;
      font-size: 12px; font-weight: 500; color: #64748b; cursor: pointer;
      border-bottom: 2px solid transparent; transition: all 0.15s;
    }
    .filter-tab:hover { color: #0d9488; }
    .filter-tab.active { color: #0d9488; border-bottom-color: #0d9488; font-weight: 600; }

    /* Conversation list */
    .conv-list {
      flex: 1; overflow-y: auto; padding: 4px 0;
    }
    .conv-group-label {
      padding: 8px 16px 4px; font-size: 11px; font-weight: 600;
      color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .conv-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; cursor: pointer; border-left: 3px solid transparent;
      transition: background 0.15s;
    }
    .conv-item:hover { background: #f8fafc; }
    .conv-item:focus-visible { outline: 2px solid #0d9488; outline-offset: -2px; }
    .conv-item.active { background: #f0fdfa; border-left-color: #0d9488; }
    .conv-item.closed { opacity: 0.65; }

    /* Avatar */
    .avatar {
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 14px; position: relative;
    }
    .avatar.attorney { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .avatar.operator { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    .avatar.support { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .avatar.system { background: linear-gradient(135deg, #6b7280, #374151); }
    .avatar.driver { background: linear-gradient(135deg, #10b981, #059669); }
    .online-dot {
      position: absolute; bottom: 0; right: 0; width: 10px; height: 10px;
      border-radius: 50%; border: 2px solid #fff; background: #22c55e;
    }

    /* Conv item text */
    .conv-info { flex: 1; min-width: 0; }
    .conv-top { display: flex; justify-content: space-between; align-items: center; }
    .conv-name {
      font-size: 14px; font-weight: 500; color: #1e293b;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .conv-name.unread { font-weight: 700; }
    .conv-time { font-size: 11px; color: #94a3b8; flex-shrink: 0; margin-left: 8px; }
    .conv-preview {
      font-size: 12px; color: #64748b; margin-top: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .conv-preview.unread { color: #0d9488; font-weight: 500; }
    .conv-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
    .case-tag {
      font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 500;
    }
    .tag-attorney { background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe; }
    .tag-operator { background: #f5f3ff; color: #8b5cf6; }
    .tag-support { background: #fffbeb; color: #f59e0b; }
    .tag-closed { background: #edf2f6; color: #98a8b4; }
    .unread-count {
      background: #0d9488; color: #fff; border-radius: 10px;
      padding: 1px 7px; font-size: 11px; font-weight: 600;
    }

    /* ====================== Right Panel ====================== */
    .chat-panel {
      display: flex; flex-direction: column; overflow: hidden;
    }

    /* Chat header */
    .chat-header {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 20px; background: #fff;
      border-bottom: 1px solid #e2e8f0;
    }
    .chat-user-info { flex: 1; }
    .chat-user-name { font-size: 16px; font-weight: 600; color: #1e293b; }
    .chat-user-role { font-size: 12px; color: #64748b; }
    .chat-actions { display: flex; gap: 8px; }
    .action-btn {
      width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0;
      background: #fff; cursor: pointer; display: flex; align-items: center;
      justify-content: center; color: #64748b; font-size: 16px;
    }
    .action-btn:hover { background: #f8fafc; color: #1e293b; }

    /* Case context strip */
    .case-strip {
      display: flex; align-items: center; gap: 12px;
      padding: 8px 20px; background: #f0fdf4;
      border-bottom: 1px solid #bbf7d0; font-size: 12px;
    }
    .case-strip-icon { color: #16a34a; font-size: 14px; }
    .case-strip-text { color: #166534; flex: 1; }
    .case-strip-link {
      color: #16a34a; font-weight: 600; cursor: pointer;
      text-decoration: none; border: none; background: none; font-size: 12px;
    }

    /* Messages area */
    .chat-messages {
      flex: 1; overflow-y: auto; padding: 20px;
      display: flex; flex-direction: column; gap: 4px;
    }

    /* Date separator */
    .date-sep {
      display: flex; align-items: center; gap: 12px;
      margin: 16px 0; color: #94a3b8; font-size: 12px;
    }
    .date-sep::before, .date-sep::after {
      content: ''; flex: 1; height: 1px; background: #e2e8f0;
    }

    /* System message */
    .system-msg {
      text-align: center; padding: 6px 16px; margin: 4px auto;
      background: #f1f5f9; border-radius: 8px; font-size: 12px;
      color: #64748b; max-width: 80%;
    }

    /* Message bubbles */
    .msg-row { display: flex; gap: 8px; margin-bottom: 2px; max-width: 75%; }
    .msg-row.mine { margin-left: auto; flex-direction: row-reverse; }
    .msg-row.theirs { margin-right: auto; }
    .msg-avatar {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 10px;
    }
    .msg-bubble {
      padding: 10px 14px; border-radius: 12px; font-size: 14px;
      line-height: 1.5; word-break: break-word;
    }
    .msg-row.theirs .msg-bubble {
      background: #fff; border: 1px solid #e2e8f0;
      border-top-left-radius: 4px;
    }
    .msg-row.mine .msg-bubble {
      background: linear-gradient(135deg, #0d9488, #0f766e);
      color: #fff; border-top-right-radius: 4px;
    }
    .msg-sender-name {
      font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 2px;
    }
    .msg-role-badge {
      font-size: 9px; padding: 1px 5px; border-radius: 3px;
      font-weight: 600; margin-left: 6px;
    }
    .msg-role-badge.attorney { background: #eff6ff; color: #3b82f6; }
    .msg-role-badge.operator { background: #f5f3ff; color: #8b5cf6; }
    .msg-footer {
      display: flex; align-items: center; gap: 6px;
      margin-top: 4px; font-size: 11px; color: #94a3b8;
    }
    .msg-row.mine .msg-footer { color: rgba(255,255,255,0.7); justify-content: flex-end; }

    /* Attachment */
    .attachment-block {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; background: #f8fafc; border-radius: 8px;
      border: 1px solid #e2e8f0; margin-top: 6px; font-size: 12px;
    }
    .attachment-block .file-icon { font-size: 18px; color: #3b82f6; }
    .attachment-info { flex: 1; }
    .attachment-name { font-weight: 500; color: #1e293b; }
    .attachment-size { color: #94a3b8; font-size: 11px; }

    /* Typing indicator */
    .typing-indicator {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; font-size: 12px; color: #64748b;
    }
    .typing-dots { display: flex; gap: 3px; }
    .typing-dots span {
      width: 6px; height: 6px; border-radius: 50%; background: #94a3b8;
      animation: bounce 1.4s infinite ease-in-out;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.16s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.32s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    /* Input area */
    .chat-input-area {
      padding: 12px 20px; background: #fff;
      border-top: 1px solid #e2e8f0;
    }
    .input-toolbar {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    }
    .toolbar-btn {
      width: 32px; height: 32px; border-radius: 6px; border: none;
      background: none; cursor: pointer; color: #94a3b8; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
    }
    .toolbar-btn:hover { background: #f1f5f9; color: #475569; }
    .encrypt-note {
      margin-left: auto; font-size: 11px; color: #94a3b8;
      display: flex; align-items: center; gap: 4px;
    }
    .input-row { display: flex; gap: 8px; align-items: flex-end; }
    .input-row textarea {
      flex: 1; resize: none; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 10px 14px; font-size: 14px; font-family: inherit;
      min-height: 20px; max-height: 120px; line-height: 1.4;
      box-sizing: border-box;
    }
    .input-row textarea:focus { outline: none; border-color: #0d9488; }
    .send-btn {
      width: 40px; height: 40px; border-radius: 50%; border: none;
      background: #0d9488; color: #fff; cursor: pointer; font-size: 18px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: opacity 0.15s;
    }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .send-btn:not(:disabled):hover { background: #0f766e; }

    /* Empty state */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 100%; color: #94a3b8;
      gap: 12px; font-size: 15px;
    }
    .empty-state-icon { font-size: 48px; opacity: 0.5; }

    /* Loading */
    .loading-state {
      display: flex; align-items: center; justify-content: center;
      height: 100%; color: #94a3b8;
    }
    .spinner {
      width: 32px; height: 32px; border: 3px solid #e2e8f0;
      border-top-color: #0d9488; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-state {
      padding: 24px; text-align: center; color: #ef4444;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .messages-layout { grid-template-columns: 1fr; }
      .conv-panel { display: flex; }
      .conv-panel.hidden { display: none; }
      .chat-panel.hidden { display: none; }
      .back-btn { display: flex; }
    }
    @media (min-width: 769px) {
      .back-btn { display: none; }
    }
  `,
  template: `
    <div class="messages-layout">
      <!-- Left Panel: Conversation List -->
      <div class="conv-panel" [class.hidden]="selectedConv() && isMobile()">
        <div class="conv-header">
          <div class="conv-header-row">
            <h2>
              Messages
              @if (totalUnread() > 0) {
                <span class="unread-badge">{{ totalUnread() }}</span>
              }
            </h2>
            <button class="new-conv-btn" aria-label="New conversation" type="button">+</button>
          </div>

          <div class="search-wrap">
            <span class="search-icon" aria-hidden="true">&#128269;</span>
            <input
              type="text"
              placeholder="Search conversations..."
              aria-label="Search conversations"
              [formControl]="searchControl"
            />
          </div>

          <div class="filter-tabs" role="tablist" aria-label="Conversation filters">
            @for (tab of filterTabs; track tab.key) {
              <button
                class="filter-tab"
                [class.active]="activeTab() === tab.key"
                role="tab"
                [attr.aria-selected]="activeTab() === tab.key"
                (click)="activeTab.set(tab.key)"
                type="button"
              >{{ tab.label }}</button>
            }
          </div>
        </div>

        <div class="conv-list" role="list" aria-label="Conversations">
          @if (loadingConvs()) {
            <div class="loading-state"><div class="spinner"></div></div>
          } @else if (convError()) {
            <div class="error-state" role="alert">{{ convError() }}</div>
          } @else {
            @if (activeCaseConvs().length > 0) {
              <div class="conv-group-label" role="heading" aria-level="3">Active Cases</div>
              @for (conv of activeCaseConvs(); track conv.id) {
                <div
                  class="conv-item"
                  [class.active]="selectedConv()?.id === conv.id"
                  role="listitem"
                  tabindex="0"
                  (click)="selectConversation(conv)"
                  (keydown.enter)="selectConversation(conv)"
                  (keydown.space)="selectConversation(conv); $event.preventDefault()"
                >
                  <div class="avatar" [class]="msgSvc.getAvatarClass(conv)">
                    {{ getInitials(conv) }}
                    <span class="online-dot" aria-hidden="true"></span>
                  </div>
                  <div class="conv-info">
                    <div class="conv-top">
                      <span class="conv-name" [class.unread]="conv.unread_count > 0">
                        {{ msgSvc.getOtherPartyName(conv) }}
                      </span>
                      <span class="conv-time">{{ formatTime(conv.last_message_at || conv.created_at) }}</span>
                    </div>
                    <div class="conv-preview" [class.unread]="conv.unread_count > 0">
                      {{ conv.last_message || 'No messages yet' }}
                    </div>
                    <div class="conv-bottom">
                      @if (msgSvc.getCaseTagLabel(conv)) {
                        <span class="case-tag" [class]="msgSvc.getCaseTagClass(conv)">
                          {{ msgSvc.getCaseTagLabel(conv) }}
                        </span>
                      }
                      @if (conv.unread_count > 0) {
                        <span class="unread-count">{{ conv.unread_count }}</span>
                      }
                    </div>
                  </div>
                </div>
              }
            }

            @if (supportConvs().length > 0) {
              <div class="conv-group-label" role="heading" aria-level="3">Support & Operations</div>
              @for (conv of supportConvs(); track conv.id) {
                <div
                  class="conv-item"
                  [class.active]="selectedConv()?.id === conv.id"
                  role="listitem"
                  tabindex="0"
                  (click)="selectConversation(conv)"
                  (keydown.enter)="selectConversation(conv)"
                  (keydown.space)="selectConversation(conv); $event.preventDefault()"
                >
                  <div class="avatar" [class]="msgSvc.getAvatarClass(conv)">
                    {{ getInitials(conv) }}
                  </div>
                  <div class="conv-info">
                    <div class="conv-top">
                      <span class="conv-name" [class.unread]="conv.unread_count > 0">
                        {{ msgSvc.getOtherPartyName(conv) }}
                      </span>
                      <span class="conv-time">{{ formatTime(conv.last_message_at || conv.created_at) }}</span>
                    </div>
                    <div class="conv-preview" [class.unread]="conv.unread_count > 0">
                      {{ conv.last_message || 'No messages yet' }}
                    </div>
                    <div class="conv-bottom">
                      <span class="case-tag" [class]="msgSvc.getCaseTagClass(conv)">
                        {{ msgSvc.getCaseTagLabel(conv) }}
                      </span>
                      @if (conv.unread_count > 0) {
                        <span class="unread-count">{{ conv.unread_count }}</span>
                      }
                    </div>
                  </div>
                </div>
              }
            }

            @if (closedConvs().length > 0) {
              <div class="conv-group-label" role="heading" aria-level="3">Closed Cases</div>
              @for (conv of closedConvs(); track conv.id) {
                <div
                  class="conv-item closed"
                  [class.active]="selectedConv()?.id === conv.id"
                  role="listitem"
                  tabindex="0"
                  (click)="selectConversation(conv)"
                  (keydown.enter)="selectConversation(conv)"
                  (keydown.space)="selectConversation(conv); $event.preventDefault()"
                >
                  <div class="avatar system">{{ getInitials(conv) }}</div>
                  <div class="conv-info">
                    <div class="conv-top">
                      <span class="conv-name">{{ msgSvc.getOtherPartyName(conv) }}</span>
                      <span class="conv-time">{{ formatTime(conv.last_message_at || conv.created_at) }}</span>
                    </div>
                    <div class="conv-preview">{{ conv.last_message || 'Conversation closed' }}</div>
                    <div class="conv-bottom">
                      <span class="case-tag tag-closed">Closed</span>
                    </div>
                  </div>
                </div>
              }
            }

            @if (activeCaseConvs().length === 0 && supportConvs().length === 0 && closedConvs().length === 0) {
              <div class="empty-state" style="padding: 32px">
                <span>No conversations match your filters</span>
              </div>
            }
          }
        </div>
      </div>

      <!-- Right Panel: Chat or Empty State -->
      @if (selectedConv(); as conv) {
        <div class="chat-panel" [class.hidden]="!selectedConv() && isMobile()">
          <!-- Chat header -->
          <div class="chat-header">
            <button class="action-btn back-btn" aria-label="Back to conversations" (click)="selectedConv.set(null)" type="button">
              &#8592;
            </button>
            <div class="avatar" [class]="msgSvc.getAvatarClass(conv)">
              {{ getInitials(conv) }}
            </div>
            <div class="chat-user-info">
              <div class="chat-user-name">{{ msgSvc.getOtherPartyName(conv) }}</div>
              <div class="chat-user-role">
                @switch (conv.conversation_type) {
                  @case ('attorney_case') { Defense Attorney }
                  @case ('operator') { Case Coordinator }
                  @case ('support') { Support Agent }
                }
                @if (!conv.closed_at) {
                  &middot; <span style="color: #22c55e">Online</span>
                }
              </div>
            </div>
            <div class="chat-actions">
              @if (conv.conversation_type === 'attorney_case') {
                <button class="action-btn" aria-label="View case" type="button">&#128196;</button>
              }
              <button class="action-btn" aria-label="More options" type="button">&#8942;</button>
            </div>
          </div>

          <!-- Case context strip -->
          @if (conv.conversation_type === 'attorney_case' && conv.case) {
            <div class="case-strip">
              <span class="case-strip-icon">&#9679;</span>
              <span class="case-strip-text">
                {{ conv.case.case_number }}
                @if (conv.case.violation_type) {
                  &middot; {{ conv.case.violation_type }}
                }
                &middot; {{ conv.case.status }}
              </span>
              <button class="case-strip-link" type="button">View Case</button>
            </div>
          }

          <!-- Messages area -->
          <div class="chat-messages" role="log" aria-live="polite" aria-label="Messages" #messagesContainer>
            @if (loadingMsgs()) {
              <div class="loading-state"><div class="spinner"></div></div>
            } @else {
              @for (msg of messages(); track msg.id; let i = $index) {
                <!-- Date separator -->
                @if (shouldShowDateSeparator(i)) {
                  <div class="date-sep">{{ formatDateLabel(msg.created_at) }}</div>
                }

                <!-- Message bubble -->
                @if (msg.message_type === 'system') {
                  <div class="system-msg">{{ msg.content }}</div>
                } @else {
                  <div class="msg-row" [class.mine]="msg.sender_id === currentUserId()" [class.theirs]="msg.sender_id !== currentUserId()">
                    @if (msg.sender_id !== currentUserId() && !isGroupedWithPrevious(i)) {
                      <div class="msg-avatar" [class]="msgSvc.getSenderAvatarClass(msg)">
                        {{ getSenderInitials(msg) }}
                      </div>
                    } @else if (msg.sender_id !== currentUserId()) {
                      <div style="width: 28px; flex-shrink: 0"></div>
                    }
                    <div>
                      @if (msg.sender_id !== currentUserId() && !isGroupedWithPrevious(i)) {
                        <div class="msg-sender-name">
                          {{ msg.sender?.name || msg.sender?.full_name || 'Unknown' }}
                          @if (msgSvc.getSenderRole(msg)) {
                            <span class="msg-role-badge" [class]="msgSvc.getSenderAvatarClass(msg)">
                              {{ msgSvc.getSenderRole(msg) }}
                            </span>
                          }
                        </div>
                      }
                      <div class="msg-bubble">{{ msg.content }}</div>
                      @if (msg.attachments && msg.attachments.length > 0) {
                        @for (att of msg.attachments; track att.id) {
                          <div class="attachment-block">
                            <span class="file-icon">&#128196;</span>
                            <div class="attachment-info">
                              <div class="attachment-name">{{ att.file_name }}</div>
                              <div class="attachment-size">{{ formatFileSize(att.file_size) }}</div>
                            </div>
                          </div>
                        }
                      }
                      @if (!isGroupedWithNext(i)) {
                        <div class="msg-footer">
                          <span>{{ msg.created_at | date:'shortTime' }}</span>
                          @if (msg.sender_id === currentUserId()) {
                            <span>{{ msg.is_read ? '&#10003;&#10003;' : '&#10003;' }}</span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              }
            }
          </div>

          <!-- Typing indicator -->
          @if (typingIndicator()) {
            <div class="typing-indicator">
              <div class="typing-dots">
                <span></span><span></span><span></span>
              </div>
              <span>{{ msgSvc.getOtherPartyName(conv) }} is typing...</span>
            </div>
          }

          <!-- Input area -->
          @if (!conv.closed_at) {
            <div class="chat-input-area">
              <div class="input-toolbar">
                <button class="toolbar-btn" aria-label="Attach file" type="button">&#128206;</button>
                <button class="toolbar-btn" aria-label="Upload document" type="button">&#128196;</button>
                <span class="encrypt-note">&#128274; End-to-end encrypted</span>
              </div>
              <div class="input-row">
                <textarea
                  placeholder="Type a message..."
                  aria-label="Message input"
                  [formControl]="messageControl"
                  (keydown.enter)="onEnterKey($event)"
                  rows="1"
                ></textarea>
                <button
                  class="send-btn"
                  aria-label="Send message"
                  [disabled]="!messageControl.value?.trim() || sending()"
                  (click)="sendMessage()"
                  type="button"
                >&#9654;</button>
              </div>
            </div>
          } @else {
            <div class="chat-input-area" style="text-align: center; color: #94a3b8; padding: 16px;">
              This conversation is closed
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <span class="empty-state-icon">&#128172;</span>
          <span>Select a conversation to start messaging</span>
        </div>
      }
    </div>
  `,
})
export class MessagesComponent implements OnInit, OnDestroy {
  // Services
  protected msgSvc = inject(MessagingService);
  private authService = inject(AuthService);
  private messagesContainer = viewChild<ElementRef<HTMLElement>>('messagesContainer');

  // State signals
  conversations = signal<Conversation[]>([]);
  messages = signal<Message[]>([]);
  selectedConv = signal<Conversation | null>(null);
  loadingConvs = signal(true);
  loadingMsgs = signal(false);
  sending = signal(false);
  convError = signal('');
  typingIndicator = signal(false);
  activeTab = signal<FilterTab>('all');
  searchQuery = signal('');

  // Form controls
  searchControl = new FormControl('');
  messageControl = new FormControl('');

  // Computed: total unread across all conversations
  totalUnread = computed(() =>
    this.conversations().reduce((sum, c) => sum + (c.unread_count ?? 0), 0)
  );

  // Computed: filtered conversations based on tab + search
  filteredConversations = computed(() => {
    let convs = this.conversations();
    const tab = this.activeTab();
    const query = this.searchQuery().toLowerCase();

    // Tab filter
    if (tab === 'attorneys') {
      convs = convs.filter(c => c.conversation_type === 'attorney_case');
    } else if (tab === 'support') {
      convs = convs.filter(c => c.conversation_type === 'operator' || c.conversation_type === 'support');
    } else if (tab === 'unread') {
      convs = convs.filter(c => (c.unread_count ?? 0) > 0);
    }

    // Search filter
    if (query) {
      convs = convs.filter(c => {
        const name = this.msgSvc.getOtherPartyName(c);
        return name.toLowerCase().includes(query);
      });
    }

    return convs;
  });

  // Grouped conversations
  activeCaseConvs = computed(() =>
    this.filteredConversations().filter(c => c.conversation_type === 'attorney_case' && !c.closed_at)
  );
  supportConvs = computed(() =>
    this.filteredConversations().filter(c => c.conversation_type === 'operator' || c.conversation_type === 'support')
  );
  closedConvs = computed(() =>
    this.filteredConversations().filter(c => !!c.closed_at)
  );

  // Mobile detection
  isMobile = signal(false);

  // Current user
  currentUserId = computed(() => this.authService.getCurrentUser()?.id ?? '');

  // Tab definitions
  filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'attorneys', label: 'Attorneys' },
    { key: 'support', label: 'Support' },
    { key: 'unread', label: 'Unread' },
  ];

  // Search debounce
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;
  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.loadConversations();
    this.checkMobile();

    // Debounced search
    this.subs.push(
      this.searchControl.valueChanges.subscribe(val => {
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.searchQuery.set(val ?? '');
        }, 300);
      })
    );

    // Real-time: new message
    this.subs.push(
      this.msgSvc.newMessage$.subscribe(msg => {
        if (this.selectedConv()?.id === msg.conversation_id) {
          this.messages.update(list => [...list, msg]);
          this.scrollToBottom();
        }
        // Update conversation preview in list
        this.conversations.update(convs =>
          convs.map(c => c.id === msg.conversation_id
            ? { ...c, last_message: msg.content ?? '', last_message_at: msg.created_at }
            : c
          )
        );
      })
    );

    // Real-time: typing
    this.subs.push(
      this.msgSvc.typing$.subscribe(evt => {
        if (evt.conversation_id === this.selectedConv()?.id) {
          this.typingIndicator.set(true);
          setTimeout(() => this.typingIndicator.set(false), 3000);
        }
      })
    );

    // Listen for resize
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.checkMobile());
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    const conv = this.selectedConv();
    if (conv) this.msgSvc.leaveConversation(conv.id);
  }

  // ---- Data loading ----

  loadConversations(): void {
    this.loadingConvs.set(true);
    this.convError.set('');

    this.msgSvc.getConversations().subscribe({
      next: (res) => {
        this.conversations.set(res.data ?? []);
        this.loadingConvs.set(false);
      },
      error: () => {
        this.convError.set('Failed to load conversations. Please try again.');
        this.loadingConvs.set(false);
      }
    });
  }

  selectConversation(conv: Conversation): void {
    const prev = this.selectedConv();
    if (prev) this.msgSvc.leaveConversation(prev.id);

    this.selectedConv.set(conv);
    this.loadMessages(conv.id);
    this.msgSvc.joinConversation(conv.id);
  }

  loadMessages(conversationId: string): void {
    this.loadingMsgs.set(true);
    this.msgSvc.getMessages(conversationId).subscribe({
      next: (res) => {
        this.messages.set(res.data ?? []);
        this.loadingMsgs.set(false);
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: () => {
        this.messages.set([]);
        this.loadingMsgs.set(false);
      }
    });
  }

  // ---- Sending ----

  sendMessage(): void {
    const content = this.messageControl.value?.trim();
    if (!content) return;

    const conv = this.selectedConv();
    if (!conv) return;

    this.sending.set(true);
    const recipientId = conv.driver_id === this.currentUserId()
      ? (conv.attorney_id ?? conv.operator_id ?? undefined)
      : conv.driver_id;

    this.msgSvc.sendMessage(conv.id, content, recipientId).subscribe({
      next: (res) => {
        this.messages.update(list => [...list, res.data]);
        this.messageControl.setValue('');
        this.sending.set(false);
        this.scrollToBottom();
        // Update conversation preview
        this.conversations.update(convs =>
          convs.map(c => c.id === conv.id
            ? { ...c, last_message: content, last_message_at: new Date().toISOString() }
            : c
          )
        );
      },
      error: () => {
        // Add local message as fallback
        const localMsg: Message = {
          id: `local-${Date.now()}`,
          conversation_id: conv.id,
          sender_id: this.currentUserId(),
          content,
          message_type: 'text',
          created_at: new Date().toISOString(),
          is_read: false,
        };
        this.messages.update(list => [...list, localMsg]);
        this.messageControl.setValue('');
        this.sending.set(false);
        this.scrollToBottom();
      }
    });
  }

  onEnterKey(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      this.sendMessage();
    }
  }

  // ---- UI helpers ----

  getInitials(conv: Conversation): string {
    const name = this.msgSvc.getOtherPartyName(conv);
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  getSenderInitials(msg: Message): string {
    const name = msg.sender?.name ?? msg.sender?.full_name ?? '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr);
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
    return new Date(msgs[index].created_at).toDateString() !== new Date(msgs[index - 1].created_at).toDateString();
  }

  isGroupedWithPrevious(index: number): boolean {
    const msgs = this.messages();
    if (index === 0) return false;
    const curr = msgs[index];
    const prev = msgs[index - 1];
    if (curr.sender_id !== prev.sender_id) return false;
    return new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime() < 120000;
  }

  isGroupedWithNext(index: number): boolean {
    const msgs = this.messages();
    if (index >= msgs.length - 1) return false;
    const curr = msgs[index];
    const next = msgs[index + 1];
    if (curr.sender_id !== next.sender_id) return false;
    return new Date(next.created_at).getTime() - new Date(curr.created_at).getTime() < 120000;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  private scrollToBottom(): void {
    const container = this.messagesContainer()?.nativeElement;
    if (container) {
      setTimeout(() => { container.scrollTop = container.scrollHeight; }, 0);
    }
  }

  private checkMobile(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 769);
    }
  }
}
