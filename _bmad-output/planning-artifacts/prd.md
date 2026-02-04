---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-zyncdata-2026-02-03.md"
  - "docs/Zyncdata.pdf"
  - "docs/DXT AI Brand Board.pdf"
briefCount: 1
researchCount: 0
brainstormingCount: 0
projectDocsCount: 2
classification:
  projectType: "SaaS B2B Platform (Access Hub & Portfolio Management)"
  domain: "Enterprise Software - Portal & Access Management"
  complexity: "Medium"
  projectContext: "Greenfield"
workflowType: 'prd'
date: 2026-02-03
author: Jiraw
project_name: zyncdata
---

# Product Requirements Document - zyncdata

**Author:** Jiraw
**Date:** 2026-02-03

## Success Criteria

### User Success

**Primary User (Jiraw - Multi-System Administrator):**
- **Daily Driver:** ใช้ zyncdata.app เป็น starting point ทุกวันทำงาน (5 days/week minimum)
- **Time Savings:** ประหยัดเวลา 50%+ ในการ navigate ระหว่างระบบ
  - Current: 1-2 นาทีในการ switch ระหว่าง 5 ระบบ
  - Target: 30-60 วินาที total
- **Emotional Success:** รู้สึกว่าทำงานได้เร็วขึ้น, ไม่ต้อง search bookmarks อีกต่อไป
- **Context Switching:** เข้าถึงระบบใดก็ได้ภายใน 1-2 clicks
- **Leading Indicator:** ใช้ zyncdata.app อย่างน้อย 3 days/week ภายใน Week 1 (early adoption signal)

**Secondary Users (DxT Team - CMS Admins):**
- **Self-Service:** เพิ่มระบบใหม่ได้เองภายใน 10 นาที โดยไม่ต้องรอ developer (80%+ independence)
- **Content Control:** แก้ไข landing page content และ publish โดยไม่มี downtime
- **Error Recovery:** Admin สามารถแก้ไขความผิดพลาด (edit/delete) ภายใน 2 นาที โดยไม่ต้องขอความช่วยเหลือ
- **First-Time Onboarding:** DxT Team member ใหม่สามารถเพิ่มระบบแรกได้สำเร็จโดยไม่ต้องอบรม (self-explanatory UI)
- **Confidence:** รู้สึกมั่นใจในการจัดการ platform ได้เอง

**End Users (พนักงานองค์กรลูกค้า):**
- **Quick Access:** เข้าถึงระบบที่ต้องการภายใน 2 clicks และ < 10 วินาที
- **Zero Confusion (Measurable):** 95%+ ของ first-time users สามารถเข้าถึงระบบที่ต้องการได้สำเร็จโดยไม่ต้องขอความช่วยเหลือ
- **Professional Impression (Measurable):** First-time visitors สามารถระบุระบบทั้ง 5 และวัตถุประสงค์ของแต่ละระบบได้ภายใน 30 วินาที (usability test)
- **Flexibility:** เลือกใช้ portal หรือ direct URL ก็ได้ตามสะดวก

**UX Success Metrics:**
- **Delight Moments:** อย่างน้อย 1 "wow moment" ต่อ session (smooth animation, instant feedback)
- **Frustration Tracking:** Track และแก้ไข pain points ทั้งหมด (interaction > 5 วินาที, unclear buttons) → Target: Zero major frustrations ภายใน Week 2
- **Emotional Score:** 4-5 stars (5-point scale) หลัง Week 3 (stable)
- **Habituation Timeline:** Week 1 (ทดลอง) → Week 2 (ใช้บ่อย) → Week 3+ (default behavior)

### Business Success

**Strategic Goals (Non-Revenue Focused):**
- **Professional Image:** Zyncdata สร้างความประทับใจแรกพบที่ดีให้กับลูกค้าของ DxT
  - **Concrete Metric:** ได้รับ rating 4+ stars จาก 5+ external viewers (DxT clients, partners) ภายในเดือนแรก
- **Portfolio Showcase:** แสดงผลงานของ DxT (5+ ระบบ) อย่างเป็นระบบและสวยงาม
- **Operational Efficiency:** ลด support overhead และเพิ่มประสิทธิภาพการทำงาน

**Phase-Based Success:**

**Phase 1 (Month 1-2): MVP Foundation**
- ✅ Portal + CMS ใช้งานได้สมบูรณ์
- ✅ แสดงระบบปัจจุบันทั้ง 5 รายการ (TINEDY, VOCA, ENEOS, rws, BINANCE)
- ✅ Jiraw ใช้งานเป็นประจำ (validated via weekly check-in)
- ✅ Security audit completed 2 weeks before MVP launch

**Phase 2 (Month 3-4): Self-Service Success**
- ✅ DxT Team เพิ่มระบบใหม่ได้เองภายใน 10 นาที
- ✅ Landing page customization ใช้งานได้
- ✅ Analytics dashboard แสดงข้อมูล usage

**Phase 3 (Month 5-6): Stability & Growth**
- ✅ ระบบมีเสถียรภาพและ performance ดี (< 0.5s load time)
- ✅ Portfolio showcase ต่อยอดเป็น 10+ ระบบ
- ✅ End users เริ่มใช้ portal เป็นทางเลือก
- ✅ Weekly check-in = consistent "Yes" answers

**Weekly Check-In Protocol:**
ทุกวันศุกร์ ถามตัวเอง 3 คำถาม:
1. ✅ Did I use zyncdata.app this week? (Yes/No)
2. ✅ Did it save me time? (Yes/No/Neutral)
3. ✅ Is it still worth maintaining? (Yes/No)

**Decision Rule:**
- ถ้าตอบ "No" ใน Q1 หรือ Q2 เป็นเวลา 2 สัปดาห์ติดต่อกัน = **Pivot or Kill the project**
- ถ้าตอบ "No" ใน Q3 = **Immediate review and decide next steps**

**Leading Indicators (Early Warning Signs):**
- ⚠️ Week 1: ถ้าใช้ < 2 days = risk signal
- ⚠️ Week 2: ถ้า emotional score < 3 stars = investigate issues
- ⚠️ Any week: ถ้า load time > 1s consistently = performance problem
- ⚠️ CMS: ถ้า DxT Team ยังต้องขอความช่วยเหลือ > 50% = UX problem

### Technical Success

**Performance (Context-Specific):**
- ✅ Load time < 0.5s for cached pages, < 2s for first load (measured from Thailand)
- ✅ Response time for system redirects < 300ms
- ✅ Smooth animations and transitions (60fps)
- ✅ Performance measured under realistic load: 10-20 concurrent users (realistic for MVP phase)

**Reliability:**
- ✅ Uptime 99.9% target
- ✅ Zero critical bugs in production
- ✅ Graceful error handling and user feedback
- ✅ Automated daily backups + tested restore procedure
- ✅ Rollback plan ready and tested

**Security (Comprehensive):**
- ✅ Security audit passed 2 weeks before MVP launch
- ✅ MFA (TOTP) tested comprehensively:
  - Signup flow with QR code scanning
  - Login flow with authenticator app
  - Session timeout and re-authentication
  - Backup codes generation and usage
  - Error scenarios (wrong code, expired code)
- ✅ Penetration testing completed and vulnerabilities addressed
- ✅ HTTPS with valid SSL certificate
- ✅ Secure session management
- ✅ Role-based access control (RBAC) working correctly

**Scalability:**
- ✅ Support 10+ systems without performance degradation
- ✅ Handle 10-20 concurrent users (realistic for MVP phase)
- ✅ Database optimized for growth
- ✅ Monitoring & alerting configured for critical metrics

**Accessibility:**
- ✅ Keyboard navigation works for all critical paths (tab, enter, escape)
- ✅ Color contrast passes WCAG AA standards
- ✅ Screen reader compatible (basic support)

### Measurable Outcomes

**Quantitative Metrics:**
- **Time Savings:** 50%+ reduction in navigation time (measured via baseline comparison)
- **Load Time:** < 0.5s cached, < 2s first load (measured from Thailand)
- **CMS Efficiency:** Add system in < 10 minutes, fix mistakes in < 2 minutes
- **Adoption:** Jiraw uses zyncdata.app 5+ days/week
- **User Satisfaction:** Feedback ≥ 4 stars (5-point scale)
- **Professional Perception:** 4+ stars from 5+ external viewers
- **First-Time Success:** 95%+ users succeed without help

**Qualitative Metrics:**
- **30-Second Test:** Visitors identify all 5 systems and their purpose within 30 seconds
- **Zero Onboarding:** No instructions needed to use portal
- **Self-Explanatory CMS:** New team members add systems without training
- **Emotional Score:** 4-5 stars after Week 3 (stable)
- **Zero Frustrations:** No major pain points by Week 2

## Product Scope

### MVP - Minimum Viable Product

**Core Deliverables (Must Have):**

**1. Public Landing Page (zyncdata.app)**
- Portfolio cards แสดงระบบทั้ง 5 รายการ
- Click & redirect to subdomain
- DxT AI branding (colors, fonts, logo)
- Responsive design (desktop, mobile, tablet)
- Accessibility: Keyboard navigation + WCAG AA color contrast
- Performance: Load time < 0.5s (cached), < 2s (first load)

**2. CMS Platform (Priority Order)**

**Priority 1: System Management** (Critical)
- ✅ Add new system (name, URL, logo, description)
- ✅ Edit system information
- ✅ Delete system (with confirmation)
- ✅ Reorder systems
- ✅ Enable/disable systems
- ✅ Error recovery: undo/edit mistakes easily

