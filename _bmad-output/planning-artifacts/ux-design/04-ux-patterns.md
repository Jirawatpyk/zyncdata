# Step 12: UX Consistency Patterns

## Overview

This section establishes UX consistency patterns for common interaction situations across Zyncdata. These patterns ensure users experience predictable, intuitive behavior regardless of which part of the application they're using.

**Foundation:** Built on shadcn/ui design system (Step 11)
**Informed By:** User journeys (Step 10), Component strategy (Step 11), Design direction (Step 9)
**Purpose:** Define micro-interactions, feedback mechanisms, and visual consistency rules

---

## UX Consistency Patterns

### 1. Button Hierarchy & Actions

**Purpose:** Establish clear visual hierarchy and consistent action patterns for all interactive buttons.

#### Primary Actions

**When to Use:** Main goal-oriented actions that users need to complete their task.

**Visual Design:**
- Background: DxT Gradient Blue (`bg-gradient-to-r from-blue-600 to-blue-500`)
- Text: White (`text-white`)
- Font Weight: Semibold (`font-semibold`)
- Padding: `px-6 py-3` (medium), `px-8 py-4` (large on landing)
- Border Radius: `rounded-lg`
- Shadow: `shadow-md` default, `shadow-lg` on hover

**Behavior:**
- Hover: Scale 1.02, brightness 110%, shadow elevation
- Active: Scale 0.98
- Loading: Spinner + "Processing..." text, disabled
- Disabled: Opacity 50%, cursor-not-allowed

**Accessibility:**
- Focus: 2px blue ring (`ring-2 ring-blue-500 ring-offset-2`)
- Min touch target: 44x44px
- ARIA: `aria-label` for icon-only buttons

**Examples:**
- "Publish" (CMS)
- "Send Message" (Contact form)
- "Get Started" (Landing page hero)
- "Restore This Version" (Version history)

#### Secondary Actions

**When to Use:** Alternative actions, cancel operations, or less critical tasks.

**Visual Design:**
- Background: Transparent or white (`bg-white border border-gray-300`)
- Text: Gray (`text-gray-700`)
- Font Weight: Medium (`font-medium`)
- Padding: Same as primary (`px-6 py-3`)
- Border Radius: `rounded-lg`
- Shadow: None default, `shadow-sm` on hover

**Behavior:**
- Hover: Border color darkens, subtle shadow
- Active: Scale 0.98
- Loading: Spinner + text, disabled
- Disabled: Opacity 50%, cursor-not-allowed

**Accessibility:**
- Focus: 2px gray ring (`ring-2 ring-gray-400 ring-offset-2`)
- Min touch target: 44x44px
- Clear label indicating action is optional or secondary

**Examples:**
- "Cancel" (Forms, modals)
- "Save as Draft" (CMS)
- "Preview" (CMS live preview)
- "Back to Dashboard" (Navigation)

#### Destructive Actions

**When to Use:** Actions that delete, remove, or irreversibly change data.

**Visual Design:**
- Background: Red gradient (`bg-gradient-to-r from-red-600 to-red-500`)
- Text: White (`text-white`)
- Font Weight: Semibold (`font-semibold`)
- Padding: `px-6 py-3`
- Border Radius: `rounded-lg`
- Shadow: `shadow-md` default, `shadow-lg` on hover

**Behavior:**
- Always requires confirmation dialog first
- Hover: Scale 1.02, brightness 110%, shadow elevation
- Active: Scale 0.98
- Loading: Spinner + "Deleting..." text, disabled
- Disabled: Opacity 50%, cursor-not-allowed

**Accessibility:**
- Focus: 2px red ring (`ring-2 ring-red-500 ring-offset-2`)
- ARIA: `aria-label="Delete system, requires confirmation"`
- Confirmation modal focuses on secondary "Cancel" by default (safety)

**Examples:**
- "Delete System" (CMS)
- "Remove Content" (CMS)
- "Discard Changes" (Forms with significant edits)

#### Ghost/Text-Only Actions

**When to Use:** Tertiary actions, inline actions, or actions within cards.

**Visual Design:**
- Background: Transparent
- Text: Blue (`text-blue-600`)
- Font Weight: Medium (`font-medium`)
- Padding: `px-3 py-2` (smaller)
- Border Radius: `rounded-md`
- Underline on hover

**Behavior:**
- Hover: Underline, text brightens
- Active: Text darkens
- No loading state (instant actions)
- Disabled: Opacity 50%, no underline

**Accessibility:**
- Focus: 2px blue ring (`ring-2 ring-blue-400 ring-offset-1`)
- Must have clear label (no icon-only ghost buttons)

**Examples:**
- "View Details" (System error panel)
- "See All History" (Version timeline)
- "Learn More" (Landing page sections)

---

### 2. Feedback Patterns

**Purpose:** Provide clear, timely feedback for all user actions with consistent visual and interaction patterns.

#### Success Feedback

**When to Use:** User successfully completes an action (publish, save, send).

**Visual Design - Toast Notification:**
- Position: Bottom-right corner
- Background: Green gradient (`bg-gradient-to-r from-green-500 to-emerald-500`)
- Icon: ✅ Checkmark (white)
- Text: White, 2 lines max (title + description)
- Duration: 4 seconds auto-dismiss
- Shadow: `shadow-lg`

**Behavior:**
- Animation: Slide in from right with spring animation
- Dismiss: Auto after 4s, or manual X button, or swipe right
- Sound: Optional subtle "success" sound (user preference)
- Multiple toasts: Stack vertically, max 3 visible

**Accessibility:**
- ARIA: `role="status" aria-live="polite"`
- Focus: Focusable for keyboard users to read fully
- High contrast mode: Bold border for visibility

**Examples:**
```javascript
toast.success("Content published!", {
  description: "Your changes are now live on the landing page.",
  duration: 4000
})
```

**Use Cases:**
- "Content published successfully"
- "Message sent! We'll reply within 24 hours."
- "System added to dashboard"
- "Version restored successfully"

#### Error Feedback

**When to Use:** User action fails, system error occurs, validation fails.

**Visual Design - Toast Notification:**
- Position: Bottom-right corner
- Background: Red gradient (`bg-gradient-to-r from-red-500 to-rose-500`)
- Icon: ⚠️ Warning (white)
- Text: White, 2 lines max (title + description)
- Duration: 6 seconds (longer for errors)
- Action Button: Optional "View Details" or "Retry"

**Behavior:**
- Animation: Slide in from right with spring animation
- Dismiss: Auto after 6s, or manual X button, or swipe right
- Sound: Optional subtle "error" sound (user preference)
- Persistent for critical errors: No auto-dismiss for network failures

**Accessibility:**
- ARIA: `role="alert" aria-live="assertive"`
- Focus: Auto-focus for critical errors requiring action
- Screen reader: Announces immediately

**Error Message Tone:**
- ❌ **Avoid:** "Error 500: Internal Server Error"
- ✅ **Use:** "Unable to publish content. Please try again or contact support."
- Explain what happened in plain language
- Provide next steps or recovery actions
- Show empathy ("We're sorry for the inconvenience")

**Examples:**
```javascript
toast.error("Unable to publish content", {
  description: "Network connection lost. Please check your internet and try again.",
  duration: 6000,
  action: {
    label: "Retry",
    onClick: () => retryPublish()
  }
})
```

**Use Cases:**
- "Network connection lost. Please try again."
- "ENEOS system is down. Cannot access at this time."
- "Invalid email format. Please check and try again."
- "Unable to restore version. Contact support if problem persists."

#### Warning Feedback

**When to Use:** User about to perform risky action, system in degraded state.

**Visual Design - Modal Dialog:**
- Position: Center of screen with backdrop overlay
- Background: White card with yellow accent
- Icon: ⚠️ Warning (yellow/amber)
- Title: Bold, clear warning statement
- Description: Explain the risk and consequences
- Actions: Secondary "Cancel" (default focus) + Primary "Continue"

**Behavior:**
- Animation: Fade in with scale 0.95 to 1.0
- Backdrop: Dark overlay (bg-black/50)
- Dismiss: ESC key, click backdrop, or "Cancel" button
- Focus trap: Keep focus within modal

**Accessibility:**
- ARIA: `role="alertdialog" aria-labelledby="warning-title"`
- Focus: Auto-focus on "Cancel" (safe option)
- Escape key: Always closes dialog
- Screen reader: Announces full warning text

**Warning Message Tone:**
- Clear about what's at risk
- Explain consequences without being alarmist
- Offer alternative actions when possible

**Examples:**
```jsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <div className="flex items-center gap-3">
        <AlertCircle className="h-6 w-6 text-amber-500" />
        <AlertDialogTitle>ENEOS system is degraded</AlertDialogTitle>
      </div>
      <AlertDialogDescription>
        The system is experiencing performance issues. You may encounter
        slow response times or intermittent errors. Continue anyway?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={proceedToDegradedSystem}>
        Continue Anyway
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Use Cases:**
- Accessing degraded system
- Deleting content (confirmation)
- Leaving form with unsaved changes
- Performing irreversible action

#### Info Feedback

**When to Use:** Provide helpful information, tips, or status updates.

**Visual Design - Toast Notification:**
- Position: Bottom-right corner
- Background: Blue gradient (`bg-gradient-to-r from-blue-500 to-cyan-500`)
- Icon: ℹ️ Info (white)
- Text: White, 2 lines max
- Duration: 5 seconds

**Behavior:**
- Animation: Slide in from right
- Dismiss: Auto after 5s, or manual X button
- Sound: No sound (informational only)

**Accessibility:**
- ARIA: `role="status" aria-live="polite"`
- Non-intrusive: Doesn't interrupt user flow

**Examples:**
```javascript
toast.info("Auto-save enabled", {
  description: "Your changes are saved automatically every 30 seconds.",
  duration: 5000
})
```

**Use Cases:**
- "Auto-save enabled"
- "Live preview synced"
- "New version available for restore"
- "First-time user tips"

#### Loading Feedback

**When to Use:** Async operations in progress (publish, fetch, save).

**Visual Design:**
- **Inline Loading (< 2 seconds expected):**
  - Spinner icon rotating
  - Text: "Publishing..." / "Saving..." / "Loading..."
  - Button disabled with reduced opacity

- **Full Screen Loading (> 2 seconds expected):**
  - Centered spinner with brand colors
  - Loading text
  - Optional: Progress percentage if available
  - Optional: "Taking longer than expected..." after 5s

**Behavior:**
- Animation: Smooth rotation (no stuttering)
- Timeout: Show error after 30s of no response
- Cancelable: Offer cancel button for long operations

**Accessibility:**
- ARIA: `aria-busy="true" aria-live="polite"`
- Screen reader: "Publishing content, please wait"
- Visual: High contrast spinner visible on all backgrounds

**Examples:**
```jsx
// Inline button loading
<Button disabled={isPublishing}>
  {isPublishing ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Publishing...
    </>
  ) : (
    "Publish"
  )}
</Button>

// Full screen loading
<div className="flex flex-col items-center justify-center min-h-screen">
  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
  <p className="mt-4 text-gray-600">Loading dashboard...</p>
