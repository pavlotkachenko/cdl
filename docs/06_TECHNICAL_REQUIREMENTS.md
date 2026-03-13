# Technical Requirements Document (TRD)

**Project:** CDL Ticket Management System  
**Version:** 1.0  
**Date:** March 2026  
**Status:** Production-Ready (85% Complete)

---

## Executive Summary

This document defines the technical architecture, technology stack, security requirements, performance specifications, and infrastructure needs for the CDL Ticket Management System - a multi-tenant B2B SaaS platform serving drivers, carriers, and attorneys.

**Core Principle:** Technology serves user experience. Every technical decision prioritizes simplicity, performance, and reliability.

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Angular 18 PWA (Progressive Web App)                        │
│  - Desktop Browser (Chrome, Firefox, Safari, Edge)           │
│  - Mobile Browser (iOS Safari, Android Chrome)               │
│  - Installable (Add to Home Screen)                          │
│  - Offline Capable (Service Workers)                         │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/TLS 1.3
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Node.js 18+ / Express.js                                    │
│  - RESTful API                                               │
│  - JWT Authentication                                        │
│  - Role-Based Access Control (RBAC)                          │
│  - WebSocket for Real-Time Updates                           │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL 15+ (via Supabase)                               │
│  - Row-Level Security (RLS)                                  │
│  - Real-Time Subscriptions                                   │
│  - Automated Backups                                         │
│  - Point-in-Time Recovery                                    │
└─────────────────────────────────────────────────────────────┘
                            ↕ 
┌─────────────────────────────────────────────────────────────┐
│                   STORAGE LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  Supabase Storage                                            │
│  - Ticket photos/documents                                   │
│  - User-uploaded files                                       │
│  - Generated reports (PDFs)                                  │
└─────────────────────────────────────────────────────────────┘
                            ↕ 
┌─────────────────────────────────────────────────────────────┐
│                THIRD-PARTY INTEGRATIONS                      │
├─────────────────────────────────────────────────────────────┤
│  - Stripe (Payment Processing)                               │
│  - Twilio (SMS Notifications)                                │
│  - SendGrid (Email Delivery)                                 │
│  - OCR Service (Ticket Scanning)                             │
│  - Google Maps (Court Locations)                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Patterns

**Frontend:**
- Single Page Application (SPA)
- Component-Based Architecture
- Reactive Programming (RxJS)
- State Management via Services
- Lazy Loading for Performance

**Backend:**
- RESTful API Design
- Layered Architecture (Routes → Controllers → Services → Models)
- Dependency Injection
- Middleware Pattern (Auth, Logging, Error Handling)
- Event-Driven for Real-Time Features

**Database:**
- Normalized Schema (3NF)
- Row-Level Security for Multi-Tenancy
- Indexed for Performance
- Migrations for Version Control

---

## 2. Technology Stack

### 2.1 Frontend Technologies

#### Core Framework
- **Angular 18** (Latest Stable)
  - Framework: Component-based with TypeScript
  - Why: Enterprise-ready, opinionated, batteries-included
  - Benefits: Strong TypeScript support, powerful forms, built-in routing

#### UI Components
- **Angular Material 18**
  - Component Library: Pre-built, accessible UI components
  - Design System: Material Design 3
  - Benefits: Professional look, accessibility built-in, mobile-friendly

#### State Management
- **RxJS 7+**
  - Reactive Programming Library
  - Benefits: Powerful async handling, real-time data streams

#### Progressive Web App (PWA)
- **@angular/service-worker**
  - Service Workers: Offline capability, background sync
  - Manifest: Install to home screen
  - Benefits: App-like experience, works offline, push notifications

#### Build Tools
- **Angular CLI**
  - Development Server: Hot module replacement
  - Production Build: Ahead-of-Time (AOT) compilation, tree shaking
  - Testing: Jasmine + Karma

#### Additional Libraries
- **Chart.js**: Data visualization (dashboards)
- **date-fns**: Date manipulation
- **validator.js**: Input validation