**Priority 2: Content Editor** (Important)
- ✅ Edit hero section (title, subtitle, description)
- ✅ Edit intro text
- ✅ Edit footer content
- ✅ Rich text editor (WYSIWYG)

**Priority 3: Theme & Branding** (Nice to Have)
- ✅ Color scheme selection (DxT AI palette)
- ✅ Font settings (Nunito + alternatives)
- ✅ Logo management

**All Priorities:**
- ✅ Preview mode (see changes before publish)
- ✅ Publish button (make changes live)
- ✅ Confirmation dialogs (prevent accidents)
- ✅ Instant updates after publish
- ✅ Self-explanatory UI for first-time users

**3. Authentication & Security**
- ✅ Username/Password login
- ✅ MFA (TOTP with authenticator app) - fully tested
- ✅ Session management
- ✅ Role-based access (Super Admin, Admin, User)
- ✅ Secure logout
- ✅ Security audit completed 2 weeks before launch

**4. Analytics & Monitoring Dashboard**
- ✅ Real-time system health status (🟢 Online / 🔴 Offline)
- ✅ Response time tracking
- ✅ Last checked timestamp
- ✅ Auto-refresh every 30-60 seconds
- ✅ Overall summary (5/5 Online, 0/5 Offline)
- ✅ Alerting for critical issues

**5. Operations & Maintenance**
- ✅ Automated daily backups
- ✅ Tested restore procedure
- ✅ Rollback plan ready
- ✅ Monitoring & alerting configured

**MVP Success Definition:**
"ทำได้ + Deploy ได้ + ใช้งานได้ + Security audit passed + Backup/rollback ready = MVP สำเร็จ" ✅

### Growth Features (Post-MVP)

**Phase 2 (Month 3-6):**
- Version history & rollback capabilities (UI-level)
- Staging environment for testing
- Multiple CMS users with role-based permissions
- Historical analytics data and trends
- Advanced monitoring (uptime %, performance graphs)
- Enhanced security (detailed audit logs)

**Phase 3 (Month 6-12):**
- True SSO implementation (SAML 2.0, OAuth 2.0)
- REST API for integrations
- Slack/Teams notifications and controls
- Advanced customization options
- Bulk operations and CSV import/export
- Mobile-responsive CMS admin

### Vision (Future)

**Long-term Goals (Year 2+):**
- AI-powered insights (usage patterns, recommendations, anomaly detection)
- White-label solution for other companies
- Ecosystem integrations (Jira, GitHub, Notion, etc.)
- Advanced analytics (heatmaps, user journeys, conversion funnels)
- Mobile app (iOS/Android)
- Scale to 50+ systems with no performance degradation
- Multi-language support (Thai, English, etc.)

**Platform Transformation:**
- **Year 1:** Internal utility tool → Professional portfolio showcase
- **Year 2:** Simple portal → Full enterprise platform
- **Year 3:** DxT-only → Potential SaaS product for other companies

## User Journeys

### Journey 1: Jiraw's Morning Ritual - From Chaos to Control

**Persona: Jiraw - The Solo Operations Hero**

Jiraw is a one-person operations team managing five production systems (TINEDY, VOCA, ENEOS, rws, BINANCE) for multiple DxT clients. Every morning starts the same way: opening five browser tabs, hunting through bookmarks, and mentally context-switching between completely different systems. It's exhausting.

**Opening Scene: The Bookmark Hunt**

It's 9:00 AM. Jiraw opens his laptop with coffee in hand. He needs to check ENEOS first—there was a deployment last night. Where's that bookmark again? Ah, there it is. `eneos.zyncdata.app`. Opens tab. Now TINEDY—scroll, scroll... found it. Another tab. By the time he's opened all five systems, he's already spent 2 minutes and his mental energy is drained from just *starting* his day.

**Discovery: The Single Portal**

One day, Jiraw decides to build something better. What if there was **one URL** to rule them all? What if `zyncdata.app` became his **home base**—a dashboard showing all five systems at a glance?

**Rising Action: The New Workflow**

Now, every morning looks different:
1. Open browser → Type `zyncdata.app` (muscle memory)
2. Beautiful landing page loads instantly (< 0.5s) - smooth fade-in animation
3. Five clean cards appear—TINEDY, VOCA, ENEOS, rws, BINANCE—each with logos and status indicators
4. **Wait—ENEOS card shows 🔴 Offline (red indicator)**
5. *"Okay, issue detected. Let me check analytics first."*
6. Click "Analytics" → Dashboard shows ENEOS response time spiked 3 minutes ago
7. Click ENEOS card anyway → Gets redirect → Server error page
8. *"Hmm, deployment issue. Let me restart the service."*
9. Restarts service via SSH → Refreshes zyncdata.app
10. **ENEOS card now shows 🟢 Online (green indicator)** - visual confirmation!
11. Click → Jump to ENEOS → Check system health, review logs
12. Hit back → Home base again
13. Click "TINEDY" → Jump to another system

**Climax: The Time-Saving Revelation**

After Week 1, Jiraw realizes something profound: **He's not searching anymore.** No bookmark hunting. No tab chaos. No mental overhead. What used to take 1-2 minutes now takes 30-60 seconds. More importantly, **the cognitive load is gone.** His mornings feel lighter.

But the real magic? When something breaks (like ENEOS), **he knows immediately** without clicking around. The status indicator saves him from wasting time on dead links.

**Resolution: The Default Behavior**

By Week 3, `zyncdata.app` is Jiraw's browser homepage. It's not just a tool—it's his **digital home.** When he needs to switch between systems throughout the day, he returns to this home base. Click. Jump. Return. Click. Jump. Return. It's seamless.

**Emotional Arc:**
- Before: Frustrated, mentally exhausted, inefficient
- During: Curious, hopeful, testing
- **Setback:** ENEOS offline moment (brief panic)
- **Recovery:** Status indicator reveals issue immediately (relief)
- After: Relieved, empowered, efficient, **trust in the system**

**Aha! Moment:** *"Wait... I haven't opened my bookmarks folder in a week. And when ENEOS went down, I knew before even clicking. This actually works."*

**Requirements Revealed:**
- Fast portal loading (< 0.5s)
- Visual system cards with logos
- One-click redirect to subdomains
- Real-time status indicators (🟢 Online / 🔴 Offline)
- Clean, uncluttered interface
- Responsive design (works on all devices)
- Analytics dashboard (response time tracking)
- Error handling (graceful failures)

## SaaS B2B Platform Specific Requirements

### Platform Architecture & Tenant Model

**Platform Type:** Single-Tenant SaaS B2B Platform
**Primary Use Case:** Enterprise Access Management & Portfolio Showcase
**Deployment Model:** Cloud-hosted with managed database

**Tenancy Model Decision:**
- **Single-Tenant Architecture** - DxT operates one Zyncdata instance for all client systems
- Not multi-tenant in the traditional SaaS sense (no separate customer databases)
- DxT is the sole administrator managing multiple client systems (TINEDY, VOCA, ENEOS, rws, BINANCE) within one unified platform
- Each "system" is a portfolio item/card on the landing page, not a separate tenant

**Rationale:**
- Simplified architecture for MVP - no tenant isolation complexity
- DxT showcases client work on one unified portal
- Easier to maintain and deploy as internal tool
- Can evolve to multi-tenant architecture in future if Zyncdata becomes a commercial product (Year 3+ vision)

**Data Organization:**
- One database instance - all data in single database
- No tenant-level data isolation required
- System-level separation via `systems` table (each row = one client system)

### Database Architecture

**Database Provider:** Supabase (Managed PostgreSQL)

**Schema Design:**