</div>
```

**Use Cases:**
- Dashboard initial load
- Publishing CMS content
- Submitting contact form
- Restoring version
- Fetching health check history

---

### 3. Empty State Patterns

**Purpose:** Guide users when there's no data to display with helpful next actions.

#### No Systems Configured (Admin Dashboard)

**When to Use:** First-time admin user, no systems added yet.

**Visual Design:**
- Centered container with icon illustration
- Icon: 🏗️ Building/Construction (120x120px)
- Title: "No Systems Yet"
- Description: "Add your first system to start monitoring"
- Primary Action: "Add System" button (prominent)
- Secondary Action: "Learn How" link to docs

**Behavior:**
- Appears on empty dashboard
- Dismisses once first system added
- Can trigger onboarding tour if first visit

**Accessibility:**
- ARIA: `role="region" aria-label="Empty state"`
- Focus: Auto-focus on "Add System" button
- Clear instructions for keyboard navigation

**Example:**
```jsx
<div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
  <div className="text-6xl mb-4">🏗️</div>
  <h2 className="text-2xl font-bold text-gray-900 mb-2">
    No Systems Yet
  </h2>
  <p className="text-gray-600 mb-6 max-w-md">
    Add your first system to start monitoring health status and
    streamline your daily workflow.
  </p>
  <div className="flex gap-3">
    <Button onClick={openAddSystemModal}>
      <Plus className="mr-2 h-4 w-4" />
      Add System
    </Button>
    <Button variant="ghost" onClick={openDocs}>
      Learn How
    </Button>
  </div>
</div>
```

#### No Health Check Logs

**When to Use:** System has no health check history yet.

**Visual Design:**
- Icon: 📊 Chart/Graph (80x80px)
- Title: "No Health Checks Yet"
- Description: "Check back soon to see historical data"
- No action button (passive waiting state)

**Behavior:**
- Appears in HealthCheckViewer component
- Auto-updates when first log arrives
- Shows timestamp of when checks will start

**Accessibility:**
- ARIA: `role="status" aria-live="polite"`
- Screen reader: "No health check logs available yet"

**Example:**
```jsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="text-5xl mb-3">📊</div>
  <h3 className="text-lg font-semibold text-gray-900 mb-1">
    No Health Checks Yet
  </h3>
  <p className="text-gray-600 text-sm">
    Health checks run every 5 minutes. Check back soon!
  </p>
</div>
```

#### No Version History

**When to Use:** Content has never been edited/published before.

**Visual Design:**
- Icon: 🕐 Clock/History (80x80px)
- Title: "No Version History"
- Description: "Publish changes to create your first version"
- No action button (passive waiting state)

**Behavior:**
- Appears in VersionHistoryPanel
- Disappears after first publish
- Shows in sidebar when no versions exist

**Accessibility:**
- ARIA: `role="status"`
- Clear message that this is expected for new content

**Example:**
```jsx
<div className="flex flex-col items-center justify-center py-8 text-center px-4">
  <div className="text-4xl mb-2">🕐</div>
  <h4 className="text-md font-semibold text-gray-800 mb-1">
    No Version History
  </h4>
  <p className="text-gray-600 text-sm max-w-xs">
    Publish your first changes to start tracking versions.
  </p>
</div>
```

#### No Search Results

**When to Use:** User search/filter returns no matches.

**Visual Design:**
- Icon: 🔍 Magnifying Glass (80x80px)
- Title: "No Results Found"
- Description: "Try different keywords or filters"
- Action: "Clear Filters" button if filters applied

**Behavior:**
- Shows search term in description
- Offers to clear filters/search
- Suggests alternative actions

**Accessibility:**
- ARIA: `role="status" aria-live="polite"`
- Screen reader: "No results found for [search term]"

**Example:**
```jsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="text-5xl mb-3">🔍</div>
  <h3 className="text-lg font-semibold text-gray-900 mb-1">
    No Results Found
  </h3>
  <p className="text-gray-600 text-sm mb-4">
    No systems match "{searchTerm}"
  </p>
  {hasFilters && (
    <Button variant="ghost" onClick={clearFilters}>
      Clear Filters
    </Button>
  )}
</div>
```

---

### 4. Loading State Patterns

**Purpose:** Communicate system activity and progress during async operations.

#### Skeleton Screens (Perceived Performance)

**When to Use:** Initial page load, dashboard load, content fetch (< 3 seconds expected).

**Visual Design:**
- Mimics final layout structure
- Animated gradient shimmer effect
- Gray base color (`bg-gray-200`) with lighter shimmer (`bg-gray-300`)
- Respects spacing and sizing of real content

**Behavior:**
- Animation: Shimmer effect left to right (1.5s duration, infinite loop)
- Layout shift: Zero - skeleton matches real content dimensions
- Timeout: Replaces with error state if load > 10s

**Accessibility:**
- ARIA: `aria-busy="true" aria-label="Loading content"`
- Screen reader: "Loading dashboard content, please wait"
- No seizure-inducing rapid flashing

**Example:**
```jsx
// SystemCard skeleton
<Card className="p-6">
  <div className="flex items-start justify-between mb-4">
    <Skeleton className="h-6 w-6 rounded-full" /> {/* Badge */}
    <Skeleton className="h-4 w-20" /> {/* Timestamp */}
  </div>
  <div className="flex flex-col items-center">
    <Skeleton className="h-16 w-16 rounded-lg mb-4" /> {/* Logo */}
    <Skeleton className="h-6 w-32 mb-2" /> {/* Name */}
    <Skeleton className="h-4 w-full mb-1" /> {/* Description line 1 */}
    <Skeleton className="h-4 w-3/4" /> {/* Description line 2 */}
  </div>
</Card>

// Dashboard: Show 6 skeleton cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {Array(6).fill(0).map((_, i) => (
    <SystemCardSkeleton key={i} />
  ))}
</div>
```

**Use Cases:**
- Dashboard initial load
- CMS content fetch
- Version history panel load
- Health check viewer load

#### Spinner (Inline Actions)

**When to Use:** Button actions, form submissions, quick operations (< 5 seconds expected).

**Visual Design:**
- Icon: Rotating circle (`Loader2` from lucide-react)
- Size: Match text size (h-4 w-4 for buttons)
- Color: Inherit from button/context
- Position: Left of text with margin-right

**Behavior:**
- Animation: Continuous rotation (no stuttering)
- Button disabled: Opacity 50%, cursor-not-allowed
- Text changes: "Save" → "Saving...", "Publish" → "Publishing..."

**Accessibility:**
- ARIA: `aria-busy="true" aria-label="Publishing content"`
- Screen reader: Announces state change

**Example:**
```jsx
<Button disabled={isPublishing} onClick={handlePublish}>
  {isPublishing ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Publishing...
    </>
  ) : (
    "Publish"
  )}
</Button>
```

**Use Cases:**
- Publishing CMS content
- Sending contact form
- Saving draft
- Adding new system
- Restoring version

#### Progress Bar (Long Operations)

**When to Use:** Operations > 5 seconds with deterministic progress (file uploads, batch operations).

**Visual Design:**
- Bar: Horizontal, rounded ends
- Background: Gray (`bg-gray-200`)
- Fill: Blue gradient (`bg-gradient-to-r from-blue-600 to-blue-500`)
- Height: 8px (h-2)
- Percentage text: Below or beside bar
- Animation: Smooth fill from 0% to 100%

**Behavior:**
- Updates in real-time as progress changes
- Shows percentage or "step X of Y"
- Completes with success toast
- Cancellable if operation supports it

**Accessibility:**
- ARIA: `role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"`
- Screen reader: Announces progress at 25%, 50%, 75%, 100%

**Example:**
```jsx
<div className="w-full">
  <div className="flex justify-between mb-2">
    <span className="text-sm text-gray-700">Uploading image...</span>
    <span className="text-sm text-gray-700">{progress}%</span>
  </div>
  <Progress value={progress} className="h-2" />
</div>
```

**Use Cases:**
- Image upload in CMS
- Batch system health check
- Data export/import (future)

#### WebSocket Connection Status

**When to Use:** Real-time dashboard with WebSocket connection.

**Visual Design:**
- **Connected:** 🟢 Small green dot in top nav, tooltip "Connected"
- **Connecting:** 🔵 Pulsing blue dot, tooltip "Connecting..."
- **Disconnected:** 🔴 Red dot, tooltip "Disconnected. Reconnecting..."
- **Failed:** ⚪ Gray dot, alert banner "Unable to connect. Refresh page."

**Behavior:**
- Auto-reconnect: 5 attempts with exponential backoff
- Banner alert: Shows after 3 failed reconnection attempts
- Real-time status updates pause during disconnect

**Accessibility:**
- ARIA: `role="status" aria-live="polite"`
- Screen reader: Announces connection state changes

**Example:**
```jsx
// Top nav connection indicator
<div className="flex items-center gap-2">
  <div className={cn(
    "h-2 w-2 rounded-full",
    status === 'connected' && "bg-green-500",
    status === 'connecting' && "bg-blue-500 animate-pulse",
    status === 'disconnected' && "bg-red-500",
    status === 'failed' && "bg-gray-400"
  )} />
  <span className="text-xs text-gray-600">
    {statusText}
  </span>
</div>
```

**Use Cases:**
- Dashboard real-time status updates
- Live preview synchronization (future)

---

### 5. Modal & Overlay Patterns

**Purpose:** Establish consistent behavior for dialogs, modals, sheets, and overlays.

#### Modal Dialog (Centered)

**When to Use:** Critical actions requiring user decision, confirmations, warnings.

**Visual Design:**
- Position: Center screen
- Size: Small (max-w-md), Medium (max-w-lg), Large (max-w-2xl)
- Background: White card with shadow-2xl
- Backdrop: Dark overlay (bg-black/50)
- Border Radius: rounded-xl
- Padding: p-6

**Behavior:**
- Animation: Fade in backdrop + scale modal (0.95 → 1.0)
- Focus trap: Tab cycles within modal only
- Dismiss: ESC key, backdrop click, X button, or Cancel button
- Scroll: Content scrolls if exceeds viewport height
- Z-index: High (z-50) to overlay all content

**Accessibility:**
- ARIA: `role="dialog" aria-modal="true" aria-labelledby="dialog-title"`
- Focus: Auto-focus on first interactive element (or Cancel for destructive actions)
- ESC key: Always closes modal
- Screen reader: Announces modal title and description

**Layout Structure:**
```jsx
<Dialog>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete ENEOS system?
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    {/* Optional: Modal body content */}
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={onConfirm}>
        Delete System
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Use Cases:**
- Delete confirmation
- Warning before accessing degraded system
- Add new system form
- Contact form (landing page)
- Unsaved changes warning

#### Side Panel / Sheet (Contextual)

**When to Use:** Additional information, settings, filters, version history.

**Visual Design:**
- Position: Right side (default), can be left/top/bottom
- Width: 400px (narrow), 600px (wide)
- Background: White with border-left
- Shadow: shadow-2xl
- Backdrop: Light overlay (bg-black/20) or no backdrop for non-critical

**Behavior:**
- Animation: Slide in from side (smooth transition)
- Focus trap: Tab cycles within sheet
- Dismiss: ESC key, backdrop click, X button
- Scroll: Content scrolls independently
- Z-index: z-40 (slightly lower than modal)

**Accessibility:**
- ARIA: `role="dialog" aria-modal="true" aria-labelledby="sheet-title"`
- Focus: Auto-focus on close button or first interactive element
- ESC key: Closes sheet

**Layout Structure:**
```jsx
<Sheet>
  <SheetContent side="right" className="w-[400px] sm:w-[600px]">
    <SheetHeader>
      <SheetTitle>Version History</SheetTitle>
      <SheetDescription>
        View and restore previous versions of this content
      </SheetDescription>
    </SheetHeader>
    <div className="py-4">
      {/* Sheet body content */}
      <VersionHistoryPanel />
    </div>
  </SheetContent>
