# Developer Quick Start Guide

Welcome to the Driver-Attorney Messaging Platform! This guide will help you get up and running in under 15 minutes.

---

## 🚀 Quick Setup (5 Steps)

### 1. Prerequisites Check

Make sure you have these installed:

```bash
# Check Node.js version (need 18+)
node --version

# Check npm version (need 9+)
npm --version

# Install Angular CLI globally if needed
npm install -g @angular/cli
```

### 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/driver-attorney-messaging.git
cd driver-attorney-messaging/frontend

# Install dependencies (takes ~2 minutes)
npm install
```

### 3. Start Development Server

```bash
# Start the app
npm start

# Or with specific port
ng serve --port 4200
```

Wait for compilation, then open: **http://localhost:4200/messages**

### 4. Verify Everything Works

You should see:
- ✅ 3 test conversations in the sidebar
- ✅ Click one to view messages
- ✅ Send a test message
- ✅ Get an auto-reply in 2-5 seconds

### 5. Start Coding!

The main files you'll work with:
- `src/app/features/driver/messages/messages.component.ts`
- `src/app/features/driver/services/messaging.service.ts`

---

## 📁 Project Tour

### Key Directories

```
frontend/src/app/
├── core/               # Core services (auth, http, etc.)
├── features/           # Feature modules
│   └── driver/
│       ├── messages/   # ← You'll work here most
│       └── services/   # ← And here
├── shared/             # Shared components/utilities
└── app.routes.ts       # Application routing
```

### Important Files

| File | Purpose |
|------|---------|
| `messages.component.ts` | Main chat component logic |
| `messages.component.html` | Chat UI template |
| `messages.component.scss` | Chat styling |
| `messaging.service.ts` | API communication & types |
| `messaging.service.mock.ts` | Test data (no backend needed) |

---

## 🎯 Common Tasks

### Task 1: Add a New Feature

```typescript
// 1. Update the component
// src/app/features/driver/messages/messages.component.ts

export class MessagesComponent {
  // Add your feature here
  myNewFeature(): void {
    console.log('New feature!');
  }
}
```

```html
<!-- 2. Update the template -->
<!-- messages.component.html -->

<button (click)="myNewFeature()">
  New Feature
</button>
```

```scss
// 3. Add styling
// messages.component.scss

button {
  background: blue;
  color: white;
}
```

### Task 2: Add a New API Endpoint

```typescript
// messaging.service.ts

export class MessagingService {
  // Add new method
  getArchivedConversations(): Observable<ConversationsResponse> {
    return this.http.get<ConversationsResponse>(
      `${this.apiUrl}/conversations/archived`
    );
  }
}
```

### Task 3: Add Mock Data

```typescript
// messaging.service.mock.ts

// Add to mockConversations array
{
  id: '4',
  driverId: 'driver-1',
  attorneyId: 'attorney-4',
  // ... more properties
}
```

### Task 4: Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- messages.component.spec.ts

# Run with coverage
npm run test:coverage
```

### Task 5: Check Code Style

```bash
# Lint your code
npm run lint

# Auto-fix issues
npm run lint:fix
```

---

## 🔧 Development Workflow

### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Start dev server
npm start

# 4. Make your changes
# Edit files in your IDE

# 5. Test your changes
npm test

# 6. Commit changes
git add .
git commit -m "feat: add my feature"

# 7. Push and create PR
git push origin feature/my-feature
```

### Hot Reload

The app automatically reloads when you save files. No need to restart!

### Dev Tools

**Browser DevTools:**
- Press `F12` to open
- Check Console for errors
- Use Network tab for API calls
- Use Elements tab for CSS debugging

**Angular DevTools Extension:**
- Install: [Chrome](https://chrome.google.com/webstore/detail/angular-devtools) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/angular-devtools/)
- Debug component tree
- Inspect component state
- Profile performance

---

## 🐛 Debugging Guide

### Common Issues & Solutions

#### Issue 1: Port Already in Use
```bash
# Kill process on port 4200
npx kill-port 4200

# Or use different port
ng serve --port 4300
```

#### Issue 2: Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue 3: TypeScript Errors
```bash
# Check TypeScript version
npx tsc --version

# Should be 5.0+
```

#### Issue 4: Styling Not Loading
```bash
# Check that .scss file is in same directory as .ts file
# Verify styleUrls in @Component decorator
```

### Debugging in VS Code

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Angular Debug",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}/frontend"
    }
  ]
}
```

Then press `F5` to start debugging!

---

## 🧪 Testing Guide

### Running Tests

```bash
# All tests
npm test

# Specific file
npm test -- messages.component.spec.ts

# Watch mode
npm test -- --watch

# Coverage report
npm run test:coverage
```

### Writing Tests

```typescript
// messages.component.spec.ts

describe('MessagesComponent', () => {
  let component: MessagesComponent;
  let fixture: ComponentFixture<MessagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessagesComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MessagesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load conversations on init', () => {
    component.ngOnInit();
    expect(component.conversations.length).toBeGreaterThan(0);
  });

  it('should send message', () => {
    const initialCount = component.messages.length;
    component.messageForm.patchValue({ message: 'Test' });
    component.sendMessage();
    expect(component.messages.length).toBe(initialCount + 1);
  });
});
```

---

## 🎨 UI Development

### Angular Material

We use Angular Material for UI components:

