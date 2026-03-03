
================================================================================
PART 5 COMPLETE!
================================================================================


# 05_UX_REQUIREMENTS.md

## CDL Ticket Management Platform
### User Experience Requirements
**Version:** 1.0  
**Last Updated:** 2024  
**Status:** ✅ Ready for Implementation

---

## DOCUMENT PURPOSE

This document defines the complete UX/UI requirements for the CDL Ticket Management Platform. Every design decision is guided by one principle: **Make it so simple a stressed driver in a truck can use it with one hand.**

---

## 1. UX VISION & CORE PRINCIPLES

### 1.1 Vision Statement

**"Create the EASIEST CDL violation management platform in the world"**

A platform where:
- Every click feels inevitable
- No training is required
- Mobile works better than desktop
- Errors are impossible or easily fixed
- Speed feels instant
- Everyone can use it (accessibility-first)

### 1.2 Eight Guiding Principles

#### Principle 1: Simplicity Over Features
- **Rule:** If it's not essential, it doesn't exist
- **Example:** Dashboard shows 3 cards max, not 20 widgets
- **Test:** Can a new user complete their primary task in 60 seconds?

#### Principle 2: 3-Click Rule
- **Rule:** Any action must be ≤ 3 clicks/taps
- **Examples:**
  - Upload ticket: Tap "Upload" → Photo → Done (3 taps)
  - View ticket: Tap "Tickets" → Tap ticket → View (2 taps)
  - Pay ticket: Tap ticket → Tap "Pay" → Confirm (3 taps)
- **Violations require redesign**

#### Principle 3: Mobile-First Design
- **Rule:** Design for mobile, enhance for desktop (not reverse)
- **Why:** 75%+ users on mobile phones
- **Approach:** Every feature must work perfectly on iPhone SE (smallest)

#### Principle 4: Zero Training Required
- **Rule:** If user needs instructions, design failed
- **Test:** Hand phone to stranger, can they complete task?
- **Tools:** Universal icons, clear labels, contextual help

#### Principle 5: Progressive Disclosure
- **Rule:** Show only what's needed now
- **Example:** 
  - New user sees: "Upload your ticket"
  - After upload: Payment options appear
  - After payment: Tracking dashboard appears
- **Avoid:** Information overload

#### Principle 6: Forgiving Design
- **Rule:** Users should never fear mistakes
- **Features:**
  - Undo on everything
  - Auto-save drafts
  - Clear confirmation before destructive actions
  - Easy recovery from errors

#### Principle 7: Accessible to All (WCAG 2.1 AA Minimum)
- **Rule:** Platform must work for everyone
- **Includes:**
  - Screen reader users
  - Low vision users
  - Motor disability users
  - Cognitive disability users
  - Color blind users

#### Principle 8: Perceived Speed < 200ms
- **Rule:** Every interaction should feel instant
- **Techniques:**
  - Optimistic UI updates
  - Skeleton screens (no spinners)
  - Lazy loading
  - Prefetching
- **Never:** Blank screens or "Loading..." messages

---

## 2. DESIGN SYSTEM

### 2.1 Visual Design Language

#### Color Palette

**Primary Colors:**
```
Trust Blue: #0066CC (Primary actions, links, headers)
Deep Blue: #004080 (Hover states, active states)
Light Blue: #E6F2FF (Backgrounds, highlights)
```

**Semantic Colors:**
```
Success Green: #28A745 (Completed, paid, success states)
Warning Amber: #FFC107 (Pending, upcoming deadlines)
Error Red: #DC3545 (Overdue, failed, critical actions)
Neutral Gray: #6C757D (Secondary text, disabled states)
```

**Background Colors:**
```
White: #FFFFFF (Cards, modals, primary surfaces)
Light Gray: #F8F9FA (Page backgrounds)
Dark: #212529 (Text on light backgrounds)
```

**Contrast Requirements:**
- All text: 4.5:1 minimum contrast ratio
- Large text (18pt+): 3:1 minimum
- Interactive elements: 3:1 against adjacent colors

#### Typography

**Font Family:**
```
Primary: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
Monospace: "SF Mono", Monaco, "Cascadia Code", monospace (for ticket numbers)
```

