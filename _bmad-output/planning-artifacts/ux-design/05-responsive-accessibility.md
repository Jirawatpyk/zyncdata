# Step 13: Responsive Design & Accessibility

## Overview

This section defines how Zyncdata adapts seamlessly across devices and ensures accessibility for all users, complementing the UX Consistency Patterns (Step 12) with specific responsive and accessibility implementation strategies.

**Foundation:** Built on patterns from Step 12 (Browser Matrix, Accessibility Testing)
**Informed By:** Platform requirements (Step 3), Design direction (Step 9), Component strategy (Step 11)
**Purpose:** Ensure Zyncdata works beautifully on all devices and is accessible to users with disabilities

---

## Responsive Design & Accessibility

### Responsive Strategy

**Purpose:** Define how Zyncdata adapts across device types while maintaining usability and brand consistency.

#### Desktop Strategy (1024px+)

**Primary Use Case:** Jiraw's daily workflow - managing multiple systems efficiently

**Layout Approach:**
- **Multi-column dashboard:** 3-column grid for SystemCards on wide screens (1920px+)
- **Side navigation:** Persistent left sidebar for CMS navigation
- **Content density:** Higher information density - show more data per screen
- **Desktop-specific features:**
  - Keyboard shortcuts prominently displayed
  - Hover states with rich tooltips
  - Drag-and-drop reordering (future enhancement)
  - Split-screen CMS editor with live preview side-by-side

**Grid Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Header (Logo, Nav, User Menu)                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │ System │  │ System │  │ System │  │ System │   │
│  │ Card 1 │  │ Card 2 │  │ Card 3 │  │ Card 4 │   │
│  └────────┘  └────────┘  └────────┘  └────────┘   │
│                                                      │
│  ┌────────┐  ┌────────┐                            │
│  │ System │  │ System │                            │
│  │ Card 5 │  │ Card 6 │                            │
│  └────────┘  └────────┘                            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Desktop Optimization:**
- Utilize whitespace for breathing room (not cramped)
- Multi-select capabilities (Shift+Click to select multiple systems)
- Keyboard navigation hints visible on hover
- Context menus on right-click

#### Tablet Strategy (768px - 1023px)

**Primary Use Case:** DxT team CMS editing on iPad, Jiraw's secondary device

**Layout Approach:**
- **Touch-optimized interfaces:** Larger touch targets (min 44x44px → 48x48px for comfort)
- **2-column dashboard:** SystemCards in 2-column grid
- **Simplified navigation:** Bottom tab bar or collapsible side nav
- **Touch gestures:**
  - Swipe left on SystemCard to reveal quick actions
  - Pull-to-refresh on dashboard
  - Pinch-to-zoom on charts/graphs (future)

**Grid Layout:**
```
┌─────────────────────────────────┐
│  Header (Compact)               │
├─────────────────────────────────┤
│                                 │
│  ┌────────┐    ┌────────┐      │
│  │ System │    │ System │      │
│  │ Card 1 │    │ Card 2 │      │
│  └────────┘    └────────┘      │
│                                 │
│  ┌────────┐    ┌────────┐      │
│  │ System │    │ System │      │
│  │ Card 3 │    │ Card 4 │      │
│  └────────┘    └────────┘      │
│                                 │
├─────────────────────────────────┤
│  Bottom Nav (Dashboard, CMS)    │
└─────────────────────────────────┘
```

**Tablet Optimization:**
- Larger form inputs for easier typing
- CMS editor stacks vertically (editor on top, preview below)
- Sticky save button at bottom for easy reach
- Landscape mode optimized for side-by-side editing

#### Mobile Strategy (320px - 767px)

**Primary Use Case:** On-the-go system checking, emergency access

**Layout Approach:**
- **Single-column layouts:** Stack all content vertically
- **Bottom navigation:** Thumb-friendly navigation at screen bottom
- **Progressive disclosure:** Hide secondary information, show on tap
- **Critical-first information:**
  - System name and status visible immediately
  - Details hidden in expandable cards
  - CMS simplified to essential editing only

**Grid Layout:**
```
┌───────────────┐
│  Header       │
│  (Compact)    │
├───────────────┤
│               │
│  ┌─────────┐ │
│  │ System  │ │
│  │ Card 1  │ │
│  │ 🟢 Up   │ │
│  └─────────┘ │
│               │
│  ┌─────────┐ │
│  │ System  │ │
│  │ Card 2  │ │
│  │ 🔴 Down │ │
│  └─────────┘ │
│               │
│  ┌─────────┐ │
│  │ System  │ │
│  │ Card 3  │ │
│  │ 🟡 Slow │ │
│  └─────────┘ │
│               │
├───────────────┤
│ Bottom Nav    │
│ ⚡ 🏠 👤      │
└───────────────┘
```