---

### 2.2 Backend Technologies

#### Core Framework
- **Node.js 18+ LTS**
  - Runtime: JavaScript on the server
  - Why: JavaScript everywhere, huge ecosystem, excellent async
  - Version: 18 LTS (Long-Term Support)

- **Express.js 4.18+**
  - Web Framework: Minimal, flexible
  - Benefits: Mature, well-documented, huge middleware ecosystem

#### Language
- **TypeScript 5+** (Optional but Recommended)
  - Type Safety: Catch errors at compile time
  - Benefits: Better IDE support, refactoring, documentation

#### Authentication & Security
- **jsonwebtoken (JWT)**
  - Tokens: Stateless authentication
  - Expiration: 7-day default
  
- **bcrypt**
  - Password Hashing: Industry standard
  - Salt Rounds: 10 (balance of security and performance)

- **express-validator**
  - Input Validation: Sanitization and validation
  - Benefits: Prevent SQL injection, XSS

#### Real-Time Communication
- **Socket.io 4.8** (Active — not optional)
  - WebSockets: Real-time bidirectional communication
  - Use Cases: Live ticket updates, chat, operator notifications, assignment approvals
  - **Room Architecture:**
    - `user:<userId>` — per-user room for targeted notifications
    - `role:<roleName>` — role-based rooms (e.g., `role:operator` for broadcast to all operators)
    - `case:<caseId>` — per-case rooms for live case updates
  - **Server → Client Events (Operator):**
    - `notification:new` — new notification for the operator (assignment updates, case changes)
    - `assignment:approved` — operator's assignment request was approved by admin
    - `assignment:rejected` — operator's assignment request was rejected by admin
    - `case:statusUpdate` — case status changed (for cases the operator is subscribed to)
    - `message:new` — new message in a case conversation
  - **Emit Helpers** (`backend/src/socket/socket.js`):
    - `emitToUser(userId, event, data)` — emit to a specific user's room
    - `emitToRole(role, event, data)` — emit to all users with a given role
    - `emitToCase(caseId, event, data)` — emit to all subscribers of a case

#### File Handling
- **Multer**
  - File Uploads: Middleware for multipart/form-data
  - Use: Ticket photos, documents

#### API Documentation
- **Swagger/OpenAPI** (Recommended)
  - Documentation: Auto-generated API docs
  - Benefits: Testing interface, client SDK generation

---

### 2.3 Database & Storage

#### Primary Database
- **PostgreSQL 15+** (via Supabase)
  - Relational Database: ACID compliant
  - Why: Robust, scalable, excellent for complex queries
  - Hosting: Supabase (managed PostgreSQL)

#### Database Features
- **Row-Level Security (RLS)**
  - Multi-Tenancy: Each user sees only their data
  - Security: Enforced at database level

- **Real-Time Subscriptions**
  - Live Updates: Database changes pushed to clients
  - Use: Ticket status updates, new messages

- **Automated Backups**
  - Point-in-Time Recovery: Last 7-30 days
  - Daily Snapshots: Encrypted, geographically distributed

#### File Storage
- **Supabase Storage**
  - Object Storage: S3-compatible
  - Use Cases: Ticket photos, court documents, PDFs
  - Features: Signed URLs, automatic image optimization

#### Migrations
- **Supabase Migrations**
  - Version Control: SQL migration files
  - Current: 15+ migrations (001-015+)
  - Format: Numbered SQL files (001_initial.sql, 002_add_carriers.sql)

---

### 2.4 Third-Party Services

#### Payment Processing
- **Stripe**
  - Payments: Credit/debit cards, ACH
  - Features: One-time payments, subscriptions, payment plans
  - Compliance: PCI DSS Level 1 (handled by Stripe)
  - Integration: Stripe Elements (frontend), Stripe API (backend)

#### Communications
- **Twilio**
  - SMS: Text notifications (court reminders, status updates)
  - Use Cases: Time-sensitive alerts, 2FA (optional)
  - Benefits: High delivery rate, international support