</Sheet>
```

**Use Cases:**
- Version History Panel (CMS)
- Health Check Viewer (System details)
- Settings panel
- Filters panel (future)
- User profile menu (future)

#### Alert Dialog (Critical Decisions)

**When to Use:** Destructive actions, critical warnings, irreversible operations.

**Visual Design:**
- Same as Modal Dialog but with warning/danger styling
- Icon: ⚠️ Warning icon (amber or red)
- Title: Bold, urgent tone
- Description: Clear explanation of consequences
- Actions: Secondary "Cancel" (default focus) + Destructive "Confirm"

**Behavior:**
- Cannot dismiss via backdrop click (must choose action)
- ESC key maps to Cancel action
- Focus locked on dialog
- Primary button delayed 1s to prevent accidental clicks (optional for high-risk)

**Accessibility:**
- ARIA: `role="alertdialog"`
- Focus: Auto-focus on Cancel (safe option)
- Screen reader: Announces immediately as alert

**Example:**
```jsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <div className="flex items-center gap-3 mb-2">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <AlertDialogTitle>Delete ENEOS System?</AlertDialogTitle>
      </div>
      <AlertDialogDescription>
        This will permanently remove ENEOS from your dashboard.
        All settings and history will be lost. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDelete}
        className="bg-red-600 hover:bg-red-700"
      >
        Delete System
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Use Cases:**
- Delete system
- Discard unsaved changes
- Remove content version
- Irreversible actions

#### Popover (Contextual Help)

**When to Use:** Tooltips, contextual help, small menus, status details.

**Visual Design:**
- Position: Near trigger element (auto-positioned to stay in viewport)
- Size: Small, compact (max-w-xs)
- Background: White card with border
- Shadow: shadow-md
- Arrow: Points to trigger element

**Behavior:**
- Trigger: Hover (tooltip) or Click (menu)
- Dismiss: Click outside, ESC key, select option
- No focus trap (lightweight overlay)
- No backdrop

**Accessibility:**
- ARIA: `role="tooltip"` or `role="menu"`
- Focus: Remains on trigger for tooltips, moves to popover for menus
- ESC key: Closes popover

**Example:**
```jsx
// Tooltip popover
<Popover>
  <PopoverTrigger>
    <InfoIcon className="h-4 w-4 text-gray-400" />
  </PopoverTrigger>
  <PopoverContent className="max-w-xs">
    <p className="text-sm text-gray-700">
      Status is checked every 5 minutes. Last check: 2 min ago.
    </p>
  </PopoverContent>
</Popover>

// Status details popover
<Popover>
  <PopoverTrigger>
    <Badge variant="destructive">🔴 Down</Badge>
  </PopoverTrigger>
  <PopoverContent className="max-w-sm">
    <div className="space-y-2">
      <h4 className="font-semibold text-sm">System Down</h4>
      <p className="text-xs text-gray-600">
        Last successful check: 5 minutes ago
      </p>
      <p className="text-xs text-red-600">
        Error: Connection timeout after 30s
      </p>
      <Button size="sm" variant="ghost">View Details</Button>
    </div>
  </PopoverContent>
</Popover>
```

**Use Cases:**
- Status badge details
- Help tooltips
- Timestamp details ("Last checked 2 min ago")
- Quick actions menu

---

### 6. Navigation Patterns

**Purpose:** Define consistent navigation behaviors and keyboard shortcuts.

#### Primary Navigation (Top Nav)

**When to Use:** Main site navigation, role-based menu.

**Visual Design:**
- Position: Fixed top, full width
- Background: White with border-bottom
- Height: 64px
- Logo: Left side, clickable to home
- Menu items: Center or right
- User menu: Far right

**Behavior:**
- Sticky: Stays visible on scroll
- Active state: Current page highlighted
- Hover: Subtle underline or background change
- Mobile: Hamburger menu (< 768px)

**Accessibility:**
- ARIA: `role="navigation" aria-label="Main navigation"`
- Keyboard: Tab through links, Enter to activate
- Skip link: "Skip to main content" for screen readers

**Example:**
```jsx
<nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    <Link to="/" className="flex items-center gap-2">
      <img src="/logo.svg" alt="Zyncdata" className="h-8" />
      <span className="font-bold text-xl">Zyncdata</span>
    </Link>

    {/* Desktop menu */}
    <div className="hidden md:flex items-center gap-6">
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/cms">CMS</NavLink>
    </div>

    {/* User menu */}
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</nav>
```

#### In-Page Navigation (Tabs)

**When to Use:** Switch between views within same page context.

**Visual Design:**
- Style: Underline tabs (default shadcn/ui)
- Active tab: Blue underline, bold text
- Inactive tabs: Gray text, no underline
- Hover: Lighten text color

**Behavior:**
- Click to switch views
- Arrow keys to navigate between tabs
- Content updates below tabs
- Preserves scroll position per tab (optional)

**Accessibility:**
- ARIA: `role="tablist"` with `role="tab"` and `role="tabpanel"`
- Keyboard: Arrow keys navigate, Space/Enter activates
- Focus visible: Clear focus ring

**Example:**
```jsx
<Tabs defaultValue="systems" className="w-full">
  <TabsList>
    <TabsTrigger value="systems">Systems (6)</TabsTrigger>
    <TabsTrigger value="history">Health History</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>

  <TabsContent value="systems">
    <SystemsGrid />
  </TabsContent>

  <TabsContent value="history">
    <HealthCheckViewer />
  </TabsContent>

  <TabsContent value="settings">
    <SettingsPanel />
  </TabsContent>
</Tabs>
```

**Use Cases:**
- Dashboard views (All Systems, Healthy Only, Issues)
- CMS sections (Content, Media, Settings)
- System details (Overview, History, Logs)

#### Breadcrumb Navigation

**When to Use:** Deep hierarchical navigation, show current location.

**Visual Design:**
- Position: Below top nav or above page title
- Separator: `/` or `›`
- Links: Blue, underline on hover
- Current page: Gray, not clickable

**Behavior:**
- Click to navigate up hierarchy
- Last item (current page) is not interactive
- Truncate middle items if too long (show first, last, and current)

**Accessibility:**
- ARIA: `role="navigation" aria-label="Breadcrumb"`
- Keyboard: Tab through links
- Screen reader: "You are here: Dashboard, ENEOS System, Health History"

**Example:**
```jsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/systems/eneos">ENEOS</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Health History</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

**Use Cases:**
- CMS: Dashboard → CMS → Edit Hero Content
- System Details: Dashboard → ENEOS → Health History
- Deep navigation paths

#### Keyboard Shortcuts

**When to Use:** Power users, frequent actions, accessibility.

**Global Shortcuts:**
- `Ctrl/Cmd + K`: Command palette (future)
- `Ctrl/Cmd + /`: Show keyboard shortcuts help
- `ESC`: Close modal/sheet/popover
- `?`: Show help tooltip

**Context-Specific Shortcuts:**
- **Dashboard:**
  - `1-6`: Focus system card 1-6
  - `Enter`: Open focused system
  - `/`: Focus search (future)

- **CMS:**
  - `Ctrl/Cmd + S`: Save draft
  - `Ctrl/Cmd + Shift + P`: Publish
  - `Ctrl/Cmd + Z`: Undo
  - `Ctrl/Cmd + Shift + Z`: Redo

- **Forms:**
  - `Ctrl/Cmd + Enter`: Submit form
  - `ESC`: Cancel/close form

**Behavior:**
- Show hint tooltips with shortcuts: "Save (Ctrl+S)"
- Keyboard shortcuts panel accessible via `?` key
- Don't conflict with browser shortcuts
- Work across Windows, Mac, Linux

**Accessibility:**
- ARIA: Announce shortcuts when activated
- Visual feedback: Show which shortcut was triggered
- Discoverable: List in help menu

**Example:**
```jsx
// Global keyboard handler
useEffect(() => {
  const handleKeyboard = (e: KeyboardEvent) => {
    // Cmd+K: Command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      openCommandPalette()
    }

    // ESC: Close overlays
    if (e.key === 'Escape') {
      closeCurrentOverlay()
    }

    // ?: Show help
    if (e.key === '?' && !isInputFocused()) {
      e.preventDefault()
      openKeyboardShortcuts()
    }
  }

  window.addEventListener('keydown', handleKeyboard)
  return () => window.removeEventListener('keydown', handleKeyboard)
}, [])

// Button with keyboard shortcut hint
<Button onClick={handleSave}>
  Save Draft
  <kbd className="ml-2 text-xs opacity-60">Ctrl+S</kbd>
</Button>
```

---

### 7. Form Patterns & Validation

**Purpose:** Establish consistent form behavior, validation, and error handling.

#### Form Layout & Structure

**Visual Design:**
- Label position: Above input (mobile-friendly)
- Label style: Medium weight, gray-700
- Required indicator: Red asterisk `*` next to label
- Help text: Small gray text below label
- Input spacing: mb-4 between fields
- Field grouping: Border or background for related fields

**Behavior:**
- Tab order: Logical top-to-bottom, left-to-right
- Autofocus: First field on form open (optional)
- Auto-complete: Enable browser autocomplete for common fields
- Required fields: Marked visually and with `required` attribute

**Accessibility:**
- Labels: Always use `<label>` with `htmlFor` attribute
- ARIA: `aria-required="true"` for required fields
- Error association: `aria-describedby` links input to error message
- Fieldset: Group related inputs with `<fieldset>` and `<legend>`

**Example:**
```jsx
<form onSubmit={handleSubmit} className="space-y-4">
  <div>
    <Label htmlFor="name">
      Full Name <span className="text-red-500">*</span>
    </Label>
    <Input
      id="name"
      type="text"
      required
      aria-required="true"
      aria-describedby={errors.name ? "name-error" : undefined}
    />
    {errors.name && (
      <p id="name-error" className="text-sm text-red-500 mt-1">
        {errors.name.message}
      </p>
    )}
  </div>

  <div>
    <Label htmlFor="email">
      Email <span className="text-red-500">*</span>
    </Label>
    <p className="text-xs text-gray-500 mb-1">
      We'll reply within 24 hours
    </p>
    <Input
      id="email"
      type="email"
      required
      aria-required="true"
    />
  </div>

  <Button type="submit">Submit</Button>
</form>
```

#### Inline Validation (Real-Time)

**When to Use:** CMS forms, complex forms, instant feedback needed.

**Validation Timing:**
- **On Blur:** Validate field when user leaves it (least intrusive)
- **On Change (debounced):** Validate as user types for critical fields (email format, username availability)
- **On Submit:** Final validation before submission

**Visual Design:**
- **Valid:** Green checkmark icon, green border (optional)
- **Invalid:** Red X icon, red border, error message below
- **Validating:** Blue spinner icon (for async validation)

**Behavior:**
- Error appears immediately after validation fails
- Error disappears when user corrects the input
- Error message specific and actionable
- Async validation debounced (300ms) to avoid excessive API calls

**Accessibility:**
- ARIA: `aria-invalid="true"` when error present
- Error message: Linked via `aria-describedby`
- Screen reader: Announces error when it appears

**Example:**
```jsx
<div>
  <Label htmlFor="email">Email</Label>
  <div className="relative">
    <Input
      id="email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      onBlur={validateEmail}
      aria-invalid={!!emailError}
      aria-describedby={emailError ? "email-error" : undefined}
      className={cn(
        emailError && "border-red-500",
        isValidEmail && "border-green-500"
      )}
    />
    {isValidating && (
      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-blue-500" />
    )}
    {isValidEmail && !isValidating && (
      <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
    )}
    {emailError && (
      <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
    )}
  </div>
  {emailError && (
    <p id="email-error" className="text-sm text-red-500 mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {emailError}
    </p>
  )}
