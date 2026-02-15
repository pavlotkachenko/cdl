// ============================================
// Messages Component - STANDALONE VERSION (No AuthService dependency)
// Location: frontend/src/app/features/driver/messages/messages.component.ts
// ============================================

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';

// Services
//import { MockMessagingService } from '../services/messaging.service.mock';
import { MockMessagingService } from '../services/messaging.service.mock';
import { AuthService } from '../../../core/services/auth.service';

import { 
  MessagingService,
  Conversation, 
  Message, 
  QuickQuestion,
  ConversationsResponse,
  MessagesResponse,
  MessageResponse,
  QuickQuestionsResponse,
  VideoLinkResponse,
  TypingEvent
} from '../services/messaging.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatDividerModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ]
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  private destroy$ = new Subject<void>();

  // State
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  quickQuestions: QuickQuestion[] = [];
  
  currentUserId = 'driver-1'; // Hardcoded for testing - change as needed
  isTyping = false;
  otherUserTyping = false;
  isOnline = false;
  
  loading = false;
  loadingMessages = false;
  sendingMessage = false;

  // Forms
  messageForm!: FormGroup;
  searchForm!: FormGroup;

  // UI State
  showQuickQuestions = false;
  selectedFile: File | null = null;

  constructor(
    private messagingService: MockMessagingService,
    private fb: FormBuilder
  ) {
    // No AuthService dependency - using hardcoded user ID
    // To use real auth, inject AuthService and get user ID from there
  }


  ngOnInit(): void {
    this.initializeForms();
    this.loadConversations();
    this.loadQuickQuestions();
    this.subscribeToRealTimeEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.selectedConversation) {
      this.messagingService.leaveConversation(this.selectedConversation.id);
    }
  }

  // ============================================
  // Initialization
  // ============================================
  private initializeForms(): void {
    this.messageForm = this.fb.group({
      message: ['']
    });

    this.searchForm = this.fb.group({
      query: ['']
    });

    // Track typing indicator
    this.messageForm.get('message')?.valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe((value: string) => {
      if (this.selectedConversation) {
        if (value && value.trim()) {
          if (!this.isTyping) {
            this.isTyping = true;
            this.messagingService.startTyping(this.selectedConversation.id);
          }
        } else {
          if (this.isTyping) {
            this.isTyping = false;
            this.messagingService.stopTyping(this.selectedConversation.id);
          }
        }
      }
    });
  }

  private subscribeToRealTimeEvents(): void {
    // New messages
    this.messagingService.newMessage$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((message: Message) => {
      this.handleNewMessage(message);
    });

    // Typing indicators
    this.messagingService.typing$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((data: TypingEvent) => {
      if (this.selectedConversation && data.conversationId === this.selectedConversation.id) {
        this.otherUserTyping = true;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
          this.otherUserTyping = false;
        }, 3000);
      }
    });

    // Online status
    this.messagingService.userOnline$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((data: { userId: string; userName: string }) => {
      // Update online status for the other user
      if (this.selectedConversation) {
        const otherUserId = this.getOtherUserId();
        if (data.userId === otherUserId) {
          this.isOnline = true;
        }
      }
    });

    // Read receipts
    this.messagingService.messageRead$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((data: { conversationId: string; userId: string; readAt: Date }) => {
      if (this.selectedConversation && data.conversationId === this.selectedConversation.id) {
        this.markMessagesAsRead(data.readAt);
      }
    });
  }

  // ============================================
  // Load Data
  // ============================================
  loadConversations(): void {
    this.loading = true;
    this.messagingService.getConversations().subscribe({
      next: (response: ConversationsResponse) => {
        if (response.success) {
          this.conversations = response.conversations;
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading conversations:', error);
        this.loading = false;
      }
    });
  }

  loadQuickQuestions(): void {
    this.messagingService.getQuickQuestions().subscribe({
      next: (response: QuickQuestionsResponse) => {
        if (response.success) {
          this.quickQuestions = response.quickQuestions;
        }
      },
      error: (error: any) => {
        console.error('Error loading quick questions:', error);
      }
    });
  }

  // ============================================
  // Conversation Selection
  // ============================================
  selectConversation(conversation: Conversation): void {
    // Leave previous conversation
    if (this.selectedConversation) {
      this.messagingService.leaveConversation(this.selectedConversation.id);
    }

    this.selectedConversation = conversation;
    this.loadMessages(conversation.id);
    
    // Join new conversation room
    this.messagingService.joinConversation(conversation.id);
    
    // Mark messages as read
    this.messagingService.markAsRead(conversation.id).subscribe();
  }

  loadMessages(conversationId: string): void {
    this.loadingMessages = true;
    this.messagingService.getMessages(conversationId).subscribe({
      next: (response: MessagesResponse) => {
        if (response.success) {
          this.messages = response.messages;
          this.scrollToBottom();
        }
        this.loadingMessages = false;
      },
      error: (error: any) => {
        console.error('Error loading messages:', error);
        this.loadingMessages = false;
      }
    });
  }

  // ============================================
  // Send Messages
  // ============================================
  sendMessage(): void {
    if (!this.selectedConversation || this.sendingMessage) {
      return;
    }

    const content = this.messageForm.get('message')?.value?.trim();
    
    if (!content && !this.selectedFile) {
      return;
    }

    this.sendingMessage = true;

    // Send with file or just text
    const sendObservable = this.selectedFile
      ? this.messagingService.sendMessageWithFile(this.selectedConversation.id, this.selectedFile, content)
      : this.messagingService.sendMessage(this.selectedConversation.id, content);

    sendObservable.subscribe({
      next: (response: MessageResponse) => {
        if (response.success) {
          this.messageForm.reset();
          this.selectedFile = null;
          
          // Stop typing indicator
          if (this.isTyping) {
            this.isTyping = false;
            this.messagingService.stopTyping(this.selectedConversation!.id);
          }
        }
        this.sendingMessage = false;
      },
      error: (error: any) => {
        console.error('Error sending message:', error);
        this.sendingMessage = false;
      }
    });
  }

  sendQuickQuestion(question: string): void {
    if (!this.selectedConversation) {
      return;
    }

    this.messagingService.sendMessage(this.selectedConversation.id, question, 'quick_question').subscribe({
      next: (response: MessageResponse) => {
        if (response.success) {
          this.showQuickQuestions = false;
        }
      },
      error: (error: any) => {
        console.error('Error sending quick question:', error);
      }
    });
  }

  // ============================================
  // File Handling
  // ============================================
  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      this.selectedFile = file;
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // ============================================
  // UI Helpers
  // ============================================
  isMyMessage(message: Message): boolean {
    return message.senderId === this.currentUserId;
  }

  getOtherUser(): any {
    if (!this.selectedConversation) return null;
    
    return this.selectedConversation.driverId === this.currentUserId
      ? this.selectedConversation.attorney
      : this.selectedConversation.driver;
  }

  getOtherUserId(): string {
    if (!this.selectedConversation) return '';
    
    return this.selectedConversation.driverId === this.currentUserId
      ? this.selectedConversation.attorneyId
      : this.selectedConversation.driverId;
  }

  formatTime(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return d.toLocaleDateString();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('video')) return 'videocam';
    if (fileType.includes('word') || fileType.includes('document')) return 'description';
    return 'insert_drive_file';
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop = 
          this.messageContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  private handleNewMessage(message: Message): void {
    // Add to messages array if it's for the current conversation
    if (this.selectedConversation && message.conversationId === this.selectedConversation.id) {
      this.messages.push(message);
    }
    
    // Update conversation last message
    const conversation = this.conversations.find(c => c.id === message.conversationId);
    if (conversation) {
      conversation.lastMessage = message.content || 'File attachment';
      conversation.lastMessageAt = message.createdAt;
      if (message.senderId !== this.currentUserId) {
        conversation.unreadCount++;
      }
    }
    
    // Play notification sound
    this.playNotificationSound();
    
    // Scroll to bottom
    this.scrollToBottom();
  }

  private markMessagesAsRead(readAt: Date): void {
    this.messages = this.messages.map(msg => ({
      ...msg,
      isRead: true,
      readAt
    }));
  }

  private playNotificationSound(): void {
    const audio = new Audio('assets/sounds/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch((e: any) => console.log('Could not play sound:', e));
  }

  toggleQuickQuestions(): void {
    this.showQuickQuestions = !this.showQuickQuestions;
  }

  generateVideoLink(platform: 'zoom' | 'meet'): void {
    if (!this.selectedConversation) return;

    this.messagingService.generateVideoLink(this.selectedConversation.id, platform).subscribe({
      next: (response: VideoLinkResponse) => {
        if (response.success) {
          const link = response.videoLink.link;
          this.messageForm.patchValue({
            message: `Let's have a ${platform} call: ${link}`
          });
        }
      },
      error: (error: any) => {
        console.error('Error generating video link:', error);
      }
    });
  }
}
