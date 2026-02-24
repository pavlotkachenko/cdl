// ============================================
// Mock Messaging Service for Testing
// Location: frontend/src/app/features/driver/services/messaging.service.mock.ts
// ============================================

import { Injectable } from '@angular/core';
import { Observable, of, Subject, interval } from 'rxjs';
import { delay, take } from 'rxjs/operators';

import { 
  Conversation, 
  Message, 
  QuickQuestion,
  ConversationsResponse,
  MessagesResponse,
  MessageResponse,
  QuickQuestionsResponse,
  VideoLinkResponse,
  TypingEvent
} from './messaging.service';

@Injectable({
  providedIn: 'root'
})
export class MockMessagingService {
  // Subjects for real-time events
  newMessage$ = new Subject<Message>();
  typing$ = new Subject<TypingEvent>();
  userOnline$ = new Subject<{ userId: string; userName: string }>();
  messageRead$ = new Subject<{ conversationId: string; userId: string; readAt: Date }>();

  private mockConversations: Conversation[] = [
    {
      id: '1',
      driverId: 'driver-1',
      attorneyId: 'attorney-1',
      driver: {
        id: 'driver-1',
        name: 'John Driver',
        email: 'john@example.com'
      },
      attorney: {
        id: 'attorney-1',
        name: 'Sarah Attorney',
        email: 'sarah@lawfirm.com',
        firm: 'Legal Associates'
      },
      lastMessage: 'Thanks for the update on my case!',
      lastMessageAt: new Date(Date.now() - 3600000), // 1 hour ago
      unreadCount: 2,
      isOnline: true,
      createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
      updatedAt: new Date(Date.now() - 3600000)
    },
    {
      id: '2',
      driverId: 'driver-1',
      attorneyId: 'attorney-2',
      driver: {
        id: 'driver-1',
        name: 'John Driver',
        email: 'john@example.com'
      },
      attorney: {
        id: 'attorney-2',
        name: 'Michael Johnson',
        email: 'michael@lawyers.com',
        firm: 'Johnson & Partners'
      },
      lastMessage: 'Your court date is scheduled for next week.',
      lastMessageAt: new Date(Date.now() - 86400000), // 1 day ago
      unreadCount: 0,
      isOnline: false,
      createdAt: new Date(Date.now() - 86400000 * 14),
      updatedAt: new Date(Date.now() - 86400000)
    },
    {
      id: '3',
      driverId: 'driver-1',
      attorneyId: 'attorney-3',
      driver: {
        id: 'driver-1',
        name: 'John Driver',
        email: 'john@example.com'
      },
      attorney: {
        id: 'attorney-3',
        name: 'Emily Roberts',
        email: 'emily@legalcorp.com',
        firm: 'LegalCorp'
      },
      lastMessage: 'I received your documents.',
      lastMessageAt: new Date(Date.now() - 172800000), // 2 days ago
      unreadCount: 0,
      isOnline: true,
      createdAt: new Date(Date.now() - 86400000 * 30),
      updatedAt: new Date(Date.now() - 172800000)
    }
  ];