**Mobile Optimization:**
- Hamburger menu for secondary navigation
- Full-width cards for easy tapping
- Reduced descriptions (truncated with "Read more")
- Simplified CMS: Basic text editing only (rich features desktop-only)
- Offline support: Show cached system status when offline
- Mobile Safari: Address bar aware (sticky elements account for dynamic toolbar)

#### Responsive Component Adaptations

**SystemCard Responsive Behavior:**

```tsx
// Desktop (3 columns at 1280px+)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {systems.map(system => (
    <SystemCard system={system} variant="desktop" />
  ))}
</div>

// Tablet (2 columns)
// lg:grid-cols-3 doesn't apply, falls back to md:grid-cols-2

// Mobile (1 column, stacked)
// grid-cols-1 is default
```

**SplitScreenEditor Responsive Behavior:**

```tsx
// Desktop: Side-by-side
<div className="flex flex-col lg:flex-row gap-6">
  <div className="lg:w-1/2">
    <Editor />
  </div>
  <div className="lg:w-1/2">
    <LivePreview />
  </div>
</div>

// Tablet/Mobile: Stacked with tabs
<Tabs defaultValue="editor">
  <TabsList>
    <TabsTrigger value="editor">Edit</TabsTrigger>
    <TabsTrigger value="preview">Preview</TabsTrigger>
  </TabsList>
  <TabsContent value="editor"><Editor /></TabsContent>
  <TabsContent value="preview"><LivePreview /></TabsContent>
</Tabs>
```

**Navigation Responsive Behavior:**

```tsx
// Desktop: Horizontal nav with all items visible
<nav className="hidden md:flex items-center gap-6">
  <NavLink to="/dashboard">Dashboard</NavLink>
  <NavLink to="/cms">CMS</NavLink>
  <NavLink to="/settings">Settings</NavLink>
</nav>

// Mobile: Hamburger menu
<Sheet>
  <SheetTrigger className="md:hidden">
    <Menu className="h-6 w-6" />
  </SheetTrigger>
  <SheetContent side="left">
    <nav className="flex flex-col gap-4">
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/cms">CMS</NavLink>
      <NavLink to="/settings">Settings</NavLink>
    </nav>
  </SheetContent>
</Sheet>
```

---

### Breakpoint Strategy

**Purpose:** Define specific screen widths where layouts adapt to maintain optimal usability.

#### Tailwind CSS Breakpoint System

**Using Tailwind's default breakpoints (mobile-first approach):**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Small devices (large phones, landscape)
      'md': '768px',   // Medium devices (tablets)
      'lg': '1024px',  // Large devices (laptops, desktops)
      'xl': '1280px',  // Extra large devices (large desktops)
      '2xl': '1536px', // 2X large devices (very large desktops)
    }
  }
}
```

#### Zyncdata-Specific Breakpoints

**Why these breakpoints:**

**320px - 639px (Mobile Portrait)**
- iPhone SE, small Android phones
- **Target:** 15% of Jiraw's usage (on-the-go checking)
- **Layout:** Single column, bottom navigation
- **Priority:** System status visibility, emergency access

**640px - 767px (Mobile Landscape)**
- iPhone in landscape, small tablets
- **Target:** 5% of usage (rare)
- **Layout:** Still single column (landscape not optimized for cards)
- **Priority:** Maintain mobile UX, don't create intermediate layout

**768px - 1023px (Tablet)**
- iPad, Android tablets
- **Target:** 20% of usage (DxT team CMS editing on iPad)
- **Layout:** 2-column grid, touch-optimized
- **Priority:** CMS editing comfort, larger touch targets

**1024px - 1279px (Small Desktop)**
- 13" laptops, 1366x768 monitors
- **Target:** 30% of usage (Jiraw's laptop)
- **Layout:** 2-3 column grid, full navigation visible
- **Priority:** Efficient multi-system monitoring

**1280px+ (Large Desktop)**
- 15"+ laptops, external monitors, 1920x1080+
- **Target:** 30% of usage (Jiraw's main setup)
- **Layout:** 3-4 column grid, maximum density
- **Priority:** See all systems at once, keyboard shortcuts

#### Breakpoint Decision Matrix

**When to show/hide features by breakpoint:**

| Feature | Mobile (< 768px) | Tablet (768-1023px) | Desktop (1024px+) |
|---------|------------------|---------------------|-------------------|
| **Navigation** | Hamburger menu | Bottom tabs | Top nav bar |
| **SystemCard grid** | 1 column | 2 columns | 3 columns |
| **CMS Editor** | Text-only | Tabs (Edit/Preview) | Side-by-side |
| **Keyboard shortcuts** | Hidden | Hidden | Visible hints |
| **Hover tooltips** | Tap to reveal | Tap to reveal | Hover |
| **Advanced filters** | Hidden (basic only) | Available | Full features |
| **Version history** | Simplified list | Timeline view | Full timeline |
| **Bulk actions** | Hidden | Available | Available |

#### Mobile-First Implementation

**Why mobile-first:**
- Ensures core functionality works on smallest screens first
- Progressive enhancement for larger screens
- Better performance (load essential CSS first)
- Forces prioritization of critical features

**Example mobile-first pattern:**

```css
/* Default (mobile): 1 column, full width */
.system-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .system-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  .system-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}