**Font Sizes:**
```
Display: 32px/2rem (Page titles)
H1: 24px/1.5rem (Section headers)
H2: 20px/1.25rem (Card headers)
H3: 18px/1.125rem (Subsections)
Body: 16px/1rem (Default text)
Small: 14px/0.875rem (Helper text, captions)
Tiny: 12px/0.75rem (Labels only, never for critical info)
```

**Font Weights:**
```
Regular: 400 (Body text)
Medium: 500 (Emphasized text)
Semibold: 600 (Headers)
Bold: 700 (High emphasis, rarely used)
```

**Line Heights:**
```
Tight: 1.25 (Headers)
Normal: 1.5 (Body text)
Relaxed: 1.75 (Long-form content)
```

**Accessibility Rules:**
- Minimum 16px for body text (never smaller)
- Adequate line height for readability
- Never use color alone to convey meaning
- Use dyslexia-friendly fonts (Inter is designed for this)

#### Spacing System

**8px Base Unit:**
```
xs: 4px (0.25rem)   - Tight spacing within components
sm: 8px (0.5rem)    - Component internal spacing
md: 16px (1rem)     - Default spacing
lg: 24px (1.5rem)   - Section spacing
xl: 32px (2rem)     - Major section spacing
2xl: 48px (3rem)    - Page-level spacing
3xl: 64px (4rem)    - Hero sections
```

**Consistent Spacing:**
- Card padding: 16px (mobile), 24px (desktop)
- Section margins: 24px (mobile), 32px (desktop)
- List item spacing: 12px between items
- Button padding: 12px vertical, 24px horizontal

#### White Space Philosophy

**"White space is not wasted space"**

Rules:
- Generous padding around all elements
- Clear visual separation between sections
- Never cram information
- Breathing room reduces cognitive load

Examples:
- ✅ Good: 24px between cards
- ❌ Bad: 8px between cards (too cramped)

#### Iconography

**Icon Library:** Heroicons (Open source, consistent, recognizable)

**Icon Sizing:**
```
Small: 16px (Inline with text)
Medium: 24px (Standard UI icons)
Large: 32px (Featured icons)
XLarge: 48px (Empty states, illustrations)
```

**Icon Usage:**
- Always pair with text labels (never icon alone for primary actions)
- Use universal symbols (🏠 Home, 📄 Documents, ⚙️ Settings)
- Maintain 3:1 contrast ratio
- Include ARIA labels for screen readers

**Standard Icons:**
```
Upload: CloudArrowUpIcon
Ticket: DocumentTextIcon
Payment: CreditCardIcon
Calendar: CalendarIcon
Alert: ExclamationTriangleIcon
Success: CheckCircleIcon
Info: InformationCircleIcon
Settings: Cog6ToothIcon
User: UserCircleIcon
Menu: Bars3Icon
Close: XMarkIcon
Back: ChevronLeftIcon
```

### 2.2 Component Library

#### Buttons

**Primary Button (CTA):**
```
Style:
- Background: Trust Blue (#0066CC)
- Text: White
- Padding: 12px 24px
- Border radius: 8px
- Font: 16px, Semibold
- Min height: 44px (touch target)
- Min width: 100px

States:
- Hover: Deep Blue (#004080)
- Active: Darker blue + slight scale
- Disabled: Gray (#6C757D), cursor not-allowed
- Focus: 2px blue outline, 4px offset

Usage:
- One primary button per screen section
- Action-oriented text ("Upload Ticket" not "Submit")
```

**Secondary Button:**
```
Style:
- Background: White
- Border: 2px solid Trust Blue
- Text: Trust Blue
- Same sizing as primary

States:
- Hover: Light blue background (#E6F2FF)
- Active: Slightly darker
- Disabled: Gray border and text

Usage:
- Alternative actions
- Cancel/Back buttons
```

**Destructive Button:**
```
Style:
- Background: Error Red (#DC3545)
- Text: White
- Same sizing as primary

States:
- Hover: Darker red
- Requires confirmation modal

Usage:
- Delete, remove, permanent actions
- Always show confirmation dialog
```