</div>
```

**Validation Rules:**
- **Email:** Valid email format, not empty
- **URL:** Valid URL format, reachable (async check)
- **Required:** Not empty, trimmed
- **Min/Max Length:** Character count limits
- **Custom:** Business logic (e.g., system name uniqueness)

**Error Messages - Examples:**
- ❌ "Invalid email" → ✅ "Please enter a valid email address (e.g., name@example.com)"
- ❌ "Required field" → ✅ "System name is required"
- ❌ "Too short" → ✅ "Description must be at least 10 characters"
- ❌ "Error" → ✅ "This system name is already in use. Try a different name."

#### Form Submission

**Behavior:**
- **Before Submit:** Final validation of all fields
- **During Submit:** Disable form, show loading state on submit button
- **Success:** Show success toast, clear form OR navigate away
- **Error:** Show error toast, re-enable form, focus first error field

**Accessibility:**
- Focus management: Focus first error field on submission failure
- Screen reader: Announce success/error message

**Example:**
```jsx
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()

  // Final validation
  const errors = validateForm(formData)
  if (Object.keys(errors).length > 0) {
    setErrors(errors)
    // Focus first error field
    document.getElementById(Object.keys(errors)[0])?.focus()
    return
  }

  // Submit
  setIsSubmitting(true)
  try {
    await submitContactForm(formData)

    toast.success("Message sent!", {
      description: "We'll reply within 24 hours."
    })

    // Clear form
    resetForm()
    closeModal()
  } catch (error) {
    toast.error("Unable to send message", {
      description: error.message || "Please try again later.",
      action: {
        label: "Retry",
        onClick: () => handleSubmit(e)
      }
    })
  } finally {
    setIsSubmitting(false)
  }
}
```

#### Auto-Save (CMS)

**When to Use:** Long forms, content editing, prevent data loss.

**Behavior:**
- **Trigger:** Auto-save every 30 seconds if changes detected
- **Indicator:** "Saving..." → "Saved 2 min ago"
- **Debouncing:** Wait 2 seconds after last keystroke before saving
- **Conflict Resolution:** Warn if another user edited same content

**Visual Design:**
- Indicator position: Top right of form or near save button
- States:
  - **Unsaved:** "Unsaved changes"
  - **Saving:** Spinner + "Saving..."
  - **Saved:** Checkmark + "Saved 2 min ago"
  - **Error:** X + "Save failed. Retry?"

**Accessibility:**
- ARIA: `aria-live="polite"` for save status updates
- Screen reader: "Auto-save enabled. Last saved 2 minutes ago."

**Example:**
```jsx
const AutoSaveIndicator = ({ status, lastSaved }) => {
  return (
    <div
      className="flex items-center gap-2 text-sm"
      role="status"
      aria-live="polite"
    >
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          <span className="text-gray-600">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span className="text-gray-600">
            Saved {formatDistanceToNow(lastSaved)} ago
          </span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-3 w-3 text-red-500" />
          <button className="text-red-600 underline">
            Save failed. Retry?
          </button>
        </>
      )}
      {status === 'unsaved' && (
        <span className="text-amber-600">Unsaved changes</span>
      )}
    </div>
  )
}

// Auto-save hook
const useAutoSave = (data, saveFn, interval = 30000) => {
  const [status, setStatus] = useState('saved')
  const [lastSaved, setLastSaved] = useState(new Date())
  const debouncedData = useDebounce(data, 2000)

  useEffect(() => {
    const save = async () => {
      setStatus('saving')
      try {
        await saveFn(debouncedData)
        setStatus('saved')
        setLastSaved(new Date())
      } catch (error) {
        setStatus('error')
      }
    }

    const timer = setInterval(save, interval)
    return () => clearInterval(timer)
  }, [debouncedData, saveFn, interval])

  return { status, lastSaved }
}
```

**Use Cases:**
- CMS content editor
- Long forms (multi-step)
- User profile editing

#### Unsaved Changes Warning

**When to Use:** User attempts to leave page with unsaved changes.

**Behavior:**
- Browser native prompt: "You have unsaved changes. Leave page?"
- Custom modal (better UX): "Save changes before leaving?"
- Actions: "Save & Leave", "Leave Without Saving", "Cancel"

**Accessibility:**
- Focus: Auto-focus on "Cancel" (safe option)
- ESC key: Maps to "Cancel"

**Example:**
```jsx
const useUnsavedChangesWarning = (hasUnsavedChanges: boolean) => {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '' // Chrome requires returnValue to be set
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Also handle React Router navigation
  useBlocker(() => {
    if (hasUnsavedChanges) {
      return !window.confirm('You have unsaved changes. Leave without saving?')
    }
    return false
  })
}
```

---

## Design System Integration

### How Patterns Complement shadcn/ui

These UX patterns work seamlessly with our chosen design system (shadcn/ui + Tailwind CSS):

**Component Foundation:**
- All patterns use shadcn/ui base components (Button, Dialog, Toast, etc.)
- Custom behavior layered on top of unstyled primitives
- Consistent with Radix UI accessibility standards

**Styling Consistency:**
- All patterns use DxT brand colors from Tailwind config
- Typography follows Nunito font system
- Spacing uses 8px grid system (Tailwind default)
- Animations use consistent timing functions

**Customization Approach:**
- Patterns defined in reusable hooks (useAutoSave, useKeyboardShortcuts)
- Component variants created via className composition
- No conflicting styles with design system

**Performance Optimization:**
- No runtime CSS-in-JS overhead
- Tree-shakeable pattern utilities
- Lazy-loaded modals and overlays
- Debounced validation and auto-save

---

## Pattern Implementation Guidelines

### For Developers

**1. Consistency First:**
- Always reference these patterns when implementing features
- Don't create one-off solutions - extend existing patterns
- When in doubt, ask: "Is there a pattern for this?"

**2. Accessibility Non-Negotiable:**
- Every pattern includes accessibility requirements
- Test with keyboard navigation
- Test with screen reader (NVDA, JAWS, VoiceOver)
- Run axe DevTools on every component

**3. Performance Considerations:**
- Debounce user input (300ms standard, 2s for auto-save)
- Use skeleton screens for < 3s loads
- Lazy load modals and heavy components
- Optimize animations (use transform/opacity only)

**4. Error Handling:**
- Every async operation needs error handling
- Use empathetic error messages
- Provide recovery actions (retry, contact support)
- Log errors for debugging (Sentry, LogRocket, etc.)

**5. Testing:**
- Unit test: Validation logic, async patterns
- Integration test: Form submission flows
- E2E test: Critical user journeys (publish content, send contact form)
- Accessibility test: Automated (axe) + manual (screen reader)

---

## Pattern Success Metrics

### Button Hierarchy
- **Goal:** Users intuitively identify primary actions
- **Metric:** < 5% clicks on wrong button in critical flows
- **Tracking:** Click heatmaps, user session recordings

### Feedback Patterns
- **Goal:** Users understand system state and action outcomes
- **Metric:** < 10% support tickets due to unclear feedback
- **Tracking:** Support ticket analysis, user surveys

### Empty States
- **Goal:** Users know what to do when no data present
- **Metric:** 80%+ complete first action from empty state
- **Tracking:** Funnel analysis (empty state → first action)

### Loading States
- **Goal:** Users feel confident system is working
- **Metric:** < 20% premature page refreshes during load
- **Tracking:** Analytics events for page refreshes

### Modal Patterns
- **Goal:** Users complete modal actions without confusion
- **Metric:** < 10% modal abandonment rate
- **Tracking:** Modal analytics (opened vs completed)

### Navigation Patterns
- **Goal:** Users navigate efficiently without getting lost
- **Metric:** < 3 clicks to reach any page
- **Tracking:** Navigation path analysis

### Form Patterns
- **Goal:** Users complete forms with minimal friction
- **Metric:** > 80% form completion rate
- **Tracking:** Form analytics (start, field errors, completion)

---

### 8. Performance & Optimization Patterns

**Purpose:** Ensure fast, responsive user experience through performance budgets and optimization strategies.

#### Performance Budget Pattern

**Performance Targets (Non-Negotiable):**

**Bundle Size Limits:**
- Initial JavaScript bundle: < 150KB (gzipped)
- CSS bundle: < 50KB (gzipped)
- Total initial page weight: < 500KB (excluding images)
- Individual route chunks: < 100KB each

**Core Web Vitals:**
- **LCP (Largest Contentful Paint):** < 2.5s for all pages
  - Dashboard: < 2.0s (critical user path)
  - Landing page: < 1.8s (first impression)
  - CMS: < 2.5s (acceptable for admin tool)

- **FID (First Input Delay):** < 100ms
  - Button clicks respond immediately
  - Form inputs responsive on first keystroke

- **CLS (Cumulative Layout Shift):** < 0.1
  - Skeleton screens match exact layout dimensions
  - No content jumping during load
  - Reserved space for dynamic content

**Additional Metrics:**
- **Time to Interactive (TTI):** < 3.5s on 4G connection
- **Speed Index:** < 3.0s
- **Total Blocking Time:** < 300ms

**Monitoring & Enforcement:**
- Lighthouse CI in PR checks (fail if budget exceeded)
- Real User Monitoring (RUM) via Web Vitals API
- Bundle size analysis in every build (webpack-bundle-analyzer)
- Performance dashboard tracking weekly trends

**When Budget Exceeded:**
1. Block PR merge
2. Identify heavy dependencies (source-map-explorer)
3. Implement code splitting or lazy loading
4. Consider alternative lighter libraries

#### Code Splitting Strategy Pattern

**Route-Based Splitting (Primary):**

```typescript
// Lazy load major routes
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CMS = lazy(() => import('./pages/CMS'))
const LandingPage = lazy(() => import('./pages/Landing'))

// Router setup with suspense
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/cms" element={<CMS />} />
  </Routes>
</Suspense>
```

**Component-Based Splitting (Secondary):**

```typescript
// Heavy components lazy loaded
const SplitScreenEditor = lazy(() => import('@/components/SplitScreenEditor'))
const VersionHistoryPanel = lazy(() => import('@/components/VersionHistoryPanel'))
const OnboardingTour = lazy(() => import('@/components/OnboardingTour'))

// Modal dialogs lazy loaded (only when opened)
const ConfirmDeleteDialog = lazy(() => import('@/components/ConfirmDeleteDialog'))
```

**Vendor Splitting:**

```javascript
// webpack.config.js
optimization: {
  splitChunks: {
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
      },
      common: {
        minChunks: 2,
        priority: -10,
        reuseExistingChunk: true,
      },
    },
  },
}
```

**Preloading Strategy:**
- Preload critical routes on idle: `<link rel="prefetch">`
- Preconnect to API domain: `<link rel="preconnect">`
- DNS prefetch for WebSocket server

#### Error Boundary Pattern

**Purpose:** Gracefully handle React component errors without crashing entire app.

**Implementation:**

```typescript
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking service
    logErrorToSentry({
      error,
      errorInfo,
      userContext: {
        userId: getCurrentUserId(),
        route: window.location.pathname,
      },
    })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback
        error={this.state.error}
        resetError={() => this.setState({ hasError: false })}
      />
    }

    return this.props.children
  }
}