- **SendGrid**
  - Email: Transactional emails
  - Templates: Welcome, password reset, receipts
  - Analytics: Open rates, click tracking

#### Location Services
- **Google Maps API**
  - Use: Display court locations
  - Features: Geocoding, directions
  - Alternative: OpenStreetMap (free alternative)

#### OCR (Optical Character Recognition)
- **Tesseract.js** or **Google Vision API**
  - Use: Extract text from ticket photos
  - Benefits: Auto-fill ticket details, reduce manual entry

---

## 3. Security Requirements

### 3.1 Authentication & Authorization

#### Authentication
- **JWT (JSON Web Tokens)**
  - Algorithm: HS256 (HMAC with SHA-256)
  - Payload: userId, email, role
  - Expiration: 7 days default
  - Storage: localStorage (frontend), HTTP-only cookies (alternative)

#### Password Security
- **Hashing: bcrypt**
  - Salt Rounds: 10
  - Never store plain text passwords
  - Reset tokens: Time-limited, single-use

#### Multi-Factor Authentication (Future)
- **SMS-based 2FA** (via Twilio)
  - Optional for carriers/attorneys
  - Recommended for admin/paralegals

#### Role-Based Access Control (RBAC)
```typescript
Roles:
- driver: Can view own tickets, submit tickets, message assigned attorney
- carrier: Can view drivers' tickets, manage fleet, access reports
- attorney: Can view assigned cases, update case status, message clients
- admin: Full system access, user management, system configuration
- paralegal: Limited admin access, case support

Permissions enforced at:
- API level (middleware)
- Database level (RLS)
- Frontend level (route guards)
```

---

### 3.2 Data Security

#### Encryption
- **In Transit: TLS 1.3**
  - All API communication over HTTPS
  - Certificate: Let's Encrypt (auto-renewed)
  - Minimum TLS Version: 1.2 (1.3 preferred)

- **At Rest: Database Encryption**
  - PostgreSQL: Encrypted at rest (via Supabase)
  - Storage: AES-256 encryption for files
  - Backups: Encrypted

#### Sensitive Data Handling
- **PII (Personally Identifiable Information)**
  - Stored: Encrypted in database
  - Access: Logged (audit trail)
  - Retention: Per GDPR guidelines (right to deletion)

- **Payment Information**
  - Never stored directly
  - Tokenized via Stripe
  - PCI DSS Compliance: Handled by Stripe

---

### 3.3 Application Security

#### Input Validation
- **Server-Side Validation**
  - All inputs validated before processing
  - Sanitization: Remove malicious code
  - Type checking: Prevent type confusion

#### SQL Injection Prevention
- **Parameterized Queries**
  - ORM: Sequelize or Prisma (prevents SQL injection)
  - Never concatenate user input into SQL

#### XSS (Cross-Site Scripting) Prevention
- **Angular: Built-in XSS protection**
  - Automatic sanitization of templates
  - DomSanitizer for trusted HTML

#### CSRF (Cross-Site Request Forgery) Prevention
- **CSRF Tokens**
  - Double-submit cookie pattern
  - OR: SameSite cookie attribute

#### Rate Limiting
- **Express Rate Limit**
  - Login attempts: 5 per 15 minutes
  - API requests: 100 per 15 minutes per IP
  - Purpose: Prevent brute force, DoS attacks

#### Security Headers
```javascript
helmet.js middleware:
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: max-age=31536000
```

---

### 3.4 Compliance

#### GDPR (General Data Protection Regulation)
- **User Rights:**
  - Right to access data
  - Right to deletion
  - Right to data portability
  - Consent management

- **Implementation:**
  - Data export functionality
  - Account deletion (anonymize data)
  - Cookie consent banner
  - Privacy policy

#### PCI DSS (Payment Card Industry)
- **Level:** SAQ-A (Stripe handles card data)
- **Requirements:**
  - Never store card numbers
  - Use Stripe Elements (reduces scope)
  - Annual compliance questionnaire

