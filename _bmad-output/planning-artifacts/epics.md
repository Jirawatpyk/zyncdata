---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# zyncdata - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for zyncdata, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**User Management & Authentication (14 FRs)**
FR1: Users can be registered for CMS access with email and password (invitation-only: Super Admin creates accounts, no open self-registration)
FR2: Users can log in to the CMS with email and password
FR3: Users can set up Multi-Factor Authentication (MFA) using authenticator apps
FR4: Users can authenticate login using codes from authenticator apps
FR5: Users can generate and store backup codes for MFA recovery
FR6: Users can use backup codes to authenticate when authenticator app is unavailable
FR7: Users can log out of the CMS
FR8: System can enforce role-based permissions (Super Admin, Admin, User)
FR9: Super Admin can create new CMS user accounts
FR10: Super Admin can delete CMS user accounts
FR11: Super Admin can assign or change user roles
FR12: Super Admin can reset user passwords
FR13: System can track user login history and last login timestamp
FR14: System can disable user accounts without deleting them

**System Portfolio Management (9 FRs)**
FR15: Admins can add new systems to the portfolio with name, URL, logo, and description
FR16: Admins can edit existing system information (name, URL, logo, description)
FR17: Admins can delete systems from the portfolio with confirmation
FR18: Admins can reorder systems to change display sequence on landing page
FR19: Admins can enable or disable system visibility on the landing page
FR20: Admins can upload system logos
FR20a: Admins can delete or replace system logos
FR21: Visitors can view all enabled systems on the public landing page
FR22: Visitors can click on system cards to redirect to the respective system URL
FR23: Visitors can see current health status indicators for each system (online/offline)

**Content & Branding Management (11 FRs)**
FR24: Admins can edit hero section content (title, subtitle, description)
FR25: Admins can edit intro section content (about DxT, platform purpose)
FR26: Admins can edit footer content (contact information, copyright)
FR27: Admins can customize color schemes using predefined DxT AI palette
FR28: Admins can select font styles for landing page typography
FR29: Admins can upload and replace the platform logo
FR30: Admins can preview all CMS changes before publishing
FR31: Admins can publish CMS changes to make them live on the public landing page
FR32: Visitors can view published landing page content with DxT branding
FR68: Admins can manage platform favicon
FR71: Admins can preview changes across different device sizes

**Health Monitoring & Analytics (13 FRs)**
FR33: System can automatically check health status of all portfolio systems at regular intervals
FR34: System can detect system failures based on consecutive check failures
FR35: System can track response times for each system health check
FR36: System can store historical health check data for trend analysis
FR37: Admins can view real-time system health dashboard showing all system statuses
FR38: Admins can view response time metrics for each system
FR39: Admins can view last checked timestamps for all systems
FR40: Admins can view overall summary statistics (e.g., "5/5 Online")
FR41: Dashboard can auto-refresh to display latest health data without manual reload
FR64: System can notify Admins when health checks fail
FR65: Admins can configure health check intervals per system
FR66: Admins can set health check timeout thresholds per system
FR67: Admins can set failure count threshold before marking system offline

**CMS Administration (10 FRs)**
FR42: Admins can access a protected CMS admin panel
FR43: System can restrict CMS access to authenticated users with appropriate roles
FR45: System can provide confirmation dialogs for destructive actions (delete, publish)
FR46: Admins can recover from mistakes by editing changes
FR47: System can log all CMS actions for audit trail purposes
FR69: System can display success confirmation messages after Admin actions
FR70: System can display clear error messages when operations fail
FR72: System can display loading states during operations
FR73: System can display empty states when no data exists
FR74: System can maintain version history of content changes

**Security & Audit (8 FRs)**
FR48: System can log all authentication events (login success/failure, logout, MFA setup)
FR49: System can log all system management actions (create, update, delete, reorder)
FR50: System can log all content editing actions (hero, intro, footer changes)
FR51: System can log all publish actions with timestamp and user information
FR52: System can log user management actions (create user, delete user, role changes)
FR53: Super Admin can view audit logs showing user actions with timestamps and details
FR54: System can retain audit logs for a configurable period
FR55: System can track IP addresses for security-relevant actions

**Operations & Maintenance (9 FRs)**
FR56: System can perform automated daily database backups
FR57: Super Admin can manually trigger database backups before major changes
FR58: Super Admin can restore database from backup when needed
FR59: Super Admin can rollback to previous deployment if issues occur
FR60: System can detect critical errors and alert Super Admin
FR60a: System can monitor application performance metrics
FR61: System can track application errors and performance metrics
FR62: Super Admin can access system configuration settings
FR63: Super Admin can manage health check intervals and thresholds

### NonFunctional Requirements

**Performance (10 NFRs)**
NFR-P1: Landing page initial load time must be less than 2 seconds
NFR-P2: Dashboard page load time must be less than 3 seconds
NFR-P3: CMS save and edit operations must complete within 1 second
NFR-P3a: CMS publish operations must complete within 3 seconds
NFR-P4: Health check response time per system must be less than 5 seconds
NFR-P5: System must support 5-7 concurrent CMS users without performance degradation
NFR-P6: Auto-refresh operations must complete within 3 seconds
NFR-P7: Error messages must appear within 500ms of operation failure
NFR-P8: Loading indicators must appear within 200ms of operation start
NFR-P9: Mobile landing page load time must be less than 3 seconds on 4G connection
NFR-P10: System must handle rate limits gracefully when performing health checks at scale

**Security (8 NFRs)**
NFR-S1: User passwords must be hashed using Supabase Auth platform defaults (bcrypt-compatible)
NFR-S2: MFA secrets must be encrypted at rest using platform-managed encryption
NFR-S3: Session tokens must expire after 24 hours of inactivity
NFR-S4: All API endpoints must validate user permissions based on RBAC matrix
NFR-S5: System must leverage Supabase Auth rate limiting for login attempts
NFR-S6: All sensitive data transmission must use HTTPS/TLS 1.3 or higher
NFR-S7: Audit logs must be tamper-proof (append-only, no deletion capability)
NFR-S8: All user-generated content fields must pass OWASP XSS filter tests

**Reliability (7 NFRs)**
NFR-R1: System design must target 99.0% uptime per month leveraging Vercel and Supabase SLAs
NFR-R2: Health monitoring must detect actual system failures with ≥ 95% accuracy
NFR-R3: System must automatically recover from transient network failures within 5 minutes
NFR-R4: Manual recovery from critical failures must complete within 1 hour (RTO)
NFR-R5: Database backups must be restorable within 4 hours (RPO: max 24 hours data loss)
NFR-R6: Health check failures must trigger admin notifications within 1 minute
NFR-R8: System must deliver failure notifications via email to designated admin addresses

**Scalability (4 NFRs)**
NFR-SC1: System must support up to 10 systems in portfolio without performance degradation
NFR-SC2: System must support up to 50 concurrent end users on landing page
NFR-SC3: Database must handle 100,000 health check records before requiring optimization
NFR-SC4: System architecture must allow horizontal scaling when needed

**User Experience (3 NFRs)**
NFR-UX1: All pages must render correctly across Chrome, Firefox, Safari (latest 2 versions)
NFR-UX2: Mobile responsive design must maintain usability on screens ≥ 375px width
NFR-UX3: Admin must be able to add new system to portfolio in less than 10 minutes

**Testing & Quality (2 NFRs)**
NFR-T1: Critical paths must have ≥ 80% automated test coverage
NFR-T2: Deployments must pass smoke tests before marking as successful

### Additional Requirements