// ErrorFallback.tsx
const ErrorFallback = ({ error, resetError }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4">
    <div className="text-6xl mb-4">😞</div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">
      Something went wrong
    </h2>
    <p className="text-gray-600 mb-4 max-w-md text-center">
      We're sorry! An unexpected error occurred. Don't worry - your work has been auto-saved.
    </p>
    <div className="flex gap-3">
      <Button onClick={resetError}>
        Try Again
      </Button>
      <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
        Back to Dashboard
      </Button>
    </div>
    {process.env.NODE_ENV === 'development' && (
      <details className="mt-4 max-w-2xl">
        <summary className="cursor-pointer text-sm text-gray-500">
          Error Details (Dev Only)
        </summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
          {error?.toString()}
          {error?.stack}
        </pre>
      </details>
    )}
  </div>
)
```

**Usage - Wrap Critical Sections:**

```tsx
// App-level boundary
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Route-level boundaries
<Route path="/dashboard" element={
  <ErrorBoundary fallback={<DashboardError />}>
    <Dashboard />
  </ErrorBoundary>
} />

// Component-level for risky operations
<ErrorBoundary fallback={<EditorError />}>
  <SplitScreenEditor />
</ErrorBoundary>
```

#### WebSocket Reconnection Pattern

**Purpose:** Reliable real-time connection with automatic recovery from network failures.

**Exponential Backoff Strategy:**

```typescript
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000] // ms
const MAX_RECONNECT_ATTEMPTS = 5

class WebSocketManager {
  private socket: Socket | null = null
  private reconnectAttempt = 0
  private reconnectTimer: NodeJS.Timeout | null = null

  connect(url: string) {
    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: false, // Manual reconnection for better control
    })

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected')
      this.reconnectAttempt = 0 // Reset counter on successful connection
      updateConnectionStatus('connected')
    })

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ WebSocket disconnected:', reason)
      updateConnectionStatus('disconnected')

      if (reason === 'io server disconnect') {
        // Server initiated disconnect - don't reconnect automatically
        return
      }

      // Client-side disconnect - attempt reconnection
      this.scheduleReconnect()
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error)
      updateConnectionStatus('failed')
      this.scheduleReconnect()
    })
  }

  private scheduleReconnect() {
    if (this.reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached')
      updateConnectionStatus('failed')
      showPersistentErrorBanner()
      return
    }

    const delay = RECONNECT_DELAYS[this.reconnectAttempt] || 16000
    updateConnectionStatus('connecting')

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt + 1}/${MAX_RECONNECT_ATTEMPTS})`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempt++
      this.socket?.connect()
    }, delay)
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.socket?.disconnect()
  }
}

// Connection status indicator
const updateConnectionStatus = (status: ConnectionStatus) => {
  const statusMap = {
    connected: { color: 'green', text: 'Connected', pulse: false },
    connecting: { color: 'blue', text: 'Connecting...', pulse: true },
    disconnected: { color: 'red', text: 'Disconnected. Reconnecting...', pulse: false },
    failed: { color: 'gray', text: 'Connection failed', pulse: false },
  }

  // Update UI indicator
  document.getElementById('ws-status')?.setAttribute('data-status', status)

  // Screen reader announcement
  announceToScreenReader(statusMap[status].text)
}

const showPersistentErrorBanner = () => {
  toast.error('Unable to connect to server', {
    description: 'Real-time updates are unavailable. Please refresh the page.',
    duration: Infinity, // Don't auto-dismiss
    action: {
      label: 'Refresh Page',
      onClick: () => window.location.reload()
    }
  })
}
```

**Connection Status UI Pattern:**

```tsx
const ConnectionIndicator = () => {
  const { status } = useWebSocketStatus()

  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <div className={cn(
        "h-2 w-2 rounded-full",
        status === 'connected' && "bg-green-500",
        status === 'connecting' && "bg-blue-500 animate-pulse",
        status === 'disconnected' && "bg-red-500",
        status === 'failed' && "bg-gray-400"
      )} />
      <span className="text-xs text-gray-600">
        {status === 'connected' && 'Connected'}
        {status === 'connecting' && 'Connecting...'}
        {status === 'disconnected' && 'Reconnecting...'}
        {status === 'failed' && 'Offline'}
      </span>
    </div>
  )
}
```

#### Debounce & Throttle Pattern

**Purpose:** Optimize performance by limiting function execution frequency.

**Debounce Implementation:**

```typescript
// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Usage in search input
const SearchInput = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Only search after 300ms of no typing
      performSearch(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm])

  return (
    <Input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search systems..."
    />
  )
}

// Auto-save with debounce
const CMSEditor = () => {
  const [content, setContent] = useState('')
  const debouncedContent = useDebounce(content, 2000) // 2s delay

  useEffect(() => {
    if (debouncedContent) {
      autoSave(debouncedContent)
    }
  }, [debouncedContent])

  return <textarea value={content} onChange={(e) => setContent(e.target.value)} />
}
```

**Throttle Implementation:**

```typescript
// Custom hook for throttling functions
function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now())

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastRan.current >= delay) {
      callback(...args)
      lastRan.current = now
    }
  }, [callback, delay]) as T
}

// Usage in scroll handler
const InfiniteScroll = () => {
  const handleScroll = useThrottle(() => {
    const scrollPercentage = (window.scrollY / document.body.scrollHeight) * 100
    if (scrollPercentage > 80) {
      loadMoreItems()
    }
  }, 300) // Max once per 300ms

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return <div>...</div>
}
```

**Standard Delay Guidelines:**
- **Search input:** 300ms debounce
- **Form validation:** On blur (immediate) or 500ms debounce on change
- **Auto-save:** 2000ms debounce (2 seconds after last edit)
- **Live preview:** 300ms debounce
- **Scroll events:** 100-300ms throttle
- **Resize events:** 200ms throttle
- **Analytics tracking:** 1000ms debounce

---

### 9. Testing & Quality Patterns

**Purpose:** Ensure UX patterns work consistently across devices, browsers, and user contexts.

#### Testing Pyramid for UX Patterns

**Level 1: Unit Tests (70% coverage)**

```typescript
// Example: Button validation tests
describe('PrimaryButton', () => {
  it('renders with correct styling', () => {
    render(<Button variant="primary">Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gradient-to-r from-blue-600 to-blue-500')
  })

  it('shows loading state correctly', () => {
    render(<Button loading>Submit</Button>)
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('meets accessibility requirements', async () => {
    const { container } = render(<Button>Click me</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// Example: Form validation logic tests
describe('validateEmail', () => {
  it('accepts valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true)
  })

  it('rejects invalid formats', () => {
    expect(validateEmail('not-an-email')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
  })

  it('returns specific error messages', () => {
    const result = validateEmailWithMessage('')
    expect(result.error).toBe('Email is required')
  })
})
```

**Level 2: Integration Tests (20% coverage)**

```typescript
// Example: Form submission flow test
describe('ContactForm submission', () => {
  it('validates, submits, and shows success toast', async () => {
    render(<ContactForm />)

    // Fill form
    await userEvent.type(screen.getByLabelText(/name/i), 'John Doe')
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com')
    await userEvent.type(screen.getByLabelText(/message/i), 'Hello!')

    // Submit
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    // Verify loading state
    expect(screen.getByText(/sending/i)).toBeInTheDocument()

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/message sent/i)).toBeInTheDocument()
    })
  })

  it('handles errors gracefully', async () => {
    server.use(
      rest.post('/api/contact', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )

    render(<ContactForm />)

    // Submit form (pre-filled)
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    // Verify error handling
    await waitFor(() => {
      expect(screen.getByText(/unable to send/i)).toBeInTheDocument()
    })

    // Verify retry action present
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})
```

**Level 3: E2E Tests (10% coverage)**

```typescript
// Example: Critical user journey E2E test (Playwright)
test('Dashboard to system access flow', async ({ page }) => {
  // Navigate to dashboard
  await page.goto('/dashboard')

  // Verify skeleton loading state
  await expect(page.locator('[data-testid="system-skeleton"]')).toBeVisible()

  // Wait for real content
  await expect(page.locator('[data-testid="system-card"]').first()).toBeVisible()

  // Check healthy system click behavior
  const healthyCard = page.locator('[data-testid="system-card-healthy"]').first()
  await healthyCard.click()

  // Should navigate to system URL (verify redirect)
  await page.waitForURL(/tinedy|voca|eneos/)

  // Go back to test degraded system
  await page.goto('/dashboard')

  const degradedCard = page.locator('[data-testid="system-card-degraded"]').first()
  await degradedCard.click()

  // Should show warning dialog
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await expect(page.getByText(/experiencing performance issues/i)).toBeVisible()

  // Test keyboard navigation - ESC should close
  await page.keyboard.press('Escape')
  await expect(page.getByRole('alertdialog')).not.toBeVisible()
})
```

#### Visual Regression Testing Pattern

**Tools:** Playwright + Percy or Chromatic

```typescript
// visual-regression.spec.ts
test.describe('Visual Regression Tests', () => {
  test('Toast notifications render consistently', async ({ page }) => {
    await page.goto('/test-toasts')

    // Trigger success toast
    await page.click('[data-test="show-success-toast"]')
    await page.waitForSelector('[data-sonner-toast]')

    // Capture screenshot
    await expect(page).toHaveScreenshot('toast-success.png')

    // Test error toast
    await page.click('[data-test="show-error-toast"]')
    await expect(page).toHaveScreenshot('toast-error.png')
  })

  test('Button states render correctly', async ({ page }) => {
    await page.goto('/test-buttons')

    // Default state
    await expect(page.locator('[data-test="primary-button"]')).toHaveScreenshot('button-primary-default.png')

    // Hover state
    await page.hover('[data-test="primary-button"]')
    await expect(page.locator('[data-test="primary-button"]')).toHaveScreenshot('button-primary-hover.png')

    // Loading state
    await expect(page.locator('[data-test="button-loading"]')).toHaveScreenshot('button-loading.png')
  })

  test('Modal animations consistent', async ({ page }) => {
    await page.goto('/dashboard')

    // Open delete confirmation modal
    await page.click('[data-test="delete-system-button"]')
    await page.waitForSelector('[role="alertdialog"]', { state: 'visible' })

    // Wait for animation to complete
    await page.waitForTimeout(300)

    await expect(page).toHaveScreenshot('modal-delete-confirmation.png')
  })

  test('Skeleton screens match layout', async ({ page }) => {
    // Capture skeleton state
    await page.goto('/dashboard?mock=skeleton')
    await expect(page).toHaveScreenshot('dashboard-skeleton.png')

    // Capture loaded state
    await page.goto('/dashboard')
    await page.waitForSelector('[data-testid="system-card"]')
    await expect(page).toHaveScreenshot('dashboard-loaded.png')

    // Manually verify no layout shift by comparing screenshots
  })
})
```

#### Accessibility Testing Matrix

**Automated Testing (Required for all PRs):**

```typescript
// jest-axe integration
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

describe('Accessibility tests', () => {
  it('Dashboard passes axe scan', async () => {
    const { container } = render(<Dashboard />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('CMS editor passes axe scan', async () => {
    const { container } = render(<CMSEditor />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('Modal dialogs are accessible', async () => {
    const { container } = render(<ConfirmDeleteDialog open />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// Playwright axe integration
test('Dashboard accessibility (E2E)', async ({ page }) => {
  await page.goto('/dashboard')
  await injectAxe(page)

  const violations = await checkA11y(page)
  expect(violations).toHaveLength(0)
})
```

**Manual Testing Checklist (Required before release):**