/* Large desktop: 4 columns (if 6+ systems) */
@media (min-width: 1536px) {
  .system-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

#### Container Max-Width Strategy

**Prevent overly wide layouts on ultra-wide screens:**

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content constrained to 1280px max */}
</div>

// For full-bleed sections (landing page hero)
<div className="w-full">
  <div className="max-w-7xl mx-auto px-4">
    {/* Content */}
  </div>
</div>
```

**Max-width breakpoints:**
- Dashboard: `max-w-7xl` (1280px) - optimal for 3-4 columns
- CMS Editor: `max-w-5xl` (1024px) - readable line length
- Landing Page: `max-w-7xl` (1280px) - hero/content sections
- Forms: `max-w-2xl` (672px) - comfortable reading width

---

### Accessibility Strategy

**Purpose:** Ensure Zyncdata is usable by everyone, including users with disabilities.

#### WCAG Compliance Level

**Target: WCAG 2.1 Level AA**

**Why Level AA:**
- **Legal compliance:** Meets most accessibility regulations (ADA, Section 508, EU Accessibility Act)
- **Industry standard:** Expected baseline for modern web applications
- **User coverage:** Addresses vast majority of accessibility needs
- **Reasonable effort:** Achievable without excessive cost/complexity
- **Not Level AAA because:**
  - Level AAA is rarely required
  - Some criteria conflict with design goals (e.g., 7:1 contrast can reduce readability for non-vision-impaired users)
  - Focus resources on meeting AA comprehensively rather than AAA partially

**WCAG 2.1 Level AA Success Criteria (Applicable to Zyncdata):**

#### Principle 1: Perceivable

**1.1 Text Alternatives**
- ✅ All images have descriptive alt text
- ✅ System logos include alt="[System Name] logo"
- ✅ Icon-only buttons include aria-label
- ✅ Decorative images use alt="" or role="presentation"

**1.3 Adaptable**
- ✅ Semantic HTML structure (headings, landmarks, lists)
- ✅ Reading order makes sense when CSS disabled
- ✅ Form labels properly associated (htmlFor + id)
- ✅ Tables use proper markup (thead, tbody, th scope)

**1.4 Distinguishable**
- ✅ **Color contrast 4.5:1 minimum** for normal text (18px and smaller)
  - Text on white: #1f2937 (gray-800) = 10.7:1 ✅
  - Blue links: #2563eb (blue-600) = 4.56:1 ✅
  - Success green: #16a34a (green-600) on white = 3.4:1 ❌ → Use #15803d (green-700) = 4.68:1 ✅

- ✅ **Color contrast 3:1 minimum** for large text (24px+ or 18.5px+ bold)
  - Status badges meet this threshold

- ✅ **Color not sole indicator:**
  - System status uses emoji + color + text: 🟢 "Healthy" (green)
  - Error messages use icon + color: ⚠️ Red text
  - Form validation uses icon + border + message

- ✅ **Text resize up to 200%** without loss of content or functionality
  - Use rem units (not px) for typography
  - Flexible layouts (not fixed widths)
  - Test at 200% zoom in browser

- ✅ **Focus visible:** Clear focus indicators on all interactive elements
  - Blue ring: `ring-2 ring-blue-500 ring-offset-2`
  - High contrast: Bold outline in Windows High Contrast Mode

**1.4.10 Reflow (AA):**
- ✅ Content reflows at 320px width without horizontal scrolling
- ✅ No two-dimensional scrolling required (except data tables)

**1.4.11 Non-text Contrast (AA):**
- ✅ UI components 3:1 contrast minimum
  - Button borders clearly visible
  - Form input borders distinguishable
  - Focus indicators meet 3:1

**1.4.12 Text Spacing (AA):**
- ✅ Design accommodates user-adjusted text spacing:
  - Line height 1.5x font size
  - Paragraph spacing 2x font size
  - Letter spacing 0.12x font size
  - Word spacing 0.16x font size

**1.4.13 Content on Hover or Focus (AA):**
- ✅ Tooltips dismissible (ESC key closes)
- ✅ Tooltips hoverable (can move mouse over tooltip content)
- ✅ Tooltips persistent until dismissed or hover removed

#### Principle 2: Operable

**2.1 Keyboard Accessible**
- ✅ All functionality available via keyboard
- ✅ No keyboard traps (can tab out of all sections)
- ✅ Keyboard shortcuts don't conflict with assistive tech
  - Cmd/Ctrl+S for save (standard)
  - ESC to close modals (standard)
  - ? for help (custom, can be remapped)

**2.2 Enough Time**
- ✅ No time limits on user actions
- ✅ Auto-save provides 30s intervals (user can pause by stopping typing)
- ✅ Session timeout warning 2 minutes before expiry with extend option

**2.3 Seizures and Physical Reactions**
- ✅ No flashing content (all animations smooth, < 3 flashes per second)
- ✅ Skeleton shimmer animation slow (1.5s duration)
- ✅ Confetti animation subtle, skippable via prefers-reduced-motion

**2.4 Navigable**
- ✅ **Skip links:** "Skip to main content" link (hidden until focused)
- ✅ **Page titles:** Descriptive and unique per page
  - "Dashboard - Zyncdata"
  - "Edit Hero Content - CMS - Zyncdata"
- ✅ **Focus order:** Logical tab order (top to bottom, left to right)
- ✅ **Link purpose:** Link text describes destination
  - ❌ "Click here" → ✅ "View ENEOS system details"
- ✅ **Multiple ways to navigate:**
  - Top navigation menu
  - Breadcrumbs
  - Search (future)
- ✅ **Headings and labels:** Descriptive headings structure content
- ✅ **Focus visible:** Already covered in 1.4

**2.5 Input Modalities (AA)**

**2.5.1 Pointer Gestures:**
- ✅ All multi-touch gestures have single-pointer alternative
  - Swipe to delete: Tap "Delete" button instead

**2.5.2 Pointer Cancellation:**
- ✅ Click/tap completes on "up" event (not "down")
  - Prevents accidental activations
  - User can slide finger off button to cancel

**2.5.3 Label in Name:**
- ✅ Visible label text included in accessible name
  - Button labeled "Publish" has aria-label="Publish content" (includes "Publish")

**2.5.4 Motion Actuation:**
- ✅ No device motion required (no shake-to-undo, tilt controls)

#### Principle 3: Understandable

**3.1 Readable**
- ✅ **Language declared:** `<html lang="en">`
- ✅ **Language changes marked:** `<span lang="th">ภาษาไทย</span>` if mixed

**3.2 Predictable**
- ✅ **Consistent navigation:** Same nav order on all pages
- ✅ **Consistent identification:** Same icons/labels for same functions
  - Save icon always 💾
  - Settings icon always ⚙️
- ✅ **No context changes on focus:** Focus doesn't auto-submit forms
- ✅ **No context changes on input:** Typing doesn't auto-navigate

**3.3 Input Assistance**
- ✅ **Error identification:** Form errors clearly indicated
  - Red border + error icon + error message
  - "Email is required" not "Invalid field"

- ✅ **Labels or instructions:** All form fields have visible labels
  - Label position: Above input (not placeholder)
  - Help text: Below label for context

- ✅ **Error suggestion:** Errors provide correction guidance
  - ❌ "Invalid email" → ✅ "Please enter a valid email (e.g., name@example.com)"

- ✅ **Error prevention (legal/financial):**
  - Delete confirmations: "Are you sure you want to delete ENEOS system?"
  - Unsaved changes warning before navigation
  - Reversible actions: Version restore has rollback

#### Principle 4: Robust

**4.1 Compatible**
- ✅ **Valid HTML:** No parsing errors (validated with W3C validator)
- ✅ **Name, Role, Value:** All components have proper ARIA
  - Buttons: `role="button"` (implicit in `<button>`)
  - Modals: `role="dialog" aria-modal="true"`
  - Forms: Proper labels and error associations

**4.1.3 Status Messages (AA):**
- ✅ Status messages announced via aria-live
  - Toasts: `role="status" aria-live="polite"`
  - Errors: `role="alert" aria-live="assertive"`
  - Loading: `aria-busy="true" aria-live="polite"`

#### Accessibility Features Beyond WCAG AA

**Additional enhancements for better UX:**

**Reduced Motion Support:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**High Contrast Mode (Windows):**
```css
@media (prefers-contrast: high) {
  .system-card {
    border: 2px solid currentColor;
  }
  .button-primary {
    outline: 2px solid;
  }
}
```

**Dark Mode Accessibility:**
- If dark mode implemented, ensure:
  - Contrast ratios still meet 4.5:1 in dark theme
  - Focus indicators visible on dark backgrounds
  - No pure black (#000) - use #0a0a0a for reduced eye strain

---

### Testing Strategy

**Purpose:** Systematically validate responsive design and accessibility across real-world conditions.

#### Responsive Testing Methodology

**Phase 1: Browser DevTools Testing (Daily)**

**Chrome DevTools:**
- Test all breakpoints (320px, 640px, 768px, 1024px, 1280px, 1920px)
- Device emulation: iPhone SE, iPhone 12, iPad, Desktop
- Network throttling: Fast 3G, Slow 4G
- Touch simulation for hover state testing

**Firefox Responsive Design Mode:**
- Test Firefox-specific rendering differences
- Validate CSS Grid layouts
- Check font rendering (Firefox renders text differently)

**Safari Technology Preview (Mac only):**
- iOS Safari quirks (address bar behavior)
- WebKit-specific bugs
- Touch event handling

**Edge DevTools:**
- Test on Chromium Edge
- Validate Windows High Contrast Mode

**Phase 2: Real Device Testing (Weekly)**

**Mandatory test devices:**

**Mobile:**
- iPhone 12 (iOS 16+) - Safari
- iPhone SE (small screen reference)
- Samsung Galaxy S21 (Android 12+) - Chrome
- Budget Android phone (test performance on low-end)

**Tablet:**
- iPad (10th gen) - Safari
- iPad Pro - Safari (large tablet reference)
- Samsung Galaxy Tab - Chrome

**Desktop:**
- MacBook Pro 13" (1440x900 scaled)
- Windows laptop 1920x1080
- External monitor 2560x1440

**Phase 3: Network Performance Testing (Pre-release)**

**Test on actual mobile networks:**
- 4G LTE (typical mobile)
- 3G (slow network simulation)
- WiFi (fast connection)
- Offline mode (service worker caching)

**Metrics to track:**
- Time to First Byte (TTFB)
- Largest Contentful Paint (LCP) on mobile
- Total Blocking Time (TBT) on low-end devices
- JavaScript bundle load time on 3G

**Tools:**
- WebPageTest.org (real device testing)
- Lighthouse mobile audits
- Chrome UX Report (real user data)

#### Accessibility Testing Methodology

**Phase 1: Automated Testing (Every PR)**

**jest-axe (Unit tests):**
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

describe('Dashboard accessibility', () => {
  it('passes axe audit', async () => {
    const { container } = render(<Dashboard />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

**Playwright axe (E2E tests):**
```typescript
test('Dashboard is accessible', async ({ page }) => {
  await page.goto('/dashboard')
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
  expect(accessibilityScanResults.violations).toEqual([])
})
```

**Lighthouse CI (PR checks):**
```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse CI
  run: lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