#### SOC 2 (Future)
- **Service Organization Control**
  - Audit: Third-party security audit
  - Timeline: Year 2-3

---

## 4. Performance Requirements

### 4.1 Frontend Performance

#### Load Time Targets
- **First Contentful Paint (FCP): < 1.5 seconds**
  - Mobile: < 2 seconds
  - Desktop: < 1 second

- **Time to Interactive (TTI): < 3 seconds**
  - Mobile: < 4 seconds
  - Desktop: < 2.5 seconds

- **Largest Contentful Paint (LCP): < 2.5 seconds**

#### Optimization Techniques
- **Code Splitting**
  - Lazy loading: Load routes on demand
  - Benefits: Smaller initial bundle

- **Tree Shaking**
  - Remove unused code
  - Angular CLI: Built-in with production builds

- **Image Optimization**
  - Format: WebP (fallback to JPEG/PNG)
  - Lazy loading: Intersection Observer
  - Responsive images: srcset

- **Caching**
  - Service Worker: Cache static assets
  - HTTP caching: Cache-Control headers
  - CDN: Serve static assets (future)

#### Bundle Size Targets
- **Initial Bundle: < 500 KB (gzipped)**
- **Lazy-Loaded Chunks: < 200 KB each**

---

### 4.2 Backend Performance

#### API Response Time
- **p50 (median): < 200ms**
- **p95: < 500ms**
- **p99: < 1000ms**

#### Database Performance
- **Query Execution: < 100ms**
  - Indexed queries: < 50ms
  - Complex joins: < 200ms

- **Connection Pool:**
  - Min: 5 connections
  - Max: 20 connections
  - Idle timeout: 30 seconds

#### Caching Strategy (Future)
- **Redis (if needed)**
  - Session data
  - Frequently accessed queries
  - Rate limit counters

---

### 4.3 Scalability

#### Horizontal Scaling
- **Application Servers:**
  - Stateless design (enables horizontal scaling)
  - Load balancer: Distribute traffic
  - Target: Handle 10,000+ concurrent users

#### Database Scaling
- **Read Replicas** (Supabase feature)
  - Separate read/write workloads
  - Reduce load on primary database

#### File Storage Scaling
- **Supabase Storage:**
  - Automatic scaling
  - CDN integration (global distribution)

#### Capacity Planning
```
Current Target (MVP):
- 1,000 active users
- 5,000 tickets/month
- 99.5% uptime

Year 1 Target:
- 10,000 active users
- 50,000 tickets/month
- 99.9% uptime

Year 2+ Target:
- 100,000+ active users
- 500,000+ tickets/month
- 99.95% uptime
```

---

## 5. Infrastructure & DevOps

### 5.1 Hosting

#### Frontend
- **Vercel** or **Netlify** (Recommended)
  - Static Site Hosting
  - Global CDN
  - Automatic deployments from Git
  - Free tier sufficient for MVP

- **Alternative: AWS S3 + CloudFront**

#### Backend
- **Railway** or **Render** (Recommended for MVP)
  - Container-based hosting
  - Auto-scaling
  - Integrated with GitHub
  - Free tier available

- **Alternative: AWS EC2, Google Cloud Run, Azure App Service**

#### Database
- **Supabase** (Current)
  - Managed PostgreSQL
  - Automatic backups
  - Free tier: 500MB, 2GB transfer
  - Paid tier: Scales as needed

---

### 5.2 Deployment

#### CI/CD Pipeline
- **GitHub Actions** (Recommended)
  ```yaml
  Workflow:
  1. Push to main branch
  2. Run tests (unit + integration)
  3. Build production bundle
  4. Deploy to staging
  5. (Manual approval)
  6. Deploy to production
  ```

#### Environments
- **Development:** Local development (localhost)
- **Staging:** Testing environment (staging.cdl-system.com)
- **Production:** Live system (app.cdl-system.com)

#### Database Migrations
- **Strategy:**
  - Migrations in version control
  - Applied automatically on deploy
  - Rollback capability (down migrations)