  private mockMessages: { [conversationId: string]: Message[] } = {
    '1': [
      {
        id: 'msg-1',
        conversationId: '1',
        senderId: 'attorney-1',
        content: 'Hi John, I wanted to update you on your case progress.',
        createdAt: new Date(Date.now() - 7200000),
        isRead: true,
        readAt: new Date(Date.now() - 7100000)
      },
      {
        id: 'msg-2',
        conversationId: '1',
        senderId: 'driver-1',
        content: 'Thanks Sarah! What\'s the latest?',
        createdAt: new Date(Date.now() - 7000000),
        isRead: true,
        readAt: new Date(Date.now() - 6900000)
      },
      {
        id: 'msg-3',
        conversationId: '1',
        senderId: 'attorney-1',
        content: 'We\'ve received the police report and are reviewing it. I\'ll have a detailed analysis for you by tomorrow.',
        createdAt: new Date(Date.now() - 6800000),
        isRead: true,
        readAt: new Date(Date.now() - 6700000)
      },
      {
        id: 'msg-4',
        conversationId: '1',
        senderId: 'attorney-1',
        content: 'Here is the document you requested.',
        fileUrl: 'https://example.com/docs/report.pdf',
        fileName: 'Police_Report_2024.pdf',
        fileType: 'application/pdf',
        fileSize: 524288, // 512KB
        createdAt: new Date(Date.now() - 5000000),
        isRead: true,
        readAt: new Date(Date.now() - 4900000)
      },
      {
        id: 'msg-5',
        conversationId: '1',
        senderId: 'driver-1',
        content: 'Thanks for the update on my case!',
        createdAt: new Date(Date.now() - 3600000),
        isRead: false
      }
    ],
    '2': [
      {
        id: 'msg-6',
        conversationId: '2',
        senderId: 'attorney-2',
        content: 'Good morning John, your court date is scheduled for next Tuesday at 9 AM.',
        createdAt: new Date(Date.now() - 86400000),
        isRead: true,
        readAt: new Date(Date.now() - 86300000)
      },
      {
        id: 'msg-7',
        conversationId: '2',
        senderId: 'driver-1',
        content: 'Thanks for letting me know. Should I bring anything specific?',
        createdAt: new Date(Date.now() - 86000000),
        isRead: true,
        readAt: new Date(Date.now() - 85900000)
      }
    ],
    '3': [
      {
        id: 'msg-8',
        conversationId: '3',
        senderId: 'attorney-3',
        content: 'I received your documents. Everything looks good!',
        createdAt: new Date(Date.now() - 172800000),
        isRead: true,
        readAt: new Date(Date.now() - 172700000)
      }
    ]
  };

  private mockQuickQuestions: QuickQuestion[] = [
    { id: '1', question: 'What is the status of my case?', category: 'status' },
    { id: '2', question: 'When is my next court date?', category: 'court' },
    { id: '3', question: 'Do you need any documents from me?', category: 'documents' },
    { id: '4', question: 'What are the next steps?', category: 'process' },
    { id: '5', question: 'Can we schedule a call?', category: 'meeting' },
    { id: '6', question: 'What is the expected timeline?', category: 'timeline' }
  ];

  private messageIdCounter = 100;

  constructor() {
    // Simulate incoming messages periodically for testing
    this.simulateIncomingMessages();
  }

  getConversations(): Observable<ConversationsResponse> {
    return of({
      success: true,
      data: this.mockConversations,
      message: 'Conversations loaded successfully'
    }).pipe(delay(500)); // Simulate network delay
  }

  getMessages(conversationId: string): Observable<MessagesResponse> {
    const messages = this.mockMessages[conversationId] || [];
    return of({
      success: true,
      data: messages,
      message: 'Messages loaded successfully'
    }).pipe(delay(300));
  }

  sendMessage(conversationId: string, content: string, messageType?: string): Observable<MessageResponse> {
    const newMessage: Message = {
      id: `msg-${this.messageIdCounter++}`,
      conversationId: conversationId,
      senderId: 'driver-1', // Current user
      content: content,
      messageType: messageType,
      createdAt: new Date(),
      isRead: false
    };

    // Add to mock messages
    if (!this.mockMessages[conversationId]) {
      this.mockMessages[conversationId] = [];
    }
    this.mockMessages[conversationId].push(newMessage);

    // Update conversation
    const conversation = this.mockConversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.lastMessage = content;
      conversation.lastMessageAt = new Date();
    }

    // Emit new message event
    setTimeout(() => {
      this.newMessage$.next(newMessage);
    }, 100);

    // Simulate attorney response after 2-5 seconds
    this.simulateResponse(conversationId);