**Core Tables:**
```sql
-- Systems (Portfolio Items)
CREATE TABLE systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  status VARCHAR(50) DEFAULT 'online', -- 'online' | 'offline' | 'degraded'
  response_time INTEGER, -- in milliseconds
  display_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (CMS Admins)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'super_admin' | 'admin' | 'user'
  mfa_secret TEXT, -- encrypted TOTP secret
  mfa_enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[], -- array of encrypted backup codes
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landing Page Content
CREATE TABLE landing_page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name VARCHAR(100) NOT NULL, -- 'hero' | 'intro' | 'footer'
  content JSONB NOT NULL, -- flexible content structure
  metadata JSONB,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Checks (Monitoring Logs)
CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID REFERENCES systems(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- 'success' | 'failure' | 'timeout'
  response_time INTEGER, -- in milliseconds
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs (User Activity Tracking)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- 'create_system' | 'update_content' | 'publish' | 'login'
  resource VARCHAR(100), -- 'system:uuid' | 'content:section_name'
  details JSONB, -- action-specific metadata
  ip_address INET,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes for Performance:**
```sql
-- Frequently queried fields
CREATE INDEX idx_systems_enabled ON systems(enabled, display_order);
CREATE INDEX idx_health_checks_system_id ON health_checks(system_id, checked_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
```

**Connection Pooling Strategy (Supabase):**
- **Transaction Mode** (PgBouncer) for serverless functions (Next.js API routes)
  - Short-lived connections for CRUD operations
  - Connection limit: 15 concurrent connections (Supabase free tier)
- **Session Mode** for long-running admin operations (health check service)
  - Persistent connection for continuous monitoring
- **Expected Load:** 10-20 concurrent users max (MVP phase)
- **Connection Usage:** ~5-10 connections during peak hours

**Data Retention Policies:**
- **Health Checks:** Retain last 1000 checks per system (~7-14 days at 60s intervals)
  - Automatic pruning via database trigger or scheduled job
- **Audit Logs:** Retain for 90 days (MVP), then archive or delete
  - Phase 2: 1-year retention for compliance
- **User Sessions:** JWT tokens valid for 24 hours, refresh tokens for 7 days

**Backup & Disaster Recovery:**
- **Automated Backups:** Supabase daily backups (7-day retention)
- **Manual Pre-Deployment Backups:** Before major CMS changes
- **RPO (Recovery Point Objective):** 24 hours - Maximum acceptable data loss
- **RTO (Recovery Time Objective):** 4 hours - Maximum acceptable downtime
- **Restore Testing:** Quarterly restore drill to validate backup integrity
- **Backup Verification:** Monthly backup health checks

**Data Volume Estimates (MVP):**
- Systems: ~10-20 rows (low growth)
- Users: ~5-10 rows (low growth)
- Health Checks: ~1000 checks/system × 10 systems = 10,000 rows (pruned regularly)
- Audit Logs: ~100 actions/day × 90 days = 9,000 rows
- **Total Estimated Size:** < 100 MB (well within Supabase free tier)

### Role-Based Access Control (RBAC) Matrix

**Defined Roles:**

| Role | User Count (MVP) | Primary Responsibilities |
|------|------------------|-------------------------|
| **Super Admin** | 1 (Jiraw) | Full system control, user management, all CMS functions, analytics access, system configuration |
| **Admin** | 2-5 (DxT Team) | CMS management (add/edit/delete systems), content editing, publish changes, view analytics |
| **User** (Future - Phase 2+) | TBD | Read-only access to portal, view analytics dashboard only |

**Detailed Permission Matrix:**

| Permission / Feature | Super Admin | Admin | User (Future) |
|---------------------|-------------|-------|---------------|
| **System Management** |
| Add new system (portfolio item) | ✅ | ✅ | ❌ |
| Edit system details (name, URL, logo, description) | ✅ | ✅ | ❌ |
| Delete system | ✅ | ✅ | ❌ |
| Reorder systems (display order) | ✅ | ✅ | ❌ |
| Enable/Disable system visibility | ✅ | ✅ | ❌ |
| **Content Management** |
| Edit landing page content (hero, intro, footer) | ✅ | ✅ | ❌ |
| Edit theme & branding (colors, fonts, logo) | ✅ | ✅ | ❌ |
| Preview changes before publish | ✅ | ✅ | ❌ |
| Publish changes to production | ✅ | ✅ | ❌ |
| **Analytics & Monitoring** |
| View system health dashboard | ✅ | ✅ | ✅ |
| View response time metrics | ✅ | ✅ | ✅ |
| View analytics (page views, usage) | ✅ | ✅ | ✅ |
| View audit logs (who changed what) | ✅ | ❌ | ❌ |
| **User Management** |
| Create new CMS user accounts | ✅ | ❌ | ❌ |
| Delete user accounts | ✅ | ❌ | ❌ |
| Assign/change user roles | ✅ | ❌ | ❌ |
| Reset user passwords | ✅ | ❌ | ❌ |
| **System Configuration** |
| Modify system settings | ✅ | ❌ | ❌ |
| Configure health check intervals | ✅ | ❌ | ❌ |
| Manage database backups | ✅ | ❌ | ❌ |

**User Lifecycle:**

**Onboarding (Admin role):**
1. Super Admin creates account → assigns "Admin" role
2. New user receives invitation email
3. User sets password + enables MFA (mandatory)
4. User gains CMS access based on Admin permissions

**Active Use:**
- Login requires: password + MFA code
- Session duration: 24 hours (auto-logout after 2 hours inactivity)
- All CMS actions logged in audit trail

**Offboarding:**
- Super Admin disables account → immediate access revocation
- Audit logs retained (user's past actions preserved)

### Business Rules & Constraints

**System Deletion Rules:**
- **Soft Delete by Default** - Systems marked as `enabled: false` instead of hard delete
- **30-Day Recovery Window** - Deleted systems remain in database for 30 days before permanent removal
- **Confirmation Required** - CMS displays confirmation dialog: "Are you sure you want to delete [SYSTEM NAME]? This can be undone within 30 days."
- **Active System Protection** - If system has recent health checks (within 24 hours), show warning: "This system is currently active. Proceed with caution."
- **Hard Delete** - Super Admin can permanently delete (bypass soft delete) for sensitive data removal

**Emergency Admin Procedures:**
- **Backup Super Admin** - Jiraw must designate one DxT Team member as backup Super Admin for emergencies
- **Account Recovery** - If Jiraw loses MFA access:
  1. Use backup codes (generated during MFA setup)
  2. If backup codes lost: Database-level manual intervention required (direct Supabase access)
- **Critical System Failure** - If CMS becomes inaccessible:
  1. Rollback to previous Vercel deployment (one-click)
  2. Restore database from latest backup if corrupted
  3. RTO target: 4 hours

**Publish & Rollback Mechanisms:**
- **Preview Before Publish** - All changes reviewed in preview mode (client-side simulation)
- **Instant Publish** - Changes go live immediately upon "Publish" button click
- **No Version History in MVP** - Once published, no UI-based undo (Phase 2 feature)
- **Emergency Rollback** - If publish causes issues:
  1. Manual content revert via CMS (edit and re-publish)
  2. Database restore from pre-publish backup (manual process, ~1-2 hours)
  3. Phase 2: UI-based version history with one-click rollback

**Audit Log Scope & Retention:**

**Logged Events:**
- ✅ Authentication events (login success/failure, logout, MFA setup)
- ✅ System management (create, update, delete, reorder, enable/disable)
- ✅ Content editing (hero, intro, footer changes)
- ✅ Theme updates (color, font, logo changes)
- ✅ Publish actions (timestamp, user, what changed)
- ✅ User management (create user, delete user, role changes) - Super Admin only
- ✅ Failed authorization attempts (user tried to access forbidden resource)

**Audit Log Details Captured:**
- User ID, action type, resource affected
- Timestamp (UTC), IP address
- Action-specific metadata (e.g., old value → new value for updates)

**Retention Policy:**
- **MVP:** 90 days retention, then auto-delete
- **Phase 2+:** 1-year retention for compliance
- **Critical Events:** Login failures, user management actions retained indefinitely

**GDPR & Data Lifecycle Management:**

**Data Minimization:**
- Only collect essential data (email, password hash, MFA secret)
- No PII stored on public landing page (system metadata only)
- No tracking cookies on public site (analytics via Vercel, server-side)

**Right to Access:**
- User can request their audit log data (Super Admin exports via Supabase dashboard)

**Right to Deletion (Right to be Forgotten):**
- User account deletion process:
  1. Super Admin marks user as `is_active: false` (soft delete)
  2. User loses CMS access immediately
  3. After 30 days: Permanently delete user record
  4. Audit logs: **Anonymize** user_id (replace with 'deleted-user-[uuid]') instead of deleting logs (preserve audit trail)

**Data Retention Summary:**
- Active user accounts: Indefinite (while employed at DxT)
- Deleted user accounts: 30-day grace period, then permanent deletion
- Audit logs: 90 days (MVP), anonymized after user deletion
- Health checks: Last 1000 per system (~7-14 days)
- Database backups: 7 days (Supabase automated)

### Subscription & Billing Model

**MVP Model:** **Free** (No Billing System)

**Business Context:**
- Zyncdata is an internal DxT tool (not a commercial product in MVP)
- No revenue model required for MVP
- Focus on product validation and adoption first

**No Billing Features in MVP:**
- ❌ No payment gateway integration
- ❌ No subscription tiers or pricing plans
- ❌ No usage metering or billing cycles
- ❌ No feature gating based on plans

**Future Considerations (Phase 3+, Year 2-3):**

If Zyncdata evolves to a commercial SaaS product:
- **Freemium Model:** Free tier (5 systems) + Paid tiers (10-50+ systems)
- **Per-System Pricing:** $5-10/system/month
- **White-Label Licensing:** One-time fee for agencies ($500-2000)
- **Enterprise Plan:** Custom pricing for large organizations

**MVP Decision:** Keep it simple - no billing complexity until product-market fit validated.

### Integration Architecture

**MVP Integration Strategy:** **Internal Only** (No External Integrations)

**Internal System Components:**
- Public landing page (frontend portal)
- CMS admin panel (protected routes)
- Database (managed PostgreSQL)
- Health monitoring service (serverless functions)
- Analytics tracking (built-in)
- Error monitoring (optional: Sentry)

**No External Integrations in MVP:**
- ❌ Slack/Teams notifications
- ❌ JIRA, GitHub, Notion
- ❌ SSO providers (Google, Microsoft login)
- ❌ Email marketing tools
- ❌ Third-party APIs
- ❌ Webhooks

**Rationale for "No Integrations" in MVP:**
- Reduce complexity and development time
- Focus on core functionality first (portal + CMS)
- DxT Team can manually check system status if needed
- Integrations can be prioritized based on user feedback post-launch

**API Architecture (Internal Only):**
- RESTful API for CMS operations (internal endpoints)
- Database API for CRUD operations
- Server-side authentication middleware
- No public API endpoints exposed

**Future Integration Roadmap (Post-MVP):**

**Phase 2 (Month 3-6):**
- Slack/Teams notifications for system outages
- Email alerts for critical events

**Phase 3 (Month 6-12):**
- Public REST API for third-party tools
- Webhooks for real-time event notifications
- SSO integration (Google, Microsoft, SAML 2.0)

### Compliance & Security Requirements

**MVP Compliance Approach:** **General Security Best Practices** (No Special Compliance Standards)

**No Regulatory Compliance Required:**
- ❌ SOC 2 Type II
- ❌ ISO 27001
- ❌ HIPAA (not healthcare)
- ❌ PCI DSS (no payment processing)
- ❌ Industry-specific certifications

**Why No Special Compliance?**
- Internal DxT tool (not handling sensitive customer data)
- No financial transactions or payment data
- Not operating in regulated industries (healthcare, finance)
- Can add compliance certifications later if Zyncdata becomes commercial product

**Mandatory Security Measures (MVP):**

**Authentication & Access Control:**
- ✅ Secure password storage (bcrypt hashed, 12+ rounds)
- ✅ **MFA (TOTP) mandatory** for all CMS users
- ✅ Role-based access control (RBAC) enforcement
- ✅ Session management (24-hour expiration, auto-logout)
- ✅ Secure password reset flow

**Application Security:**
- ✅ HTTPS with valid SSL certificate
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection (input sanitization, output encoding)
- ✅ CSRF protection (token validation)
- ✅ Rate limiting on authentication endpoints
- ✅ Security headers (CSP, X-Frame-Options, etc.)

**Data Protection:**
- ✅ Passwords never stored in plaintext
- ✅ MFA secrets encrypted at rest
- ✅ Database backups encrypted
- ✅ Minimal data collection (no unnecessary PII)

**Monitoring & Audit:**
- ✅ Audit logs for all CMS actions (who/what/when)
- ✅ Failed login attempt tracking
- ✅ Error monitoring with alerts

**Security Testing Before MVP Launch:**
- ✅ Security audit completed **2 weeks before launch**
- ✅ Penetration testing (authentication, session management, input validation)
- ✅ Vulnerability scanning
- ✅ MFA implementation thoroughly tested

**Basic Compliance Adherence:**
- ✅ GDPR considerations (minimal data collection, user consent where needed)
- ✅ WCAG AA accessibility standards (keyboard navigation, color contrast)

**Phase 2-3 Security Enhancements (Future):**
- Detailed audit logs with 1-year retention
- IP whitelisting for CMS access
- Advanced DDoS protection
- SOC 2 Type II compliance (if commercializing)

**MVP Security Philosophy:** "Secure by default, compliant when necessary."

---

## Technical Glossary

**For clarity, here are key technical terms and acronyms used throughout this document:**

### Authentication & Security Terms

**MFA (Multi-Factor Authentication)**
- Security method requiring two or more verification factors (password + authenticator app code)
- Zyncdata uses TOTP-based MFA (see below)

**TOTP (Time-based One-Time Password)**
- Algorithm generating temporary 6-digit codes that expire after 30 seconds
- Used by authenticator apps (Google Authenticator, Authy, 1Password)

**bcrypt**
- Password hashing algorithm designed to be slow (protects against brute-force attacks)
- "12 rounds" = computational complexity level (higher = slower but more secure)

**JWT (JSON Web Token)**
- Secure token format for user sessions
- Stored in httpOnly cookies (protects against XSS attacks)

**RBAC (Role-Based Access Control)**
- Permission system where users are assigned roles (Super Admin, Admin, User)
- Each role has specific permissions defining what they can/cannot do

**CSRF (Cross-Site Request Forgery)**
- Attack where malicious site tricks user into unwanted actions on trusted site
- Prevented via token validation

**XSS (Cross-Site Scripting)**
- Attack injecting malicious scripts into web pages
- Prevented via input sanitization and output encoding

### Database & Infrastructure Terms

**Supabase**
- Managed PostgreSQL database service (like Firebase but open-source)
- Includes built-in authentication, real-time subscriptions, auto-generated APIs

**PostgreSQL**
- Open-source relational database (SQL-based)
- Industry-standard for web applications

**PgBouncer**
- Connection pooler for PostgreSQL (manages database connections efficiently)
- Essential for serverless functions (Vercel) with connection limits

**Transaction Mode vs Session Mode**
- **Transaction Mode**: Short-lived connections (one transaction per connection)
- **Session Mode**: Long-lived connections (multiple transactions per connection)

**RPO (Recovery Point Objective)**
- Maximum acceptable data loss duration (e.g., 24 hours = can lose up to 1 day of data)

**RTO (Recovery Time Objective)**
- Maximum acceptable downtime duration (e.g., 4 hours = must restore within 4 hours)

### Compliance & Standards

**GDPR (General Data Protection Regulation)**
- EU privacy law protecting user data
- Key rights: access, deletion, portability, consent

**WCAG AA (Web Content Accessibility Guidelines, Level AA)**
- Accessibility standards for web content
- Requirements: keyboard navigation, color contrast, screen reader compatibility

**SOC 2 Type II**
- Security audit certification for SaaS companies
- Validates security controls over 6-12 month period

**ISO 27001**
- International information security management standard
- Not required for MVP (future consideration)

### Platform & Architecture Terms

**Single-Tenant vs Multi-Tenant**
- **Single-Tenant**: One database instance for one organization (Zyncdata's approach)
- **Multi-Tenant**: One database instance shared by multiple organizations (separate data isolation)

**Soft Delete vs Hard Delete**
- **Soft Delete**: Mark record as deleted (`enabled: false`) but keep in database (recoverable)
- **Hard Delete**: Permanently remove record from database (non-recoverable)

**Serverless Functions**
- Code that runs on-demand without managing servers
- Vercel serverless functions used for API routes and health checks

**ISR (Incremental Static Regeneration)**
- Next.js feature allowing static pages to update without full rebuild
- Enables instant content updates after CMS publish

### Development Terms

**MVP (Minimum Viable Product)**
- Phase 1 - Core features needed to validate product (months 1-2)
- Used consistently throughout this document

**Phase 2** (Post-MVP, months 3-6)
- Growth features like version history, Slack notifications, enhanced analytics

**Phase 3** (Expansion, months 6-12)
- Advanced features like public API, SSO, white-label capabilities

**API (Application Programming Interface)**
- Interface allowing systems to communicate
- Zyncdata MVP: Internal APIs only (no public API)

**REST (Representational State Transfer)**
- Architectural style for APIs using HTTP methods (GET, POST, PUT, DELETE)

**CI/CD (Continuous Integration/Continuous Deployment)**
- Automated testing and deployment pipeline
- Vercel provides built-in CI/CD for Next.js apps
## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** **Experience MVP** - Professional Portfolio Showcase + Internal Workflow Solution

**Strategic Intent:**
Zyncdata serves a dual purpose from day one:
1. **Internal Productivity Tool** - Solve Jiraw's daily bookmark hunt problem (time savings 50%+)
2. **Professional DxT Showcase** - Create impressive first impression for DxT clients and partners

This Experience MVP prioritizes both **functional utility** and **polished presentation** - it must work flawlessly AND look professional. Unlike a pure problem-solving MVP (which could be ugly but functional), Zyncdata represents DxT's brand and technical expertise to external stakeholders.

**Resource Allocation:**
- **Solo Developer:** Jiraw (full-time, 40 hours/week)
- **Timeline:** MVP launch target: **10-12 weeks realistic** (6-8 weeks optimistic, see risk mitigation)
- **Skills Required:** Full-stack (Next.js, React, Supabase, Vercel deployment)
- **External Dependencies:** Supabase (managed DB + Auth), Vercel (hosting), Sentry (optional error monitoring)
- **Backup Admin:** To be designated by Week 5 (DxT Team member for emergency coverage)

**Success Threshold:**
MVP is successful when:
- ✅ Jiraw uses zyncdata.app as daily starting point (5+ days/week)
- ✅ External viewers (DxT clients/partners) rate it 4+ stars (professional impression)
- ✅ DxT Team can self-service add/edit systems within 10 minutes
- ✅ Security audit passed 2 weeks before launch

**MVP Philosophy Statement:**
*"Ship a polished, professional tool that solves a real problem immediately while showcasing DxT's technical excellence. Functional AND beautiful."*

---

### MVP Feature Set (Phase 1: Months 1-2)

**Timeline:** 6-8 weeks to MVP launch

**Core User Journey Supported:**
- **Journey 1: Jiraw's Morning Ritual** - Single portal access to all 5 client systems (TINEDY, VOCA, ENEOS, rws, BINANCE) with real-time health indicators

**Must-Have Capabilities (Non-Negotiable):**

All 5 core deliverables are essential and cannot be cut:

#### **1. Public Landing Page (zyncdata.app)**
**Why Essential:** This IS the product - the portal that users interact with daily
- Portfolio cards for 5 systems (expandable to 10+)
- One-click redirect to subdomains
- Real-time system status indicators (🟢 Online / 🔴 Offline)
- DxT AI branding (colors: #41B9D5, #5371FF, fonts: Nunito)
- Responsive design (desktop, mobile, tablet)
- Accessibility: Keyboard navigation + WCAG AA color contrast
- Performance: < 0.5s cached load, < 2s first load

#### **2. CMS Platform**
**Why Essential:** DxT Team must manage content independently (no developer dependency)

**Priority 1: System Management** (Critical)
- Add/edit/delete systems (portfolio items)
- Reorder systems (drag-and-drop or numeric order)
- Enable/disable system visibility
- Upload logos, edit URLs, descriptions
- Error recovery: undo/edit mistakes within 2 minutes

**Priority 2: Content Editor** (Important)
- Edit hero section (title, subtitle, description)
- Edit intro text (about DxT, platform purpose)
- Edit footer content (contact, copyright)
- Rich text editor (WYSIWYG for non-technical users)

**Priority 3: Theme & Branding** (Professional Polish)
- Color scheme selection (DxT AI palette + alternatives)
- Font settings (Nunito primary + fallbacks)
- Logo upload/replacement

**All Priorities Include:**
- Preview mode (see changes before publish)
- Publish button (instant updates, no downtime)
- Confirmation dialogs (prevent accidental deletions)
- Self-explanatory UI (no training required)

#### **3. Authentication & Security**
**Why Essential:** CMS must be secure - mandatory requirement, no compromise
- Username/Password authentication (bcrypt hashed, 12+ rounds)
- **MFA (TOTP) mandatory** for all CMS users (Google Authenticator, Authy)
  - **Implementation approach:** Supabase Auth plugin with TOTP (recommended - saves 2-3 weeks vs custom)
  - Alternative: Custom implementation using otplib (if Supabase Auth insufficient)
  - QR code generation for setup
  - 6-digit code validation on login
  - Backup codes (8 single-use codes)
  - Comprehensive testing (signup, login, timeout, errors)
- Session management (24-hour expiration, 2-hour inactivity logout)
- Role-based access control (Super Admin, Admin, User)
- Security audit **2 weeks before MVP launch** (non-negotiable gate)

#### **4. Analytics & Monitoring Dashboard**
**Why Essential:** Proactive issue detection - core value proposition for "Jiraw's Morning Ritual" journey
- Real-time system health status (🟢/🔴 indicators)
- Response time tracking per system (milliseconds)
- Health check frequency: every 60 seconds
- Failure threshold: 3 consecutive failures = offline
- Last checked timestamp (how fresh is the data?)
- Overall summary (e.g., "5/5 Online, 0/5 Offline")
- **Auto-refresh dashboard every 30-60 seconds** (kept in MVP, cuttable if timeline slips)
- Alerting for critical issues (Phase 2: Slack/email alerts)

**Note:** Auto-refresh is low-complexity (5-10 lines of code) but can be cut if timeline slips - manual refresh button sufficient for MVP.

#### **5. Operations & Maintenance**
**Why Essential:** Production readiness - must be able to recover from disasters
- Automated daily backups (Supabase managed, 7-day retention)
- Tested restore procedure (quarterly drill required)
- Rollback plan documented and ready (Vercel one-click + DB restore)
- Monitoring & alerting configured (Vercel Analytics, Sentry)
- RPO: 24 hours (max data loss acceptable)
- RTO: 4 hours (max downtime acceptable)

**MVP Exclusions (Deferred to Phase 2+):**
- ❌ Version history & content rollback UI (manual DB restore only in MVP)
- ❌ Staging environment (preview mode sufficient for MVP)
- ❌ Multiple CMS users beyond Jiraw + 2-5 DxT Team (scales in Phase 2)
- ❌ Historical analytics (real-time only in MVP, no trend graphs)
- ❌ Advanced monitoring (uptime %, performance graphs over time)
- ❌ Email/Slack notifications (manual dashboard check in MVP)

---

### Post-MVP Features

**Phase 2: Growth & Self-Service (Months 3-6)**

**Focus:** Enhance DxT Team independence and introduce external viewers

**Key Features:**
- **Version History & Rollback** - UI-based undo for CMS changes (no DB restore needed)
- **Staging Environment** - Test changes safely before publishing to production
- **Multiple CMS Users** - Expand beyond initial 5 users, refined role permissions
- **Historical Analytics** - Trend graphs, uptime percentages, performance over time
- **Enhanced Monitoring** - Slack/Teams notifications for system outages
- **Email Alerts** - Critical events sent to Super Admin automatically
- **Advanced System Management** - Bulk operations, system tagging, search/filter
- **Mobile-Responsive CMS** - Manage content from mobile devices

**Success Metrics (Phase 2):**
- DxT Team adds new systems without developer help (80%+ independence validated)
- Zero critical bugs in production for 30+ days
- Historical data shows consistent uptime (99%+ target)

---

**Phase 3: Platform Expansion (Months 6-12)**

**Focus:** External integrations, API access, and scalability for commercial viability

**Key Features:**
- **True SSO Implementation** - SAML 2.0, OAuth 2.0 (Google, Microsoft login)
- **Public REST API** - Allow third-party tools to integrate with Zyncdata
- **Webhooks** - Real-time event notifications to external systems
- **API Rate Limiting** - Throttle requests, authentication keys for API consumers
- **Slack/Teams Integration** - Bidirectional (notifications IN, commands OUT)
- **Advanced Customization** - Custom CSS, JavaScript hooks, plugin system
- **Bulk Operations** - CSV import/export for systems, batch updates
- **Enhanced Security** - IP whitelisting, advanced audit logs, SOC 2 readiness
- **Performance Optimization** - Multi-region deployment, CDN, caching strategies
- **White-Label Preparation** - Custom branding per tenant (if multi-tenant pivot)

**Success Metrics (Phase 3):**
- Platform handles 50+ systems with no performance degradation
- External API consumers actively using webhooks/REST API
- Commercial readiness validated (pricing model tested, SOC 2 in progress)

---

**Vision: Long-Term Transformation (Year 2+)**

**Platform Evolution Roadmap:**
- **Year 1:** Internal DxT tool → Professional portfolio showcase ✅
- **Year 2:** Simple portal → Full enterprise platform (SSO, API, integrations)
- **Year 3:** DxT-only → Potential SaaS product for other agencies/companies
- **Year 5:** 5 systems → Unlimited scalability, white-label offering

**Advanced Capabilities (Year 2-3+):**
- **AI-Powered Insights** - Usage pattern analysis, anomaly detection, predictive alerts
- **White-Label Solution** - Agencies can rebrand Zyncdata as their own product
- **Ecosystem Integrations** - JIRA, GitHub, Notion, Confluence, Linear, etc.
- **Advanced Analytics** - Heatmaps, user journey tracking, conversion funnels
- **Mobile App** - iOS/Android native apps for on-the-go system access
- **Multi-Language Support** - Thai, English, plus 5+ additional languages
- **Enterprise Features** - Custom SLAs, dedicated support, compliance certifications

**Market Positioning (Future):**
- **Target:** Digital agencies, consultancies, MSPs managing 10-100+ client systems
- **Pricing Model:** Freemium (5 systems free) → Pro ($50-100/month for unlimited) → Enterprise (custom)
- **Differentiation:** Beautiful UX + powerful CMS + real-time monitoring in one platform

---

### Risk Mitigation Strategy

**Primary Risks Identified:**
1. **Technical Complexity** (MFA, Health Monitoring)
2. **Solo Developer Burnout**
3. **Scope Creep**
4. **Adoption Risk** (Jiraw doesn't use it daily)

---

#### **1. Technical Risks: MFA Implementation & Health Monitoring**

**Risk Details:**
- MFA (TOTP) is complex: QR code generation, authenticator app integration, backup codes, session management, error handling
- Health monitoring at scale: 5 systems × 60-second intervals = managing concurrent checks, retry logic, status tracking
- Security vulnerabilities: Authentication is high-risk surface area (XSS, CSRF, session hijacking)

**Mitigation Strategies:**

**MFA Implementation:**
- ✅ **Primary approach:** Supabase Auth with TOTP plugin (managed service, saves 2-3 weeks)
  - Pros: Battle-tested, maintained by Supabase, handles edge cases
  - Cons: Less customization flexibility
  - Timeline: 1 week integration + 1 week testing = 2 weeks total
- ✅ **Alternative:** Custom implementation using `otplib` + `qrcode` libraries (if Supabase Auth insufficient)
  - Pros: Full control, customizable UX
  - Cons: More development time (3-4 weeks), more edge cases to handle
  - Timeline: 2 weeks implementation + 1-2 weeks testing = 3-4 weeks total
- ✅ Follow OWASP authentication best practices (don't reinvent crypto)
- ✅ Comprehensive testing plan (signup, login, timeout, error scenarios documented in PRD)
- ✅ Security audit 2 weeks before launch (external penetration testing)
- ✅ Gradual rollout: Jiraw tests first, then DxT Team, then declare MVP ready

**Health Monitoring Complexity:**
- ✅ Start simple: HTTP HEAD requests with 10-second timeout (no fancy checks)
- ✅ Use serverless cron jobs (Vercel Cron) - no complex infrastructure
- ✅ Exponential backoff for retries (avoid hammering failing systems)
- ✅ Database pruning: keep last 1000 checks per system (prevent data bloat)
- ✅ Phase 2 enhancement: add advanced monitoring (uptime %, alerting) after MVP validated

**De-Risking Timeline:**
- **Week 1-2:** Setup Next.js + Supabase Auth integration
- **Week 3-4:** CMS core features (system management, content editor)
- **Week 5-6:** Health monitoring + analytics dashboard
- **Week 7-8:** MFA integration (Supabase Auth TOTP plugin - 1 week) + testing (1 week)
- **Week 9-10:** Security audit (external consultant) + fix findings
- **Week 11-12:** Launch prep (operations, UAT, buffer for issues)

**Backup Plan:**
If Supabase Auth TOTP plugin proves insufficient:
- **Option A:** Custom MFA using otplib (extend timeline by 1-2 weeks)
- **Option B:** Launch without MFA (IP whitelist only), add MFA in Phase 2

**Decision Rule:** Evaluate Supabase Auth by Week 7 - if insufficient, decide Option A or B immediately.

---

#### **2. Resource Risks: Solo Developer Constraints**

**Risk Details:**
- Solo dev (Jiraw) = single point of failure
- 40 hours/week is aggressive (burnout risk after 6-8 weeks)
- Skill gaps: Security expertise, MFA implementation, production operations
- Context switching: Jiraw also managing 5 client systems (DxT operations)

**Mitigation Strategies:**

**Time Management:**
- ✅ **Strict MVP scope** - No feature creep allowed (5 deliverables only)
- ✅ **Weekly check-in protocol** (Friday self-assessment: Did I use it? Did it save time? Worth continuing?)
- ✅ **2-week pivot rule** - If answering "No" to check-in for 2 weeks straight, pivot or kill project
- ✅ **Leading indicators** - If Week 1 < 2 days usage, investigate immediately

**Skill Gap Mitigation:**
- ✅ Use managed services (Supabase for DB, Vercel for hosting) - reduce DevOps burden
- ✅ Leverage proven libraries (NextAuth.js or otplib for MFA) - don't build from scratch
- ✅ External security audit (hire consultant if needed) - validate implementation
- ✅ Documentation first (write down what should happen before coding) - clarifies complexity

**Burnout Prevention:**
- ✅ Phased approach: Week 1-2 foundation, Week 3-4 core features, Week 5-6 polish, Week 7-8 security/launch
- ✅ Take 1 day off per week (Saturday/Sunday) - maintain sustainable pace
- ✅ Celebrate milestones (Week 3: basic portal works, Week 5: MFA works, Week 8: MVP shipped!)

**Backup Plan:**
If Jiraw unavailable (sick, emergency):
- **Backup Super Admin** designated from DxT Team by Week 5 (TBD - specific person to be named)
  - Week 5 milestone: Designate backup admin, grant Supabase + Vercel access
  - Week 7 milestone: Train backup on disaster recovery procedures (DB restore, Vercel rollback)
  - Week 9 milestone: Backup runs disaster recovery drill (validates they can execute)
- **Code documented** in README (how to deploy, rollback, restore DB)
- **Vercel auto-deploy** from Git (push code = instant deploy, no manual steps)
- **1-page emergency runbook** - "If system down, do this" (DB restore, Vercel rollback, Supabase logs)

**Expansion Readiness (Post-MVP):**
- Phase 2: Hire contractor or junior dev to help with Phase 2 features
- Phase 3: Build small team (2-3 people) if commercial viability proven

---

#### **3. Market Risks: Adoption & Habituation**

**Risk Details:**
- Primary user (Jiraw) might not actually use zyncdata.app daily despite building it
- DxT Team might ignore CMS, ask Jiraw to make changes anyway (defeating self-service goal)
- External viewers (DxT clients) might not care about portfolio showcase
- "Field of Dreams" fallacy: "If you build it, they will come" (not always true)

**Mitigation Strategies:**

**Jiraw Adoption (Critical Success Factor):**
- ✅ **Forcing function:** Set zyncdata.app as browser homepage (day 1)
- ✅ **Weekly check-in** (Friday ritual) - publicly commit to self-assessment
- ✅ **Leading indicator tracking** - Week 1 must show 3+ days usage (early warning)
- ✅ **Pivot trigger** - 2 consecutive weeks of "No" to "Did I use it?" = re-evaluate immediately

**DxT Team Self-Service:**
- ✅ **Onboarding session** (30 minutes) - show CMS, walk through add/edit system flow
- ✅ **First success** - Each team member adds 1 test system successfully (hands-on training)
- ✅ **Measure independence** - Track how often team asks Jiraw for help (target: < 20%)
- ✅ **Feedback loop** - If team still asks for help, fix UX issues (make CMS more obvious)

**External Validation:**
- ✅ **Manual outreach** - Send zyncdata.app link to 5 DxT clients within Week 1 post-launch
- ✅ **Feedback form** - Simple 5-star rating + "What do you think?" text box
- ✅ **Target:** 4+ stars from 5+ external viewers (validates professional impression goal)
- ✅ **Iterate based on feedback** - If rating < 4 stars, understand why and fix in Phase 2

**De-Risking Strategy:**
- **Assumption:** Jiraw WILL use it (solving real pain point)
- **Validation:** Week 1-3 usage data (leading indicators)
- **Pivot Option:** If Jiraw doesn't use it, repurpose as pure showcase tool (no CMS/monitoring needed)

---

#### **4. Scope Creep Risks: Feature Bloat**

**Risk Details:**
- MVP already has 5 major deliverables (non-negotiable scope is large)
- Temptation to add "just one more thing" (Slack alerts, email notifications, version history)
- Each added feature = 1-2 weeks delay
- Solo dev vulnerable to gold-plating (perfectionism vs shipping)

**Mitigation Strategies:**

**Strict MVP Boundaries:**
- ✅ **Written MVP contract** - 5 deliverables documented in PRD (this document)
- ✅ **"No" by default** - Any new feature idea goes to Phase 2 backlog (not MVP)
- ✅ **Stakeholder alignment** - DxT Team aware: MVP = basic but functional, polish comes later
- ✅ **Definition of Done** - Each deliverable has clear acceptance criteria (documented in PRD)

**Weekly Scope Review:**
- ✅ **Friday check-in includes scope check** - "Did I add anything not in MVP?"
- ✅ **Penalty for scope creep** - If Week 5 arrives and MVP not 80% done, cut Priority 3 features (Theme & Branding)
- ✅ **Ship incomplete over perfect** - If Week 8 arrives, ship whatever works (Phase 2 fixes bugs)

**Decision Framework for New Ideas:**
- **Ask:** Does this block MVP success criteria? (If No → Phase 2)
- **Ask:** Can users work around this manually? (If Yes → Phase 2)
- **Ask:** Does this take > 2 days to build? (If Yes → Phase 2)

**Emergency Scope Cut Options (if timeline slips):**
- **Auto-refresh dashboard** - Replace with manual refresh button (saves 1-2 hours, low impact)
- **CMS rich text editor** - Use plain textarea instead of WYSIWYG (saves 4-8 hours)
- **System reordering UI** - Hardcode display order in database (add drag-and-drop in Phase 2)

**Protected (DO NOT CUT):**
- ✅ **Theme & Branding** - Core to Experience MVP (DxT brand showcase)
- ✅ **System Management** - Core CMS functionality
- ✅ **MFA Security** - Non-negotiable security requirement

**Rule:** Better to ship 80% of 5 features than 100% of 3 features (portfolio showcase needs completeness).

---

### Development Timeline & Milestones

**Estimated MVP Timeline: 10-12 weeks (Solo, Full-Time) - Agile Sprint Plan**

**Sprint Structure:** 5 × 2-week sprints + buffer

---

#### **Sprint 1 (Weeks 1-2): Foundation Sprint**

**Goal:** Deployable static landing page + empty CMS shell

**User Stories:**
- Setup Next.js project + Vercel deployment (4 hours)
- Create Supabase database schema (5 core tables) (8 hours)
- Build static landing page with 5 hardcoded systems (16 hours)
- Basic authentication scaffold (username/password, no MFA) (16 hours)
- Deploy to Vercel (production + preview environments) (4 hours)
- **Total:** ~48 hours (2 weeks, 24 hrs/week accounting for planning/meetings)

**Definition of Done:**
- ✅ Can visit zyncdata.app and see 5 hardcoded systems
- ✅ Can log into empty CMS with username/password
- ✅ Vercel auto-deploy from Git working

**Sprint Review:** Demo static landing page + login to DxT Team

---

#### **Sprint 2 (Weeks 3-4): CMS Core Sprint**

**Goal:** Can add/edit/delete systems via CMS, landing page updates dynamically

**User Stories:**
- System Management CRUD (Create/Read/Update/Delete) (20 hours)
- Landing page pulls from Supabase database (8 hours)
- Preview mode (client-side simulation) (12 hours)
- Publish button (instant update, cache invalidation) (8 hours)
- **Total:** ~48 hours

**Definition of Done:**
- ✅ Can add/edit/delete systems via CMS
- ✅ Landing page shows systems from database
- ✅ Preview before publish works
- ✅ Publish button updates production instantly

**Sprint Review:** Demo full system management workflow to DxT Team, get feedback on UX

---

#### **Sprint 3 (Weeks 5-6): Content + Monitoring Sprint**

**Goal:** Can edit landing page content + see real-time system health

**User Stories:**
- Content Editor (hero, intro, footer sections) (12 hours)
- Health check service (HTTP requests, 60s cron job) (16 hours)
- Status indicators (🟢/🔴 on landing page + dashboard) (12 hours)
- Theme & Branding settings (colors, fonts, logo upload) (8 hours)
- **Total:** ~48 hours

**Key Milestone:** **Designate backup admin (TBD)** - grant Supabase + Vercel access

**Definition of Done:**
- ✅ Can edit all landing page content via CMS
- ✅ Health checks running every 60 seconds
- ✅ Dashboard shows real-time status (with auto-refresh)
- ✅ Can customize DxT branding (colors, fonts, logo)
- ✅ Backup admin designated and granted access

**Sprint Review:** Demo full CMS functionality to DxT Team, backup admin observes

---

#### **Sprint 4 (Weeks 7-8): Security Sprint**

**Goal:** MFA working, security audit passed

**User Stories:**
- Integrate Supabase Auth with TOTP plugin (16 hours)
- MFA setup flow (QR code, authenticator app pairing) (8 hours)
- MFA login flow (6-digit code validation, backup codes) (8 hours)
- Comprehensive MFA testing (signup, login, errors) (8 hours)
- Security audit prep (fix known vulnerabilities) (8 hours)
- **Total:** ~48 hours

**Key Milestone:** **Train backup admin** on disaster recovery (DB restore, Vercel rollback)

**Definition of Done:**
- ✅ MFA (TOTP) working end-to-end
- ✅ All MFA test scenarios pass
- ✅ Ready for external security audit
- ✅ Backup admin trained on emergency procedures

**Sprint Review:** Demo MFA flow to DxT Team, backup admin validates training

---

#### **Sprint 5 (Weeks 9-10): Security Audit + Launch Prep**

**Goal:** External audit passed, production-ready, DxT Team trained

**User Stories:**
- External security audit (consultant review, 8-16 hours consultant time)
- Fix audit findings (critical bugs, vulnerabilities) (16 hours buffer)
- Operations setup (automated backups, rollback tested) (8 hours)
- Seed initial 5 systems into database (4 hours)
- DxT Team onboarding session (show CMS, hands-on practice) (4 hours)
- User acceptance testing (DxT Team finds bugs) (8 hours)
- **Total:** ~48 hours

**Key Milestone:** **Backup admin runs disaster recovery drill** (validates procedures work)

**Definition of Done:**
- ✅ Security audit passed (no critical findings)
- ✅ All audit findings resolved
- ✅ Automated backups configured and tested
- ✅ 5 systems seeded into production database
- ✅ DxT Team trained and comfortable with CMS
- ✅ Backup admin successfully executes disaster recovery drill

**Sprint Review:** Final demo to DxT Team, collect feedback, prepare for launch

---

#### **Weeks 11-12: Launch + Firefighting Buffer**

**Goal:** Production launch, monitor for issues, quick fixes

**Activities:**
- Production launch (Go-Live) (4 hours)
- Monitor system health for first 48 hours (8 hours)
- Quick bug fixes from real-world usage (16 hours buffer)
- Post-launch retrospective (what went well, what didn't) (2 hours)
- Weekly check-in #1 (Friday Week 11): Did Jiraw use it? Did it save time?

**Definition of Done:**
- ✅ Zyncdata.app live in production
- ✅ Jiraw using it as daily starting point (leading indicator)
- ✅ DxT Team able to manage systems independently
- ✅ Zero critical production issues

---

### Agile Discipline (Solo Dev Edition)

**Daily Practices:**
- **5-minute morning standup (solo):** What did I do yesterday? What will I do today? Any blockers?
- **Track actual hours per story:** Compare estimates vs reality (adjust next sprint)

**Bi-Weekly Practices:**
- **Friday Sprint Review:** Demo working features to DxT Team (15-30 minutes)
- **Friday Sprint Retrospective:** What went well? What slowed me down? (10 minutes)
- **Friday Weekly Check-In** (Week 11+): Did I use zyncdata.app? Did it save time? Worth continuing?

**Velocity Tracking:**
- Sprint 1 baseline: Track actual hours for each story
- Sprint 2+ adjustments: If stories consistently take 1.5x estimates, add 50% buffer to Sprint 3+

**Benefits of Sprint Structure:**
- ✅ Clear 2-week milestones (prevents "surprised at Week 6")
- ✅ Early feedback from DxT Team (course-correct UX issues early)
- ✅ Realistic progress tracking (velocity-based estimates)
- ✅ Buffer week at end (handles inevitable firefighting)

---

**Contingency Options:**

**If Timeline Slips 2+ Weeks:**
- Cut auto-refresh dashboard (replace with manual refresh button)
- Cut WYSIWYG editor (use plain textarea)
- Extend Sprint 5 by 1 week (delay launch to Week 13)

**If MFA Takes Longer Than Expected:**
- Week 7 decision point: Evaluate Supabase Auth TOTP plugin
- If insufficient: Switch to custom otplib implementation (extend timeline by 1-2 weeks)
- Nuclear option: Launch without MFA (IP whitelist only), add MFA in Phase 2

**Total Realistic Timeline: 12 weeks (3 months) to production-ready MVP**

---

### Success Criteria Alignment

**This scoping strategy directly supports the PRD Success Criteria:**

**User Success:**
- ✅ **Jiraw's Daily Driver** - MVP enables Week 1 adoption (leading indicator: 3+ days/week)
- ✅ **50% Time Savings** - Portal reduces 1-2 min navigation to 30-60 sec
- ✅ **DxT Team Self-Service** - CMS Priority 1-2 features enable 10-minute system additions

**Business Success:**
- ✅ **Professional Image** - Experience MVP prioritizes polished UI (DxT branding, WCAG AA)
- ✅ **Portfolio Showcase** - Landing page displays 5 systems with logos, descriptions
- ✅ **Operational Efficiency** - Health monitoring reduces manual system checks

**Technical Success:**
- ✅ **Performance** - < 0.5s cached, < 2s first load (Next.js optimized, Vercel CDN)
- ✅ **Security** - MFA mandatory, security audit gate before launch
- ✅ **Reliability** - 99.9% uptime target (Vercel SLA + backup/rollback ready)

**MVP Success Validation:**
- ✅ Weekly check-in protocol tracks adoption (leading indicators)
- ✅ External validation (4+ stars from 5+ viewers)
- ✅ 2-week pivot rule prevents wasted effort on unused product

---

### Key Takeaways

**Strategic Decisions Made:**
1. ✅ **Experience MVP** - Functional + Beautiful (represents DxT brand)
2. ✅ **Non-Negotiable Scope** - All 5 deliverables essential, no cuts
3. ✅ **Solo Developer, Full-Time** - 40 hrs/week, 6-8 week timeline
4. ✅ **Primary Risk: Technical Complexity** - Mitigated via managed services, proven libraries, external audit

**MVP Philosophy:**
*"Ship a polished, professional tool that solves a real problem immediately while showcasing DxT's technical excellence."*

**What Makes This Scope Viable:**
- Clear boundaries (5 deliverables, no more)
- Managed services reduce DevOps burden (Supabase, Vercel)
- Weekly check-ins prevent wasted effort (pivot or kill if not used)
- Security audit gate ensures production readiness
- Phase 2-3 roadmap preserves long-term vision without bloating MVP

**Next Steps After MVP:**
- Week 1 post-launch: Validate adoption (Jiraw usage, DxT Team feedback, external ratings)
- Month 2-3: Iterate based on feedback, fix bugs, enhance UX
- Month 3+: Phase 2 features (version history, Slack alerts, staging environment)
## Functional Requirements

### Terminology Clarifications

**User Types:**
- **Visitors:** Unauthenticated public users who access the landing page
- **CMS Users:** Authenticated users with roles (Super Admin, Admin, User)
- **Username:** Refers to email address used for authentication

---

### User Management & Authentication

**FR1:** Users can register for CMS access with email and password
**FR2:** Users can log in to the CMS with email and password
**FR3:** Users can set up Multi-Factor Authentication (MFA) using authenticator apps
**FR4:** Users can authenticate login using codes from authenticator apps
**FR5:** Users can generate and store backup codes for MFA recovery
**FR6:** Users can use backup codes to authenticate when authenticator app is unavailable
**FR7:** Users can log out of the CMS
**FR8:** System can enforce role-based permissions (Super Admin, Admin, User)
**FR9:** Super Admin can create new CMS user accounts
**FR10:** Super Admin can delete CMS user accounts
**FR11:** Super Admin can assign or change user roles
**FR12:** Super Admin can reset user passwords
**FR13:** System can track user login history and last login timestamp
**FR14:** System can disable user accounts without deleting them

### System Portfolio Management

**FR15:** Admins can add new systems to the portfolio with name, URL, logo, and description
**FR16:** Admins can edit existing system information (name, URL, logo, description)
**FR17:** Admins can delete systems from the portfolio with confirmation
**FR18:** Admins can reorder systems to change display sequence on landing page
**FR19:** Admins can enable or disable system visibility on the landing page
**FR20:** Admins can upload system logos
**FR20a:** Admins can delete or replace system logos
**FR21:** Visitors can view all enabled systems on the public landing page
**FR22:** Visitors can click on system cards to redirect to the respective system URL
**FR23:** Visitors can see current health status indicators for each system (online/offline)

### Content & Branding Management

**FR24:** Admins can edit hero section content (title, subtitle, description)
**FR25:** Admins can edit intro section content (about DxT, platform purpose)
**FR26:** Admins can edit footer content (contact information, copyright)
**FR27:** Admins can customize color schemes using predefined DxT AI palette
**FR28:** Admins can select font styles for landing page typography
**FR29:** Admins can upload and replace the platform logo
**FR30:** Admins can preview all CMS changes before publishing
**FR31:** Admins can publish CMS changes to make them live on the public landing page
**FR32:** Visitors can view published landing page content with DxT branding
**FR68:** Admins can manage platform favicon
**FR71:** Admins can preview changes across different device sizes

### Health Monitoring & Analytics

**FR33:** System can automatically check health status of all portfolio systems at regular intervals
**FR34:** System can detect system failures based on consecutive check failures
**FR35:** System can track response times for each system health check
**FR36:** System can store historical health check data for trend analysis
**FR37:** Admins can view real-time system health dashboard showing all system statuses
**FR38:** Admins can view response time metrics for each system
**FR39:** Admins can view last checked timestamps for all systems
**FR40:** Admins can view overall summary statistics (e.g., "5/5 Online")
**FR41:** Dashboard can auto-refresh to display latest health data without manual reload
**FR64:** System can notify Admins when health checks fail
**FR65:** Admins can configure health check intervals per system
**FR66:** Admins can set health check timeout thresholds per system
**FR67:** Admins can set failure count threshold before marking system offline

### CMS Administration

**FR42:** Admins can access a protected CMS admin panel
**FR43:** System can restrict CMS access to authenticated users with appropriate roles
**FR45:** System can provide confirmation dialogs for destructive actions (delete, publish)
**FR46:** Admins can recover from mistakes by editing changes
**FR47:** System can log all CMS actions for audit trail purposes
**FR69:** System can display success confirmation messages after Admin actions
**FR70:** System can display clear error messages when operations fail
**FR72:** System can display loading states during operations
**FR73:** System can display empty states when no data exists
**FR74:** System can maintain version history of content changes

### Security & Audit

**FR48:** System can log all authentication events (login success/failure, logout, MFA setup)
**FR49:** System can log all system management actions (create, update, delete, reorder)
**FR50:** System can log all content editing actions (hero, intro, footer changes)
**FR51:** System can log all publish actions with timestamp and user information
**FR52:** System can log user management actions (create user, delete user, role changes)
**FR53:** Super Admin can view audit logs showing user actions with timestamps and details
**FR54:** System can retain audit logs for a configurable period
**FR55:** System can track IP addresses for security-relevant actions

### Operations & Maintenance

**FR56:** System can perform automated daily database backups
**FR57:** Super Admin can manually trigger database backups before major changes
**FR58:** Super Admin can restore database from backup when needed
**FR59:** Super Admin can rollback to previous deployment if issues occur
**FR60:** System can detect critical errors and alert Super Admin
**FR60a:** System can monitor application performance metrics
**FR61:** System can track application errors and performance metrics
**FR62:** Super Admin can access system configuration settings
**FR63:** Super Admin can manage health check intervals and thresholds

---

**Total Functional Requirements: 74 FRs across 7 capability areas**

**Coverage Summary:**
- ✅ All 5 MVP deliverables covered (Landing Page, CMS, Auth, Analytics, Operations)
- ✅ User journeys (Jiraw's Morning Ritual) capabilities included
- ✅ RBAC requirements (Super Admin, Admin, User roles) defined
- ✅ Security & compliance capabilities (audit logging, MFA) specified
- ✅ Health monitoring with notification & per-system configuration
- ✅ User feedback (success/error messages, loading/empty states)
- ✅ Experience MVP enhancements (mobile preview, favicon, version history)
- ✅ Implementation-agnostic (no technology details, no UI specifics)
- ✅ Testable (each FR can be verified as exists/doesn't exist)

**Capability Contract:** These 74 FRs define EVERY capability that will exist in Zyncdata MVP. Any feature not listed here will not be implemented unless explicitly added to this list.
## Non-Functional Requirements

Non-functional requirements define **how well** the system must perform. These quality attributes ensure Zyncdata delivers a professional, secure, and reliable experience.

---

### Performance

**NFR-P1:** Landing page initial load time must be less than 2 seconds
**NFR-P2:** Dashboard page load time must be less than 3 seconds
**NFR-P3:** CMS save and edit operations must complete within 1 second
**NFR-P3a:** CMS publish operations must complete within 3 seconds
**NFR-P4:** Health check response time per system must be less than 5 seconds
**NFR-P5:** System must support 5-7 concurrent CMS users without performance degradation
**NFR-P6:** Auto-refresh operations must complete within 3 seconds
**NFR-P7:** Error messages must appear within 500ms of operation failure
**NFR-P8:** Loading indicators must appear within 200ms of operation start
**NFR-P9:** Mobile landing page load time must be less than 3 seconds on 4G connection
**NFR-P10:** System must handle rate limits gracefully when performing health checks at scale (10+ systems with frequent check intervals)

**Rationale:** Fast response times are critical for user success. Slow performance leads to user frustration, direct bookmark usage instead of landing page adoption, and failure to meet Success Criteria (50%+ time savings). Mobile performance ensures accessibility for end users on various devices.

---

### Security

**NFR-S1:** User passwords must be hashed using Supabase Auth platform defaults (bcrypt-compatible algorithm)
**NFR-S2:** MFA secrets must be encrypted at rest using platform-managed encryption
**NFR-S3:** Session tokens must expire after 24 hours of inactivity
**NFR-S4:** All API endpoints must validate user permissions based on RBAC matrix
**NFR-S5:** System must leverage Supabase Auth rate limiting for login attempts to prevent brute force attacks
**NFR-S6:** All sensitive data transmission must use HTTPS/TLS 1.3 or higher
**NFR-S7:** Audit logs must be tamper-proof (append-only, no deletion capability)
**NFR-S8:** All user-generated content fields must pass OWASP XSS filter tests to prevent XSS and SQL injection attacks

**Rationale:** Security is foundational for a system managing authentication, system access, and audit trails. These requirements protect sensitive data while acknowledging that Supabase Auth manages core authentication security (password hashing, MFA encryption, rate limiting). Requirements focus on what the application controls directly.

---

### Reliability

**NFR-R1:** System design must target 99.0% uptime per month leveraging Vercel and Supabase platform SLAs (approximately 7.2 hours downtime per month)
**NFR-R2:** Health monitoring must detect actual system failures with ≥ 95% accuracy (testing strategy: maintain known-bad test endpoint for validation)
**NFR-R3:** System must automatically recover from transient network and connection failures within 5 minutes
**NFR-R4:** Manual recovery from critical failures must complete within 1 hour (RTO - Recovery Time Objective, assumes Jiraw or trained backup admin available)
**NFR-R5:** Database backups must be restorable within 4 hours (RPO - Recovery Point Objective: maximum 24 hours data loss)
**NFR-R6:** Health check failures must trigger admin notifications within 1 minute
**NFR-R8:** System must deliver failure notifications via email to designated admin email addresses

**Rationale:** As a health monitoring platform, Zyncdata itself must be reliable. When system is down, Jiraw cannot monitor system health, DxT Team cannot manage CMS, and end users cannot access the landing page. 99% uptime target acknowledges dependency on platform SLAs (Vercel + Supabase). Email notifications ensure admins are alerted even when dashboard is inaccessible.

---

### Scalability

**NFR-SC1:** System must support up to 10 systems in portfolio without performance degradation
**NFR-SC2:** System must support up to 50 concurrent end users on landing page without performance degradation
**NFR-SC3:** Database must handle 100,000 health check records before requiring optimization
**NFR-SC4:** System architecture must allow horizontal scaling when needed (future-proof design)

**Rationale:** Success Criteria states system must support "10+ systems in portfolio." These baseline scalability requirements ensure MVP can handle initial load and provide headroom for growth. Conservative estimates allow for future expansion without over-engineering MVP. Vercel + Supabase architecture provides built-in horizontal scaling capabilities.

---

### User Experience (UX)

**NFR-UX1:** All pages must render correctly across Chrome, Firefox, and Safari (latest 2 versions of each)
**NFR-UX2:** Mobile responsive design must maintain usability on screens ≥ 375px width (iPhone SE minimum)
**NFR-UX3:** Admin must be able to add new system to portfolio in less than 10 minutes (measured via user testing)

**Rationale:** Experience MVP requires professional polish and cross-browser/device compatibility. NFR-UX3 directly supports Success Criteria ("DxT Team can add system in < 10 minutes"). Browser and mobile compatibility ensure broad accessibility for end users and CMS admins.

---

### Testing & Quality

**NFR-T1:** Critical paths (authentication, RBAC enforcement, health checks) must have ≥ 80% automated test coverage
**NFR-T2:** Deployments must pass smoke tests (landing page loads, CMS login succeeds, health check executes) before marking as successful

**Rationale:** For a 10-12 week MVP with security and authentication components, automated testing is essential for safe iteration. 80% coverage for critical paths balances quality with development speed. Smoke tests prevent broken deployments from reaching production.

---

**Total Non-Functional Requirements: 33 NFRs across 6 quality attributes**

**Quality Attribute Selection Rationale:**
- **Performance:** Critical for user adoption and Success Criteria achievement (expanded to include mobile and UX timing)
- **Security:** Fundamental for authentication, MFA, RBAC, and audit system (aligned with Supabase Auth capabilities)
- **Reliability:** Essential for health monitoring platform credibility (realistic targets acknowledging platform dependencies)
- **Scalability:** Baseline requirements to support Success Criteria (10+ systems)
- **User Experience:** Experience MVP polish requirements (browser compatibility, mobile responsive, usability)
- **Testing & Quality:** Quality gates for safe iteration during 10-12 week MVP timeline
- **Accessibility:** Not included (no specific requirements identified)
- **Integration:** Not included (no external system integrations in MVP scope)

**NFR Characteristics:**
- ✅ Specific and measurable (every NFR has quantifiable criteria)
- ✅ Testable (includes testing strategies where needed)
- ✅ MVP-appropriate (realistic targets, not over-engineered)
- ✅ Aligned with platform decisions (Supabase Auth, Vercel, Supabase)
- ✅ Supports Success Criteria and user needs
- ✅ Implementation-realistic (acknowledges what application controls vs. platform)
