# API Specification - Driver-Attorney Messaging Platform

## Overview

This document provides the complete API specification for the backend services required by the Driver-Attorney Messaging Platform.

---

## Base URLs

- **Development**: `http://localhost:3000/api`
- **Staging**: `https://staging-api.yourapp.com/api`
- **Production**: `https://api.yourapp.com/api`

---

## Authentication

All API requests require authentication using JWT tokens.

### Headers
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "driver",
    "avatar": "https://example.com/avatars/user-123.jpg"
  }
}
```

#### Register
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "driver"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

---

## Conversations API

### Get All Conversations
```http
GET /api/conversations
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search query

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conv-123",
      "driverId": "driver-1",
      "attorneyId": "attorney-1",
      "driver": {
        "id": "driver-1",
        "name": "John Driver",
        "email": "john@example.com",
        "avatar": "https://example.com/avatars/driver-1.jpg"
      },
      "attorney": {
        "id": "attorney-1",
        "name": "Sarah Attorney",
        "email": "sarah@lawfirm.com",
        "firm": "Legal Associates",
        "avatar": "https://example.com/avatars/attorney-1.jpg"
      },
      "lastMessage": "Thanks for the update!",
      "lastMessageAt": "2024-02-14T10:30:00Z",
      "unreadCount": 2,
      "isOnline": true,
      "createdAt": "2024-02-01T08:00:00Z",
      "updatedAt": "2024-02-14T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  },
  "message": "Conversations retrieved successfully"
}
```

### Get Single Conversation
```http
GET /api/conversations/:id
```

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "conv-123",
    "driverId": "driver-1",
    "attorneyId": "attorney-1",
    "driver": { /* user object */ },
    "attorney": { /* user object */ },
    "lastMessage": "Thanks for the update!",
    "lastMessageAt": "2024-02-14T10:30:00Z",
    "unreadCount": 2,
    "isOnline": true,
    "createdAt": "2024-02-01T08:00:00Z",
    "updatedAt": "2024-02-14T10:30:00Z"
  },
  "message": "Conversation retrieved successfully"
}
```

### Create Conversation
```http
POST /api/conversations
```

**Request Body:**
```json
{
  "attorneyId": "attorney-1"
}
```

**Response:**
```json
{
  "success": true,
  "conversation": { /* conversation object */ },
  "message": "Conversation created successfully"
}
```