**Text Button (Tertiary):**
```
Style:
- No background or border
- Text: Trust Blue
- Padding: 8px 16px

Usage:
- Less important actions
- Links within content
- "Learn more" type actions
```

**Button Best Practices:**
- Use action verbs: "Upload Photo" not "Submit"
- Keep labels short: 1-3 words
- Loading state: Show spinner, disable button, keep text visible
- Mobile: Full width for primary actions
- Keyboard: Enter key triggers primary action

#### Form Elements

**Text Input:**
```
Style:
- Height: 44px minimum
- Padding: 12px 16px
- Border: 1px solid #CED4DA
- Border radius: 8px
- Font: 16px (prevents zoom on iOS)
- Background: White

States:
- Focus: 2px blue border
- Error: Red border, red helper text below
- Disabled: Gray background
- Success: Green checkmark icon

Features:
- Floating labels or clear labels above
- Inline validation (real-time)
- Helper text below (gray, 14px)
- Error text below (red, 14px)
- Character counter for limited fields
```

**Text Input Best Practices:**
- Autocomplete attributes for autofill
- Appropriate input types (tel, email, number)
- Clear placeholder examples
- Validate on blur, show success on valid
- Never clear input on error

**Select/Dropdown:**
```
Style:
- Same as text input
- Chevron icon on right
- Options in modal sheet (mobile)
- Dropdown menu (desktop)

Features:
- Search within options if > 7 items
- Group related options
- Show selected value clearly
```

**Radio Buttons:**
```
Style:
- Size: 24px click target
- Label: 16px, to the right
- Spacing: 16px between options

Usage:
- 2-5 mutually exclusive options
- If > 5 options, use select instead
```

**Checkboxes:**
```
Style:
- Size: 24px click target
- Label: 16px, to the right
- Spacing: 16px between options

Usage:
- Multiple selections allowed
- Toggle settings
- Confirm actions ("I agree to terms")
```

**Date Picker:**
```
Style:
- Text input with calendar icon
- Native date picker on mobile
- Custom calendar on desktop

Features:
- Min/max date constraints
- Disabled dates (e.g., past dates)
- Quick select buttons (Today, Tomorrow)
```

**File Upload:**
```
Style:
- Large drop zone
- Camera icon + "Take Photo" button
- "Choose File" button
- Drag and drop area

Mobile:
- Camera first option
- Photo library second
- Files third

Features:
- Show preview immediately
- Progress bar during upload
- Easy to replace/remove
- File type and size validation
```

**Form Validation:**
```
Timing:
- Validate on blur (when leaving field)
- Show success immediately when valid
- Re-validate on input after initial error

Error Display:
- Red border on field
- Red text below field
- Icon in field (optional)
- Specific, helpful message

Error Messages:
- ❌ "Invalid input"
- ✅ "Email must include @"

Success Display:
- Green checkmark icon
- Optional green border
- Keep validation subtle
```

#### Cards

**Standard Card:**
```
Style:
- Background: White
- Border: 1px solid #E9ECEF
- Border radius: 12px
- Padding: 16px (mobile), 24px (desktop)
- Box shadow: 0 2px 4px rgba(0,0,0,0.1)

Sections:
- Header (optional): Title + action
- Body: Main content
- Footer (optional): Metadata or actions

Interactive Cards:
- Hover: Slight lift (shadow increase)
- Clickable: Cursor pointer
- Active: Slight scale down
```

**Info Card:**
```
Style:
- Left border: 4px colored (blue/amber/red/green)
- Icon on left
- White background

Usage:
- Alerts
- Status messages
- Helpful tips
```

**Ticket Card:**
```
Structure:
[Icon] [Ticket Number] [Status Badge]
[Violation Type]
[Date] [Amount]
[Primary Action Button]

Compact view (list):
- One line: Number, type, status
- Tap to expand

Expanded view:
- Full details
- All actions
- Timeline
```

#### Modals & Dialogs

**Modal:**
```
Style:
- Overlay: Black, 40% opacity
- Container: White, centered
- Border radius: 16px
- Max width: 500px
- Padding: 24px
- Close X in top right

Mobile:
- Slide up from bottom
- Full width
- Rounded top corners only
```

