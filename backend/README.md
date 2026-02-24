# CDL Driver-Attorney Messaging System - Backend API

Complete Node.js/Express backend with Socket.io real-time messaging, Supabase database integration, and comprehensive security features.

## 🚀 Features

- **REST API**: Full CRUD operations for conversations, messages, and quick questions
- **Real-time Messaging**: Socket.io WebSocket server for instant message delivery
- **Authentication**: JWT-based authentication with Supabase Auth integration
- **File Uploads**: Secure file handling with Multer and Supabase Storage
- **Database**: PostgreSQL via Supabase with Row-Level Security (RLS)
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Error Handling**: Comprehensive error handling and logging

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- SendGrid account (for email notifications)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-secret-key

# Optional
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4200
```

### 3. Database Setup

Run the migration files in Supabase SQL Editor:

```bash
# Run in order:
1. migrations/001_messaging_schema.sql
2. migrations/002_messaging_rls_policies.sql
3. migrations/003_messaging_triggers_audit.sql
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start at: `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.js                    # Main entry point
│   ├── config/
│   │   └── supabase.js             # Supabase client
│   ├── middleware/
│   │   ├── auth.js                 # JWT authentication
│   │   ├── error.middleware.js     # Error handling
│   │   ├── validation.middleware.js # Request validation
│   │   └── upload.middleware.js    # File upload config
│   ├── routes/
│   │   ├── conversation.routes.js  # Conversation endpoints
│   │   ├── messages.routes.js      # Message endpoints
│   │   ├── quick-questions.routes.js
│   │   ├── auth.routes.js          # Authentication
│   │   ├── case.routes.js          # Case management
│   │   ├── user.routes.js          # User management
│   │   ├── file.routes.js          # File operations
│   │   └── notification.routes.js  # Notifications
│   ├── controllers/
│   │   ├── conversation.controller.js
│   │   ├── message.controller.js
│   │   └── quick-question.controller.js
│   ├── services/
│   │   ├── conversation.service.js  # Business logic
│   │   ├── message.service.js
│   │   ├── quick-question.service.js
│   │   └── storage.service.js       # File storage
│   ├── socket/
│   │   └── socket.js                # Socket.io server
│   └── utils/
│       └── errors.js                # Custom errors
├── migrations/                       # Database migrations
├── package.json
└── .env
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token

### Conversations
- `GET /api/conversations` - Get all conversations (paginated)
- `GET /api/conversations/:id` - Get single conversation
- `POST /api/conversations` - Create new conversation
- `DELETE /api/conversations/:id` - Delete conversation
- `POST /api/conversations/:id/video-link` - Generate video link
- `GET /api/conversations/:id/messages` - Get conversation messages

### Messages
- `POST /api/messages` - Send text message
- `POST /api/messages/file` - Send message with file
- `POST /api/messages/:id/read` - Mark as read
- `DELETE /api/messages/:id` - Delete message
- `GET /api/messages/:id` - Get message details

### Quick Questions
- `GET /api/quick-questions` - Get all quick questions
- `POST /api/quick-questions` - Create (Admin only)
- `PUT /api/quick-questions/:id` - Update (Admin only)
- `DELETE /api/quick-questions/:id` - Delete (Admin only)

### Health Check
- `GET /health` - Server health status
- `GET /api/health` - API health status

## 🔐 Authentication

All protected routes require JWT token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Role-Based Access Control

- **Driver**: Can create conversations, send/receive messages
- **Attorney**: Can respond to messages, generate video links
- **Admin**: Full access to all resources

## 🔄 Real-time WebSocket Events

### Client → Server Events

```javascript
// Join conversation
socket.emit('join-conversation', { conversationId: 'uuid' });

// Leave conversation
socket.emit('leave-conversation', { conversationId: 'uuid' });

// Typing indicators
socket.emit('typing-start', { conversationId: 'uuid' });
socket.emit('typing-stop', { conversationId: 'uuid' });

// Get online users
socket.emit('get-online-users');
```

### Server → Client Events

```javascript
// New message received
socket.on('new-message', (message) => { });

// Message marked as read
socket.on('message-read', (data) => { });

// Message deleted
socket.on('message-deleted', (data) => { });

// User typing
socket.on('user-typing', (data) => { });

// User stopped typing
socket.on('user-stopped-typing', (data) => { });

// User online/offline
socket.on('user-online', (data) => { });
socket.on('user-offline', (data) => { });

// Video link generated
socket.on('video-link-generated', (data) => { });
```

## 📦 Dependencies

### Core
- `express` - Web framework
- `socket.io` - Real-time WebSocket
- `@supabase/supabase-js` - Database client
- `jsonwebtoken` - JWT authentication

### Security
- `helmet` - Security headers
- `cors` - Cross-origin resource sharing
- `express-validator` - Input validation

### File Handling
- `multer` - File upload middleware

### Email
- `@sendgrid/mail` - Email notifications
- `nodemailer` - Alternative email service

### Utilities
- `dotenv` - Environment variables
- `uuid` - Unique ID generation
- `morgan` - HTTP request logger

## 🧪 Testing

```bash
# Run tests (once implemented)
npm test
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=your-production-url
SUPABASE_ANON_KEY=your-production-key
JWT_SECRET=strong-random-secret
FRONTEND_URL=https://your-app.com
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

## 📝 Database Schema

See `migrations/` folder for complete schema including:

- **users** - User accounts (linked to Supabase Auth)
- **cases** - Legal cases
- **conversations** - Message threads
- **messages** - Individual messages
- **message_attachments** - File attachments
- **quick_questions** - Pre-defined questions
- **video_call_links** - Video meeting links
- **message_audit_log** - Compliance audit trail

## 🔒 Security Features

- JWT token authentication
- Row-Level Security (RLS) policies
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Rate limiting
- File type and size validation
- SQL injection protection (via Supabase)

## 📊 Error Handling

All errors follow standard format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

## 🐛 Troubleshooting

### Connection Issues

```bash
# Check Supabase connection
node -e "require('./src/config/supabase').testConnection()"
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Environment Variables

```bash
# Verify .env is loaded
node -e "console.log(process.env.SUPABASE_URL)"
```

## 📞 Support

For issues or questions:
- Check documentation in `/docs`
- Review migration files in `/migrations`
- Consult architecture document

## 📄 License

ISC

## 👨‍💻 Author

Pavlo Tkachenko