# Fail PR if accessibility score < 90
```

**Phase 2: Manual Keyboard Testing (Weekly)**

**Keyboard navigation checklist:**
- [ ] Tab through all interactive elements in logical order
- [ ] Shift+Tab moves backward correctly
- [ ] Enter/Space activates buttons and links
- [ ] ESC closes all modals, sheets, popovers
- [ ] Arrow keys work in custom components (tabs, carousels)
- [ ] Focus visible on all elements (no invisible focus)
- [ ] No keyboard traps (can escape all sections)
- [ ] Keyboard shortcuts don't conflict (Cmd+S, Cmd+/, ESC, ?)

**Test with physical keyboard:**
- Wireless keyboard + desktop browser
- Laptop keyboard (test with touchpad disabled)
- External keyboard + iPad

**Phase 3: Screen Reader Testing (Pre-release)**

**NVDA (Windows - Free):**
- Test with Chrome or Firefox on Windows
- Verify all interactive elements announced correctly
- Check reading order makes sense
- Validate ARIA labels and descriptions
- Test form field error announcements

**JAWS (Windows - Paid, industry standard):**
- Final validation before release
- Most widely used screen reader by blind users
- Test with Internet Explorer/Edge (JAWS users' preference)

**VoiceOver (Mac/iOS - Built-in):**
- Test on macOS with Safari
- Test on iPhone/iPad with Safari
- Verify mobile touch gestures work
- Check VoiceOver rotor functionality

**Screen reader testing checklist:**
- [ ] Page title announced on load
- [ ] Headings navigable (H key jumps between headings)
- [ ] Landmarks navigable (D key jumps between regions)
- [ ] Forms navigable (F key jumps between form fields)
- [ ] Links navigable (K key jumps between links)
- [ ] Images have descriptive alt text
- [ ] Icon-only buttons have aria-label
- [ ] Dynamic content announced (aria-live regions)
- [ ] Modal focus trapped and announced
- [ ] Loading states announced ("Loading dashboard, please wait")
- [ ] Error messages announced immediately (aria-live="assertive")

**Phase 4: Visual Accessibility Testing (Pre-release)**

**Color contrast validation:**
```bash
# Install Pa11y
npm install -g pa11y

