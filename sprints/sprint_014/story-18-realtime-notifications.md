# Story 18 — Real-time Notifications via Socket.io

**Sprint:** 014 — Real-time Notifications
**Status:** DONE

## Scope

Wire `SocketService` (Socket.io) to `NotificationService` (BehaviorSubjects) so the `NotificationBellComponent` receives live push notifications without polling. Rewrite `NotificationBellComponent` to Angular 21 patterns.

## Changes

### 18.1 `socket.service.ts` — UPDATED
- Added `onNotification(): Observable<any>` listening to `notification:new` event

### 18.2 `notification.service.ts` — UPDATED
- Added `pushSocketNotification(notification: Notification): void`
  - Prepends notification to `notificationsSubject`
  - Increments `unreadCountSubject` if unread
  - Emits on `newNotificationSubject`

### 18.3 `notification-bell.component.ts` — REWRITTEN (Angular 21)
Replaced legacy patterns:
| Before | After |
|--------|-------|
| `standalone: true` | Removed (default in Angular 21) |
| `CommonModule` | Removed (native control flow) |
| Constructor injection | `inject()` |
| `Subject` / `takeUntil` | `takeUntilDestroyed(destroyRef)` |
| `OnDestroy` + `destroy$.next()` | Removed |
| Mutable class properties | `toSignal()` + `signal()` + `computed()` |
| `getNotificationIcon()` duplicate | Delegates to `notificationService.getNotificationIcon()` |
| `getTimeAgo()` duplicate | Delegates to `notificationService.formatTimestamp()` |

New wiring in `ngOnInit()`:
```typescript
this.socketService.connect();
this.socketService.onNotification()
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(n => this.notificationService.pushSocketNotification(n));
```

Signals:
```typescript
notifications = toSignal(notificationService.notifications$, { initialValue: [] });
unreadCount  = toSignal(notificationService.unreadCount$,   { initialValue: 0  });
recentNotifications = computed(() => notifications().slice(0, 5));
loading = signal(false);
```

### 18.4 `notification-bell.component.html` — UPDATED
- Replaced all `*ngIf` → `@if`
- Replaced `*ngFor` → `@for ... track notification.id`
- Updated all property reads to signal call syntax (`unreadCount()`, `loading()`, `recentNotifications()`)
- Added `aria-label="Notifications"` to bell button (accessibility)
- Collapsed footer/divider inside the `@if` guard (no duplicate dividers)

### 18.5 `notification-bell.component.spec.ts` — NEW (10 tests)
- renders notification bell button
- hides badge when unreadCount is 0
- shows unread count from notification service
- calls getNotifications and connect on init
- sets loading to false after getNotifications resolves
- recentNotifications slices to max 5 items
- pushes socket notification into notification service
- markAllAsRead calls notificationService.markAllAsRead
- markAsRead skips already-read notifications
- markAsRead calls service for unread notifications

## Total
362/362 tests pass (was 352 before Sprint 014, +10 new tests).