```typescript
// Import modules in component
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  imports: [
    MatButtonModule,
    MatIconModule
  ]
})
```

```html
<!-- Use in template -->
<button mat-raised-button color="primary">
  <mat-icon>send</mat-icon>
  Send Message
</button>
```

### Custom Styling

```scss
// Use SCSS variables
$primary-color: #2196f3;
$secondary-color: #1976d2;

.my-component {
  background: linear-gradient(135deg, $primary-color, $secondary-color);
  
  &:hover {
    opacity: 0.9;
  }
}
```

### Responsive Design

```scss
// Mobile first approach
.container {
  padding: 16px;
  
  // Tablet
  @media (min-width: 768px) {
    padding: 24px;
  }
  
  // Desktop
  @media (min-width: 1024px) {
    padding: 32px;
  }
}
```

---

## 📦 Building for Production

### Development Build
```bash
ng build
```

### Production Build
```bash
ng build --configuration production
```

Output will be in `dist/` directory.

### Build Optimization

The production build includes:
- ✅ Ahead-of-Time (AOT) compilation
- ✅ Tree shaking
- ✅ Minification
- ✅ Bundle optimization
- ✅ Source map generation

### Build Size Analysis

```bash
# Install analyzer
npm install -g webpack-bundle-analyzer

# Build and analyze
ng build --stats-json
webpack-bundle-analyzer dist/frontend/stats.json
```

---

## 🔌 API Integration

### Switching from Mock to Real API

**Step 1: Update environment**
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  useMockData: false, // ← Change to false
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'http://localhost:3000'
};
```

**Step 2: Update component**
```typescript
// messages.component.ts
import { MessagingService } from '../services/messaging.service';

constructor(
  private messagingService: MessagingService, // ← Use real service
  // ...
)
```

**Step 3: Start backend server**
```bash
# In backend directory
npm start
```

### API Testing with Postman

1. Import collection from `docs/postman/`
2. Set environment variables:
   - `baseUrl`: `http://localhost:3000`
   - `token`: Your JWT token
3. Run requests

---

## 🚀 Deployment

### Deploy to Development

```bash
# Build
npm run build

# Deploy (example with Netlify)
netlify deploy --prod --dir=dist/frontend
```

### Deploy to Staging

```bash
# Build with staging config
ng build --configuration staging

# Deploy
# (Your deployment command here)
```

### Deploy to Production

```bash
# Build production
ng build --configuration production

# Deploy
# (Your deployment command here)
```

---

## 📚 Learning Resources

### Angular Docs
- [Angular.dev](https://angular.dev) - Official documentation
- [RxJS Guide](https://rxjs.dev/guide/overview) - Reactive programming
- [Angular Material](https://material.angular.io) - Component library

### Recommended Tutorials
- [Angular University](https://angular-university.io)
- [Deborah Kurata's Pluralsight Courses](https://www.pluralsight.com/authors/deborah-kurata)
- [Angular In Depth](https://indepth.dev/angular)

### Community
- [Angular Discord](https://discord.gg/angular)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/angular)
- [Reddit r/Angular2](https://reddit.com/r/Angular2)

---

## 🎯 Tips & Best Practices

### TypeScript Tips

```typescript
// Use types everywhere
interface User {
  id: string;
  name: string;
}

// Use const instead of let when possible
const user: User = { id: '1', name: 'John' };

// Use optional chaining
const userName = user?.profile?.name ?? 'Unknown';

// Use nullish coalescing
const port = process.env.PORT ?? 4200;
```

### Component Tips

```typescript
// Use OnPush for better performance
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// Unsubscribe from observables
private destroy$ = new Subject<void>();

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

// Use takeUntil
this.service.data$.pipe(
  takeUntil(this.destroy$)
).subscribe(data => {
  // Handle data
});
```

### Performance Tips

```typescript
// Use trackBy for *ngFor
<div *ngFor="let item of items; trackBy: trackById">

trackById(index: number, item: any): string {
  return item.id;
}

// Lazy load modules
{
  path: 'messages',
  loadChildren: () => import('./messages/messages.module')
    .then(m => m.MessagesModule)
}

// Use async pipe
messages$ = this.service.getMessages();

<div *ngFor="let msg of messages$ | async">
```

---

## ✅ Checklist for First PR

Before submitting your first pull request:

- [ ] Code runs without errors (`npm start`)
- [ ] All tests pass (`npm test`)
- [ ] Code follows style guide (`npm run lint`)
- [ ] Added tests for new features
- [ ] Updated documentation if needed
- [ ] Tested on Chrome and Firefox
- [ ] Tested responsive design (mobile/tablet)
- [ ] No console errors or warnings
- [ ] Commit messages follow convention
- [ ] Branch name is descriptive (`feature/add-message-search`)

---

## 🆘 Getting Help

Stuck? Here's how to get help:

1. **Check the docs** - Most questions are answered in README
2. **Search issues** - Someone might have had the same problem
3. **Ask the team** - Use Slack channel `#frontend-dev`
4. **Stack Overflow** - Tag with `angular` and `typescript`
5. **Office hours** - Every Friday 3-4pm for Q&A

---

## 🎉 You're Ready!

You now have everything you need to start contributing. Happy coding!

**Next steps:**
1. Pick an issue from GitHub
2. Create a branch
3. Code your solution
4. Submit a PR
5. Get it reviewed and merged

Welcome to the team! 🚀
