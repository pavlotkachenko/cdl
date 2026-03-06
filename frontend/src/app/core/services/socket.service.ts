import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable, fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private authService = inject(AuthService);
  private socket: Socket | null = null;
  private destroy$ = new Subject<void>();

  connect(): void {
    if (this.socket?.connected) return;

    const token = this.authService.getToken?.() || localStorage.getItem('token');
    if (!token) return;

    this.socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => console.log('[Socket] connected'));
    this.socket.on('disconnect', () => console.log('[Socket] disconnected'));
    this.socket.on('connect_error', (err) => console.warn('[Socket] error', err.message));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinCase(caseId: string): void {
    this.socket?.emit('join-case', { caseId });
  }

  leaveCase(caseId: string): void {
    this.socket?.emit('leave-case', { caseId });
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit('join-conversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('leave-conversation', { conversationId });
  }

  onCaseStatusUpdate(): Observable<{ caseId: string; status: string; updatedAt: string }> {
    return new Observable(observer => {
      const handler = (data: any) => observer.next(data);
      this.socket?.on('case:status_updated', handler);
      return () => this.socket?.off('case:status_updated', handler);
    });
  }

  onNewMessage(): Observable<any> {
    return new Observable(observer => {
      const handler = (data: any) => observer.next(data);
      this.socket?.on('new-message', handler);
      return () => this.socket?.off('new-message', handler);
    });
  }

  onNotification(): Observable<any> {
    return new Observable(observer => {
      const handler = (data: any) => observer.next(data);
      this.socket?.on('notification:new', handler);
      return () => this.socket?.off('notification:new', handler);
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