**Modal Structure:**
```
[Close X]
[Icon] [Title]
[Content]
[Action Buttons]

Actions:
- Primary on right (or bottom on mobile)
- Secondary on left
- Destructive separate
```

**Modal Best Practices:**
- Dismissible by backdrop click
- ESC key closes
- Focus trap (tab loops within)
- Return focus on close
- Confirm before closing if unsaved changes

**Alert Dialog:**
```
Purpose: Confirm destructive actions

Structure:
[Warning Icon]
"Are you sure?"
"This action cannot be undone"
[Cancel] [Confirm Delete]

Features:
- Cannot dismiss by backdrop
- Must click button
- Destructive button in red
```

**Bottom Sheet (Mobile):**
```
Style:
- Slides up from bottom
- Rounded top corners
- Drag handle at top
- Swipe down to dismiss

Usage:
- Action menus
- Filter panels
- Simple forms
```

#### Loading States

**Skeleton Screens:**
```
Purpose: Show page structure while loading

Style:
- Gray rectangles in place of content
- Subtle shimmer animation
- Maintain layout (no content shift)

Usage:
- Initial page load
- Infinite scroll loading
- Card loading
```

**Progress Indicators:**
```
Determinate (known progress):
- Progress bar with percentage
- Use for file uploads
- Use for multi-step processes

Indeterminate (unknown duration):
- Spinner (use sparingly)
- Pulse animation
- Use for API calls
```

**Optimistic UI:**
```
Principle: Update UI immediately, rollback if fails

Example:
- User uploads ticket
- Show ticket in list immediately (with "uploading" badge)
- If upload fails, show error, offer retry
- Never make user wait for server
```

#### Empty States

**Empty State Pattern:**
```
Structure:
[Large Illustration]
[Primary Message]
[Secondary Message]
[Primary Action Button]

Example:
[Ticket Icon]
"No tickets yet"
"Upload your first ticket to get started"
[Upload Ticket Button]

Tone:
- Friendly, encouraging
- Not negative ("You don't have...")
- Actionable
```

#### Navigation

**Mobile Bottom Navigation:**
```
Style:
- Fixed at bottom
- 5 items maximum
- Icon + label
- Active state highlighted

Items:
1. Home/Dashboard (House icon)
2. Tickets (Document icon)
3. Upload (Plus in circle - primary)
4. Activity (Bell icon)
5. Account (User icon)

Accessibility:
- 44px minimum touch target
- Clear labels
- Badge for notifications
```

**Desktop Header Navigation:**
```
Style:
- Horizontal bar at top
- Logo left
- Nav items center
- User menu right

Structure:
[Logo] [Dashboard] [Tickets] [Payments]  [Search] [Notifications] [Avatar]
```

**Breadcrumbs:**
```
Usage: Deep navigation only (3+ levels)

Style:
Home > Tickets > Ticket #12345

Mobile: Show only current + back button
Desktop: Show full path
```

#### Lists

**List Item:**
```
Style:
- Min height: 64px
- Padding: 12px 16px
- Border bottom: 1px solid #E9ECEF
- Hover: Light gray background

Structure:
[Icon/Avatar] [Primary Text]
              [Secondary Text]
                              [Action/Badge]

Interactive:
- Swipe actions (mobile): Delete, Archive
- Long press: Context menu
- Tap: Navigate to detail
```

**Virtual Scrolling:**
```
For lists > 100 items:
- Render only visible items
- Lazy load as scrolling
- Maintain scroll position
```

#### Badges & Tags

**Status Badge:**
```
Style:
- Inline text with colored background
- Border radius: 12px
- Padding: 4px 12px
- Font: 12px, Semibold

Colors:
- Pending: Amber
- Paid: Green
- Overdue: Red
- In Review: Blue

Usage:
- Ticket status
- Payment status
- User role
```

**Count Badge:**
```
Style:
- Small circle (20px)
- Red background
- White number
- Position: Top right of icon

Usage:
- Notification count
- Unread items
```

#### Tooltips

