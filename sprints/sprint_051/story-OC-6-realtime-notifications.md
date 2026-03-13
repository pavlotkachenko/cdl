# Story OC-6: Real-time Updates & Notification Service Integration

## Status: DONE

## Priority: P1

## Depends On: None (infrastructure story)

## Description
Replace the operator notifications mock data (500ms setTimeout in `OperatorNotificationsComponent`)
with real API calls to the existing notification service. Add Socket.io listeners so operators
receive real-time updates when new cases arrive, assignment requests are approved/rejected,
or case statuses change.

### User Stories
> As an **operator**, I want to see real notifications from the system (new case submitted,
> assignment approved, attorney responded) instead of mock data.

> As an **operator**, I want to see new cases appear in my queue in real-time without
> refreshing the page, so I can respond quickly.

## Backend Changes

### Verify Notification Endpoints
Confirm `notification.controller.js` endpoints accept `operator` role:
- `GET /api/notifications` — list user's notifications
- `PATCH /api/notifications/:id/read` — mark read
- `PATCH /api/notifications/read-all` — mark all read
- `GET /api/notifications/unread-count` — badge count

**If role restrictions exist:** Update `authorize()` to include `operator`.

### Socket.io Room for Operators
In `backend/src/socket/` (existing socket handler):
- When an operator connects, join room `operator:<userId>`
- Emit events:
  - `case:new` — when a new case is submitted (broadcast to all operators)
  - `case:assigned` — when a case is assigned to this operator
  - `assignment:approved` — when admin approves an assignment request
  - `assignment:rejected` — when admin rejects an assignment request
  - `notification:new` — when a new notification is created for this user

### Notification Creation Points
Ensure notifications are created (in `notification.service.js` or inline) for:
- New case submitted → all operators with `type: 'new_case'`
- Assignment request approved → requesting operator with `type: 'assignment_approved'`
- Assignment request rejected → requesting operator with `type: 'assignment_rejected'`
- Case status changed by attorney → assigned operator with `type: 'status_change'`
- New message from driver → assigned operator with `type: 'new_message'`

## Frontend Changes

### Update: `OperatorNotificationsComponent`
**Current state:** Uses `setTimeout(500)` to load mock notifications.
**Target state:** Calls real notification API and subscribes to Socket.io events.

**Changes:**
- Replace mock data loading with `notificationService.getNotifications()`
- Replace `markRead()` mock logic with `notificationService.markRead(id)`
- Replace `markAllRead()` with `notificationService.markAllRead()`
- Add `unreadCount` from API: `notificationService.getUnreadCount()`
- Subscribe to `notification:new` socket event to prepend new notifications

### New/Update: `NotificationService` (or reuse existing)
Check if `core/services/notification.service.ts` exists. If so, extend it. If not, create:
```typescript
@Injectable({ providedIn: 'root' })
export class OperatorNotificationService {
  private http = inject(HttpClient);

  getNotifications(): Observable<Notification[]> { ... }
  getUnreadCount(): Observable<number> { ... }
  markRead(id: string): Observable<void> { ... }
  markAllRead(): Observable<void> { ... }
}
```

### Socket.io Integration
Check if a `SocketService` exists in the frontend. If so, subscribe to events in the
notifications component:
```typescript
ngOnInit() {
  this.socketService.on('notification:new', (notification) => {
    this.notifications.update(list => [notification, ...list]);
  });

  this.socketService.on('case:new', () => {
    // Trigger dashboard refresh if dashboard is also loaded
  });
}
```

If no `SocketService` exists, create a lightweight one:
```typescript
@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;
  constructor() {
    this.socket = io(environment.socketUrl, { auth: { token: this.getToken() } });
  }
  on<T>(event: string, callback: (data: T) => void) { this.socket.on(event, callback); }
  disconnect() { this.socket.disconnect(); }
}
```

### Dashboard Real-time Refresh
In `operator-dashboard.component.ts`:
- Subscribe to `case:new` socket event → call `refresh()` to reload queue
- Subscribe to `assignment:approved` → call `refresh()` (case now in My Cases)
- Show a subtle "New cases available" toast/banner instead of auto-refreshing if preferred
  (less jarring UX)

## Acceptance Criteria
- [ ] Operator notifications page loads real data from notification API (no mock setTimeout)
- [ ] Mark read / mark all read call real API and update UI
- [ ] Unread count badge reflects real count from API
- [ ] New notifications appear in real-time via Socket.io without page refresh
- [ ] Dashboard receives `case:new` events and shows "New cases available" indicator
- [ ] Assignment approval/rejection triggers real-time notification
- [ ] Socket.io connection authenticates with JWT token
- [ ] Socket disconnects on component destroy / logout
- [ ] Existing notification component tests updated (mock HTTP instead of setTimeout)
- [ ] All text uses TranslateModule with existing `OPR.NOTIF.*` keys
- [ ] Build succeeds with no errors

## Test Coverage

### Backend Tests
- Notification created when new case submitted
- Notification created when assignment approved/rejected
- Socket event emitted for `case:new`, `assignment:approved`
- Operator role has access to notification endpoints

### Frontend Tests (update `operator-notifications.component.spec.ts`)
- Component calls notification service on init (not setTimeout)
- `markRead()` calls service and updates local state
- `markAllRead()` calls service and sets all to read
- Unread count updates when notifications change
- Socket event handler prepends new notification to list

### Frontend Tests (`socket.service.spec.ts` — if new)
- Connects with auth token
- `on()` registers event listener
- `disconnect()` closes connection