### Delete Conversation
```http
DELETE /api/conversations/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

---

## Messages API

### Get Messages
```http
GET /api/conversations/:conversationId/messages
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `before` (optional): Get messages before this message ID
- `after` (optional): Get messages after this message ID

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg-123",
      "conversationId": "conv-123",
      "senderId": "attorney-1",
      "content": "Hi John, I have an update on your case.",
      "messageType": "text",
      "fileUrl": null,
      "fileName": null,
      "fileType": null,
      "fileSize": null,
      "createdAt": "2024-02-14T10:25:00Z",
      "isRead": true,
      "readAt": "2024-02-14T10:26:00Z"
    },
    {
      "id": "msg-124",
      "conversationId": "conv-123",
      "senderId": "attorney-1",
      "content": "Here is the police report.",
      "messageType": "file",
      "fileUrl": "https://example.com/files/report.pdf",
      "fileName": "Police_Report_2024.pdf",
      "fileType": "application/pdf",
      "fileSize": 524288,
      "createdAt": "2024-02-14T10:27:00Z",
      "isRead": false,
      "readAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "hasMore": true
  },
  "message": "Messages retrieved successfully"
}
```

### Send Message
```http
POST /api/conversations/:conversationId/messages
```

**Request Body:**
```json
{
  "content": "Thanks for the update!",
  "messageType": "text"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg-125",
    "conversationId": "conv-123",
    "senderId": "driver-1",
    "content": "Thanks for the update!",
    "messageType": "text",
    "createdAt": "2024-02-14T10:30:00Z",
    "isRead": false,
    "readAt": null
  },
  "messageText": "Message sent successfully"
}
```

### Send Message with File
```http
POST /api/conversations/:conversationId/messages/file
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
file: <binary data>
content: "Here is the accident photo"
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg-126",
    "conversationId": "conv-123",
    "senderId": "driver-1",
    "content": "Here is the accident photo",
    "messageType": "file",
    "fileUrl": "https://example.com/files/accident-photo.jpg",
    "fileName": "accident-photo.jpg",
    "fileType": "image/jpeg",
    "fileSize": 1024000,
    "createdAt": "2024-02-14T10:35:00Z",
    "isRead": false
  },
  "messageText": "Message with file sent successfully"
}
```

### Mark Message as Read
```http
POST /api/conversations/:conversationId/read
```

**Request Body:**
```json
{
  "messageIds": ["msg-124", "msg-125"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Messages marked as read",
  "readAt": "2024-02-14T10:40:00Z"
}
```

### Delete Message
```http
DELETE /api/messages/:messageId
```

**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

## Quick Questions API

### Get Quick Questions
```http
GET /api/quick-questions
```

**Query Parameters:**
- `category` (optional): Filter by category

**Response:**
```json
{
  "success": true,
  "quickQuestions": [
    {
      "id": "qq-1",
      "question": "What is the status of my case?",
      "category": "status"
    },
    {
      "id": "qq-2",
      "question": "When is my next court date?",
      "category": "court"
    },
    {
      "id": "qq-3",
      "question": "Do you need any documents from me?",
      "category": "documents"
    }
  ],
  "message": "Quick questions retrieved successfully"
}
```

### Create Quick Question
```http
POST /api/quick-questions
```

**Request Body:**
```json
{
  "question": "Can we schedule a call?",
  "category": "meeting"
}
```

**Response:**
```json
{
  "success": true,
  "quickQuestion": {
    "id": "qq-7",
    "question": "Can we schedule a call?",
    "category": "meeting"
  },
  "message": "Quick question created successfully"
}
```

---

## Video Links API

### Generate Video Link
```http
POST /api/conversations/:conversationId/video-link
```

**Request Body:**
```json
{
  "platform": "zoom"
}
```

**Response:**
```json
{
  "success": true,
  "videoLink": {
    "id": "vl-123",
    "conversationId": "conv-123",
    "platform": "zoom",
    "link": "https://zoom.us/j/123456789",
    "createdAt": "2024-02-14T10:45:00Z"
  },
  "message": "Video link generated successfully"
}
```

---

## WebSocket Events

### Connection

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'JWT_TOKEN_HERE'
  }
});
```

### Client → Server Events

#### Join Conversation
```javascript
socket.emit('join-conversation', {
  conversationId: 'conv-123'
});
```

#### Leave Conversation
```javascript
socket.emit('leave-conversation', {
  conversationId: 'conv-123'
});
```

#### Start Typing
```javascript
socket.emit('typing-start', {
  conversationId: 'conv-123'
});
```

#### Stop Typing
```javascript
socket.emit('typing-stop', {
  conversationId: 'conv-123'
});
```

### Server → Client Events

#### New Message
```javascript
socket.on('new-message', (message) => {
  // message object
  {
    id: 'msg-127',
    conversationId: 'conv-123',
    senderId: 'attorney-1',
    content: 'New message content',
    createdAt: '2024-02-14T10:50:00Z',
    isRead: false
  }
});
```

#### Typing Indicator
```javascript
socket.on('typing', (data) => {
  // data object
  {
    conversationId: 'conv-123',
    userId: 'attorney-1',
    userName: 'Sarah Attorney'
  }
});
```

#### User Online
```javascript
socket.on('user-online', (data) => {
  // data object
  {
    userId: 'attorney-1',
    userName: 'Sarah Attorney'
  }
});
```

#### User Offline
```javascript
socket.on('user-offline', (data) => {
  // data object
  {
    userId: 'attorney-1',
    userName: 'Sarah Attorney'
  }
});
```

#### Message Read
```javascript
socket.on('message-read', (data) => {
  // data object
  {
    conversationId: 'conv-123',
    userId: 'driver-1',
    messageIds: ['msg-124', 'msg-125'],
    readAt: '2024-02-14T10:55:00Z'
  }
});
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `SERVER_ERROR` | 500 | Internal server error |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "content": "Content is required",
      "conversationId": "Invalid conversation ID format"
    }
  }
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication**: 5 requests per minute
- **Messages**: 60 requests per minute
- **File uploads**: 10 requests per minute
- **Other endpoints**: 100 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1644849600
```

---

## File Upload Specifications

### Accepted File Types

- **Documents**: PDF, DOC, DOCX, XLS, XLSX, TXT
- **Images**: JPG, JPEG, PNG, GIF, WebP
- **Videos**: MP4, MOV, AVI (max 50MB)

### Size Limits

- **Single file**: 10MB (standard users)
- **Single file**: 50MB (premium users)
- **Total storage**: 1GB per user

### File Upload Process

1. Client sends file via FormData
2. Server validates file type and size
3. Server scans file for viruses
4. Server uploads to cloud storage (S3, GCS, etc.)
5. Server returns file URL
6. Server creates message record with file metadata

---

## Pagination

All list endpoints support pagination:

**Request:**
```http
GET /api/conversations?page=2&limit=20
```

**Response includes pagination metadata:**
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## Filtering & Sorting

### Filtering
```http
GET /api/conversations?unread=true&online=true
```

### Sorting
```http
GET /api/messages?sort=-createdAt
```

Prefix with `-` for descending order.

---

## Webhooks

The API can send webhooks for important events:

### Configuration
```http
POST /api/webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["message.sent", "message.read", "user.online"],
  "secret": "webhook_secret_key"
}
```

### Webhook Events

- `message.sent`
- `message.read`
- `message.deleted`
- `conversation.created`
- `conversation.deleted`
- `user.online`
- `user.offline`

### Webhook Payload

```json
{
  "event": "message.sent",
  "timestamp": "2024-02-14T11:00:00Z",
  "data": {
    "messageId": "msg-128",
    "conversationId": "conv-123",
    "senderId": "driver-1",
    "content": "Message content"
  },
  "signature": "sha256_hash_of_payload"
}
```

---

## API Versioning

The API uses URL versioning:

- **Current**: `/api/v1/...`
- **Beta**: `/api/v2-beta/...`

Version 1 will be supported for at least 12 months after v2 release.

---

## Testing

### Postman Collection

Import the Postman collection for easy API testing:
```
https://api.yourapp.com/postman/collection.json
```

### API Sandbox

Test API in sandbox environment:
```
https://sandbox-api.yourapp.com/api
```

Sandbox credentials:
- **Email**: `test@example.com`
- **Password**: `testpassword123`

---

## Support

For API support:
- 📧 Email: api-support@yourapp.com
- 📖 Documentation: https://docs.yourapp.com
- 🐛 Issues: https://github.com/your-org/api/issues


Project Status Assessment

  What We've Built — 9 Sprints

  ┌────────┬───────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────┐
  │ Sprint │                             Focus                             │                             Outcome                              │
  ├────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 001    │ MVP blockers (skeleton screens, mobile UX, email, auth fixes) │ Loading states, touch targets, carrier wizard                    │
  ├────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 002    │ Backend test coverage                                         │ All services tested (email, payment, OCR, auth, messaging)       │
  ├────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 003    │ Core case flows                                               │ Ticket submission, attorney matching, payment, real-time updates │
  ├────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 004    │ Auth/security                                                 │ Route guards, unauthorized page, auth tests                      │
  ├────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 005    │ Driver flows — Angular 21                                     │ Payment, OCR prefill, attorney recommendation                    │
  ├────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 006    │ Carrier portal                                                │ Fleet dashboard, driver management, case overview, profile       │
  ├────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 007    │ Attorney portal — Angular 21                                  │ Dashboard, case detail, subscription management                  │
  ├────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 008    │ Driver portal — Angular 21                                    │ Dashboard, notifications, profile, AuthGuard restored            │
  ├────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ 009    │ Admin portal — Angular 21 (partial)                           │ Admin dashboard, case mgmt, staff mgmt, operator cleanup         │
  └────────┴───────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────┘

  Test count: 290 passing (was 0 when we started modernization).

  ---
  MVP Status

  The roadmap declares MVP "~90% complete" — but that was written at project start. Here's the honest picture today:

  MVP Must-Haves

  ┌──────────────────────────┬─────────────┬─────────────────────────────────────────────────────────────────────────────────┐
  │           Item           │   Status    │                                      Notes                                      │
  ├──────────────────────────┼─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Ticket submission flow   │ ✅ Complete │ Sprint 003, 005                                                                 │
  ├──────────────────────────┼─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Attorney matching engine │ ✅ Complete │ Sprint 003, 005                                                                 │
  ├──────────────────────────┼─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Payment processing       │ ✅ Complete │ Sprint 003, 005                                                                 │
  ├──────────────────────────┼─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Real-time messaging      │ ✅ Complete │ Sprint 003                                                                      │
  ├──────────────────────────┼─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Landing page             │ ⚠️  ~65%     │ Hero exists, no testimonials/FAQ/social proof                                   │
  ├──────────────────────────┼─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Carrier registration     │ ⚠️  ~70%     │ Portal exists, form not simplified to 3 fields                                  │
  ├──────────────────────────┼─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Loading & error states   │ ⚠️  ~50%     │ Skeleton screens exist in some places, not systematic                           │
  ├──────────────────────────┼─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Mobile responsiveness    │ ⚠️  ~80%     │ Touch targets/keyboard types done in Sprint 001; not audited post-modernization │
  └──────────────────────────┴─────────────┴─────────────────────────────────────────────────────────────────────────────────┘

  Core Feature Coverage by Role

  ┌──────────┬───────────────┬─────────────────────────────────────────────┐
  │   Role   │ Functionality │              Angular 21 Modern              │
  ├──────────┼───────────────┼─────────────────────────────────────────────┤
  │ Driver   │ ✅ 100%       │ ✅ 100% (Sprint 008)                        │
  ├──────────┼───────────────┼─────────────────────────────────────────────┤
  │ Carrier  │ ✅ 100%       │ ⚠️  ~60% (some legacy components remain)     │
  ├──────────┼───────────────┼─────────────────────────────────────────────┤
  │ Attorney │ ✅ 100%       │ ✅ 100% (Sprint 007)                        │
  ├──────────┼───────────────┼─────────────────────────────────────────────┤
  │ Operator │ ✅ 100%       │ ✅ 100% (Sprint 009)                        │
  ├──────────┼───────────────┼─────────────────────────────────────────────┤
  │ Admin    │ ✅ 100%       │ ⚠️  ~60% (4 components are Sprint 010 scope) │
  └──────────┴───────────────┴─────────────────────────────────────────────┘

  ---
  Honest Distance to Each Milestone

  MVP launch — ~3 sprints away:
  - Sprint 010: Finish Angular 21 migration for 4 remaining admin components (tech debt, not user-visible but keeps codebase consistent)
  - Sprint 011: Landing page completion (hero copy, testimonials, FAQ, social proof)
  - Sprint 012: UX polish pass (systematic loading states, error messages, mobile audit, Lighthouse to >90)

  V1 (Revenue Optimization) — Months 2-3 after MVP:
  - Payment plans UI, subscription tiers, invoicing system, push notifications, analytics dashboard
  - No backend work exists for these yet; 12 person-weeks estimated

  V2 (Market Expansion) — Months 4-6:
  - Fleet bulk operations, compliance reports (DOT-ready), partner API
  - 24 person-weeks estimated

  V3 (AI/Native) — Months 7-12:
  - AI ticket assessment, predictive analytics, ELD integrations, native iOS/Android apps
  - 52 person-weeks, ML infrastructure, app store approvals

  ---
  The Bottom Line

  The core platform works end-to-end — all user roles can complete their primary flows. What's holding back MVP launch isn't missing features; it's polish: the
  landing page doesn't yet sell the product in 5 seconds, and the UX quality bars (loading states, error states, Lighthouse >90) aren't uniformly met.

  Sprint 010 (admin completion) is tech debt cleanup — worthwhile for maintainability but not a user-visible MVP blocker. You could skip it for now, do the landing
  page + UX polish sprints, and come back to it.

  Recommendation: After Sprint 010, run a focused "Launch Gate" sprint targeting the roadmap's 7 launch gates (landing page, Lighthouse score, WCAG audit, payment
  flow in test mode, error scenario coverage). That puts you at a releasable MVP.

  Ready to proceed with Sprint 010 whenever you are.

  - Sprint 014: Real-time notifications via Socket.io (bell icon, unread count, live updates)
  - Sprint 014: PWA offline support (service worker, manifest, offline page)
  - Sprint 014: Operator dashboard enhancements (bulk actions, case assignment workflow)