**Tooltip:**
```
Style:
- Dark background (#212529)
- White text
- Small arrow pointing to element
- Border radius: 4px
- Padding: 8px 12px
- Max width: 200px

Trigger:
- Hover (desktop)
- Tap (mobile, dismiss on tap away)

Content:
- Brief explanation
- No critical info (must work without)
```

#### Alerts & Notifications

**Inline Alert:**
```
Style:
- Full width banner
- Colored left border (4px)
- Icon on left
- Close X on right
- Dismissible

Types:
- Info (blue): General information
- Success (green): Action completed
- Warning (amber): Attention needed
- Error (red): Problem occurred

Auto-dismiss:
- Success: 5 seconds
- Info: 7 seconds
- Warning: No auto-dismiss
- Error: No auto-dismiss
```

**Toast Notification:**
```
Style:
- Small popup
- Bottom center (mobile)
- Top right (desktop)
- Auto-dismiss after 5s
- Slide in animation

Usage:
- Non-critical confirmations
- Background actions completed
- Quick status updates

Content:
- Icon + brief message
- Action button (optional)
- Undo button (for reversible actions)
```

**Push Notification:**
```
Content:
- Title: Clear action required
- Body: Specific detail
- Action: Deep link to relevant screen

Examples:
- "Ticket due in 3 days"
- "Payment confirmation received"
- "New message from DMV"

Timing:
- Respect quiet hours (9pm-8am)
- Batch low-priority notifications
- Send high-priority immediately
```

---

## 3. MOBILE-FIRST DESIGN

### 3.1 Thumb Zone Optimization

**Thumb Reach Zones:**

```
┌─────────────────────┐
│   Hard to Reach     │ ← Top 1/3: Secondary info only
│   (avoid actions)   │
├─────────────────────┤
│   Easy to Reach     │ ← Middle 1/3: Secondary actions
│   (natural hold)    │
├─────────────────────┤
│  *** PRIME ZONE *** │ ← Bottom 1/3: PRIMARY ACTIONS
│   (thumb rests)     │ ← Navigation bar here
└─────────────────────┘
```

**Design Rules:**
1. **Bottom 1/3 (Prime Zone):**
   - Primary CTA buttons
   - Bottom navigation
   - Most frequent actions
   - Save, Submit, Continue buttons

2. **Middle 1/3 (Easy Zone):**
   - Secondary actions
   - Content scrolling
   - List items
   - Forms

3. **Top 1/3 (Hard Zone):**
   - Headers (view only)
   - Static information
   - Back button (exception - critical)
   - Secondary menu icons

**Never in Top Corners:**
- Primary actions
- Frequent actions
- Destructive actions

### 3.2 One-Handed Operation

**Principles:**
- All critical functions accessible one-handed
- No stretching or hand repositioning required
- Large, easy-to-hit targets
- Confirmation actions near initial action

**Single-Hand Features:**
1. **Bottom Sheet Menus:**
   - Swipe up for options
   - Large touch targets
   - Easy dismiss

2. **Swipe Gestures:**
   - Swipe left: Delete/Archive
   - Swipe right: Mark complete
   - Pull down: Refresh
   - Swipe back: Previous screen

3. **Floating Action Button (FAB):**
   - Position: Bottom right
   - Size: 56x56px minimum
   - Primary action only
   - Example: Upload ticket

4. **Quick Actions:**
   - Long press for context menu
   - 3D Touch support (iOS)
   - Haptic feedback on action

### 3.3 Touch Targets

**Minimum Sizes:**
```
Minimum touch target: 44x44px (iOS), 48x48dp (Android)
Preferred: 48x48px or larger
Spacing between targets: 8px minimum
```

**Button Sizing:**
```
Primary CTA: 
- Height: 48px minimum
- Full width on mobile
- 16px margin on sides

Secondary buttons:
- Height: 44px minimum
- Auto width, centered
- 16px spacing between buttons

Icon buttons:
- 48x48px minimum
- Visible tap feedback
- Clear icon + label
```

**List Items:**
```
Minimum height: 64px
Tap area: Full row
Sub-actions: Right side, 44px minimum
```

**Form Inputs:**
```
Height: 48px minimum
Full width minus 16px margins
Spacing between: 16px
```

### 3.4 Mobile Performance