# Test color contrast
pa11y --standard WCAG2AA --reporter cli https://zyncdata.app/dashboard

# Check for contrast violations
```

**Manual contrast testing:**
- Use browser extension: "WCAG Color Contrast Checker"
- Verify all text meets 4.5:1 (normal) or 3:1 (large)
- Test interactive states (hover, focus, active)
- Check custom backgrounds (status badges, alerts)

**Color blindness simulation:**
- Chrome DevTools: Emulate vision deficiencies
  - Protanopia (red-blind)
  - Deuteranopia (green-blind)
  - Tritanopia (blue-blind)
  - Achromatopsia (total color blindness)
- Verify system status distinguishable without color:
  - 🟢 Healthy = Checkmark icon + "Healthy" text
  - 🔴 Down = X icon + "Down" text
  - 🟡 Degraded = Warning icon + "Degraded" text

**Zoom testing (200% minimum):**
- Browser zoom to 200%
- Verify no horizontal scrolling (except data tables)
- Check no content cutoff or overlap
- Ensure touch targets still reachable
- Test at 400% zoom (Level AAA, nice-to-have)

**High contrast mode (Windows):**
- Enable Windows High Contrast Mode
- Verify focus indicators visible
- Check borders and outlines present
- Ensure icons remain distinguishable

**Phase 5: User Testing with Disabilities (Before v1.0)**

**Recruit diverse testers:**
- Blind users (screen reader experts)
- Low vision users (screen magnifier users)
- Motor disability users (keyboard-only, switch access)
- Cognitive disability users (dyslexia, ADHD)

**Structured testing sessions:**
- Task-based testing (e.g., "Add a new system to dashboard")
- Think-aloud protocol (users verbalize thoughts)
- Identify pain points and confusion
- Gather subjective feedback (frustration, satisfaction)

**Compensation:**
- Pay testers fairly ($50-100/hour is standard)
- Provide gift cards or donations to accessibility orgs

#### Automated Accessibility Monitoring (Production)

**Continuous monitoring:**
- Sentry accessibility error tracking
- Real user monitoring for a11y violations
- Monthly accessibility audits (automated)

**Accessibility dashboard:**
- Track violation counts over time
- Monitor WCAG compliance percentage
- Alert on new violations introduced

---

### Implementation Guidelines

**Purpose:** Provide developers with specific, actionable guidelines to implement responsive and accessible designs correctly.

#### Responsive Development Guidelines

**1. Use Relative Units**

**Font sizes (rem, not px):**
```css
/* ❌ Bad - Fixed pixels */
.heading {
  font-size: 24px;
}