**Keyboard Navigation:**
- [ ] Tab through all interactive elements in logical order
- [ ] Enter/Space activates buttons and links
- [ ] ESC closes modals, popovers, sheets
- [ ] Arrow keys navigate tabs
- [ ] Focus visible on all interactive elements
- [ ] No keyboard traps (can tab out of all sections)

**Screen Reader Testing (NVDA on Windows, VoiceOver on Mac):**
- [ ] All images have alt text or aria-labels
- [ ] Form inputs associated with labels
- [ ] Error messages announced immediately
- [ ] Loading states announced ("Loading dashboard, please wait")
- [ ] Success/error toasts announced with appropriate urgency
- [ ] Modal dialogs announced with title and description
- [ ] Dynamic content updates announced (aria-live regions)

**Visual Accessibility:**
- [ ] Text contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Interactive elements ≥ 3:1 contrast with background
- [ ] Color not sole means of conveying information (use icons + text)
- [ ] Focus indicators clearly visible
- [ ] Text remains readable at 200% zoom
- [ ] No content loss at 400% zoom
- [ ] High contrast mode (Windows) works correctly

**Motor Accessibility:**
- [ ] Touch targets minimum 44x44px
- [ ] Sufficient spacing between interactive elements
- [ ] No time-critical interactions (or can be extended)
- [ ] Forms can be completed with keyboard only
- [ ] No required fine motor control (drag-drop has alternative)

#### Browser & Device Support Matrix

**Desktop Browsers (100% feature parity):**
- Chrome 90+ (Windows, Mac, Linux)
- Firefox 88+ (Windows, Mac, Linux)
- Safari 14+ (Mac only)
- Edge 90+ (Windows, Mac)

**Mobile Browsers (Optimized responsive experience):**
- iOS Safari 14+ (iPhone, iPad)
- Android Chrome 90+
- Samsung Internet 14+

**Screen Resolutions (Test breakpoints):**
- 320px - Mobile portrait (iPhone SE)
- 375px - Mobile portrait (iPhone 12)
- 768px - Tablet portrait (iPad)
- 1024px - Tablet landscape / small laptop
- 1280px - Desktop (standard)
- 1920px - Desktop (full HD)

**Testing Strategy:**
```javascript
// BrowserStack or Sauce Labs configuration
const browsers = [
  { browserName: 'chrome', version: '90', os: 'Windows', os_version: '10' },
  { browserName: 'firefox', version: '88', os: 'Windows', os_version: '10' },
  { browserName: 'safari', version: '14', os: 'OS X', os_version: 'Big Sur' },
  { browserName: 'edge', version: '90', os: 'Windows', os_version: '10' },
  { browserName: 'chrome', device: 'iPhone 12', real_mobile: true },
  { browserName: 'chrome', device: 'Samsung Galaxy S21', real_mobile: true },
]

// Run E2E tests on all browsers
browsers.forEach(browser => {
  test.describe(`${browser.browserName} ${browser.version}`, () => {
    // Critical flow tests
  })
})
```

**Unsupported Browsers (Show graceful message):**
- Internet Explorer (all versions)
- Chrome < 90
- Firefox < 88
- Safari < 14

```tsx
// Browser detection and warning
const UnsupportedBrowserWarning = () => {
  const isUnsupported = detectUnsupportedBrowser()

  if (!isUnsupported) return null

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 p-4">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <p className="text-sm text-yellow-800">
          You're using an unsupported browser. For the best experience, please update to the latest version of Chrome, Firefox, Safari, or Edge.
        </p>
      </div>
    </div>
  )
}
```

#### Error Logging & Monitoring Pattern

**Error Tracking Service Setup:**

```typescript
// sentry.config.ts
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.REACT_APP_VERSION,

  // Performance monitoring
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.1, // 10% of transactions

  // Error filtering
  beforeSend(event, hint) {
    // Don't send errors from localhost
    if (window.location.hostname === 'localhost') return null

    // Filter out known third-party errors
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
      return null
    }

    // Scrub PII
    if (event.request?.cookies) {
      delete event.request.cookies
    }

    return event
  },

  // User context
  initialScope: {
    tags: {
      appVersion: process.env.REACT_APP_VERSION,
    },
  },
})

// Set user context after authentication
export const setUserContext = (user: User) => {
  Sentry.setUser({
    id: user.id,
    email: user.email, // Only if user consents
    username: user.name,
  })
}
```

**Error Severity Levels:**

```typescript
// Low severity - log but don't alert
Sentry.captureMessage('WebSocket reconnected after 3 attempts', 'info')

// Medium severity - log and track
Sentry.captureException(new Error('Form validation failed unexpectedly'), {
  level: 'warning',
  tags: { component: 'ContactForm' },
})

// High severity - log, alert, and notify team
Sentry.captureException(error, {
  level: 'error',
  tags: { critical: true },
  contexts: {
    formData: { /* sanitized data */ },
    userJourney: ['dashboard', 'cms', 'publish'],
  },
})
```

**Structured Logging Pattern:**

```typescript
// logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
}

class Logger {
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    // Console output (development)
    if (process.env.NODE_ENV === 'development') {
      console[level === 'debug' ? 'log' : level](entry)
    }

    // Send to logging service (production)
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(entry)
    }

    // Send errors to Sentry
    if (level === 'error') {
      Sentry.captureException(new Error(message), { extra: context })
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context)
  }

  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context)
  }

  private sendToLoggingService(entry: LogEntry) {
    // Send to LogRocket, Datadog, or custom endpoint
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => {
      // Silently fail - don't break app if logging fails
    })
  }
}

export const logger = new Logger()

// Usage examples
logger.info('User published content', {
  contentType: 'hero',
  userId: user.id,
  duration: 45.2, // seconds
})

logger.error('Failed to restore version', {
  versionId: 'v5',
  errorCode: 'VERSION_NOT_FOUND',
  userId: user.id,
})
```

**PII Scrubbing Pattern:**

```typescript
// Automatically scrub sensitive data before logging
const scrubPII = (obj: any): any => {
  const sensitiveKeys = ['password', 'token', 'apiKey', 'ssn', 'creditCard']

  if (typeof obj !== 'object' || obj === null) return obj

  const scrubbed = { ...obj }

  for (const key in scrubbed) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      scrubbed[key] = '[REDACTED]'
    } else if (typeof scrubbed[key] === 'object') {
      scrubbed[key] = scrubPII(scrubbed[key])
    }
  }

  return scrubbed
}

// Usage
logger.info('Form submitted', scrubPII(formData))
```

---

### 10. User Feedback & Analytics Patterns

**Purpose:** Continuously improve UX patterns through data-driven insights and user feedback.

#### Analytics Instrumentation Pattern

**Event Tracking Strategy:**

```typescript
// analytics.ts
interface AnalyticsEvent {
  category: 'navigation' | 'interaction' | 'conversion' | 'error'
  action: string
  label?: string
  value?: number
  metadata?: Record<string, any>
}

class Analytics {
  track(event: AnalyticsEvent) {
    // Send to Google Analytics 4
    if (window.gtag) {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.metadata,
      })
    }

    // Send to custom analytics endpoint
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        timestamp: Date.now(),
        sessionId: getSessionId(),
        userId: getUserId(),
      }),
    }).catch(() => {
      // Silently fail - don't break UX if analytics fails
    })
  }

  // Convenience methods
  trackPageView(path: string) {
    this.track({
      category: 'navigation',
      action: 'page_view',
      label: path,
    })
  }

  trackButtonClick(buttonName: string, metadata?: Record<string, any>) {
    this.track({
      category: 'interaction',
      action: 'button_click',
      label: buttonName,
      metadata,
    })
  }

  trackFormSubmission(formName: string, success: boolean, duration: number) {
    this.track({
      category: 'conversion',
      action: success ? 'form_submitted' : 'form_failed',
      label: formName,
      value: duration,
      metadata: { success },
    })
  }

  trackError(errorType: string, message: string) {
    this.track({
      category: 'error',
      action: errorType,
      label: message,
    })
  }
}

export const analytics = new Analytics()
```

**Pattern-Specific Tracking Examples:**

```typescript
// Button hierarchy pattern - track wrong clicks
const SystemCard = ({ system }) => {
  const handleClick = () => {
    analytics.trackButtonClick('system_card', {
      systemId: system.id,
      status: system.status,
      expectedAction: system.status === 'healthy' ? 'navigate' : 'show_modal',
    })

    // Rest of click logic...
  }
}

// Form pattern - track completion funnel
const ContactForm = () => {
  const startTime = useRef(Date.now())
  const [fieldErrors, setFieldErrors] = useState<string[]>([])

  useEffect(() => {
    analytics.track({
      category: 'interaction',
      action: 'form_started',
      label: 'contact_form',
    })
  }, [])

  const handleSubmit = async (data) => {
    const duration = (Date.now() - startTime.current) / 1000

    try {
      await submitForm(data)

      analytics.trackFormSubmission('contact_form', true, duration)
      analytics.track({
        category: 'conversion',
        action: 'contact_form_success',
        metadata: {
          duration,
          fieldErrorsEncountered: fieldErrors.length,
          retryAttempts: retryCount,
        },
      })
    } catch (error) {
      analytics.trackFormSubmission('contact_form', false, duration)
      analytics.trackError('form_submission_failed', error.message)
    }
  }
}

// Modal pattern - track abandonment
const ConfirmDeleteDialog = ({ open, onClose }) => {
  const openTime = useRef<number | null>(null)

  useEffect(() => {
    if (open) {
      openTime.current = Date.now()
      analytics.track({
        category: 'interaction',
        action: 'modal_opened',
        label: 'confirm_delete',
      })
    }
  }, [open])

  const handleClose = (action: 'confirm' | 'cancel' | 'backdrop') => {
    if (openTime.current) {
      const duration = (Date.now() - openTime.current) / 1000

      analytics.track({
        category: 'interaction',
        action: 'modal_closed',
        label: 'confirm_delete',
        metadata: {
          closeAction: action,
          duration,
          abandoned: action === 'backdrop', // User clicked outside
        },
      })
    }

    onClose()
  }
}

// Loading pattern - track premature refreshes
useEffect(() => {
  const handleBeforeUnload = () => {
    if (isLoading) {
      analytics.track({
        category: 'interaction',
        action: 'premature_page_refresh',
        label: window.location.pathname,
        metadata: {
          loadingDuration: (Date.now() - loadStartTime) / 1000,
        },
      })
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [isLoading])
```

#### A/B Testing Pattern

**A/B Test Infrastructure:**

```typescript
// ab-test.ts
type Variant = 'control' | 'variant_a' | 'variant_b'

interface ABTest {
  testId: string
  variants: Variant[]
  weights?: number[] // Optional custom distribution
}

class ABTesting {
  private assignments = new Map<string, Variant>()

  assignVariant(test: ABTest): Variant {
    // Check for existing assignment (sticky)
    const stored = localStorage.getItem(`ab_${test.testId}`)
    if (stored && test.variants.includes(stored as Variant)) {
      return stored as Variant
    }

    // Random assignment with optional weights
    const weights = test.weights || test.variants.map(() => 1)
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    let random = Math.random() * totalWeight

    let assigned: Variant = test.variants[0]
    for (let i = 0; i < test.variants.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        assigned = test.variants[i]
        break
      }
    }

    // Store assignment
    localStorage.setItem(`ab_${test.testId}`, assigned)
    this.assignments.set(test.testId, assigned)

    // Track assignment
    analytics.track({
      category: 'experiment',
      action: 'variant_assigned',
      label: test.testId,
      metadata: { variant: assigned },
    })

    return assigned
  }

  getVariant(testId: string): Variant | null {
    return this.assignments.get(testId) || localStorage.getItem(`ab_${testId}`) as Variant | null
  }

  trackConversion(testId: string, conversionType: string) {
    const variant = this.getVariant(testId)
    if (!variant) return

    analytics.track({
      category: 'experiment',
      action: 'conversion',
      label: testId,
      metadata: {
        variant,
        conversionType,
      },
    })
  }
}

export const abTesting = new ABTesting()
```

