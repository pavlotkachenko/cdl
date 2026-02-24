// ============================================
// Messages Component
// Location: frontend/src/app/features/driver/messages/messages.component.ts
// ============================================

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

// Angular Material
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import {
  Conversation,
  Message,
  QuickQuestion,
  MessagingService
} from './messaging.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  conversations: Conversation[] = [];
  messages: Message[] = [];
  quickQuestions: QuickQuestion[] = [];
  selectedConversation: Conversation | null = null;

  searchForm: FormGroup;
  messageForm: FormGroup;

  loading = true;
  loadingMessages = false;
  sendingMessage = false;
  showQuickQuestions = false;
  otherUserTyping = false;
  isOnline = false;
  selectedFile: File | null = null;

  currentUserId = 'driver-1'; // TODO: Get from auth service

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private messagingService: MessagingService,
    private route: ActivatedRoute
  ) {
    this.searchForm = this.fb.group({ query: [''] });
    this.messageForm = this.fb.group({ message: [''] });
  }

  ngOnInit(): void {
    this.loadConversations();
    this.loadQuickQuestions();
    this.setupRealTimeListeners();

    // Check for conversationId route param
    const conversationId = this.route.snapshot.paramMap.get('conversationId');
    if (conversationId) {
      this.loadConversations().add(() => {
        const conv = this.conversations.find(c => c.id === conversationId);
        if (conv) {
          this.selectConversation(conv);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.selectedConversation) {
      this.messagingService.leaveConversation(this.selectedConversation.id);
    }
  }

  loadConversations() {
    this.loading = true;
    const sub = this.messagingService.getConversations().subscribe({
      next: (response) => {
        this.conversations = response.conversations;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
    return sub;
  }

  loadMessages(conversationId: string): void {
    this.loadingMessages = true;
    const sub = this.messagingService.getMessages(conversationId).subscribe({
      next: (response) => {
        this.messages = response.messages;
        this.loadingMessages = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.loadingMessages = false;
      }
    });
    this.subscriptions.add(sub);
  }

  loadQuickQuestions(): void {
    const sub = this.messagingService.getQuickQuestions().subscribe({
      next: (response) => {
        this.quickQuestions = response.quickQuestions;
      },
      error: (error) => {
        console.error('Error loading quick questions:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  selectConversation(conversation: Conversation): void {
    // Leave previous conversation
    if (this.selectedConversation) {
      this.messagingService.leaveConversation(this.selectedConversation.id);
    }

    this.selectedConversation = conversation;
    this.isOnline = conversation.isOnline;
    this.loadMessages(conversation.id);
    this.messagingService.joinConversation(conversation.id);
    this.messagingService.markAsRead(conversation.id).subscribe();
    conversation.unreadCount = 0;
  }

  sendMessage(): void {
    const content = this.messageForm.get('message')?.value?.trim();

    if (!content && !this.selectedFile) return;
    if (!this.selectedConversation) return;

    this.sendingMessage = true;
    const conversationId = this.selectedConversation.id;

    const obs = this.selectedFile
      ? this.messagingService.sendMessageWithFile(conversationId, this.selectedFile, content)
      : this.messagingService.sendMessage(conversationId, content);

    obs.subscribe({
      next: (response) => {
        this.messageForm.reset();
        this.selectedFile = null;
        this.sendingMessage = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.sendingMessage = false;
      }
    });
  }

  sendQuickQuestion(question: string): void {
    this.messageForm.patchValue({ message: question });
    this.showQuickQuestions = false;
    this.sendMessage();
  }

  generateVideoLink(platform: 'zoom' | 'meet'): void {
    if (!this.selectedConversation) return;

    this.messagingService.generateVideoLink(this.selectedConversation.id, platform).subscribe({
      next: (response) => {
        // Send the video link as a message
        const linkMessage = `Join the ${platform === 'zoom' ? 'Zoom' : 'Google Meet'} call: ${response.videoLink.link}`;
        this.messageForm.patchValue({ message: linkMessage });
        this.sendMessage();
      },
      error: (error) => {
        console.error('Error generating video link:', error);
      }
    });
  }

  private setupRealTimeListeners(): void {
    // New messages
    const msgSub = this.messagingService.newMessage$.subscribe((message: Message) => {
      if (this.selectedConversation && message.conversationId === this.selectedConversation.id) {
        this.messages.push(message);
        this.scrollToBottom();
      }

      // Update conversation list
      const conv = this.conversations.find(c => c.id === message.conversationId);
      if (conv) {
        conv.lastMessage = message.content || '';
        conv.lastMessageAt = message.createdAt;
        if (!this.selectedConversation || message.conversationId !== this.selectedConversation.id) {
          conv.unreadCount++;
        }
      }
    });
    this.subscriptions.add(msgSub);

    // Typing indicator
    const typingSub = this.messagingService.typing$.subscribe((event) => {
      if (this.selectedConversation && event.conversationId === this.selectedConversation.id) {
        this.otherUserTyping = true;
        setTimeout(() => { this.otherUserTyping = false; }, 3000);
      }
    });
    this.subscriptions.add(typingSub);
  }

  // ============================================
  // UI Helper Methods
  // ============================================

  isMyMessage(message: Message): boolean {
    return message.senderId === this.currentUserId;
  }

  getOtherUser() {
    if (!this.selectedConversation) return null;
    return this.selectedConversation.driverId === this.currentUserId
      ? this.selectedConversation.attorney
      : this.selectedConversation.driver;
  }

  toggleQuickQuestions(): void {
    this.showQuickQuestions = !this.showQuickQuestions;
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  formatTime(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType === 'application/pdf') return 'picture_as_pdf';
    if (fileType.startsWith('video/')) return 'videocam';
    return 'insert_drive_file';
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer) {
        const el = this.messageContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }
}