/* ✅ Good - Relative rem (respects user font size preference) */
.heading {
  font-size: 1.5rem; /* 24px if base is 16px */
}
```

**Spacing (Tailwind classes):**
```tsx
/* ✅ Use Tailwind spacing scale (based on rem) */
<div className="mt-4 px-6 py-3"> {/* 1rem = 16px, 1.5rem = 24px, 0.75rem = 12px */}
```

**Widths (%, vw, max-width):**
```css
/* ❌ Bad - Fixed width */
.container {
  width: 1200px;
}

/* ✅ Good - Responsive max-width */
.container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}
```

**2. Mobile-First Media Queries**

```css
/* Default styles (mobile) */
.system-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablet and up (min-width approach) */
@media (min-width: 768px) {
  .system-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .system-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

**Tailwind utility classes (mobile-first):**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
</div>
```

**3. Touch Target Optimization**

**Minimum touch target 44x44px (WCAG AA):**
```tsx
/* ✅ Minimum size met */
<Button className="min-h-[44px] min-w-[44px] px-4 py-3">
  Click me
</Button>

/* ✅ Icon-only button with proper padding */
<button className="p-3" aria-label="Close modal">
  <X className="h-5 w-5" /> {/* Icon 20px, padding 12px = total 44px */}
</button>
```

**Spacing between touch targets:**
```tsx
/* ✅ Adequate spacing (8px minimum) */
<div className="flex gap-3"> {/* gap-3 = 12px */}
  <Button>Save</Button>
  <Button>Cancel</Button>
</div>
```

**4. Image Optimization**

**Responsive images (srcset):**
```tsx
<img
  src="/logo-800w.png"
  srcSet="/logo-400w.png 400w, /logo-800w.png 800w, /logo-1200w.png 1200w"
  sizes="(max-width: 768px) 400px, (max-width: 1024px) 800px, 1200px"
  alt="Zyncdata logo"
  loading="lazy"
/>
```

**WebP with fallback:**
```tsx
<picture>
  <source srcSet="/hero.webp" type="image/webp" />
  <source srcSet="/hero.jpg" type="image/jpeg" />
  <img src="/hero.jpg" alt="Dashboard hero image" />
</picture>
```

**5. Viewport Meta Tag**

```html
<!-- Required for responsive design to work -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
```

**Why maximum-scale=5.0:**
- Allows zoom up to 500% (accessibility requirement)
- Doesn't block pinch-zoom on mobile
- Prevents accidental over-zooming beyond useful range

#### Accessibility Development Guidelines

**1. Semantic HTML Structure**

**Use semantic elements (not divs for everything):**
```tsx
/* ❌ Bad - Divs everywhere */
<div className="header">
  <div className="nav">
    <div className="link" onClick={...}>Home</div>
  </div>
</div>

/* ✅ Good - Semantic HTML */
<header>
  <nav aria-label="Main navigation">
    <a href="/">Home</a>
  </nav>
</header>
```

**Heading hierarchy (don't skip levels):**
```tsx
/* ❌ Bad - Skips from H1 to H3 */
<h1>Dashboard</h1>
<h3>Your Systems</h3>

/* ✅ Good - Logical hierarchy */
<h1>Dashboard</h1>
<h2>Your Systems</h2>
<h3>TINEDY</h3>
```

**Landmark regions:**
```tsx
<header>Top navigation</header>
<nav aria-label="Main">Primary navigation</nav>
<main>Main content</main>
<aside>Sidebar content</aside>
<footer>Footer content</footer>
```

**2. ARIA Labels and Roles**

**Button labels:**
```tsx
/* ❌ Bad - Icon-only button without label */
<button>
  <X className="h-5 w-5" />
</button>

/* ✅ Good - Descriptive aria-label */
<button aria-label="Close modal">
  <X className="h-5 w-5" />
</button>

/* ✅ Even better - Visible label with Tooltip */
<Tooltip content="Close">
  <button aria-label="Close modal">
    <X className="h-5 w-5" />
  </button>
</Tooltip>
```

**Form labels:**
```tsx
/* ❌ Bad - Placeholder as label (disappears on focus) */
<input type="email" placeholder="Email" />

/* ✅ Good - Proper label association */
<label htmlFor="email">Email</label>
<input id="email" type="email" />

/* ✅ Also good - Label wrapper */
<label>
  Email
  <input type="email" />
</label>
```

**Link purpose:**
```tsx
/* ❌ Bad - Generic link text */
<a href="/systems/eneos">Click here</a>

/* ✅ Good - Descriptive link text */
<a href="/systems/eneos">View ENEOS system details</a>

/* ✅ Also good - aria-label for context */
<a href="/systems/eneos" aria-label="View ENEOS system details">
  View details
</a>
```

**3. Keyboard Navigation Implementation**

**Focus management:**
```tsx
const Modal = ({ open, onClose }) => {
  const firstFocusRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      // Auto-focus first element when modal opens
      firstFocusRef.current?.focus()

      // Trap focus within modal
      const trapFocus = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          // Handle focus trapping logic
        }
      }

      document.addEventListener('keydown', trapFocus)
      return () => document.removeEventListener('keydown', trapFocus)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <Button ref={firstFocusRef} onClick={onClose}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