**Usage Examples:**

```typescript
// Test: Toast notification position
const ToastProvider = ({ children }) => {
  const variant = abTesting.assignVariant({
    testId: 'toast_position',
    variants: ['control', 'variant_a'], // control = bottom-right, variant_a = top-right
  })

  const position = variant === 'control' ? 'bottom-right' : 'top-right'

  return <Toaster position={position}>{children}</Toaster>
}

// Test: Error message tone
const ErrorToast = ({ message }) => {
  const variant = abTesting.assignVariant({
    testId: 'error_message_tone',
    variants: ['control', 'variant_a'], // control = technical, variant_a = empathetic
  })

  const formattedMessage = variant === 'control'
    ? message // Technical: "Network request failed with status 500"
    : humanizeErrorMessage(message) // Empathetic: "We couldn't connect to the server. Please try again."

  return toast.error(formattedMessage)
}

// Test: Button color (gradient vs solid)
const PrimaryButton = ({ children, onClick }) => {
  const variant = abTesting.assignVariant({
    testId: 'button_gradient',
    variants: ['control', 'variant_a'],
  })

  const className = variant === 'control'
    ? 'bg-gradient-to-r from-blue-600 to-blue-500' // Gradient
    : 'bg-blue-600' // Solid

  const handleClick = () => {
    abTesting.trackConversion('button_gradient', 'button_clicked')
    onClick()
  }

  return <Button className={className} onClick={handleClick}>{children}</Button>
}
```

#### User Feedback Collection Pattern

**In-App Feedback Widget:**

```tsx
// FeedbackWidget.tsx
const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [category, setCategory] = useState<string>('')

  const handleSubmit = async () => {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feedback,
        rating,
        category,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
    })

    toast.success('Thank you for your feedback!')
    setIsOpen(false)
    resetForm()
  }

  return (
    <>
      {/* Floating feedback button */}
      <button
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700"
        onClick={() => setIsOpen(true)}
        aria-label="Send feedback"
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      {/* Feedback modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send us your feedback</DialogTitle>
            <DialogDescription>
              Help us improve Zyncdata. What's on your mind?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Rating */}
            <div>
              <Label>How would you rate your experience?</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={cn(
                      'text-2xl',
                      rating >= star ? 'text-yellow-500' : 'text-gray-300'
                    )}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <Label>What's this about?</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">🐛 Bug Report</SelectItem>
                  <SelectItem value="feature">💡 Feature Request</SelectItem>
                  <SelectItem value="ui">🎨 UI/UX Feedback</SelectItem>
                  <SelectItem value="performance">⚡ Performance Issue</SelectItem>
                  <SelectItem value="other">💬 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Feedback text */}
            <div>
              <Label>Your feedback</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us more..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!feedback.trim()}>
              Send Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

**Session Replay Pattern (LogRocket, FullStory):**

```typescript
// session-replay.ts
import LogRocket from 'logrocket'

export const initSessionReplay = () => {
  if (process.env.NODE_ENV === 'production') {
    LogRocket.init(process.env.REACT_APP_LOGROCKET_ID)

    // Identify user after authentication
    LogRocket.identify(userId, {
      name: userName,
      email: userEmail,
      subscriptionType: 'admin', // or 'cms' or 'viewer'
    })

    // Track custom events
    LogRocket.track('Dashboard Loaded')
    LogRocket.track('Content Published', {
      contentType: 'hero',
      duration: 45.2,
    })

    // Integrate with Sentry (link session replays to errors)
    Sentry.configureScope(scope => {
      scope.addEventProcessor(async event => {
        event.extra.sessionURL = LogRocket.sessionURL
        return event
      })
    })
  }
}

// Privacy controls
export const stopSessionReplay = () => {
  LogRocket.startNewSession() // Start fresh session without previous data
}

// Redact sensitive fields
LogRocket.reduxMiddleware({
  actionSanitizer: (action) => {
    if (action.type === 'SET_PASSWORD') {
      return { ...action, payload: '[REDACTED]' }
    }
    return action
  },
})
```

**NPS/CSAT Survey Pattern:**

```tsx
// NPSSurvey.tsx - Trigger after 2 weeks of usage
const NPSSurvey = () => {
  const [score, setScore] = useState<number | null>(null)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [feedback, setFeedback] = useState('')

  // Show survey after 2 weeks, once per user
  const shouldShow = useMemo(() => {
    const lastShown = localStorage.getItem('nps_last_shown')
    const accountAge = daysSinceSignup()

    return accountAge >= 14 && (!lastShown || daysSince(lastShown) >= 90)
  }, [])

  const handleScoreSelect = (selectedScore: number) => {
    setScore(selectedScore)
    setShowFollowUp(true)

    analytics.track({
      category: 'survey',
      action: 'nps_score_selected',
      value: selectedScore,
    })
  }

  const handleSubmit = async () => {
    await fetch('/api/surveys/nps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, feedback }),
    })

    localStorage.setItem('nps_last_shown', new Date().toISOString())
    toast.success('Thank you for your feedback!')
  }

  if (!shouldShow) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-2xl rounded-lg p-6 max-w-md">
      <h3 className="font-semibold text-lg mb-2">
        How likely are you to recommend Zyncdata to a colleague?
      </h3>

      <div className="flex gap-2 my-4">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            onClick={() => handleScoreSelect(num)}
            className={cn(
              'w-10 h-10 rounded border',
              score === num ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'
            )}
          >
            {num}
          </button>
        ))}
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>Not likely</span>
        <span>Very likely</span>
      </div>

      {showFollowUp && (
        <div className="mt-4">
          <Label>What's the main reason for your score?</Label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="mt-2"
            rows={3}
          />
          <Button onClick={handleSubmit} className="mt-3 w-full">
            Submit
          </Button>
        </div>
      )}
    </div>
  )
}
```

#### Heatmap & Click Tracking Pattern

**Implementation with Microsoft Clarity or Hotjar:**

```tsx
// clarity.tsx
export const initClarity = () => {
  if (process.env.NODE_ENV === 'production') {
    ;(function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)}
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)
    })(window,document,"clarity","script",process.env.REACT_APP_CLARITY_ID)

    // Tag sessions for filtering
    window.clarity('identify', userId, {
      userType: 'admin', // or 'cms' or 'viewer'
      subscriptionPlan: 'pro',
    })
  }
}

// Custom click tracking for specific patterns
export const trackPatternClick = (patternName: string, element: string) => {
  if (window.clarity) {
    window.clarity('set', `${patternName}_click`, element)
  }
}

// Usage
<Button onClick={() => {
  trackPatternClick('button_hierarchy', 'primary_publish')
  handlePublish()
}}>
  Publish
</Button>
```

**Custom Heatmap Events:**

```typescript
// Track specific pattern interactions
const trackHeatmapEvent = (eventName: string, metadata?: Record<string, any>) => {
  // Send to analytics
  analytics.track({
    category: 'heatmap',
    action: eventName,
    metadata: {
      ...metadata,
      x: mouseX,
      y: mouseY,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    },
  })
}

// Usage in components
const SystemCard = () => {
  const handleClick = (e: MouseEvent) => {
    trackHeatmapEvent('system_card_click', {
      systemId: system.id,
      status: system.status,
      position: {
        x: e.clientX,
        y: e.clientY,
      },
    })
  }
}
```

---

### 11. Delight & Micro-interaction Patterns

**Purpose:** Create moments of joy and satisfaction through thoughtful micro-interactions and animations.

#### Celebration Moments Pattern

**First-Time Achievements:**

```tsx
// Confetti animation on first publish
import confetti from 'canvas-confetti'

const CMSEditor = () => {
  const isFirstPublish = useFirstTimeAction('content_published')

  const handlePublish = async () => {
    await publishContent()

    if (isFirstPublish) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })

      toast.success('🎉 Congratulations on your first publish!', {
        description: 'Your content is now live. Great work!',
        duration: 6000,
      })
    } else {
      toast.success('Content published successfully')
    }
  }
}