    return of({
      success: true,
      data: newMessage,
      message: 'Message sent successfully'
    }).pipe(delay(200));
  }

  sendMessageWithFile(conversationId: string, file: File, content?: string): Observable<MessageResponse> {
    const newMessage: Message = {
      id: `msg-${this.messageIdCounter++}`,
      conversationId: conversationId,
      senderId: 'driver-1',
      content: content || '',
      fileUrl: URL.createObjectURL(file), // Create temporary URL for preview
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      createdAt: new Date(),
      isRead: false
    };

    if (!this.mockMessages[conversationId]) {
      this.mockMessages[conversationId] = [];
    }
    this.mockMessages[conversationId].push(newMessage);

    const conversation = this.mockConversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.lastMessage = content || `Sent ${file.name}`;
      conversation.lastMessageAt = new Date();
    }

    setTimeout(() => {
      this.newMessage$.next(newMessage);
    }, 100);

    return of({
      success: true,
      data: newMessage,
      message: 'Message with file sent successfully'
    }).pipe(delay(500));
  }

  markAsRead(conversationId: string): Observable<any> {
    const conversation = this.mockConversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
    }

    // Mark messages as read
    if (this.mockMessages[conversationId]) {
      this.mockMessages[conversationId].forEach(msg => {
        if (msg.senderId !== 'driver-1') {
          msg.isRead = true;
          msg.readAt = new Date();
        }
      });
    }

    return of({ success: true }).pipe(delay(100));
  }

  getQuickQuestions(): Observable<QuickQuestionsResponse> {
    return of({
      success: true,
      data: this.mockQuickQuestions,
      message: 'Quick questions loaded'
    }).pipe(delay(200));
  }

  generateVideoLink(conversationId: string, platform: 'zoom' | 'meet'): Observable<VideoLinkResponse> {
    const link = platform === 'zoom' 
      ? `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`
      : `https://meet.google.com/${Math.random().toString(36).substring(7)}`;

    return of({
      success: true,
      data: {
        id: `video-${Date.now()}`,
        conversationId: conversationId,
        platform: platform,
        link: link,
        createdAt: new Date()
      },
      message: 'Video link generated'
    }).pipe(delay(300));
  }

  joinConversation(conversationId: string): void {
    console.log(`Joined conversation: ${conversationId}`);
  }

  leaveConversation(conversationId: string): void {
    console.log(`Left conversation: ${conversationId}`);
  }

  startTyping(conversationId: string): void {
    console.log(`Started typing in: ${conversationId}`);
  }

  stopTyping(conversationId: string): void {
    console.log(`Stopped typing in: ${conversationId}`);
  }

  // Simulate incoming messages for testing
  private simulateIncomingMessages(): void {
    interval(15000).pipe(take(10)).subscribe(() => {
      const conversationIds = Object.keys(this.mockMessages);
      if (conversationIds.length > 0) {
        const randomConvId = conversationIds[Math.floor(Math.random() * conversationIds.length)];
        const responses = [
          "I've reviewed your documents.",
          "Let me know if you have any questions.",
          "I'll get back to you on this shortly.",
          "Everything looks good so far.",
          "We should schedule a call to discuss this."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const conversation = this.mockConversations.find(c => c.id === randomConvId);
        
        if (conversation) {
          const incomingMessage: Message = {
            id: `msg-${this.messageIdCounter++}`,
            conversationId: randomConvId,
            senderId: conversation.attorneyId,
            content: randomResponse,
            createdAt: new Date(),
            isRead: false
          };

          this.mockMessages[randomConvId].push(incomingMessage);
          conversation.lastMessage = randomResponse;
          conversation.lastMessageAt = new Date();
          conversation.unreadCount++;

          this.newMessage$.next(incomingMessage);
        }
      }
    });
  }

  // Simulate attorney response
  private simulateResponse(conversationId: string): void {
    const delay = 2000 + Math.random() * 3000; // 2-5 seconds
    
    setTimeout(() => {
      // Emit typing indicator
      this.typing$.next({ conversationId, userId: 'attorney-1' });

      // After 2 seconds, send response
      setTimeout(() => {
        const responses = [
          "Got it, thanks for letting me know!",
          "I'll look into this and get back to you.",
          "Perfect, I'll add that to my notes.",
          "Understood. I'll keep you updated.",
          "Thanks for the information!"
        ];

        const conversation = this.mockConversations.find(c => c.id === conversationId);
        if (conversation) {
          const responseMessage: Message = {
            id: `msg-${this.messageIdCounter++}`,
            conversationId: conversationId,
            senderId: conversation.attorneyId,
            content: responses[Math.floor(Math.random() * responses.length)],
            createdAt: new Date(),
            isRead: false
          };

          this.mockMessages[conversationId].push(responseMessage);
          //conversation.lastMessage = responseMessage.content;
          conversation.lastMessage = responseMessage.content ?? '';
          conversation.lastMessageAt = new Date();
          conversation.unreadCount++;

          this.newMessage$.next(responseMessage);
        }
      }, 2000);
    }, delay);
  }
}