**3G Network Optimization:**

1. **Critical Path:**
   - Load essential content first
   - Defer non-critical resources
   - Inline critical CSS
   - Lazy load images

2. **Asset Optimization:**
   - WebP images (90% smaller)
   - Compress all images
   - Minify CSS/JS
   - Use CDN for static assets

3. **Code Splitting:**
   - Load only current route
   - Prefetch likely next route
   - Dynamic imports
   - Tree shaking

4. **Caching Strategy:**
   - Service Worker for offline
   - Cache static assets (1 year)
   - Cache API responses (5 min)
   - Background sync

**Performance Budgets:**
```
Initial Load: < 3 seconds on 3G
First Paint: < 1 second
Time to Interactive: < 5 seconds
Total Page Size: < 1MB
Images per page: < 500KB total
```

### 3.5 Offline Capabilities

**Offline-First Features:**

1. **Read Access:**
   - Cache all viewed tickets
   - View account info
   - Access help docs
   - View saved searches

2. **Write with Sync:**
   - Upload ticket (queued)
   - Draft messages
   - Save preferences
   - Bookmark items

3. **Offline Indicators:**
```
[Offline Icon] You're offline
- View saved tickets
- Uploads will sync when online
```

4. **Background Sync:**
   - Auto-retry failed uploads
   - Sync when connection returns
   - Show sync status
   - Notify on completion

**Implementation:**
- Service Worker registration
- IndexedDB for local storage
- Queue failed requests
- Retry with exponential backoff

### 3.6 Mobile-Specific Features

**Camera Integration:**
```
Primary upload method:
1. Tap "Upload Ticket"
2. Camera opens immediately
3. Take photo
4. Crop/enhance (optional)
5. Confirm upload

Features:
- Flash control
- Grid overlay
- Auto-enhance
- Multiple photos
```

**Location Services:**
```
Usage:
- Auto-detect jurisdiction
- Find nearby payment locations
- Court addresses

Privacy:
- Request permission with context
- "Allow once" option
- Store only when necessary
```

**Biometric Authentication:**
```
Support:
- Face ID (iOS)
- Touch ID (iOS)
- Fingerprint (Android)
- Pattern/PIN fallback

Usage:
- Login
- Confirm payments
- Access sensitive info
```

**Haptic Feedback:**
```
Use for:
- Button presses
- Swipe actions
- Errors (vibration pattern)
- Success (short pulse)

Never overuse:
- Not for every interaction
- Respect accessibility settings
```

**Share Sheet:**
```
Share ticket info:
- Native share button
- Generate shareable link
- Copy to clipboard
- Email/SMS
```

### 3.7 Responsive Breakpoints

**Device Breakpoints:**
```
Mobile (xs): 320px - 767px (design for this first)
Tablet (md): 768px - 1023px
Desktop (lg): 1024px - 1439px
Large Desktop (xl): 1440px+
```

**Layout Adaptations:**

**Mobile (320-767px):**
- Single column
- Full-width cards
- Bottom navigation
- Hamburger menu
- Stacked buttons

**Tablet (768-1023px):**
- Two column option
- Side-by-side cards
- Larger touch targets
- More whitespace
- Desktop-style navigation

**Desktop (1024px+):**
- Multi-column layouts
- Sidebar navigation
- Hover states
- Keyboard shortcuts
- More info density

**Fluid Typography:**
```css
/* Scale font sizes between breakpoints */
body {
  font-size: clamp(14px, 4vw, 16px);
}

h1 {
  font-size: clamp(20px, 5vw, 32px);
}
```

---

## 4. ACCESSIBILITY (WCAG 2.1 AA)

### 4.1 Visual Accessibility

**Color Contrast:**
```
Minimum Requirements:
- Regular text (< 18px): 4.5:1 contrast ratio
- Large text (≥ 18px): 3:1 contrast ratio
- UI components: 3:1 contrast ratio
- Graphical objects: 3:1 contrast ratio

Testing:
- Use WebAIM Contrast Checker
- Test all color combinations
- Include dark mode variants
```

**Never Use Color Alone:**
```
❌ Bad:
- Red text for errors (color blind users can't see)

✅ Good:
- Red text + error icon + descriptive message
- "❌ Email must include @ symbol"
```