---

### 5.3 Monitoring & Logging

#### Application Monitoring
- **Sentry** (Error Tracking)
  - Frontend errors
  - Backend exceptions
  - Performance monitoring

- **LogRocket** or **FullStory** (Session Replay)
  - Frontend: User session recordings
  - Debug: Reproduce bugs

#### Infrastructure Monitoring
- **Uptime Monitoring:**
  - UptimeRobot or Pingdom
  - Alert: Email/SMS on downtime

- **Performance Monitoring:**
  - Google Analytics: User behavior
  - Lighthouse CI: Performance metrics

#### Logging
- **Winston** (Backend Logging)
  - Levels: error, warn, info, debug
  - Storage: File + Cloud (AWS CloudWatch or similar)
  - Retention: 30 days

- **Supabase Logs:**
  - Database queries
  - API requests

---

## 6. API Design

### 6.1 RESTful API Standards

#### Base URL
```
Production: https://api.cdl-system.com
Staging: https://api-staging.cdl-system.com
Local: http://localhost:3000/api
```

#### Versioning
```
/api/v1/tickets
/api/v1/auth/signin
```

#### HTTP Methods
- **GET:** Retrieve resources
- **POST:** Create resources
- **PUT/PATCH:** Update resources
- **DELETE:** Delete resources

#### Status Codes
- **200 OK:** Successful GET/PUT/PATCH
- **201 Created:** Successful POST
- **204 No Content:** Successful DELETE
- **400 Bad Request:** Invalid input
- **401 Unauthorized:** Missing/invalid auth
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource doesn't exist
- **429 Too Many Requests:** Rate limited
- **500 Internal Server Error:** Server error

---

### 6.2 Key API Endpoints

#### Authentication
```
POST /api/auth/signin
POST /api/auth/signup
POST /api/auth/signout
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

#### Tickets
```
POST   /api/tickets                    # Submit new ticket
GET    /api/tickets/:id                # Get ticket details
GET    /api/tickets                    # List tickets (with filters)
PATCH  /api/tickets/:id                # Update ticket
DELETE /api/tickets/:id                # Delete ticket
POST   /api/tickets/:id/upload         # Upload document
```

#### Drivers
```
GET    /api/drivers/:id/dashboard      # Driver dashboard
GET    /api/drivers/:id/tickets        # Driver's tickets
PATCH  /api/drivers/:id/profile        # Update profile
```

#### Carriers
```
GET    /api/carriers/:id/dashboard     # Carrier dashboard
GET    /api/carriers/:id/drivers       # List drivers
GET    /api/carriers/:id/reports       # CSA reports
```

#### Attorneys
```
GET    /api/attorneys/:id/cases        # Assigned cases
PATCH  /api/attorneys/:id/cases/:caseId # Update case
POST   /api/attorneys/:id/availability # Set availability
```

#### Payments
```
POST   /api/payments/process           # Process payment
POST   /api/payments/create-plan       # Create payment plan
GET    /api/payments/:id/invoice       # Get invoice
```

#### Messages
```
POST   /api/messages                   # Send message
GET    /api/messages?ticketId=:id      # Get conversation
PATCH  /api/messages/:id/read          # Mark as read
```

---

### 6.3 Request/Response Format

#### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

#### Response Format (Success)
```json
{
  "data": {
    "id": "uuid",
    "...": "..."
  },
  "meta": {
    "timestamp": "2026-03-03T10:00:00Z"
  }
}
```

#### Response Format (Error)
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email is required",
    "details": {
      "field": "email",
      "constraint": "required"
    }
  }
}
```

---

## 7. Data Model

### 7.1 Core Tables

**Key Tables:**
1. **drivers:** Driver accounts
2. **carriers:** Carrier companies
3. **attorneys:** Attorney profiles
4. **users:** Admin/paralegal accounts
5. **tickets:** Ticket records
6. **violations:** Violation details
7. **payments:** Payment transactions
8. **messages:** Communication
9. **court_dates:** Court calendar
10. **documents:** File metadata

