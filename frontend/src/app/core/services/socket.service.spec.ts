/**
 * Tests for SocketService — Sprint 003
 */
import { TestBed } from '@angular/core/testing';
import { SocketService } from './socket.service';
import { AuthService } from './auth.service';
import { io } from 'socket.io-client';

// Mock socket.io-client
const mockSocket = {
  connected: false,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

const ioMock = io as ReturnType<typeof vi.fn>;

describe('SocketService', () => {
  let service: SocketService;
  let authStub: { getToken: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;

    authStub = { getToken: vi.fn().mockReturnValue('test-jwt') };

    TestBed.configureTestingModule({
      providers: [
        SocketService,
        { provide: AuthService, useValue: authStub },
      ],
    });

    service = TestBed.inject(SocketService);
  });

  afterEach(() => TestBed.resetTestingModule());

  // ----------------------------------------------------------------
  // connect
  // ----------------------------------------------------------------
  describe('connect', () => {
    it('creates a socket with the auth token', () => {
      service.connect();
      expect(ioMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ auth: { token: 'test-jwt' } })
      );
    });

    it('does not reconnect if socket is already connected', () => {
      mockSocket.connected = true;
      (service as any).socket = mockSocket;
      service.connect();
      expect(ioMock).not.toHaveBeenCalled();
    });

    it('does not connect when no token is available', () => {
      authStub.getToken.mockReturnValue(null);
      service.connect();
      expect(ioMock).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------
  // disconnect
  // ----------------------------------------------------------------
  describe('disconnect', () => {
    it('calls socket.disconnect() and nullifies socket', () => {
      (service as any).socket = mockSocket;
      service.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect((service as any).socket).toBeNull();
    });

    it('is a no-op when socket is null', () => {
      (service as any).socket = null;
      expect(() => service.disconnect()).not.toThrow();
    });
  });

  // ----------------------------------------------------------------
  // joinCase / leaveCase
  // ----------------------------------------------------------------
  describe('joinCase', () => {
    it('emits join-case with caseId', () => {
      (service as any).socket = mockSocket;
      service.joinCase('case-1');
      expect(mockSocket.emit).toHaveBeenCalledWith('join-case', { caseId: 'case-1' });
    });

    it('is a no-op when socket is null', () => {
      (service as any).socket = null;
      expect(() => service.joinCase('case-1')).not.toThrow();
    });
  });

  describe('leaveCase', () => {
    it('emits leave-case with caseId', () => {
      (service as any).socket = mockSocket;
      service.leaveCase('case-1');
      expect(mockSocket.emit).toHaveBeenCalledWith('leave-case', { caseId: 'case-1' });
    });
  });

  // ----------------------------------------------------------------
  // joinConversation / leaveConversation
  // ----------------------------------------------------------------
  describe('joinConversation', () => {
    it('emits join-conversation', () => {
      (service as any).socket = mockSocket;
      service.joinConversation('conv-1');
      expect(mockSocket.emit).toHaveBeenCalledWith('join-conversation', { conversationId: 'conv-1' });
    });
  });

  describe('leaveConversation', () => {
    it('emits leave-conversation', () => {
      (service as any).socket = mockSocket;
      service.leaveConversation('conv-1');
      expect(mockSocket.emit).toHaveBeenCalledWith('leave-conversation', { conversationId: 'conv-1' });
    });
  });

  // ----------------------------------------------------------------
  // onCaseStatusUpdate
  // ----------------------------------------------------------------
  describe('onCaseStatusUpdate', () => {
    it('returns an Observable that emits when case:status_updated fires', () => {
      return new Promise<void>(resolve => {
        (service as any).socket = mockSocket;

        let registeredHandler: (payload: unknown) => void;
        mockSocket.on.mockImplementation((event: string, handler: (p: unknown) => void) => {
          if (event === 'case:status_updated') registeredHandler = handler;
        });

        const payload = { caseId: 'case-1', status: 'send_info_to_attorney', updatedAt: '2026-01-01' };

        service.onCaseStatusUpdate().subscribe(data => {
          expect(data).toEqual(payload);
          resolve();
        });

        registeredHandler!(payload);
      });
    });

    it('unregisters the handler on unsubscribe', () => {
      (service as any).socket = mockSocket;
      mockSocket.on.mockImplementation(() => {});

      const sub = service.onCaseStatusUpdate().subscribe();
      sub.unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith('case:status_updated', expect.any(Function));
    });
  });

  // ----------------------------------------------------------------
  // onNewMessage
  // ----------------------------------------------------------------
  describe('onNewMessage', () => {
    it('returns an Observable that emits on new-message event', () => {
      return new Promise<void>(resolve => {
        (service as any).socket = mockSocket;

        let registeredHandler: (payload: unknown) => void;
        mockSocket.on.mockImplementation((event: string, handler: (p: unknown) => void) => {
          if (event === 'new-message') registeredHandler = handler;
        });

        const payload = { id: 'msg-1', content: 'Hello' };

        service.onNewMessage().subscribe(data => {
          expect(data).toEqual(payload);
          resolve();
        });

        registeredHandler!(payload);
      });
    });
  });
});