// Track first-time actions
const useFirstTimeAction = (actionKey: string): boolean => {
  const [isFirstTime, setIsFirstTime] = useState(false)

  useEffect(() => {
    const hasPerformed = localStorage.getItem(`first_${actionKey}`)
    if (!hasPerformed) {
      setIsFirstTime(true)
      localStorage.setItem(`first_${actionKey}`, 'true')
    }
  }, [actionKey])

  return isFirstTime
}
```

**Milestone Celebrations:**

```tsx
// Achievement badge on 7 days of 100% uptime
const DashboardHeader = () => {
  const { uptimeStreak } = useSystemHealth()
  const [showBadge, setShowBadge] = useState(false)

  useEffect(() => {
    if (uptimeStreak === 7 && !localStorage.getItem('achievement_7day_uptime')) {
      setShowBadge(true)
      localStorage.setItem('achievement_7day_uptime', 'true')

      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 120,
          origin: { y: 0.5 }
        })
      }, 500)
    }
  }, [uptimeStreak])

  return (
    <>
      {showBadge && (
        <Dialog open={showBadge} onOpenChange={setShowBadge}>
          <DialogContent className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <DialogTitle className="text-2xl">Achievement Unlocked!</DialogTitle>
            <DialogDescription className="text-lg mt-2">
              <strong>Reliability Champion</strong>
              <br />
              7 days of 100% uptime across all systems!
            </DialogDescription>
            <Button onClick={() => setShowBadge(false)} className="mt-4">
              Awesome!
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
```

#### Smooth Micro-animations Pattern

**Button Press Feedback:**

```tsx
// Satisfying button press with haptic-like feedback
const PrimaryButton = ({ children, onClick, ...props }) => {
  return (
    <button
      className={cn(
        'bg-gradient-to-r from-blue-600 to-blue-500',
        'hover:scale-102 active:scale-98',
        'transition-transform duration-150',
        'shadow-md hover:shadow-lg',
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}
```

**Card Hover Delight:**

```tsx
const SystemCard = ({ system }) => {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        'hover:scale-102 hover:shadow-xl',
        'hover:-translate-y-1', // Subtle lift effect
      )}
    >
      {/* Card content */}
    </Card>
  )
}
```

**Toast Slide-in Animation:**

```css
/* Custom toast animation with spring physics */
@keyframes toast-slide-in {
  from {
    transform: translateX(120%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

[data-sonner-toast] {
  animation: toast-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Loading Skeleton Shimmer:**

```tsx
const Skeleton = ({ className }) => (
  <div
    className={cn(
      'bg-gray-200 rounded',
      'relative overflow-hidden',
      className
    )}
  >
    <div className="absolute inset-0 shimmer" />
  </div>
)

// CSS
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.shimmer::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.6) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s infinite;
}
```

#### Progress Indication Delight

**Satisfying Progress Bar Fill:**

```tsx
const ProgressBar = ({ value }: { value: number }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className={cn(
          'bg-gradient-to-r from-blue-600 to-blue-500 h-full rounded-full',
          'transition-all duration-500 ease-out', // Smooth fill
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
```

**Checkmark Animation on Success:**

```tsx
const SuccessCheckmark = () => (
  <div className="checkmark-container">
    <svg className="checkmark" viewBox="0 0 52 52">
      <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
      <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
    </svg>
  </div>
)

// CSS
@keyframes checkmark-circle {
  0% {
    stroke-dashoffset: 166;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes checkmark-check {
  0% {
    stroke-dashoffset: 48;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

.checkmark-circle {
  stroke: #22c55e;
  stroke-width: 2;
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: checkmark-circle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark-check {
  stroke: #22c55e;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: checkmark-check 0.3s 0.3s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}
```

#### Contextual Onboarding Pattern

**Progressive Disclosure Onboarding:**

```tsx
import Intro from 'intro.js'
import 'intro.js/introjs.css'

const DashboardOnboarding = () => {
  const hasSeenOnboarding = localStorage.getItem('onboarding_dashboard')

  useEffect(() => {
    if (!hasSeenOnboarding && systemsCount === 0) {
      const intro = Intro()

      intro.setOptions({
        steps: [
          {
            element: '#add-system-button',
            intro: 'Welcome to Zyncdata! 👋 Let\'s add your first system to get started.',
            position: 'bottom',
          },
          {
            element: '#system-grid',
            intro: 'Your systems will appear here with real-time health status.',
          },
          {
            element: '#ws-status',
            intro: '🟢 This indicator shows your connection status for real-time updates.',
          },
        ],
        showProgress: true,
        exitOnOverlayClick: false,
        disableInteraction: true,
      })

      intro.onbeforeexit(() => {
        localStorage.setItem('onboarding_dashboard', 'true')
        return true
      })

      intro.start()
    }
  }, [hasSeenOnboarding, systemsCount])

  return null
}

// Contextual tooltips (just-in-time help)
const TooltipHelp = ({ trigger, content }) => (
  <Popover>
    <PopoverTrigger asChild>
      {trigger}
    </PopoverTrigger>
    <PopoverContent className="max-w-xs">
      <div className="flex gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0" />
        <p className="text-sm text-gray-700">{content}</p>
      </div>
    </PopoverContent>
  </Popover>
)
```

#### Empty State Delight Pattern

**Engaging Empty States:**

```tsx
const EmptyDashboard = () => {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div
        className={cn(
          'text-6xl mb-4 transition-transform duration-300',
          isHovering && 'scale-110 rotate-12', // Playful hover effect
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        🏗️
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Ready to build your dashboard?
      </h2>
      <p className="text-gray-600 mb-6 max-w-md">
        Add your first system and transform the chaos of scattered bookmarks into a streamlined command center.
      </p>
      <div className="flex gap-3">
        <Button
          onClick={openAddSystemModal}
          className="group"
        >
          <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
          Add Your First System
        </Button>
        <Button variant="ghost" onClick={openDocs}>
          <Book className="mr-2 h-4 w-4" />
          Quick Start Guide
        </Button>
      </div>
    </div>
  )
}
```

---

### 12. Edge Case Handling Patterns

**Purpose:** Handle real-world scenarios gracefully to prevent user frustration.

#### Race Condition Handling Pattern

**Idempotent Button Clicks:**

```typescript
const PublishButton = () => {
  const [isPublishing, setIsPublishing] = useState(false)
  const publishAttemptId = useRef<string | null>(null)

  const handlePublish = async () => {
    if (isPublishing) {
      console.warn('Publish already in progress, ignoring duplicate click')
      return
    }

    setIsPublishing(true)
    const attemptId = generateUniqueId()
    publishAttemptId.current = attemptId

    try {
      await publishContent({
        idempotencyKey: attemptId, // Server uses this to prevent duplicates
      })
      toast.success('Content published!')
    } catch (error) {
      toast.error('Failed to publish')
    } finally {
      setIsPublishing(false)
      publishAttemptId.current = null
    }
  }

  return (
    <Button onClick={handlePublish} disabled={isPublishing}>
      {isPublishing ? 'Publishing...' : 'Publish'}
    </Button>
  )
}
```

#### Concurrent Editing Pattern

**Conflict Detection & Resolution:**

```typescript
const CMSEditor = () => {
  const [content, setContent] = useState('')
  const [lastSavedVersion, setLastSavedVersion] = useState<number>(1)
  const [hasConflict, setHasConflict] = useState(false)

  // Poll for changes every 30s
  useEffect(() => {
    const checkForConflicts = async () => {
      const latestVersion = await fetchLatestVersion()

      if (latestVersion.version > lastSavedVersion) {
        // Someone else edited while we were editing
        setHasConflict(true)
        showConflictDialog(latestVersion)
      }
    }

    const interval = setInterval(checkForConflicts, 30000)
    return () => clearInterval(interval)
  }, [lastSavedVersion])

  const handleSave = async () => {
    try {
      const result = await saveContent({
        content,
        expectedVersion: lastSavedVersion, // Optimistic locking
      })

      setLastSavedVersion(result.newVersion)
      toast.success('Saved successfully')
    } catch (error) {
      if (error.code === 'VERSION_CONFLICT') {
        setHasConflict(true)
        showConflictDialog(error.latestVersion)
      } else {
        toast.error('Failed to save')
      }
    }
  }

  const showConflictDialog = (latestVersion) => {
    // Show modal with options:
    // - View other user's changes
    // - Overwrite with my changes
    // - Create new version from my changes
  }

  return (
    <>
      {hasConflict && <ConflictWarningBanner />}
      <Editor value={content} onChange={setContent} onSave={handleSave} />
    </>
  )
}
```

#### Large Data Handling Pattern

**Pagination & Virtual Scrolling:**

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

const SystemList = ({ systems }) => {
  const parentRef = useRef<HTMLDivElement>(null)

  // Only render visible items (performance for 100+ systems)
  const virtualizer = useVirtualizer({
    count: systems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated height of each SystemCard
    overscan: 5, // Render 5 extra items above/below viewport
  })

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <SystemCard system={systems[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### Network Failure Recovery Pattern

**Offline Detection & Queueing:**

```typescript
const useOfflineQueue = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const queue = useRef<QueuedAction[]>([])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      processQueue()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.info('You\'re offline. Changes will sync when reconnected.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const enqueue = (action: QueuedAction) => {
    if (isOnline) {
      return executeAction(action)
    } else {
      queue.current.push(action)
      localStorage.setItem('offline_queue', JSON.stringify(queue.current))
      toast.info(`Action queued. Will retry when online.`)
    }
  }

  const processQueue = async () => {
    const actions = queue.current
    queue.current = []

    for (const action of actions) {
      try {
        await executeAction(action)
        toast.success(`Synced: ${action.description}`)
      } catch (error) {
        queue.current.push(action) // Re-queue failed actions
        toast.error(`Failed to sync: ${action.description}`)
      }
    }

    if (queue.current.length === 0) {
      localStorage.removeItem('offline_queue')
    }
  }

  return { enqueue, isOnline }
}
```

#### Timeout & Retry Pattern

**Exponential Backoff Retry:**

```typescript
const fetchWithRetry = async <T,>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) // Exponential backoff
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)
        await sleep(delay)
      }
    }
  }

  throw lastError
}

// Usage
const loadDashboard = async () => {
  try {
    const systems = await fetchWithRetry(() =>
      fetch('/api/systems').then(r => r.json())
    )
    setS systems(systems)
  } catch (error) {
    toast.error('Unable to load dashboard after multiple attempts', {
      description: 'Please check your connection and try again.',
      action: {
        label: 'Retry Now',
        onClick: loadDashboard,
      },
    })
  }
}
```

---

## Pattern Success Metrics (Revised)

### Measurement Methodology

**Baseline Measurement (Month 1):**
- Establish current performance before implementing patterns
- Track key metrics for 2-4 weeks to establish baseline
- Document pain points and user complaints

**Target Setting (Month 2):**
- Set realistic targets based on baseline + industry benchmarks
- Define timeline to achieve targets (3 months, 6 months, 12 months)
- Get stakeholder buy-in on success criteria

**Continuous Monitoring:**
- Weekly dashboards tracking all metrics
- Monthly reviews with team to identify trends
- Quarterly retrospectives to adjust patterns

### Button Hierarchy
- **Goal:** Users intuitively identify primary actions
- **Baseline Metric:** Measure current wrong-click rate
- **Target Metric:** < 5% clicks on wrong button in critical flows (industry standard: 8-10%)
- **Tracking:**
  - Click heatmaps (Clarity/Hotjar)
  - User session recordings
  - A/B test results (gradient vs solid buttons)
- **Timeline:** Achieve target within 3 months of pattern implementation

### Feedback Patterns
- **Goal:** Users understand system state and action outcomes
- **Baseline Metric:** Current support ticket volume related to unclear feedback
- **Target Metric:** < 10% support tickets due to unclear feedback
- **Tracking:**
  - Support ticket categorization
  - User surveys (CSAT after error)
  - Session replay analysis
- **Timeline:** Achieve within 4 months

### Empty States
- **Goal:** Users know what to do when no data present
- **Baseline Metric:** Current abandonment rate on empty states
- **Target Metric:** 80%+ complete first action from empty state
- **Tracking:**
  - Funnel analysis (empty state view → action click → completion)
  - Time-to-first-action
  - Onboarding tour completion rate
- **Timeline:** Achieve within 2 months

### Loading States
- **Goal:** Users feel confident system is working
- **Baseline Metric:** Current premature page refresh rate
- **Target Metric:** < 20% premature page refreshes during load
- **Tracking:**
  - Analytics events for page refreshes mid-load
  - User complaints about "stuck" loading
  - Actual load time vs perceived load time (surveys)
- **Timeline:** Achieve within 3 months

### Modal Patterns
- **Goal:** Users complete modal actions without confusion
- **Baseline Metric:** Current modal abandonment rate
- **Target Metric:** < 10% modal abandonment rate
- **Tracking:**
  - Modal analytics (opened vs completed vs closed-without-action)
  - Time spent in modal before decision
  - ESC key usage vs button clicks
- **Timeline:** Achieve within 2 months

### Navigation Patterns
- **Goal:** Users navigate efficiently without getting lost
- **Baseline Metric:** Current clicks-to-goal average
- **Target Metric:** < 3 clicks to reach any page from homepage
- **Tracking:**
  - Navigation path analysis
  - Breadcrumb usage analytics
  - Search usage (high search = poor navigation)
- **Timeline:** Achieve immediately (architectural)

### Form Patterns
- **Goal:** Users complete forms with minimal friction
- **Baseline Metric:** Current form completion rate
- **Target Metric:** > 80% form completion rate (industry average: 65-70%)
- **Tracking:**
  - Form analytics (start rate, field-level errors, completion rate)
  - Abandonment points (which field do users quit at?)
  - Validation error frequency per field
- **Timeline:** Achieve within 4 months

### Performance Patterns
- **Goal:** Fast, responsive experience
- **Target Metrics (Non-negotiable from Day 1):**
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- **Tracking:**
  - Lighthouse CI in every PR
  - Real User Monitoring (RUM)
  - Core Web Vitals dashboard
- **Timeline:** Must meet targets before production launch

---

## Next Steps

These UX consistency patterns provide the foundation for:
- **Consistent user experience** across all Zyncdata features
- **Faster development** with reusable pattern libraries
- **Better accessibility** with built-in WCAG 2.1 AA compliance
- **Measurable UX quality** through pattern-specific metrics

**Next Step:** Continue to Step 13: Responsive Design & Accessibility to define mobile-first responsive strategies and comprehensive accessibility testing.