*See migrations folder for complete schema*

---

### 7.2 Relationships

```
drivers 1───n tickets n───1 attorneys
carriers 1───n drivers
tickets 1───n messages
tickets 1───n payments
tickets 1───1 violations
tickets 1───n documents
tickets 1───1 court_dates
```

---

## 8. Development Environment

### 8.1 Local Setup

#### Prerequisites
- Node.js 18+ LTS
- npm 9+ or yarn 1.22+
- PostgreSQL 15+ (or Supabase CLI)
- Git

#### Environment Variables
```env
# Backend (.env)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key-64-characters-minimum
STRIPE_SECRET_KEY=sk_test_...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
SENDGRID_API_KEY=...

# Frontend (environment.ts)
apiUrl=http://localhost:3000/api
stripePublicKey=pk_test_...
```

---

### 8.2 Testing Strategy

#### Unit Tests
- **Frontend:** Jasmine + Karma
- **Backend:** Jest or Mocha
- **Coverage Target:** > 70%

#### Integration Tests
- **API Tests:** Supertest
- **E2E Tests:** Cypress or Playwright
- **Critical Paths:** Signup → Ticket Submit → Payment

#### Performance Tests
- **Load Testing:** k6 or Artillery
- **Target:** 100 req/s sustained

---

## 9. Future Technical Enhancements

### Phase 2 (Months 4-6)
- [ ] Redis caching layer
- [ ] WebSocket for real-time updates
- [ ] Native mobile apps (React Native or Flutter)
- [ ] Advanced analytics (data warehouse)

### Phase 3 (Months 7-12)
- [ ] Microservices architecture (if needed)
- [ ] GraphQL API (alternative to REST)
- [ ] AI/ML features (ticket classification, risk assessment)
- [ ] Video consultation (WebRTC)

---

## 10. Technical Debt & Known Issues

### Current Technical Debt
- [ ] Add comprehensive API documentation (Swagger)
- [ ] Implement rate limiting across all endpoints
- [ ] Add request/response logging
- [ ] Set up monitoring dashboards
- [ ] Write more unit tests (currently < 50% coverage)

### Planned Improvements
- [ ] Migrate to TypeScript (backend)
- [ ] Add GraphQL for complex queries
- [ ] Implement caching layer
- [ ] Optimize database queries (add more indexes)

---

## 11. Success Metrics

### Performance KPIs
- API response time (p95): < 500ms ✅
- Page load time: < 2 seconds ✅
- Uptime: > 99.5% ⏳
- Error rate: < 1% ⏳

### Scalability Milestones
- 1,000 users: ✅ Achieved
- 10,000 users: 🎯 Target
- 100,000 users: 📅 Future

---

## Appendix A: Technology Decision Log

### Why Angular vs React?
**Decision:** Angular  
**Reason:** Enterprise-ready, opinionated, excellent for forms and complex business logic. Team familiarity. Built-in features reduce decision fatigue.

### Why PostgreSQL vs MongoDB?
**Decision:** PostgreSQL  
**Reason:** Relational model fits domain (tickets, payments, relationships). ACID compliance critical for payments. Mature, reliable.

### Why JWT vs Sessions?
**Decision:** JWT  
**Reason:** Stateless, scales horizontally, works with mobile apps, simpler infrastructure.

---

## Appendix B: Useful Commands

```bash
# Frontend
npm run start          # Dev server
npm run build          # Production build
npm run test           # Run tests
npm run lint           # Lint code

# Backend
npm run dev            # Dev server (nodemon)
npm run start          # Production server
npm run migrate        # Run migrations
npm run test           # Run tests

# Database
npx supabase migration new <name>  # Create migration
npx supabase db push               # Apply migrations
npx supabase db reset              # Reset database
```

---

**End of Technical Requirements Document**

*Last Updated: March 3, 2026*  
*Version: 1.0*  
*Maintained by: Development Team*