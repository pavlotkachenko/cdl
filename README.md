# Driver-Attorney Messaging Platform

A real-time messaging application built with Angular that enables seamless communication between drivers and their legal representatives. The platform provides a secure, feature-rich chat interface with file sharing, quick questions, and video conferencing integration.

![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=flat&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript)
![Material](https://img.shields.io/badge/Material-UI-0081CB?style=flat&logo=material-ui)
![Socket.io](https://img.shields.io/badge/Socket.io-4.0+-010101?style=flat&logo=socket.io)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Features](#features)
  - [Implemented Features](#implemented-features)
  - [Planned Features](#planned-features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Usage](#usage)
- [Testing](#testing)
- [API Integration](#api-integration)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

The Driver-Attorney Messaging Platform is a modern, real-time communication system designed to facilitate efficient and secure conversations between drivers and their legal attorneys. The application provides a familiar chat interface with specialized features tailored for legal consultation and case management.

### Use Cases

1. **Case Updates**: Attorneys can provide real-time updates on case progress
2. **Document Sharing**: Quick and secure exchange of legal documents and evidence
3. **Virtual Consultations**: Integrated video conferencing for remote meetings
4. **Quick Responses**: Pre-configured quick questions for common inquiries
5. **Evidence Collection**: Photo and document upload for accident reports
6. **Timeline Tracking**: Message history for case documentation
7. **Multi-Attorney Support**: Manage conversations with multiple legal representatives

---

## 🛠 Technology Stack

### Frontend Framework
- **Angular 17+** - Modern web application framework
- **TypeScript 5.0+** - Type-safe JavaScript
- **RxJS** - Reactive programming with observables
- **Angular Material** - Material Design component library

### UI/UX Libraries
- **Angular Material Components**
  - `@angular/material` - UI components
  - `@angular/cdk` - Component Dev Kit
  - `@angular/animations` - Animation framework
- **Angular Material Modules Used**:
  - MatCardModule
  - MatListModule
  - MatFormFieldModule
  - MatInputModule
  - MatButtonModule
  - MatIconModule
  - MatBadgeModule
  - MatDividerModule
  - MatChipsModule
  - MatMenuModule
  - MatTooltipModule
  - MatProgressSpinnerModule
  - MatDialogModule

### Real-time Communication
- **Socket.io Client 4.0+** - WebSocket-based real-time bidirectional communication
- **RxJS Subjects** - Event-driven message handling

### State Management
- **RxJS BehaviorSubjects** - Reactive state management
- **Angular Services** - Singleton pattern for data sharing

### HTTP Client
- **Angular HttpClient** - RESTful API communication
- **HTTP Interceptors** - Request/response handling

### Development Tools
- **Angular CLI** - Project scaffolding and build tools
- **TypeScript ESLint** - Code quality and linting
- **Prettier** - Code formatting
- **Karma & Jasmine** - Unit testing
- **Protractor/Cypress** - E2E testing (optional)

### Build & Deployment
- **Webpack** (via Angular CLI) - Module bundling
- **Angular Build Optimizer** - Production optimization
- **Ahead-of-Time (AOT) Compilation** - Performance optimization

---

## ✅ Features

### Implemented Features

#### 🎨 **User Interface**
- ✅ Modern, responsive chat interface
- ✅ Conversation list with avatars and previews
- ✅ Real-time message display
- ✅ Typing indicators
- ✅ Online/offline status indicators
- ✅ Unread message badges
- ✅ Mobile-responsive design
- ✅ Smooth animations and transitions
- ✅ Professional gradient design system

#### 💬 **Messaging Core**
- ✅ Real-time message sending and receiving
- ✅ Message threading by conversation
- ✅ Conversation selection and switching
- ✅ Message timestamps with smart formatting
  - "Just now"
  - "5m ago"
  - "2h ago"
  - "3d ago"
  - Full date for older messages
- ✅ Message delivery status
- ✅ Read receipts (sent ✓ / read ✓✓)
- ✅ Character-level type-safety with TypeScript

#### 📎 **File Management**
- ✅ File attachment support (up to 10MB)
- ✅ Multiple file type support:
  - Documents (PDF, Word, Excel)
  - Images (PNG, JPG, GIF, WebP)
  - Videos
- ✅ File preview cards
- ✅ File size formatting and validation
- ✅ Drag-and-drop file selection
- ✅ File type icons
- ✅ Download capability for attachments

#### ⚡ **Quick Actions**
- ✅ Quick Questions panel
  - "What is the status of my case?"
  - "When is my next court date?"
  - "Do you need any documents from me?"
  - "What are the next steps?"
  - "Can we schedule a call?"
  - "What is the expected timeline?"
- ✅ Quick question categorization (status, court, documents, process, meeting, timeline)
- ✅ One-click message sending
- ✅ Expandable/collapsible panel

#### 🎥 **Video Integration**
- ✅ Zoom meeting link generation
- ✅ Google Meet link generation
- ✅ Auto-populate meeting links in messages
- ✅ One-click video call initiation

#### 🔔 **Notifications**
- ✅ Browser notification sound on new messages
- ✅ Visual typing indicators
- ✅ Conversation unread count
- ✅ Real-time conversation list updates

#### 🔒 **Data & State Management**
- ✅ Type-safe data models
- ✅ RxJS-based state management
- ✅ Real-time WebSocket connection
- ✅ Automatic reconnection handling
- ✅ Optimistic UI updates
- ✅ Conversation join/leave events
- ✅ Message read status tracking

#### 🧪 **Testing & Development**
- ✅ Mock service for development
- ✅ Test data with 3 sample conversations
- ✅ Auto-response simulation
- ✅ Periodic incoming message simulation
- ✅ No backend required for UI development
- ✅ Comprehensive type definitions

#### 🎨 **UI/UX Features**
- ✅ Conversation search functionality
- ✅ Message scrolling with auto-scroll to bottom
- ✅ Smooth message animations
- ✅ Loading states and spinners
- ✅ Empty state handling
- ✅ Error state handling
- ✅ Responsive breakpoints (mobile/tablet/desktop)
- ✅ Accessibility support (ARIA labels, keyboard navigation)

---

### 📅 Planned Features

#### 🔐 **Authentication & Security**
- ⏳ User authentication system
- ⏳ JWT token-based authorization
- ⏳ OAuth integration (Google, Microsoft)
- ⏳ Two-factor authentication (2FA)
- ⏳ End-to-end encryption for sensitive messages
- ⏳ Message encryption at rest
- ⏳ Secure file upload with virus scanning
- ⏳ Session management and timeout
- ⏳ Role-based access control (RBAC)
- ⏳ User blocking and reporting

#### 💬 **Enhanced Messaging**
- ⏳ Message editing capability
- ⏳ Message deletion (soft delete)
- ⏳ Message reactions/emoji support
- ⏳ Message threading/replies
- ⏳ Message forwarding
- ⏳ Rich text formatting (bold, italic, links)
- ⏳ Code snippet support with syntax highlighting
- ⏳ Message pinning (important messages)
- ⏳ Message starring/favoriting
- ⏳ Draft message saving
- ⏳ Scheduled messages
- ⏳ Message templates for common responses

#### 🔍 **Search & Organization**
- ⏳ Advanced message search
  - Full-text search across all conversations
  - Search by date range
  - Search by file type
  - Search by sender
- ⏳ Message filtering (files only, unread only, etc.)
- ⏳ Conversation archiving
- ⏳ Conversation labeling/tagging
- ⏳ Conversation pinning
- ⏳ Custom conversation folders
- ⏳ Conversation muting
- ⏳ Export conversation history (PDF, CSV, JSON)

#### 👥 **Group & Multi-User Features**
- ⏳ Group conversations
- ⏳ Add/remove participants
- ⏳ Group naming and avatars
- ⏳ Group admin roles
- ⏳ @mention notifications
- ⏳ Participant typing indicators
- ⏳ Multi-attorney consultations
- ⏳ Case team discussions

#### 📱 **Media & Rich Content**
- ⏳ Voice message recording
- ⏳ Audio playback controls
- ⏳ Image preview in chat
- ⏳ Video preview and playback
- ⏳ Image gallery view
- ⏳ Screen sharing capability
- ⏳ PDF inline preview
- ⏳ Link preview with thumbnails
- ⏳ GIF and sticker support
- ⏳ Location sharing
- ⏳ Contact card sharing

#### 🔔 **Advanced Notifications**
- ⏳ Push notifications (PWA)
- ⏳ Email notifications
- ⏳ SMS notifications
- ⏳ Notification preferences/settings
- ⏳ Do Not Disturb mode
- ⏳ Notification sounds customization
- ⏳ Desktop notifications
- ⏳ Notification grouping
- ⏳ Notification actions (reply, mark read)

#### 🎥 **Video & Voice Calling**
- ⏳ In-app video calling (WebRTC)
- ⏳ In-app voice calling
- ⏳ Screen sharing during calls
- ⏳ Call recording (with consent)
- ⏳ Call history and logs
- ⏳ Virtual waiting room
- ⏳ Call scheduling
- ⏳ Calendar integration

#### 📊 **Analytics & Insights**
- ⏳ Message analytics dashboard
- ⏳ Response time tracking
- ⏳ Conversation activity metrics
- ⏳ User engagement statistics
- ⏳ Peak usage time analysis
- ⏳ Case resolution tracking
- ⏳ Attorney performance metrics

#### 🔧 **Integration & Automation**
- ⏳ Calendar integration (Google Calendar, Outlook)
- ⏳ Document management system integration
- ⏳ CRM integration
- ⏳ Legal case management software integration
- ⏳ Automated case status updates
- ⏳ Bot integration for FAQs
- ⏳ Workflow automation
- ⏳ Zapier/IFTTT webhooks
- ⏳ Email-to-chat bridge

#### 👤 **User Profile & Settings**
- ⏳ User profile management
- ⏳ Avatar upload and customization
- ⏳ Status messages
- ⏳ Availability settings
- ⏳ Notification preferences
- ⏳ Theme customization (dark mode)
- ⏳ Language settings (i18n)
- ⏳ Accessibility settings
- ⏳ Privacy settings
- ⏳ Data export request

#### 📱 **Mobile & Cross-Platform**
- ⏳ Progressive Web App (PWA) support
- ⏳ Offline mode with sync
- ⏳ Native mobile apps (iOS/Android)
- ⏳ Tablet-optimized interface
- ⏳ Desktop application (Electron)
- ⏳ Browser extension

#### 🛡️ **Compliance & Legal**
- ⏳ GDPR compliance features
- ⏳ HIPAA compliance (if needed)
- ⏳ Audit logging
- ⏳ Data retention policies
- ⏳ Legal hold functionality
- ⏳ Terms of service acceptance tracking
- ⏳ Privacy policy management
- ⏳ Cookie consent management

#### 🎯 **Advanced Features**
- ⏳ AI-powered message suggestions
- ⏳ Smart reply recommendations
- ⏳ Automatic language translation
- ⏳ Sentiment analysis
- ⏳ Priority inbox (important messages)
- ⏳ Conversation summarization
- ⏳ Smart search with NLP
- ⏳ Chatbot for common queries

#### 🔄 **Reliability & Performance**
- ⏳ Message queue for offline sending
- ⏳ Message retry mechanism
- ⏳ Connection status indicator
- ⏳ Automatic reconnection
- ⏳ Message pagination (infinite scroll)
- ⏳ Image lazy loading
- ⏳ Virtual scrolling for large conversations
- ⏳ Service worker for caching
- ⏳ CDN for static assets

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 18.x
- **npm**: >= 9.x (comes with Node.js)
- **Angular CLI**: >= 17.x
  ```bash
  npm install -g @angular/cli
  ```

**Recommended Tools:**
- **VS Code** with Angular Language Service extension
- **Git** for version control
- **Chrome/Firefox DevTools** for debugging

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/driver-attorney-messaging.git
cd driver-attorney-messaging
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Install Required Packages

The following packages will be installed automatically via `npm install`:

```bash
# Core Angular packages (automatically installed)
@angular/animations
@angular/cdk
@angular/common
@angular/compiler
@angular/core
@angular/forms
@angular/material
@angular/platform-browser
@angular/platform-browser-dynamic
@angular/router

# Real-time communication
socket.io-client

# Utilities
rxjs
tslib
zone.js
```

### 4. Environment Configuration

Create environment files if they don't exist:

```bash
# Development environment
cat > src/environments/environment.ts << 'EOF'
export const environment = {
  production: false,
  useMockData: true, // Set to false when backend is ready
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'http://localhost:3000',
  features: {
    enableFileUploads: true,
    enableVideoLinks: true,
    enableQuickQuestions: true,
    enableNotifications: true
  }
};
EOF

# Production environment
cat > src/environments/environment.prod.ts << 'EOF'
export const environment = {
  production: true,
  useMockData: false,
  apiUrl: 'https://api.yourapp.com/api',
  wsUrl: 'https://api.yourapp.com',
  features: {
    enableFileUploads: true,
    enableVideoLinks: true,
    enableQuickQuestions: true,
    enableNotifications: true
  }
};
EOF
```

### 5. Start Development Server

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/messages`

The application will automatically reload if you change any of the source files.

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   └── services/
│   │   │       └── auth.service.ts          # Authentication service
│   │   │
│   │   ├── features/
│   │   │   └── driver/
│   │   │       ├── services/
│   │   │       │   ├── messaging.service.ts       # Main messaging service
│   │   │       │   └── messaging.service.mock.ts  # Mock service for testing
│   │   │       │
│   │   │       └── messages/
│   │   │           ├── messages.component.ts      # Main component
│   │   │           ├── messages.component.html    # Template
│   │   │           ├── messages.component.scss    # Styles
│   │   │           └── messages.component.spec.ts # Unit tests
│   │   │
│   │   ├── shared/
│   │   │   ├── components/                  # Reusable components
│   │   │   ├── models/                      # Data models
│   │   │   └── utils/                       # Utility functions
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.routes.ts                    # Application routes
│   │   └── app.config.ts                    # Application configuration
│   │
│   ├── assets/
│   │   ├── sounds/
│   │   │   └── notification.mp3             # Notification sound
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── environments/
│   │   ├── environment.ts                   # Development config
│   │   └── environment.prod.ts              # Production config
│   │
│   ├── styles/
│   │   ├── _variables.scss                  # SCSS variables
│   │   ├── _mixins.scss                     # SCSS mixins
│   │   └── styles.scss                      # Global styles
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
│
├── angular.json                             # Angular CLI configuration
├── package.json                             # NPM dependencies
├── tsconfig.json                            # TypeScript configuration
├── tsconfig.app.json                        # App-specific TS config
├── tsconfig.spec.json                       # Test-specific TS config
└── README.md                                # This file
```

---

## ⚙️ Configuration

### Application Configuration

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  
  // Toggle mock data for development
  useMockData: true,
  
  // Backend API endpoints
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'http://localhost:3000',
  
  // Feature flags
  features: {
    enableFileUploads: true,
    enableVideoLinks: true,
    enableQuickQuestions: true,
    enableNotifications: true
  }
};
```

### Switching Between Mock and Real Backend

**Development with Mock Data:**
```typescript
// In messages.component.ts
import { MockMessagingService } from '../services/messaging.service.mock';

constructor(
  private messagingService: MockMessagingService,
  // ...
)
```

**Production with Real Backend:**
```typescript
// In messages.component.ts
import { MessagingService } from '../services/messaging.service';

constructor(
  private messagingService: MessagingService,
  // ...
)
```

---

## 💻 Usage

### Starting the Application

```bash
# Development mode
npm start

# Development with specific port
ng serve --port 4300

# Production build
npm run build

# Run with production configuration
ng serve --configuration production
```

### Testing with Mock Data

The application includes a comprehensive mock service for development:

1. **Navigate to** `http://localhost:4200/messages`
2. **See 3 pre-loaded conversations**:
   - Sarah Attorney (2 unread messages, online)
   - Michael Johnson (Legal Associates)
   - Emily Roberts (LegalCorp, online)
3. **Click a conversation** to view message history
4. **Send a message** - you'll get an auto-response in 2-5 seconds
5. **Attach a file** - click the 📎 icon
6. **Use quick questions** - click the 🔍 icon
7. **Generate video link** - click ⋮ menu → "Start Zoom Call"

**Mock Service Features:**
- 3 sample conversations with message history
- Auto-responses from attorneys (2-5 second delay)
- Periodic incoming messages (every 15 seconds)
- Typing indicators
- Read receipts
- Online/offline status
- File attachment simulation

---

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in headless mode
npm run test:headless
```

### End-to-End Tests

```bash
# Run E2E tests
npm run e2e

# Run E2E tests in headless mode
npm run e2e:headless
```

### Test Coverage

Aim for:
- **>80% code coverage** for services
- **>70% code coverage** for components
- **100% coverage** for utility functions

---

## 🔌 API Integration

### Backend Requirements

The application expects the following REST API endpoints:

#### **Conversations**
```
GET    /api/conversations              # Get all conversations
GET    /api/conversations/:id          # Get single conversation
POST   /api/conversations              # Create new conversation
DELETE /api/conversations/:id          # Delete conversation
```

#### **Messages**
```
GET    /api/conversations/:id/messages      # Get messages
POST   /api/conversations/:id/messages      # Send message
POST   /api/conversations/:id/messages/file # Send message with file
PUT    /api/messages/:id/read               # Mark message as read
DELETE /api/messages/:id                    # Delete message
```

#### **Quick Questions**
```
GET    /api/quick-questions            # Get quick questions
POST   /api/quick-questions            # Create quick question
```

#### **Video Links**
```
POST   /api/conversations/:id/video-link  # Generate video link
```

### WebSocket Events

The application expects the following Socket.io events:

#### **Client → Server**
```javascript
'join-conversation'   { conversationId: string }
'leave-conversation'  { conversationId: string }
'typing-start'        { conversationId: string }
'typing-stop'         { conversationId: string }
'send-message'        { conversationId: string, content: string }
```

#### **Server → Client**
```javascript
'new-message'    Message
'typing'         { conversationId: string, userId: string }
'user-online'    { userId: string, userName: string }
'user-offline'   { userId: string }
'message-read'   { conversationId: string, userId: string, readAt: Date }
```

### Authentication

All API requests should include authentication:

```typescript
headers: {
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

WebSocket connection:
```typescript
socket = io(wsUrl, {
  auth: {
    token: localStorage.getItem('token')
  }
});
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Write/update tests**
5. **Ensure tests pass**
   ```bash
   npm test
   npm run lint
   ```
6. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
7. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

### Code Style

- Follow Angular style guide
- Use TypeScript strict mode
- Write meaningful commit messages
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use meaningful variable names

### Commit Message Format

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Example:**
```
feat(messages): add message editing functionality

- Add edit button to message bubbles
- Implement edit mode UI
- Add API call for message updates
- Update tests

Closes #123
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Project Lead**: [Your Name]
- **Frontend Developer**: [Developer Name]
- **Backend Developer**: [Developer Name]
- **UI/UX Designer**: [Designer Name]

---

## 📞 Support

For support, please:
- 📧 Email: support@yourapp.com
- 💬 Slack: #messaging-support
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/driver-attorney-messaging/issues)
- 📖 Documentation: [Wiki](https://github.com/your-org/driver-attorney-messaging/wiki)

---

## 🎯 Roadmap

### Q1 2024
- ✅ Basic messaging interface
- ✅ File attachments
- ✅ Quick questions
- ⏳ User authentication
- ⏳ Backend API integration

### Q2 2024
- ⏳ Message search
- ⏳ Push notifications
- ⏳ Voice messages
- ⏳ Group conversations
- ⏳ Mobile app (PWA)

### Q3 2024
- ⏳ In-app video calling
- ⏳ Message encryption
- ⏳ Advanced analytics
- ⏳ Calendar integration
- ⏳ AI-powered features

### Q4 2024
- ⏳ Native mobile apps
- ⏳ Desktop application
- ⏳ Enterprise features
- ⏳ API for third-party integrations

---

## 🙏 Acknowledgments

- Angular team for the amazing framework
- Material Design for the design system
- Socket.io team for real-time communication
- All contributors and testers

---

## 📈 Project Status

**Current Version**: 1.0.0-beta  
**Status**: Active Development  
**Last Updated**: February 2024  

---

**Made with ❤️ by [Your Team Name]**