**Text Accessibility:**
```
Minimum font size: 16px body text
Line height: 1.5 minimum
Paragraph width: 80 characters maximum
Text spacing: User can adjust without breaking layout
Justified text: Never (creates river effect)
```

**Focus Indicators:**
```
All interactive elements must have visible focus:

Style:
- 2px solid outline
- High contrast color
- 4px offset from element
- Visible on all backgrounds

Never:
- Remove focus outlines
- Use same color as background
```

### 4.2 Keyboard Navigation

**Full Keyboard Support:**

**Tab Order:**
- Logical sequence (top to bottom, left to right)
- Skip to main content link (first tab)
- Focusable: All interactive elements
- Skip navigation link at top

**Keyboard Shortcuts:**
```
Global:
- Tab: Next element
- Shift+Tab: Previous element
- Enter/Space: Activate button/link
- Escape: Close modal/menu
- Arrow keys: Navigate lists/menus

Custom:
- ? : Show keyboard shortcuts
- / : Focus search
- n : New ticket
- u : Upload ticket
- Cmd/Ctrl + K : Quick actions
```

**Focus Management:**
- Trap focus in modals
- Return focus after modal close
- Skip repetitive navigation
- Announce page changes

**No Keyboard Traps:**
- User can always tab away
- Modals have close button in tab order
- Carousels have keyboard controls

### 4.3 Screen Reader Support

**ARIA Labels:**
```html
<!-- Buttons without text -->
<button aria-label="Close modal">
  <XIcon />
</button>

<!-- Form inputs -->
<input 
  type="text" 
  aria-label="Ticket number"
  aria-describedby="ticket-help"
  aria-required="true"
/>
<span id="ticket-help">Enter 8-digit ticket number</span>

<!-- Status messages -->
<div role="status" aria-live="polite">
  Ticket uploaded successfully
</div>
```

**Semantic HTML:**
```html
✅ Good:
<nav>
<main>
<header>
<footer>
<button>
<article>

❌ Bad:
<div class="nav">
<div class="main">
<span onclick="...">
```

**ARIA Live Regions:**
```html
<!-- Announce important updates -->
<div role="alert" aria-live="assertive">
  Payment failed. Please try again.
</div>

<!-- Announce status updates -->
<div role="status" aria-live="polite">
  Ticket uploaded successfully
</div>

<!-- Loading states -->
<div aria-live="polite" aria-busy="true">
  Loading tickets...
</div>
```

**Alt Text:**
```
Images:
- Decorative: alt=""
- Informative: alt="Speeding ticket for 45 in 35 zone"
- Functional: alt="Upload ticket photo"

Complex images:
- Use aria-describedby for details
- Provide text alternative nearby
```

**Form Accessibility:**
```html
<!-- Label association -->
<label for="email">Email</label>
<input id="email" type="email" />

<!-- Error messages -->
<input 
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">
  Email must include @ symbol
</span>

<!-- Required fields -->
<input required aria-required="true" />
<span aria-label="required">*</span>
```

### 4.4 Cognitive Accessibility

**Simple Language:**
```
Reading level: 8th grade or below

Tools:
- Hemingway Editor
- Readable.com
- Flesch-Kincaid test

Examples:
❌ "Authenticate credentials to proceed"
✅ "Sign in to continue"

❌ "Remuneration required prior to resolution"
✅ "Pay ticket to resolve"
```

**Clear Instructions:**
```
❌ "Complete form"
✅ "Upload your ticket photo"

❌ "Input data"
✅ "Enter your ticket number"

Principles:
- One instruction at a time
- Use active voice
- Include examples
- Visual aids when helpful
```

**Consistent Interface:**
```
Same patterns throughout:
- Save button always bottom right
- Cancel always left of Save
- Navigation always in same place
- Colors mean same thing everywhere
```

**Avoid Time Limits:**
```
Never:
- Session timeouts during active use
- Timed forms
- Auto


✅ UX Requirements created!

📁 Saved to: /Users/paveltkachenko/prj/cdl-ticket-management/docs/05_UX_REQUIREMENTS.md