**From Architecture - Starter Template & Project Setup:**
- Starter: Official create-next-app with manual integrations (Story ID: SETUP-001, P0 blocker)
- Initialize command: `npx create-next-app@latest zyncdata --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- Follow-up: Supabase integration, shadcn/ui setup, DxT design tokens, performance optimization, accessibility tooling

**From Architecture - Technology Stack:**
- Next.js 16+ (App Router, React Server Components), React 19, TypeScript 5.x
- Supabase (Managed PostgreSQL), Supabase Auth with TOTP MFA
- Vercel (Serverless + Edge CDN), shadcn/ui, Tailwind CSS
- Zod for data validation, React Hook Form for forms
- TanStack Query (React Query ^5.x) for CMS admin state management
- Upstash Redis + @upstash/ratelimit for rate limiting
- Sentry for error tracking, Vercel Analytics for performance monitoring

**From Architecture - Database & Migration:**
- 5 core tables: systems, users, landing_page_content, health_checks, audit_logs
- Supabase CLI + SQL migrations (version-controlled in supabase/migrations/)
- Row Level Security (RLS) policies for access control
- Connection pooling: Transaction Mode (PgBouncer) for API routes, Session Mode for health checks
- Data retention: Health checks last 1000/system, Audit logs 90 days, Sessions 24h/7d refresh

**From Architecture - API Architecture:**
- Hybrid: Supabase PostgREST for CRUD + Next.js API Routes for custom logic
- Custom API Routes: WebSocket health, content rollback, logo upload, health aggregate, backup
- API response format: `{ data: T | null, error: Error | null }`
- Data transform at boundaries: snake_case (DB) ↔ camelCase (TypeScript)

**From Architecture - Real-time Communication:**
- WebSocket primary + polling fallback (60-second intervals)
- Connection status indicator in UI
- WebSocket events: `domain:action` format with Zod schema validation

**From Architecture - CI/CD & DevOps:**
- GitHub Actions: lint, type-check, test, build on PR
- Vercel auto-deploy on push to main, preview deployments per PR
- Pre-commit hooks via Husky (type-check, lint, test)
- Bundle size enforcement: JS < 150KB gzipped, CSS < 50KB gzipped
- Size-limit configuration for CI

**From Architecture - Implementation Patterns:**
- Naming: snake_case DB, camelCase TS, PascalCase components, kebab-case API endpoints
- Feature-based project structure with co-location
- Centralized error codes and WebSocket event types
- Immutable state updates, optimistic UI with rollback
- Testing pyramid: 70% Unit, 20% Integration, 10% E2E

**From Architecture - Security Hardening:**
- CSP headers configuration in next.config.js
- X-Frame-Options: DENY, X-Content-Type-Options: nosniff
- Rate limiting: Login 5/15min/IP, MFA 3/5min/user, API 100/min/user, Public 20/min/IP

**From UX - Design System & Branding:**
- DxT brand colors: Primary #41B9D5, Secondary #5371FF, Accent #6CE6E9
- Typography: Nunito (Google Fonts, weights 400, 600, 700)
- Animation: CSS transitions only (≤ 200ms), no heavy animation libraries in MVP
- Performance budgets: LCP < 2.5s, FID < 100ms, CLS < 0.1

**From UX - Responsive & Accessibility:**
- Mobile-first responsive: 375px min (iPhone SE), breakpoints at 640/768/1024/1280/1536px
- Touch targets: ≥ 44px (mobile), system cards ≥ 80px
- WCAG 2.1 AA compliance: color contrast 4.5:1 (text), 3:1 (UI components)
- Keyboard navigation for all functionality, visible focus indicators
- Screen reader support with ARIA labels (Radix UI primitives via shadcn/ui)
- Reduced motion support

**From UX - Interaction Patterns:**
- Card-based grid navigation (CSS Grid, 1-4 columns responsive)
- One-click redirect (< 300ms, no confirmation dialogs for navigation)
- Status badge prominence: Binary 🟢/🔴 with "last checked" timestamps
- Preview before publish (client-side simulation)
- Self-explanatory CMS UI (wizard-style flows, inline help, no jargon)
- Progressive disclosure for multi-level users
- Error recovery: soft delete (30-day window), edit/undo within 2 minutes

**From UX - Browser Compatibility:**
- Chrome, Firefox, Safari (latest 2 versions each)
- Modern JavaScript (ES6+) with graceful degradation

### FR Coverage Map

**Epic 1: Project Foundation & Public Portal**
FR21: Visitors can view all enabled systems on the public landing page
FR22: Visitors can click on system cards to redirect to the respective system URL
FR32: Visitors can view published landing page content with DxT branding

**Epic 2: Authentication & Access Control**
FR1: Users can be registered for CMS access with email and password (invitation-only: Super Admin creates accounts, no open self-registration)
FR2: Users can log in to the CMS with email and password
FR3: Users can set up MFA using authenticator apps
FR4: Users can authenticate login using codes from authenticator apps
FR5: Users can generate and store backup codes for MFA recovery
FR6: Users can use backup codes when authenticator app unavailable
FR7: Users can log out of the CMS
FR8: System can enforce role-based permissions (Super Admin, Admin, User)

**Epic 3: System Portfolio Management**
FR15: Admins can add new systems with name, URL, logo, description
FR16: Admins can edit existing system information
FR17: Admins can delete systems with confirmation
FR18: Admins can reorder systems display sequence
FR19: Admins can enable or disable system visibility
FR20: Admins can upload system logos
FR20a: Admins can delete or replace system logos
FR23: Visitors can see health status indicators for each system
FR42: Admins can access a protected CMS admin panel
FR43: System can restrict CMS access to authenticated users
FR45: System can provide confirmation dialogs for destructive actions
FR46: Admins can recover from mistakes by editing changes
FR69: System can display success confirmation messages
FR70: System can display clear error messages when operations fail
FR72: System can display loading states during operations
FR73: System can display empty states when no data exists

**Epic 4: Content & Branding Management**
FR24: Admins can edit hero section content
FR25: Admins can edit intro section content
FR26: Admins can edit footer content
FR27: Admins can customize color schemes using DxT AI palette
FR28: Admins can select font styles for landing page
FR29: Admins can upload and replace the platform logo
FR30: Admins can preview all CMS changes before publishing
FR31: Admins can publish CMS changes to make them live
FR68: Admins can manage platform favicon
FR71: Admins can preview changes across different device sizes
FR74: System can maintain version history of content changes

**Epic 5: Health Monitoring & Analytics Dashboard**
FR33: System can automatically check health status at regular intervals
FR34: System can detect failures based on consecutive check failures
FR35: System can track response times for each health check
FR36: System can store historical health check data
FR37: Admins can view real-time system health dashboard
FR38: Admins can view response time metrics per system
FR39: Admins can view last checked timestamps
FR40: Admins can view overall summary statistics
FR41: Dashboard can auto-refresh to display latest health data
FR63: Super Admin can manage health check intervals and thresholds
FR64: System can notify Admins when health checks fail
FR65: Admins can configure health check intervals per system
FR66: Admins can set health check timeout thresholds per system
FR67: Admins can set failure count threshold before marking system offline

**Epic 6: User Management & Administration**
FR9: Super Admin can create new CMS user accounts
FR10: Super Admin can delete CMS user accounts
FR11: Super Admin can assign or change user roles
FR12: Super Admin can reset user passwords
FR13: System can track user login history and last login timestamp
FR14: System can disable user accounts without deleting them

**Epic 7: Security, Audit & Operations**
FR47: System can log all CMS actions for audit trail
FR48: System can log all authentication events
FR49: System can log all system management actions
FR50: System can log all content editing actions
FR51: System can log all publish actions with timestamp and user info
FR52: System can log user management actions
FR53: Super Admin can view audit logs with timestamps and details
FR54: System can retain audit logs for a configurable period
FR55: System can track IP addresses for security-relevant actions
FR56: System can perform automated daily database backups
FR57: Super Admin can manually trigger database backups
FR58: Super Admin can restore database from backup
FR59: Super Admin can rollback to previous deployment
FR60: System can detect critical errors and alert Super Admin
FR60a: System can monitor application performance metrics
FR61: System can track application errors and performance metrics
FR62: Super Admin can access system configuration settings

## Epic List

### Epic 1: Project Foundation & Public Portal (4 stories)
Visitors can access zyncdata.app and see a professional landing page with DxT branding, view system cards with logos and descriptions, and click to redirect to each system's subdomain. This epic delivers the core product and establishes the technical foundation (Next.js, Supabase, Vercel CI/CD, database schema, DxT design tokens, accessibility foundation, testing infrastructure, error boundaries, shared utilities).
**FRs covered:** FR21, FR22, FR32

### Epic 2: Authentication & Access Control (6 stories)
CMS users can securely log in with invitation-based accounts, set up mandatory TOTP MFA with authenticator apps, generate backup codes, log in with two-factor authentication, and access role-appropriate areas. The system enforces RBAC (Super Admin, Admin, User) with protected routes and rate-limited auth endpoints.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8

### Epic 3: System Portfolio Management (8 stories)
Admins can manage the portfolio of systems through a self-service CMS admin panel - add new systems with name/URL/logo/description, edit existing systems, delete with soft-delete recovery, reorder display sequence, toggle visibility, and upload/manage logos. Changes appear on the live landing page. This epic establishes core CMS UX patterns (confirmation dialogs, success/error messages, loading states, empty states).
**FRs covered:** FR15, FR16, FR17, FR18, FR19, FR20, FR20a, FR23, FR42, FR43, FR45, FR46, FR69, FR70, FR72, FR73

### Epic 4: Content & Branding Management (4 stories)
Admins can customize the entire landing page experience - edit hero/intro/footer content with TipTap WYSIWYG editor, change color schemes from the DxT palette, select fonts, upload platform logo and favicon. Preview changes across different device sizes before publishing. Publish makes changes live instantly.
**FRs covered:** FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR68, FR71
**Deferred to Phase 2:** FR74 (Version History & Content Restore) — Story 4.5 moved to Phase 2 per PRD MVP Exclusions alignment

### Epic 5: Health Monitoring & Analytics Dashboard (8 stories)
Admins can monitor real-time system health on a dedicated dashboard showing status indicators, response times, and last-checked timestamps with auto-refresh. The system performs automated health checks at configurable intervals, detects failures based on consecutive check thresholds, stores historical data, and notifies admins when systems go down via Resend email. Public landing page cards also display live status indicators.
**FRs covered:** FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR40, FR41, FR63, FR64, FR65, FR66, FR67

### Epic 6: User Management & Administration (5 stories)
Super Admin can manage CMS user accounts for the DxT Team - create new accounts, assign or change roles, reset passwords, disable accounts without deletion, delete accounts, and track login history. This enables the DxT Team onboarding workflow.
**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR14

### Epic 7: Security, Audit & Operations (8 stories)
Super Admin can view complete audit trails of all platform activity with domain-specific logging (system/content events, user management/authorization events, auth events) with IP tracking and configurable retention. Operational tooling includes automated daily backups, manual backup triggers, database restore, deployment rollback, error detection with alerting, application performance monitoring, and system configuration management (excluding health check settings, which are managed in Epic 5).
**FRs covered:** FR47, FR48, FR49, FR50, FR51, FR52, FR53, FR54, FR55, FR56, FR57, FR58, FR59, FR60, FR60a, FR61, FR62

---

## Story Dependencies

The following dependency chain defines the required implementation order. Stories within an epic can generally be implemented in the listed order unless noted otherwise.

**Cross-Epic Dependencies:**
- **Epic 1 (Foundation)** → All other Epics depend on Epic 1 completion (project setup, database, shared utilities)
- **Epic 2 (Auth)** → Epic 3, 4, 5, 6, 7 depend on Epic 2 (protected routes, RBAC enforcement)
- **Epic 3 (Systems)** → Epic 5 depends on Epic 3 (health checks need systems to exist)
- **Story 3.8 (Status Indicators)** → Displays seeded/default values until Epic 5 (Health Check Service) provides real data
- **Epic 5 (Health Monitoring)** → Story 5.7 (Configurable Settings) covers FR63 functionality
- **Epic 6 (User Management)** → Can be developed in parallel with Epic 4 or 5 (depends only on Epic 2)
- **Epic 7 (Audit & Ops)** → Stories 7.1-7.3 (audit logging) must be implemented in parallel with Epic 3, as they provide cross-cutting audit infrastructure used by Epics 3-6

**Recommended Implementation Order:**
Epic 1 → Epic 2 → Epic 3 (parallel with Epic 7.1-7.3) → Epic 4 → Epic 5 → Epic 6 → Epic 7.4-7.8

---

## Epic 1: Project Foundation & Public Portal

Visitors can access zyncdata.app and see a professional landing page with DxT branding, view system cards with logos and descriptions, and click to redirect to each system's subdomain. This epic delivers the core product and establishes the technical foundation (Next.js, Supabase, Vercel CI/CD, database schema, DxT design tokens, accessibility foundation).

### Story 1.1: Project Initialization & CI/CD Foundation

As a developer,
I want the Next.js project initialized with all core dependencies, folder structure, and CI/CD pipeline,
So that the development environment is ready for feature implementation.

**Acceptance Criteria:**

**Given** no project exists
**When** the initialization commands are executed
**Then** a Next.js app is created with TypeScript, Tailwind CSS, ESLint, App Router, src directory, and `@/*` import alias

**Given** the project is initialized
**When** I check installed dependencies
**Then** @supabase/supabase-js, @supabase/ssr, shadcn/ui (New York style), Zod, React Hook Form, @vercel/analytics, and Sentry are installed
**And** dev dependencies include Vitest, Playwright, Husky, Prettier, and size-limit

**Given** the project folder structure
**When** I inspect the src directory
**Then** it follows the architecture specification: app/, components/ui/, components/patterns/, components/layouts/, lib/, types/, and middleware.ts

**Given** DxT design tokens are configured
**When** I inspect tailwind.config.ts
**Then** brand colors (#41B9D5, #5371FF, #6CE6E9), Nunito font family, and responsive breakpoints are defined

**Given** the project is pushed to GitHub
**When** a pull request is created
**Then** GitHub Actions runs lint, type-check, and build checks

**Given** the project is connected to Vercel
**When** code is pushed to main
**Then** auto-deployment to production occurs and preview deployments are created per PR

**Given** pre-commit hooks are configured
**When** a developer attempts to commit
**Then** Husky runs type-check and lint before allowing the commit

### Story 1.2: Database Schema & Seed Data

As a developer,
I want the Supabase database configured with systems and landing page content tables seeded with initial data,
So that the landing page can display real system information from the database.

**Acceptance Criteria:**

**Given** the Supabase project is created
**When** database migrations are applied
**Then** the `systems` table exists with columns: id (UUID), name, url, logo_url, description, status, response_time, display_order, enabled, created_at, updated_at

**Given** the migrations are applied
**When** I inspect the database
**Then** the `landing_page_content` table exists with columns: id (UUID), section_name, content (JSONB), metadata, updated_by, updated_at

**Given** the tables exist
**When** I query the systems table
**Then** 5 initial systems are returned: TINEDY, VOCA, ENEOS, rws, BINANCE with correct URLs, descriptions, and display order

**Given** the tables exist
**When** I query landing_page_content
**Then** hero, intro, and footer sections exist with DxT default content

**Given** RLS policies are configured
**When** an anonymous user queries systems
**Then** only enabled systems are returned (read-only access)

**Given** RLS policies are configured
**When** an anonymous user attempts to insert/update/delete systems
**Then** the operation is denied

**Given** performance indexes are needed
**When** I inspect the database
**Then** `idx_systems_enabled` index exists on systems(enabled, display_order)

**Given** Supabase Auth is configured
**When** the seed script runs
**Then** an initial Super Admin account is created via Supabase Admin API with a pre-configured email and temporary password
**And** the account has the `super_admin` role assigned

**Given** the Supabase CLI is initialized
**When** I run `supabase db diff`
**Then** migration files are version-controlled in supabase/migrations/

### Story 1.3: Public Landing Page with DxT Branding

As a visitor,
I want to see a professional landing page at zyncdata.app with DxT branding and system cards,
So that I can quickly identify and access any system with a single click.

**Acceptance Criteria:**

**Given** I navigate to zyncdata.app
**When** the page loads
**Then** I see a hero section (title, subtitle, description), a system cards grid, and a footer with DxT AI branding (colors, Nunito font, logo)

**Given** the page loads
**When** I view the system cards
**Then** each card displays the system name, logo, and description pulled from the Supabase database
**And** cards are ordered by display_order
**And** only enabled systems are shown

**Given** I see a system card
**When** I click on it
**Then** I am redirected to the system's URL in < 300ms

**Given** I'm on a mobile device (≥ 375px width)
**When** I view the landing page
**Then** the layout is responsive: 1 column (mobile), 2 columns (tablet), 3-4 columns (desktop) using CSS Grid

**Given** I use keyboard navigation
**When** I tab through the page
**Then** all interactive elements are focusable with visible focus indicators (ring-2 ring-dxt-primary)
**And** system cards are accessible via Enter/Space keys

**Given** the page renders
**When** I inspect color contrast
**Then** all text meets WCAG AA standards (4.5:1 ratio for text, 3:1 for UI components)

**Given** a first-time visit
**When** I measure page performance
**Then** LCP is < 2 seconds and on subsequent cached visits < 0.5 seconds

**Given** a mobile visitor on 4G
**When** the page loads
**Then** load time is < 3 seconds

**Given** I use Chrome, Firefox, or Safari (latest 2 versions)
**When** I view the landing page
**Then** the page renders correctly across all supported browsers

### Story 1.4: Testing Infrastructure, Error Boundaries & Shared Utilities

As a developer,
I want testing tools configured, React error boundaries in place, and shared utilities (data transformation, API client, error codes) established,
So that all subsequent stories have a consistent foundation for testing, error handling, and data access patterns.

**Acceptance Criteria:**

**Given** the project needs testing infrastructure
**When** I check the dev dependencies and configuration
**Then** Vitest is configured for unit/integration tests with React Testing Library
**And** Playwright is configured for E2E tests
**And** jest-axe and @axe-core/playwright are configured for accessibility testing
**And** coverage thresholds are set to 80% for critical paths (NFR-T1)

**Given** React error boundaries are needed for graceful degradation
**When** a component throws an unhandled error
**Then** a root-level error boundary catches the error and displays a user-friendly fallback UI instead of a white screen
**And** the error is reported to Sentry

**Given** the architecture mandates data transformation at boundaries
**When** I inspect `src/lib/utils/transform.ts`
**Then** `toCamelCase` and `toSnakeCase` utilities exist for converting between database (snake_case) and TypeScript (camelCase) formats
**And** roundtrip property-based tests verify `toSnakeCase(toCamelCase(x)) === x`

**Given** the architecture specifies a standard API client
**When** I inspect `src/lib/api/client.ts`
**Then** `apiGet<T>` and `apiPost<T>` functions exist that wrap fetch with the standard `{ data: T | null, error: Error | null }` response format

**Given** centralized error codes are needed
**When** I inspect `src/lib/errors/codes.ts`
**Then** error code constants (UNAUTHORIZED, VALIDATION_ERROR, RATE_LIMIT_EXCEEDED, INTERNAL_ERROR) are defined

**Given** WebSocket event types are needed for later epics
**When** I inspect `src/lib/websocket/events.ts`
**Then** event type constants (`health:update`, `system:created`, `content:published`) are defined with Zod payload schemas

---

## Epic 2: Authentication & Access Control

CMS users can securely log in with email/password, set up mandatory TOTP MFA with authenticator apps, generate backup codes, and access role-appropriate areas. User accounts are created by Super Admin via invitation (no open registration). The system enforces RBAC (Super Admin, Admin, User) with protected routes and rate-limited auth endpoints. The initial Super Admin account is seeded during database setup.

### Story 2.1: Initial Super Admin Account & Login

As the initial Super Admin (Jiraw),
I want a seeded Super Admin account and a secure login flow,
So that I can access the CMS immediately after deployment without open registration.

**Acceptance Criteria:**

**Given** the database is seeded (from Story 1.2)
**When** I check the users table
**Then** an initial Super Admin account exists with a pre-configured email and temporary password
**And** the password is hashed using Supabase Auth platform defaults (bcrypt-compatible)

**Given** I navigate to the login page
**When** I enter the Super Admin email and password
**Then** I am authenticated and redirected to the MFA setup page (first login requires MFA setup)

**Given** I enter an incorrect password
**When** I submit the login form
**Then** I see a generic error message "Invalid email or password" (no credential enumeration)

**Given** I attempt more than 5 login attempts in 15 minutes from the same IP
**When** I submit another login attempt
**Then** I receive a 429 "Too Many Requests" response (Upstash Redis rate limiting)

**Given** the login page
**When** I inspect the connection
**Then** all data is transmitted over HTTPS/TLS 1.3 or higher

**Given** there is no public registration page
**When** an unauthenticated user tries to access `/register`
**Then** they receive a 404 or are redirected to the login page (invitation-only model)

### Story 2.2: TOTP MFA Setup

As a CMS user,
I want to set up Multi-Factor Authentication using my authenticator app,
So that my account is protected with a second factor of authentication.

**Acceptance Criteria:**

**Given** I have just registered or haven't set up MFA
**When** I am on the MFA setup page
**Then** I see a QR code that I can scan with my authenticator app (Google Authenticator, Authy, 1Password)

**Given** I have scanned the QR code
**When** I enter a valid 6-digit TOTP code from my authenticator app
**Then** MFA is enabled on my account and mfa_enabled is set to true
**And** my MFA secret is encrypted at rest using platform-managed encryption

**Given** I enter an incorrect TOTP code during setup
**When** I submit the verification form
**Then** I see an error message "Invalid code. Please try again."

**Given** MFA setup is completed
**When** I check my account
**Then** MFA is mandatory and cannot be disabled by the user (admin-only)

### Story 2.3: Backup Codes Generation & Usage

As a CMS user,
I want to generate backup codes during MFA setup and use them when my authenticator app is unavailable,
So that I can still access my account in emergency situations.

**Acceptance Criteria:**

**Given** I have completed MFA setup
**When** the setup finalizes
**Then** 8 single-use backup codes are generated and displayed to me
**And** I am prompted to save them securely

**Given** I have backup codes
**When** I cannot access my authenticator app during login
**Then** I can click "Use backup code" and enter one of my saved codes

**Given** I enter a valid backup code
**When** I submit it
**Then** I am authenticated successfully
**And** that backup code is consumed and cannot be used again

**Given** I enter an invalid or already-used backup code
**When** I submit it
**Then** I see an error message "Invalid or already used backup code"

**Given** I attempt more than 3 backup code attempts in 5 minutes
**When** I submit another attempt
**Then** I receive a rate-limited response

### Story 2.4: MFA Login Verification

As a CMS user,
I want to verify my identity with a TOTP code on each login,
So that unauthorized access is prevented even if my password is compromised.

**Acceptance Criteria:**

**Given** I have entered correct email and password
**When** I reach the MFA verification step
**Then** I see an input field for my 6-digit authenticator code

**Given** I enter a valid TOTP code
**When** I submit the form
**Then** I am fully authenticated and redirected to the CMS dashboard
**And** a session token is created with 24-hour expiry
**And** last_login timestamp is updated on my user record

**Given** I enter an expired or incorrect TOTP code
**When** I submit the form
**Then** I see "Invalid or expired code" error

**Given** I have been authenticated
**When** 2 hours pass without any activity
**Then** my session expires and I am redirected to the login page

**Given** I have been authenticated
**When** 24 hours pass since login
**Then** my session expires regardless of activity

### Story 2.5: Secure Logout

As a CMS user,
I want to log out of the CMS securely,
So that my session is terminated and no one can access my account from this browser.

**Acceptance Criteria:**

**Given** I am logged in to the CMS
**When** I click the "Logout" button
**Then** my session is terminated on the server (Supabase Auth session invalidated)
**And** I am redirected to the login page

**Given** I have logged out
**When** I press the browser back button
**Then** I cannot access protected CMS pages and am redirected to login

**Given** I have logged out
**When** I inspect browser storage
**Then** all session tokens and auth cookies are cleared

### Story 2.6: Route Protection & RBAC Enforcement

As a system administrator,
I want role-based access control enforced on all protected routes,
So that users can only access features appropriate to their role.

**Acceptance Criteria:**

**Given** I am not authenticated
**When** I try to access any `/dashboard` or `/admin` route
**Then** I am redirected to the login page via Next.js middleware

**Given** I am authenticated with the "User" role
**When** I try to access `/admin` routes
**Then** I am redirected to an unauthorized page

**Given** I am authenticated with the "Admin" role
**When** I access CMS management routes
**Then** I can access system management, content editing, and analytics
**And** I cannot access user management or audit logs

**Given** I am authenticated with the "Super Admin" role
**When** I access any protected route
**Then** I have full access to all features

**Given** any API endpoint is called
**When** the request is processed
**Then** user permissions are validated against the RBAC matrix before executing the operation

**Given** security headers are configured
**When** any page is served
**Then** responses include CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and Referrer-Policy headers

---

## Epic 3: System Portfolio Management

Admins can manage the portfolio of systems through a self-service CMS admin panel - add new systems with name/URL/logo/description, edit existing systems, delete with soft-delete recovery, reorder display sequence, toggle visibility, and upload/manage logos. Changes appear on the live landing page. This epic establishes core CMS UX patterns (confirmation dialogs, success/error messages, loading states, empty states).

### Story 3.1: CMS Admin Panel Layout & Navigation

As an Admin,
I want a protected CMS admin panel with clear navigation,
So that I can access all management features from a single interface.

**Acceptance Criteria:**

**Given** I am authenticated as Admin or Super Admin
**When** I navigate to the admin panel
**Then** I see a sidebar/navigation with links to Systems, Content, Analytics, and Settings sections

**Given** I am authenticated
**When** I view the admin panel
**Then** my name, role, and a logout button are visible in the header

**Given** I am not authenticated
**When** I try to access `/admin` routes
**Then** I am redirected to the login page (enforced by middleware from Epic 2)

**Given** no systems exist yet
**When** I view the Systems section
**Then** I see an empty state with a clear "Add your first system" call-to-action

**Given** any operation is in progress
**When** the system is processing
**Then** a loading indicator appears within 200ms of operation start

### Story 3.2: Add New System

As an Admin,
I want to add a new system to the portfolio with name, URL, logo, and description,
So that it appears on the public landing page for visitors to access.

**Acceptance Criteria:**

**Given** I am on the Systems management page
**When** I click "Add System"
**Then** a form appears with fields: name (required), URL (required), description (optional), logo upload (optional), enabled toggle (default: true)

**Given** I fill in valid system details
**When** I submit the form
**Then** the system is created in the database with the next display_order value
**And** I see a success confirmation message
**And** the systems list updates to show the new entry

**Given** I submit the form with an invalid URL
**When** Zod validation runs
**Then** I see an inline error "Valid URL required" and the form is not submitted

**Given** I submit the form with an empty name
**When** Zod validation runs
**Then** I see an inline error "Name required"

**Given** the form submission fails (network error, server error)
**When** the error is returned
**Then** I see a clear error message within 500ms describing the issue

**Given** the system is created with enabled: true
**When** a visitor loads the landing page
**Then** the new system card appears in the correct display order

**Given** I time the entire add-system flow
**When** I measure from start to published
**Then** the entire process takes less than 10 minutes (NFR-UX3)

### Story 3.3: Edit System Information

As an Admin,
I want to edit existing system information (name, URL, logo, description),
So that I can keep portfolio data accurate and up-to-date.

**Acceptance Criteria:**

**Given** I am on the Systems management page
**When** I click "Edit" on a system
**Then** the edit form opens pre-populated with the system's current data

**Given** I modify system fields
**When** I save the changes
**Then** the system record is updated in the database
**And** I see a success confirmation message
**And** the CMS save operation completes within 1 second (NFR-P3)

**Given** I clear a required field (name or URL)
**When** I attempt to save
**Then** I see validation errors and the form is not submitted

**Given** the system was updated
**When** a visitor loads the landing page
**Then** the updated information is reflected on the system card

### Story 3.4: Delete System with Soft Delete

As an Admin,
I want to delete a system from the portfolio with confirmation and recovery options,
So that accidental deletions can be recovered within 30 days.

**Acceptance Criteria:**

**Given** I am on the Systems management page
**When** I click "Delete" on a system
**Then** a confirmation dialog appears: "Are you sure you want to delete [SYSTEM NAME]? This can be undone within 30 days."

**Given** the system has recent health checks (within 24 hours)
**When** the confirmation dialog appears
**Then** an additional warning is shown: "This system is currently active. Proceed with caution."

**Given** I confirm the deletion
**When** the operation completes
**Then** the system is soft-deleted (enabled set to false, marked for 30-day retention)
**And** the system disappears from the landing page
**And** I see a success message "System deleted. Can be recovered within 30 days."

**Given** I click "Cancel" on the confirmation dialog
**When** the dialog closes
**Then** no changes are made to the system

**Given** I made a mistake
**When** I want to recover the system within 30 days
**Then** I can re-enable it through the CMS (edit and set enabled: true)

### Story 3.5: Reorder Systems Display

As an Admin,
I want to reorder systems to change how they appear on the landing page,
So that the most important systems are displayed first.

**Acceptance Criteria:**

**Given** I am on the Systems management page with multiple systems
**When** I change the display order of a system (via drag-and-drop or numeric input)
**Then** the display_order values are updated in the database for all affected systems

**Given** I have reordered the systems
**When** a visitor loads the landing page
**Then** the system cards appear in the new order

**Given** I reorder systems
**When** the save operation completes
**Then** I see a success confirmation and the list reflects the new order

### Story 3.6: Toggle System Visibility

As an Admin,
I want to enable or disable system visibility on the landing page,
So that I can control which systems are publicly visible without deleting them.

**Acceptance Criteria:**

**Given** I am on the Systems management page
**When** I toggle the "Enabled" switch on a system
**Then** the system's enabled status is updated in the database
**And** I see a confirmation message

**Given** a system is disabled (enabled: false)
**When** a visitor loads the landing page
**Then** the disabled system does not appear in the card grid

**Given** a system is re-enabled (enabled: true)
**When** a visitor loads the landing page
**Then** the system reappears in its correct display_order position

### Story 3.7: System Logo Management

As an Admin,
I want to upload, replace, and delete system logos,
So that each system card displays the correct branding on the landing page.

**Acceptance Criteria:**

**Given** I am adding or editing a system
**When** I upload a logo file
**Then** the file is uploaded via the `/api/systems/upload-logo` API route
**And** the logo_url is saved to the system record
**And** the logo is optimized (< 10KB target per architecture spec)

**Given** a system has an existing logo
**When** I upload a new logo
**Then** the previous logo is replaced with the new one

**Given** a system has a logo
**When** I click "Remove logo"
**Then** the logo_url is cleared and the system card shows a fallback/placeholder

**Given** I upload an invalid file (not an image, or too large)
**When** the upload is processed
**Then** I see a clear error message describing the issue

### Story 3.8: Live Status Indicators on Landing Page

As a visitor,
I want to see health status indicators and freshness timestamps on each system card,
So that I know which systems are online and how recent the data is before clicking.

**Acceptance Criteria:**

**Given** I am on the public landing page
**When** I view system cards
**Then** each card displays a status badge showing the current system status from the database (online/offline)
**And** each card shows a "Last checked: X minutes ago" timestamp

**Given** a system's status is "online"
**When** I view its card
**Then** I see a green indicator

**Given** a system's status is "offline"
**When** I view its card
**Then** I see a red indicator with visual prominence (visual hierarchy draws attention to offline systems)

**Given** the status field in the database is null or unknown
**When** I view the card
**Then** a neutral/gray indicator is shown with text "Status unknown"

**Note:** Status indicators will display seeded/default values until Epic 5 (Health Check Service) is implemented. Before Epic 5, systems should be seeded with `status: null` so the "Status unknown" indicator displays, avoiding false trust in unverified status data.

---

## Epic 4: Content & Branding Management

Admins can customize the entire landing page experience - edit hero/intro/footer content, change color schemes from the DxT palette, select fonts, upload platform logo and favicon. Preview changes across different device sizes before publishing. Publish makes changes live instantly. (Version history deferred to Phase 2.)

### Story 4.1: Content Section Editor with WYSIWYG (Hero, Intro, Footer)

As an Admin,
I want to edit the hero section, intro text, and footer content using a rich text editor,
So that I can format content professionally without developer help.

**Acceptance Criteria:**

**Given** I am on the Content management page
**When** I select a section to edit (hero, intro, or footer)
**Then** I see a TipTap WYSIWYG editor pre-populated with the current published content for that section
**And** the editor supports: bold, italic, headings, links, and lists (minimal toolbar for non-technical users)

**Given** I am editing the hero section
**When** I modify the title, subtitle, or description using the rich text editor
**Then** the changes are saved as a draft in the landing_page_content table
**And** the save operation completes within 1 second (NFR-P3)

**Given** I am editing the intro section
**When** I modify the about text or platform purpose
**Then** the changes are saved as a draft

**Given** I am editing the footer section
**When** I modify contact information or copyright text
**Then** the changes are saved as a draft

**Given** I enter empty content in a required field
**When** I attempt to save
**Then** I see a validation error indicating the field is required

**Given** I submit content with potentially malicious HTML/script
**When** the content is processed
**Then** the input is sanitized to prevent XSS attacks (NFR-S8)

**Technical Decision:** TipTap editor (based on ProseMirror). Core bundle ~20KB gzipped, fits within 150KB JS budget. Install: `npm install @tiptap/react @tiptap/starter-kit`

### Story 4.2: Theme & Branding Customization

As an Admin,
I want to customize the landing page color scheme, fonts, and platform logo,
So that the portal consistently reflects DxT's professional brand identity.

**Acceptance Criteria:**

**Given** I am on the Theme & Branding settings page
**When** I view color options
**Then** I see the predefined DxT AI palette (Primary #41B9D5, Secondary #5371FF, Accent #6CE6E9) and alternative schemes

**Given** I select a different color scheme
**When** I save the selection
**Then** the theme preference is stored in the landing_page_content table under a "theme" section

**Given** I am on the font settings
**When** I select a font family
**Then** Nunito is the primary option with fallback alternatives available

**Given** I want to update the platform logo
**When** I upload a new logo image
**Then** the logo is stored and the landing page header updates to show the new logo

**Given** I want to update the favicon
**When** I upload a new favicon
**Then** the browser tab icon updates to the new favicon

### Story 4.3: Preview Mode (Client-Side)

As an Admin,
I want to preview all my CMS changes before publishing,
So that I can verify changes look correct and avoid mistakes on the live site.

**Acceptance Criteria:**

**Given** I have unsaved or unpublished changes (content, theme, or systems)
**When** I click "Preview"
**Then** a client-side preview simulation renders the landing page with my pending changes
**And** the preview is clearly labeled "PREVIEW - Not Published"

**Given** I am in preview mode
**When** I view the preview
**Then** I see the landing page exactly as it would appear to visitors with all my changes applied

**Given** I am in preview mode
**When** I click "Preview on different devices"
**Then** I can view the preview at mobile (375px), tablet (768px), and desktop (1280px) widths

**Given** I am satisfied with the preview
**When** I click "Back to Editor"
**Then** I return to the editing interface with my changes preserved

**Given** I am not satisfied with the preview
**When** I return to the editor
**Then** I can continue making changes and preview again

### Story 4.4: Publish Changes

As an Admin,
I want to publish my CMS changes to make them live on the public landing page,
So that visitors see the updated content immediately.

**Acceptance Criteria:**

**Given** I have pending changes in content, theme, or branding
**When** I click "Publish"
**Then** a confirmation dialog appears: "Are you sure you want to publish these changes? They will be live immediately."

**Given** I confirm the publish action
**When** the publish operation executes
**Then** all pending changes are applied to the production landing page
**And** the publish completes within 3 seconds (NFR-P3a)
**And** ISR cache is invalidated so visitors see updates immediately
**And** I see a success message "Changes published successfully"

**Given** I cancel the publish dialog
**When** the dialog closes
**Then** no changes are published and my drafts remain intact

**Given** the publish operation fails
**When** the error occurs
**Then** I see a clear error message and my draft changes are preserved for retry

### Story 4.5: Content Version History & Restore — DEFERRED TO PHASE 2

> **DEFERRED:** This story is moved to Phase 2 to align with PRD MVP Exclusions which explicitly exclude "Version history & content rollback UI (manual DB restore only in MVP)." FR74 will be implemented in Phase 2.

As an Admin,
I want the system to maintain a version history of content changes and allow restoring previous versions,
So that I can track what was changed, by whom, and revert to a previous version if needed.

**Acceptance Criteria:**

**Given** content is published
**When** the publish operation completes
**Then** the previous version of the content is preserved in the database with a version identifier, timestamp, and the user who published it

**Given** I am on the Content management page
**When** I view version history for a section
**Then** I see a list of previous versions with timestamps and author names

**Given** I view a specific historical version
**When** I select it
**Then** I can see the content as it was at that point in time

**Given** I want to restore a previous version
**When** I click "Restore this version" on a historical entry
**Then** a confirmation dialog appears: "Restore content to version from [timestamp]? Current content will be saved as a new version."

**Given** I confirm the restore action
**When** the restore completes
**Then** the selected version's content replaces the current draft
**And** the previous current content is preserved as a new version entry (no data loss)
**And** the restored content is loaded in the editor for review before publishing
**And** an audit log entry is created with action "restore_content", version_id, and user_id

**Given** version history exists
**When** I check the metadata field of landing_page_content
**Then** each version includes updated_by (user reference) and updated_at timestamp

---

## Epic 5: Health Monitoring & Analytics Dashboard

Admins can monitor real-time system health on a dedicated dashboard showing status indicators, response times, and last-checked timestamps with auto-refresh. The system performs automated health checks at configurable intervals, detects failures based on consecutive check thresholds, stores historical data, and notifies admins when systems go down. Public landing page cards also display live status indicators.

### Story 5.1: Basic Health Check Service & Status Updates

As a system administrator,
I want automated health checks running against all portfolio systems at regular intervals,
So that system status is continuously monitored without manual effort.

**Acceptance Criteria:**

**Given** systems exist in the portfolio
**When** the health check cron job executes (default: every 60 seconds via Vercel Cron)
**Then** an HTTP HEAD request is sent to each enabled system's URL with a 10-second timeout
**And** systems responding within 5 seconds are considered healthy (NFR-P4), responses between 5-10 seconds are recorded as degraded performance before timeout

**Given** a system responds successfully (HTTP 2xx/3xx)
**When** the health check completes
**Then** the system status is updated to "online" in the systems table
**And** the response time in milliseconds is recorded
**And** a health_checks record is created with status "success", response_time, and checked_at timestamp

**Given** a system fails to respond (timeout, HTTP 5xx, connection error)
**When** the health check completes
**Then** a health_checks record is created with status "failure" and error_message

**Given** the health_checks table needs to be created
**When** migrations run
**Then** the health_checks table exists with columns: id (UUID), system_id (FK), status, response_time, error_message, checked_at
**And** `idx_health_checks_system_id` index exists on health_checks(system_id, checked_at DESC)

### Story 5.2: Failure Detection, Retry Logic & Recovery

As a system administrator,
I want the system to intelligently detect failures with retry logic and recover from transient issues,
So that status indicators are accurate and false positives are minimized.

**Acceptance Criteria:**

**Given** a system fails consecutive checks equal to the failure threshold (default: 3)
**When** the threshold is reached
**Then** the system status is updated to "offline" in the systems table

**Given** a previously offline system responds successfully
**When** the health check succeeds
**Then** the system status is updated back to "online" and the failure counter resets

**Given** a transient network failure occurs
**When** the health check service retries with exponential backoff
**Then** the system recovers within 5 minutes (NFR-R3)

**Given** the health monitoring system detects failures
**When** I check detection accuracy
**Then** the system achieves >= 95% accuracy in detecting actual failures (NFR-R2)

### Story 5.3: Health Check Data Pruning & Scalability

As a system administrator,
I want health check data automatically pruned and rate limits handled gracefully,
So that the database stays performant as monitoring scales.

**Acceptance Criteria:**

**Given** health check data accumulates
**When** the record count exceeds 1000 per system
**Then** older records are pruned automatically (database trigger or scheduled job)

**Given** health checks are running at scale (10+ systems)
**When** checks execute concurrently
**Then** rate limits are handled gracefully without overwhelming target systems (NFR-P10)

**Given** the database has accumulated health check records
**When** I check storage and query performance
**Then** the health_checks table handles up to 100,000 records efficiently with proper indexing (NFR-SC3)

### Story 5.4: Health Monitoring Dashboard

As an Admin,
I want a real-time dashboard showing all system health statuses, response times, and timestamps,
So that I can monitor system health at a glance.

**Acceptance Criteria:**

**Given** I navigate to the Analytics/Dashboard page
**When** the page loads
**Then** I see all portfolio systems with their current status (online/offline), response time, and last checked timestamp
**And** the page loads within 3 seconds (NFR-P2)

**Given** the dashboard is displayed
**When** I view the summary section
**Then** I see overall statistics like "5/5 Online" or "4/5 Online, 1/5 Offline"

**Given** a system is offline
**When** I view the dashboard
**Then** offline systems are visually prominent (red indicator, possible visual hierarchy to top)

**Given** I view a specific system's row/card
**When** I check the details
**Then** I see: system name, current status badge, response time (ms), last checked timestamp

**Given** the dashboard has loaded
**When** I view the connection status
**Then** I see an indicator showing whether real-time updates are active (WebSocket connected) or using polling fallback

### Story 5.5: Real-Time Dashboard Updates (WebSocket + Polling)

As an Admin,
I want the dashboard to auto-refresh with the latest health data without manual reload,
So that I always see current system status.

**Acceptance Criteria:**

**Given** the dashboard is open
**When** a new health check completes on the server
**Then** the dashboard updates automatically via WebSocket connection
**And** status indicators, response times, and timestamps refresh without page reload

**Given** the WebSocket connection is established
**When** a health update event is received
**Then** the event follows the `health:update` format with Zod schema validation
**And** the UI updates with immutable state patterns

**Given** the WebSocket connection fails or is unavailable
**When** the fallback activates
**Then** the dashboard falls back to polling every 60 seconds via Supabase query

**Given** the auto-refresh is operating
**When** I check the refresh cycle
**Then** updates complete within 3 seconds (NFR-P6)

**Given** the WebSocket reconnects after a disconnection
**When** the connection is restored
**Then** the dashboard fetches the latest data and resumes real-time updates
**And** the connection status indicator updates accordingly

**Testing Note:** WebSocket connections must be testable in CI via mock WebSocket server. Contract tests must validate `health:update` Zod schema on both send and receive sides.

### Story 5.6: Health Check Failure Notifications

As an Admin,
I want to be notified when health checks fail and systems go offline,
So that I can respond to outages promptly.

**Acceptance Criteria:**

**Given** a system's status changes to "offline" (failure threshold reached)
**When** the status change is detected
**Then** an email notification is sent to designated admin email addresses within 1 minute (NFR-R6, NFR-R8)

**Given** a notification is sent
**When** I check the notification content
**Then** it includes: system name, time of failure, last successful check, and error details

**Given** a previously offline system recovers
**When** the status changes back to "online"
**Then** a recovery notification is sent to admins

**Given** notifications are configured
**When** I view the notification settings
**Then** I can see which email addresses receive alerts

**Technical Decision:** Email notifications via Resend (modern, serverless-native email API). Free tier: 100 emails/day, sufficient for MVP health alerts. Install: `npm install resend`

### Story 5.7: Configurable Health Check Settings

As an Admin,
I want to configure health check intervals, timeout thresholds, and failure counts per system,
So that monitoring can be tuned to each system's specific needs.

**Acceptance Criteria:**

**Given** I am on the system configuration page
**When** I view health check settings for a system
**Then** I see configurable fields: check interval (default: 60s), timeout threshold (default: 10s), failure count before offline (default: 3)

**Given** I change the check interval for a system
**When** I save the setting
**Then** the health check service uses the new interval for that specific system

**Given** I change the timeout threshold
**When** I save the setting
**Then** health checks for that system use the new timeout value

**Given** I change the failure count threshold
**When** I save the setting
**Then** the system requires the new number of consecutive failures before being marked offline

**Given** I enter an invalid value (e.g., interval < 30s or timeout < 1s)
**When** I attempt to save
**Then** I see a validation error with acceptable range guidance

### Story 5.8: Historical Health Check Data

As an Admin,
I want to view historical health check data for trend analysis,
So that I can identify patterns in system reliability and performance.

**Acceptance Criteria:**

**Given** I am on the dashboard for a specific system
**When** I view historical data
**Then** I see recent health check records showing status, response time, and timestamp

**Given** health check records exist
**When** I review the data
**Then** records are sorted by most recent first

**Given** I want to analyze trends
**When** I view response time data over time
**Then** I can identify performance patterns (response time increases, intermittent failures)

---

## Epic 6: User Management & Administration

Super Admin can manage CMS user accounts for the DxT Team - create new accounts, assign or change roles, reset passwords, disable accounts without deletion, delete accounts, and track login history. This enables the DxT Team onboarding workflow.

### Story 6.1: Create CMS User Accounts

As a Super Admin,
I want to create new CMS user accounts for DxT Team members,
So that they can access the CMS and manage the platform.

**Acceptance Criteria:**

**Given** I am authenticated as Super Admin
**When** I navigate to the User Management section
**Then** I see a list of all existing CMS users with their email, role, status, and last login

**Given** I click "Add User"
**When** I fill in the user's email and select a role (Admin or User)
**Then** a new account is created in Supabase Auth
**And** an invitation or initial credentials are generated for the new user

**Given** the new user receives their credentials
**When** they first log in
**Then** they are required to set up MFA (TOTP) before accessing CMS features

**Given** I try to create a user with an email that already exists
**When** I submit the form
**Then** I see an error message "A user with this email already exists"

**Given** the system has 5-7 concurrent CMS users
**When** they are all active
**Then** the system performs without degradation (NFR-P5)

### Story 6.2: Assign & Change User Roles

As a Super Admin,
I want to assign or change user roles,
So that I can control what each team member can access and do.

**Acceptance Criteria:**

**Given** I am on the User Management page
**When** I select a user and click "Change Role"
**Then** I see a dropdown with available roles: Super Admin, Admin, User

**Given** I change a user's role from Admin to User
**When** I save the change
**Then** the user's role is updated in the database immediately
**And** their next page load reflects the new permissions
**And** I see a success confirmation

**Given** I try to remove the last Super Admin role
**When** I attempt the change
**Then** the system prevents it with an error: "At least one Super Admin is required"

### Story 6.3: Reset User Passwords

As a Super Admin,
I want to reset a user's password,
So that locked-out team members can regain access.

**Acceptance Criteria:**

**Given** I am on the User Management page
**When** I click "Reset Password" for a user
**Then** a password reset is triggered via Supabase Auth
**And** the user receives a password reset link or temporary credentials

**Given** the password reset is triggered
**When** the user uses the reset mechanism
**Then** they can set a new password and log in

**Given** the reset is completed
**When** I check the user record
**Then** the password change is reflected and the previous password no longer works

### Story 6.4: Disable & Delete User Accounts

As a Super Admin,
I want to disable or delete user accounts,
So that I can revoke access when team members leave or as needed.

**Acceptance Criteria:**

**Given** I am on the User Management page
**When** I click "Disable" on an active user
**Then** the user's is_active is set to false
**And** the user immediately loses CMS access (next request redirected to login)
**And** the user record is preserved in the database

**Given** a user is disabled
**When** they attempt to log in
**Then** they see "Account disabled. Contact your administrator."

**Given** I click "Delete" on a user
**When** a confirmation dialog appears and I confirm
**Then** the user account is soft-deleted (30-day grace period per GDPR data lifecycle)
**And** after 30 days, the user record is permanently deleted
**And** audit logs referencing this user are anonymized (user_id replaced with 'deleted-user-[uuid]')

**Given** I try to delete my own Super Admin account
**When** I attempt the action
**Then** the system prevents it: "Cannot delete your own account"

### Story 6.5: User Login History & Activity Tracking

As a Super Admin,
I want to view user login history and last login timestamps,
So that I can monitor CMS usage and identify inactive accounts.

**Acceptance Criteria:**

**Given** I am on the User Management page
**When** I view the user list
**Then** each user shows their last_login timestamp

**Given** I click on a specific user
**When** I view their profile details
**Then** I see their login history including recent login timestamps

**Given** a user logs in
**When** the login succeeds
**Then** the last_login timestamp is updated on their user record

**Given** I want to identify inactive users
**When** I review the user list
**Then** I can see which users haven't logged in recently (sortable by last_login)

---

## Epic 7: Security, Audit & Operations

Super Admin can view complete audit trails of all platform activity with domain-specific logging — authentication events (Story 7.1), system & content changes (Story 7.2), user management & authorization events (Story 7.3) — with IP tracking and configurable retention. Operational tooling includes automated daily backups, manual backup triggers, database restore, deployment rollback, error detection with alerting, application performance monitoring, and system configuration management.

### Story 7.1: Audit Logging Infrastructure

As a system administrator,
I want all platform actions automatically logged with user context, timestamps, and IP addresses,
So that a complete audit trail exists for security and compliance.

**Acceptance Criteria:**

**Given** the audit_logs table exists
**When** I inspect its schema
**Then** it has columns: id (UUID), user_id, action, resource, details (JSONB), ip_address (INET), timestamp

**Given** the audit_logs table has RLS policies
**When** any user attempts to update or delete audit log records
**Then** the operation is denied (append-only, tamper-proof per NFR-S7)

**Given** a user logs in successfully
**When** the login completes
**Then** an audit log entry is created with action "login_success", user_id, IP address, and timestamp

**Given** a login attempt fails
**When** the failure occurs
**Then** an audit log entry is created with action "login_failure", attempted email, IP address, and timestamp

**Given** a user sets up or modifies MFA
**When** the MFA action completes
**Then** an audit log entry is created with action "mfa_setup" or "mfa_modified"

**Given** a user logs out
**When** the logout completes
**Then** an audit log entry is created with action "logout"

**Given** performance indexes are needed
**When** I inspect the database
**Then** `idx_audit_logs_user_id` and `idx_audit_logs_timestamp` indexes exist

### Story 7.2: System & Content Audit Logging

As a system administrator,
I want all system portfolio and content management actions logged with full context,
So that CMS changes can be traced back to specific users and actions.

**Acceptance Criteria:**

**Given** an Admin creates, updates, or deletes a system
**When** the action completes
**Then** an audit log entry is created with action type (create_system, update_system, delete_system), resource identifier, user_id, and details including old/new values for updates

**Given** an Admin reorders or toggles system visibility
**When** the action completes
**Then** an audit log entry is created with action type (reorder_systems, toggle_system), affected system IDs, and user_id

**Given** an Admin edits content (hero, intro, footer)
**When** the changes are saved
**Then** an audit log entry is created with action "update_content", section_name, user_id, and change summary

**Given** an Admin publishes changes
**When** the publish completes
**Then** an audit log entry is created with action "publish", timestamp, user_id, and what was published

### Story 7.3: User Management & Authorization Audit Logging

As a system administrator,
I want all user management and authorization events logged with full context,
So that security-sensitive actions have a complete audit trail.

**Acceptance Criteria:**

**Given** a Super Admin performs user management (create, delete, role change)
**When** the action completes
**Then** an audit log entry is created with action type, target user info, and Super Admin user_id

**Given** a Super Admin invites a new user
**When** the invitation is sent
**Then** an audit log entry is created with action "invite_user", target email, assigned role, and Super Admin user_id

**Given** a user attempts to access a forbidden resource
**When** the authorization check fails
**Then** an audit log entry is created with action "authorization_failure", attempted resource, user_id, and IP address

**Given** a user's account is disabled or re-enabled
**When** the action completes
**Then** an audit log entry is created with action "disable_user" or "enable_user", target user_id, and Super Admin user_id

### Story 7.4: Audit Log Viewer

As a Super Admin,
I want to view audit logs with filtering and search capabilities,
So that I can investigate user actions and security events.

**Acceptance Criteria:**

**Given** I am authenticated as Super Admin
**When** I navigate to the Audit Logs section
**Then** I see a chronological list of audit log entries (most recent first)

**Given** I am viewing audit logs
**When** I filter by action type (e.g., login events, system changes, content edits)
**Then** only matching entries are displayed

**Given** I am viewing audit logs
**When** I filter by user
**Then** only entries for that specific user are shown

**Given** I am viewing audit logs
**When** I filter by date range
**Then** only entries within the specified timeframe are shown

**Given** I view a specific audit log entry
**When** I expand the details
**Then** I see: user email, action, resource affected, details (old/new values), IP address, and timestamp

**Given** I am authenticated as Admin (not Super Admin)
**When** I try to access audit logs
**Then** I am denied access (Super Admin only per RBAC matrix)

### Story 7.5: Audit Log Retention & Cleanup

As a system administrator,
I want audit logs automatically retained for 90 days and cleaned up thereafter,
So that storage is managed efficiently while meeting compliance needs.

**Acceptance Criteria:**

**Given** the retention policy is configured for 90 days
**When** audit log entries are older than 90 days
**Then** they are automatically deleted via scheduled database job

**Given** critical events exist (login failures, user management actions)
**When** the retention cleanup runs
**Then** critical events are retained indefinitely (exempt from 90-day policy)

**Given** a deleted user's audit logs exist
**When** the user deletion grace period expires (30 days)
**Then** the user_id in those audit logs is anonymized to 'deleted-user-[uuid]'
**And** the audit log entries themselves are preserved

**Given** the database has accumulated audit logs
**When** I check storage
**Then** the audit_logs table handles growth efficiently with proper indexing (NFR-SC3)

### Story 7.6: Error Tracking & Performance Monitoring

As a Super Admin,
I want application errors tracked and performance metrics monitored,
So that I can identify and resolve issues proactively.

**Acceptance Criteria:**

**Given** Sentry is configured
**When** an unhandled error occurs in the application
**Then** the error is captured with stack trace, user context, and breadcrumbs
**And** the error appears in the Sentry dashboard

**Given** error rates spike
**When** more than 10 errors occur in 5 minutes
**Then** an email alert is sent to the Super Admin

**Given** Vercel Analytics is configured
**When** users interact with the application
**Then** Core Web Vitals (LCP, FID, CLS) are tracked and reported

**Given** the application is in production
**When** I check Vercel Analytics
**Then** I can verify performance meets NFR targets (LCP < 2.5s, FID < 100ms, CLS < 0.1)

**Given** smoke tests are configured
**When** a deployment completes
**Then** automated checks verify: landing page loads, CMS login succeeds, health check executes (NFR-T2)

### Story 7.7: Database Backup & Restore

As a Super Admin,
I want automated daily backups with the ability to manually trigger backups and restore when needed,
So that data can be recovered in case of corruption or disaster.

**Acceptance Criteria:**

**Given** the Supabase project is configured
**When** each day passes
**Then** an automated backup is performed with 7-day retention (Supabase managed)

**Given** I am about to make a major CMS change
**When** I click "Create Backup" in system settings
**Then** a manual backup is triggered via the `/api/admin/backup` endpoint
**And** I see a confirmation with backup timestamp

**Given** data corruption or loss occurs
**When** I initiate a database restore
**Then** the database can be restored from the latest backup
**And** the restore completes within 4 hours (NFR-R5)
**And** maximum data loss is 24 hours (RPO)

**Given** a restore is needed
**When** I follow the restore procedure
**Then** step-by-step instructions are available in the system settings or documentation

### Story 7.8: Deployment Rollback & System Configuration

As a Super Admin,
I want to rollback to a previous deployment and manage system configuration settings,
So that I can recover from bad deployments and tune platform behavior.

**Acceptance Criteria:**

**Given** a deployment causes issues
**When** I access the Vercel dashboard or system settings
**Then** I can promote a previous deployment to production (one-click rollback)

**Given** the system has critical errors
**When** the error detection system triggers
**Then** the Super Admin is alerted via Sentry notifications

**Given** I am on the System Configuration page
**When** I view available settings
**Then** I can configure: health check defaults, session timeouts, notification email addresses, and retention policies

**Given** I change a configuration setting
**When** I save the change
**Then** the setting takes effect immediately or after the next relevant cycle
**And** an audit log entry records the configuration change

**Given** manual recovery from critical failure is needed
**When** the recovery procedure is executed
**Then** the system is restored within 1 hour (NFR-R4)

<!-- Story 7.8 (Automated Testing & Quality Gates) moved to Epic 1 Story 1.4: Testing Infrastructure, Error Boundaries & Shared Utilities -->