**Keyboard shortcuts:**
```tsx
useEffect(() => {
  const handleKeyboard = (e: KeyboardEvent) => {
    // Don't trigger if user is typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    // ESC to close modal
    if (e.key === 'Escape') {
      closeModal()
    }

    // Cmd/Ctrl+S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
  }

  window.addEventListener('keydown', handleKeyboard)
  return () => window.removeEventListener('keydown', handleKeyboard)
}, [])
```

**Skip links:**
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded"
>
  Skip to main content
</a>

<main id="main-content">
  {/* Main content */}
</main>
```

**4. Focus Indicators**

**Default focus ring (Tailwind):**
```tsx
/* ✅ Always show focus (never outline-none without replacement) */
<button className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Click me
</button>

/* ❌ Never do this (removes focus indicator) */
<button className="outline-none">
  Click me
</button>
```

**Custom focus styles:**
```css
/* Ensure visible in all contexts */
.custom-button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .custom-button:focus-visible {
    outline: 3px solid;
  }
}
```

**5. High Contrast Mode Support**

```css
/* Borders visible in high contrast */
@media (prefers-contrast: high) {
  .system-card {
    border: 2px solid;
  }

  .button-primary {
    outline: 2px solid;
  }

  /* Use currentColor for borders (inherits from text color) */
  .divider {
    border-top: 1px solid currentColor;
  }
}
```

**6. Reduced Motion Support**

```tsx
/* Respect user preference for reduced motion */
const MotionSafeWrapper = ({ children }) => {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className={prefersReducedMotion ? '' : 'animate-fade-in'}>
      {children}
    </div>
  )
}

// Hook
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(query.matches)

    const listener = () => setPrefersReducedMotion(query.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])

  return prefersReducedMotion
}
```

**CSS approach:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

#### Performance Optimization for Responsive/Accessible Design

**Lazy load images below fold:**
```tsx
<img src="/hero.jpg" alt="Hero" loading="lazy" />
```

**Preload critical resources:**
```html
<link rel="preload" href="/fonts/nunito.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/logo.png" as="image">
```

**Optimize font loading:**
```css
@font-face {
  font-family: 'Nunito';
  src: url('/fonts/nunito.woff2') format('woff2');
  font-display: swap; /* Show fallback font immediately, swap when loaded */
}
```

**Reduce layout shift (CLS):**
```tsx
/* Reserve space for images to prevent layout shift */
<img
  src="/logo.png"
  alt="Logo"
  width="200"
  height="50"
  className="w-full h-auto"
/>

/* Use aspect-ratio for responsive images */
<div className="aspect-video">
  <img src="/video-thumbnail.jpg" alt="Video" className="w-full h-full object-cover" />
</div>
```

---

## Implementation Checklist

### Responsive Design Checklist

- [ ] Mobile-first CSS written (min-width media queries)
- [ ] All breakpoints tested (320px, 640px, 768px, 1024px, 1280px, 1920px)
- [ ] Touch targets minimum 44x44px on mobile/tablet
- [ ] Navigation adapted per device (hamburger mobile, full desktop)
- [ ] Images optimized (srcset, WebP, lazy loading)
- [ ] Viewport meta tag configured correctly
- [ ] No horizontal scrolling at any breakpoint
- [ ] Typography scales appropriately (rem units)
- [ ] Real device testing completed (iPhone, iPad, Android)
- [ ] Network performance tested (3G, 4G, WiFi)

### Accessibility Checklist

- [ ] WCAG 2.1 Level AA compliance verified
- [ ] Color contrast 4.5:1 for all text (4.68:1 achieved)
- [ ] All images have alt text
- [ ] Semantic HTML structure (header, nav, main, footer)
- [ ] Heading hierarchy logical (H1 → H2 → H3, no skips)
- [ ] Form labels properly associated (htmlFor + id)
- [ ] Keyboard navigation works (tab, enter, esc)
- [ ] Focus indicators visible (2px blue ring)
- [ ] ARIA labels on icon-only buttons
- [ ] Screen reader testing passed (NVDA, VoiceOver)
- [ ] jest-axe tests passing (no violations)
- [ ] Lighthouse accessibility score > 90
- [ ] High contrast mode tested
- [ ] Reduced motion respected (prefers-reduced-motion)
- [ ] Text resizes to 200% without loss of content
- [ ] Skip link implemented and functional
- [ ] No keyboard traps (can escape all sections)
- [ ] Error messages announced to screen readers
- [ ] Loading states announced (aria-live regions)
- [ ] Modal focus management implemented

---

## Success Metrics

### Responsive Design Success

**Mobile Usage Growth:**
- **Baseline:** Track current mobile usage (likely < 20%)
- **Target:** 25% mobile usage within 6 months (as mobile experience improves)
- **Tracking:** Google Analytics device category

**Performance on Mobile:**
- **Target:** LCP < 2.5s on 4G
- **Target:** FID < 100ms on mobile devices
- **Target:** CLS < 0.1 (no layout shift)
- **Tracking:** Lighthouse CI mobile audits, Chrome UX Report

**Cross-Browser Compatibility:**
- **Target:** < 5% browser-specific bugs reported
- **Tracking:** Support ticket categorization, Sentry error tracking

### Accessibility Success

**WCAG Compliance:**
- **Target:** 100% WCAG 2.1 Level AA compliance (zero violations)
- **Tracking:** Monthly automated audits (axe, Lighthouse)

**Accessibility Score:**
- **Target:** Lighthouse accessibility score ≥ 95
- **Tracking:** Lighthouse CI on every PR

**Screen Reader Usability:**
- **Target:** Zero screen reader blockers (P0 issues)
- **Target:** < 3 minor screen reader issues (P1/P2)
- **Tracking:** User testing with blind users, support tickets

**Keyboard Navigation:**
- **Target:** 100% functionality available via keyboard
- **Target:** Zero keyboard traps
- **Tracking:** Manual testing checklist, automated E2E tests

**User Satisfaction:**
- **Target:** > 4.5/5 stars from users with disabilities
- **Tracking:** Post-release survey to assistive tech users

---

## Next Steps

Responsive Design & Accessibility strategy complete! This ensures Zyncdata:
- **Works on all devices** - Desktop, tablet, mobile with optimal UX
- **Accessible to everyone** - WCAG 2.1 AA compliant, tested with assistive tech
- **Fast on all networks** - Performance budgets enforced
- **Keyboard accessible** - Full functionality without mouse
- **Screen reader friendly** - Proper ARIA, semantic HTML, live regions

**Final Step:** Continue to Step 14 to complete the UX Design workflow and review all specifications.
