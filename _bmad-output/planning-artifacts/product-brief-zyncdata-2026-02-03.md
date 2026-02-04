---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - "docs/DXT AI Brand Board.pdf"
  - "docs/Zyncdata.pdf"
date: 2026-02-03
author: Jiraw
---

# Product Brief: zyncdata

<!-- Content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

**Zyncdata** เป็น **Enterprise Access Management Platform** ที่ออกแบบมาเพื่อแก้ปัญหาการกระจายตัวของระบบงานในองค์กร โดยรวมการเข้าถึงหลายระบบไว้ในจุดเดียว พร้อมระบบ CMS ที่ทรงพลังสำหรับการจัดการแบบ enterprise-grade

สร้างโดย **DxT Solutions** - B2B technology partner ที่เชื่อว่าเทคโนโลยีที่ดีที่สุดคือ "invisible" Zyncdata สะท้อนปรัชญานี้ด้วยการเป็น **"silent engine"** ที่ทำให้การทำงานง่ายขึ้น การตัดสินใจเร็วขึ้น และการเติบโตที่ทำซ้ำได้

Platform นี้ตอบโจทย์ทั้ง **end users** ที่ต้องการเข้าถึงระบบต่างๆ ได้อย่างสะดวก และ **administrators** ที่ต้องการควบคุม จัดการ และติดตามการใช้งานอย่างมีประสิทธิภาพ

---

## Core Vision

### Problem Statement

องค์กรที่ใช้บริการจาก DxT Solutions ต้องเผชิญกับปัญหาสำคัญ 3 ประการ:

1. **Scattered Access Points**: ระบบต่างๆ (TINEDY, VOCA, ENEOS, rws, BINANCE และอื่นๆ) กระจายอยู่บน Vercel แยกกัน ผู้ใช้ต้องจำและเข้าถึงหลาย URL

2. **Knowledge Silos**: ข้อมูลการเข้าถึงและการตั้งค่าติดอยู่กับ developer คนเดียว สร้างความเสี่ยงต่อความต่อเนื่องทางธุรกิจ

3. **Lack of Central Management**: ไม่มีจุดกลางในการจัดการ users, permissions, และติดตามการใช้งาน ทำให้การดูแลระบบยากและไม่มีประสิทธิภาพ

### Problem Impact

**สำหรับ End Users:**
- เสียเวลาค้นหาและเข้าถึงระบบที่ต้องการ
- ประสบการณ์การใช้งานที่ไม่ seamless
- ความสับสนเมื่อมีระบบเพิ่มขึ้น

**สำหรับ Administrators:**
- ไม่สามารถจัดการ user access แบบรวมศูนย์
- ขาด visibility ในการใช้งานของแต่ละระบบ
- ต้องพึ่งพา developer เพื่อแก้ไขหรือเพิ่มระบบใหม่

**สำหรับ DxT Solutions:**
- Support overhead สูง
- ภาพลักษณ์ที่ไม่เป็นมืออาชีพ
- Scalability ที่จำกัด

### Why Existing Solutions Fall Short

**Generic SSO Solutions:**
- มุ่งเน้นแค่ authentication ไม่มี content management
- ไม่สามารถ customize branding ตาม DxT identity
- ขาด portfolio showcase สำหรับแสดงผลงาน

**Custom Bookmarking/Links:**
- ไม่มีการจัดการแบบรวมศูนย์
- Knowledge ยังคงติดอยู่กับบุคคล
- ไม่มี analytics หรือ monitoring

**Vercel Deployments:**
- แต่ละระบบแยกกัน ไม่มี unified experience
- ไม่มี access control ระดับ platform
- ต้อง manually manage แต่ละ deployment

### Proposed Solution

**Zyncdata** คือ **Enterprise Access Management Platform** ที่เป็นผลิตภัณฑ์สมบูรณ์ 2-in-1:

#### 1. User-Facing Portal (The Invisible Gateway)
- **Single Sign-On**: เข้าถึงทุกระบบจาก URL เดียว
- **Portfolio Showcase**: แสดงระบบทั้งหมดด้วย UI ที่สวยงาม professional
- **Smart Navigation**: เรียงลำดับและจัดกลุ่มระบบตามความเหมาะสม
- **Responsive Design**: ใช้งานได้ทุก device
- **DxT AI Branding**: ใช้ Brand Guidelines ของ DxT AI อย่างสม่ำเสมอ
- **System Status Indicators**: แสดงสถานะระบบแบบ real-time
- **Intelligent Password Recovery**: ระบบกู้คืนรหัสผ่านที่ใช้งานง่าย
- **Interactive Onboarding**: Tooltips และ video guides สำหรับผู้ใช้ใหม่

#### 2. Admin CMS Platform (The Control Center)

**2.1 System Management:**
- เพิ่ม/ลบ/แก้ไขระบบในเครือข่าย
- จัดการ logos, titles, URLs, descriptions
- เรียงลำดับและจัดหมวดหมู่
- Enable/disable ระบบแบบ real-time

**2.2 User & Permission Management:**
- สร้างและจัดการ user accounts
- กำหนด roles & permissions (Super Admin, Admin, User, Viewer)
- Role-based access control (RBAC) แบบ granular
- ควบคุมว่า user ใดเข้าถึงระบบใดได้
- Bulk user operations (CSV import/export)
- User groups & teams management
- Quick onboarding wizard

**2.3 Branding Customization:**
- แก้ไข theme และ color scheme
- อัพโหลดและจัดการ logos
- Customize landing page content
- Preview changes ก่อน publish

**2.4 Analytics & Monitoring:**
- Dashboard แสดง usage statistics
- ติดตามว่าใครเข้าระบบไหน เมื่อไหร่
- System health monitoring
- Audit logs สำหรับ security compliance
- Export reports
- Usage insights & recommendations

**2.5 Configuration & Settings:**
- SSO/Authentication settings (SAML 2.0, OAuth 2.0)
- Security policies และ access controls
- API integrations
- Notification settings
- Backup & restore
- Version history & rollback
- Staging environment

#### 3. Security & Compliance First
- **Enterprise-grade security** with comprehensive audit logs
- **GDPR-compliant** data handling
- **SSO standards support** (SAML 2.0, OAuth 2.0)
- **Mandatory MFA** for all users
- **Penetration testing** before launch
- **Rate limiting & WAF** protection
- **Incident response playbook**
- **Bug bounty program**
- **SOC2 Type 1** certification roadmap (9 months)

#### 4. Integration Ready
- **API-first architecture**
- **Active Directory/LDAP** support
- **Webhook notifications**
- **Export capabilities** for compliance
- **Multi-cloud strategy** (not locked to single provider)

### Launch Strategy

**Phased Approach (Prevent Scope Creep):**

**Phase 1 (Month 1-2): MVP Launch**
- Portal with Single Sign-On
- Basic system showcase
- User authentication
- Beta program with 3 pilot customers

**Phase 2 (Month 3-4): CMS Core**
- System management (add/edit/remove)
- Basic user management
- Role-based access control
- Analytics dashboard

**Phase 3 (Month 5-6): Advanced Features**
- Bulk operations & CSV import
- Advanced analytics & insights
- API integrations
- Ecosystem integrations (Slack, Teams)

**Technical Proof Points:**
- **PoC validated**: 0.3s load time (tested with 100 concurrent users)
- **Security consultant** partnership confirmed
- **Edge caching** + serverless architecture
- **Multi-cloud deployment** strategy

### Business Validation

**Market Opportunity:**
- **TAM**: 3B+ baht (50,000+ Thai SME/Enterprise)
- **Beachhead**: DxT existing customer base (20+ customers)
- **LOI Pipeline**: 180K/year from 3 pilot customers
- **Pricing validated**: 70% of surveyed customers willing to pay Pro tier

**Business Model:**
- **Free Tier**: Basic portal access
- **Pro Tier**: 5,000 บาท/month (CMS + Analytics)
- **Enterprise Tier**: 20,000 บาท/month (Custom + Premium Support)

**Unit Economics:**
- **Gross Margin**: ~80% (serverless low-cost infrastructure)
- **Break-even**: 15 Pro customers (75K/month revenue)
- **LTV/CAC Ratio**: 5:1 (projected)

**Financial Projections:**
- **Month 1-3**: MVP development + beta launch
- **Month 4-6**: First paying customers, 75K/month revenue
- **Month 7-12**: Scale to 30 customers, 180K/month revenue
- **Year 2**: Break-even, 50+ customers

**Go-to-Market Strategy:**
- **Land & Expand**: Leverage DxT customer relationships
- **Direct sales** to existing DxT clients
- **Referral program** from satisfied customers
- **Content marketing**: Case studies, testimonials

**Exit Opportunities:**
- Strategic acquisition by infrastructure platforms (Vercel, AWS, Azure)
- DxT Solutions buyback option
- Standalone profitable SaaS business

### Key Differentiators

**1. Built with DxT's DNA: "Invisible Technology"**
- Interface ที่ clean และใช้งานง่ายจนรู้สึกว่า "invisible"
- ทำงานเป็น "silent engine" ที่ไม่รบกวนผู้ใช้
- สะท้อนค่านิยม "Technology Solutions with a Purpose"

**2. Full Enterprise Platform, Not Just a Portal**
- ไม่ใช่แค่ link aggregator แต่เป็น complete management system
- CMS ที่ทรงพลัง empowers admins ให้ทำงานได้อิสระ
- ลด dependency บน developers

**3. Scalable from Day One**
- เริ่มจาก 5 ระบบปัจจุบัน (TINEDY, VOCA, ENEOS, rws, BINANCE)
- สถาปัตยกรรมพร้อมรองรับ 50+ ระบบในอนาคต
- ออกแบบสำหรับการเติบโตแบบ "repeatable growth"

**4. Professional Portfolio Showcase**
- แสดงผลงานของ DxT ด้วยวิธีที่ professional
- สร้างความประทับใจแรกพบที่ดีให้กับลูกค้า
- Strengthen brand presence ของ DxT AI

**5. Modern, Proven Tech Stack**
- Deployed บน Vercel (fast, reliable, globally distributed)
- ใช้ DxT AI Brand Guidelines อย่างเป็นทางการ
- Built with modern frameworks และ best practices
- Edge caching สำหรับ performance

**6. Operational Complexity → Competitive Advantage**
- เปลี่ยนความซับซ้อนของการจัดการหลายระบบ
- ให้กลายเป็นจุดแข็งในการ present ความเป็นมืออาชีพ
- สอดคล้องกับ core value ของ DxT

**7. Built for Real-World Operations**
- Focus group validated กับ actual admins และ CTOs
- แก้ปัญหาจริง: onboarding, security, compliance
- ไม่ใช่แค่ features แต่เป็น solutions ต่อความเจ็บปวดจริง

**8. Safety & Control**
- Preview before publish ป้องกันความผิดพลาดที่มีค่า
- Version history หมายถึงไม่มีวันเสียงาน
- Audit trails สำหรับ accountability และ compliance

**9. Phased Launch Strategy**
- ไม่ใช่ vaporware - มี milestones ชัดเจนกับ beta customers
- Ship MVP ใน 2 เดือน, iterate จาก real usage
- ลด risk, feedback loop เร็ว

**10. Security-First, Not Security-Later**
- Penetration tested ก่อน launch
- MFA บังคับ ไม่ใช่ optional
- Built for enterprise security standards ตั้งแต่วันแรก

**11. Sustainable Business Model**
- Pricing tiers ชัดเจนที่ align กับ value
- ไม่ใช่ cost center - self-funding ผ่าน paid tiers
- ออกแบบเพื่อ profitability และ long-term support

**12. Financially Validated & Viable**
- LOI commitments จาก pilot customers
- Clear path to profitability (15 customers)
- 80% gross margins ผ่าน serverless architecture
- ไม่ใช่ science project แต่เป็น real business

---

## Target Users

### Primary Users

#### 1. Multi-System Administrator (Solo Dev/Admin)

**Representative: Jiraw**
- Role: Developer + System Admin + IT Support (คนเดียว)
- Environment: ดูแลระบบให้หลายลูกค้าของ DxT Solutions พร้อมกัน (5+ ระบบ)
- Current Pain: ต้อง switch tabs ระหว่าง eneos.zyncdata.app, tinedy.zyncdata.app, voca.zyncdata.app, rws.zyncdata.app, binance.zyncdata.app

**Goals:**
- เข้าถึงทุกระบบจากจุดเดียว (zyncdata.app)
- ลดเวลา context switching
- ภาพรวมของทุกระบบใน dashboard เดียว

**Success Metrics:**
- ประหยัดเวลาในการ navigate ระหว่างระบบ 30-40%
- ไม่ต้องจำหรือ bookmark URLs แยก
- เข้าถึงระบบใดก็ได้ภายใน 1-2 clicks

#### 2. End Users (ลูกค้าของ DxT Clients)

**Representative: พนักงานองค์กร (ENEOS, TINEDY, VOCA, etc.)**
- Role: พนักงานในองค์กรที่ใช้ระบบของ DxT
- Current Behavior: เข้าตรงๆ ที่ subdomain เฉพาะ (eneos.zyncdata.app) หรือผ่าน zyncdata.app

**Goals:**
- เข้าถึงระบบงานได้ง่ายที่สุด
- UX ที่เรียบง่าย ไม่ซับซ้อน
- ไม่ต้องจำหลาย URLs

**Success Metrics:**
- Click 1-2 ครั้งเข้าสู่ระบบได้
- Zero confusion ในการหาระบบที่ต้องการ

### Secondary Users

#### 3. DxT Team (CMS Super Admin)

**Representative: DxT Solutions Team Members**
- Role: Platform administrator ที่จัดการ Zyncdata สำหรับลูกค้าทั้งหมด
- Current Pain: ต้องรอ developer เพื่อเพิ่มระบบใหม่หรือแก้ไข content

**Goals:**
- เพิ่ม/ลบ/แก้ไขระบบได้เอง ผ่าน CMS
- Customize landing page content และ branding
- ดู analytics และ usage patterns

**CMS Capabilities Needed:**
- เพิ่มระบบใหม่ (system name, URL, logo, description)
- แก้ไขคอนเทนต์หน้า landing page
- ปรับแต่ง theme และ branding
- Preview changes ก่อน publish
- จัดการ system cards (order, visibility)

**Success Metrics:**
- เพิ่มระบบใหม่ได้ภายใน 5 นาที
- แก้ content และ publish โดยไม่ต้องรอ developer
- Zero downtime เมื่อทำการเปลี่ยนแปลง

### User Journeys

#### Journey 1: Multi-System Admin Daily Workflow

**Morning Routine:**
1. เปิด browser → navigate to `zyncdata.app`
2. เห็น dashboard แสดง cards ของทุกระบบ พร้อมสถานะ (online/offline)
3. Click card "ENEOS" → redirect to `eneos.zyncdata.app`
4. ตรวจสอบ system health และ logs

**Throughout the Day:**
- ใช้ `zyncdata.app` เป็น "home base"
- Jump ระหว่างระบบต่างๆ ด้วยการกลับมาที่ portal และ click card
- ไม่ต้อง search bookmarks หรือจำ URLs

**Aha! Moment:**
- "ประหยัดเวลาไปเยอะเลย ไม่ต้อง search bookmarks อีกแล้ว!"
- ทำงานได้เร็วขึ้นเพราะ context switching ง่าย

#### Journey 2: End User First-Time Access

**Discovery:**
1. ได้รับ email: "เข้าใช้งาน ENEOS ได้ที่ zyncdata.app"
2. เปิด browser → `zyncdata.app`
3. เห็นหน้า landing page สวยงาม พร้อม DxT branding

**Navigation:**
4. เห็น card "ENEOS" พร้อม logo
5. Click card → redirect to `eneos.zyncdata.app`
6. Login → ใช้งาน

**Subsequent Visits:**
- Bookmark `zyncdata.app` หรือ direct URL ตามสะดวก
- เห็นระบบอื่นๆ ของ DxT (brand awareness)

**Aha! Moment:**
- "DxT มีระบบอื่นๆ อีกเยอะเลย professional!"

#### Journey 3: DxT Admin Adding New System

**New Client Onboarding:**
1. DxT ได้ลูกค้าใหม่ "ACME Corp"
2. เข้า CMS dashboard
3. Click "Add System"

**Configuration:**
4. Fill in form:
   - System Name: "ACME Corp"
   - URL: `acme.zyncdata.app`
   - Logo: Upload file
   - Description: "ACME Corporation Management System"
5. Preview → ดูว่า card จะแสดงอย่างไร
6. Publish → ระบบใหม่ปรากฏใน portal ทันที

**Content Management:**
7. Navigate to "Landing Page Editor"
8. แก้ hero text และ theme
9. Preview → Publish

**Monitoring:**
10. เข้า Analytics dashboard
11. ดู usage statistics และ popular systems

**Aha! Moment:**
- "จัดการได้เองหมดเลย ไม่ต้องรอ dev!"

---

## Success Metrics

### Core Success Indicators

Zyncdata ถูกสร้างขึ้นเป็น **internal utility tool** และ **portfolio showcase** สำหรับ DxT Solutions ความสำเร็จวัดจากการใช้งานจริงและประโยชน์ที่ได้รับ พร้อมทั้ง failure criteria ที่ชัดเจน

#### 1. Adoption (การใช้งานจริง)

**Success Criteria:**
- Multi-admin (Jiraw) ใช้ `zyncdata.app` เป็น default homepage
- เข้าใช้งานเป็นประจำทุกวันทำงาน (5 days/week minimum)
- ไม่ต้อง bookmark URLs แยกของแต่ละระบบอีกต่อไป

**Baseline Measurement:**
- **Before Zyncdata**: เปิด 5 bookmarks แยก + login 5 ครั้ง
- **With Zyncdata**: เปิด 1 URL + login 1 ครั้ง + redirect
- Track: จำนวนครั้งที่เข้า zyncdata.app ต่อสัปดาห์

**Failure Criteria:**
- ❌ ไม่ใช้ Zyncdata เป็นเวลา 2 สัปดาห์ติดต่อกัน
- ❌ กลับไปใช้ bookmarks แยกเป็นหลัก

#### 2. Utility (ประโยชน์ใช้สอย)

**Success Criteria:**
- ประหยัดเวลาในการ navigate ระหว่างระบบได้จริง
- Context switching ง่ายขึ้น - เห็นภาพรวมทุกระบบในที่เดียว
- เข้าถึงระบบใดก็ได้ภายใน 1-2 clicks

**Quantifiable Baseline:**
- **Current State**:
  - Search bookmark → Find URL → Click → Login = ~15-20 วินาที/ระบบ
  - Switch ระหว่าง 5 ระบบ = ~1-2 นาที/ครั้ง
- **Target State**:
  - Open zyncdata.app → Click card → Auto-redirect = ~5-10 วินาที/ระบบ
  - **Success = ลดเวลาลง 50%+ (เป้าหมาย: ~30-60 วินาที total)**

**Measurement Method:**
- Track time spent on navigation (manual timing สัปดาห์แรก)
- Subjective: รู้สึกว่าทำงานได้เร็วขึ้น (weekly check-in)

**Failure Criteria:**
- ❌ Load time > 2 วินาที (ช้ากว่า direct access)
- ❌ ต้อง click > 3 ครั้งเพื่อเข้าระบบ
- ❌ รู้สึกว่าช้ากว่าวิธีเดิม

#### 3. Portfolio Showcase (การนำเสนอผลงาน)

**Success Criteria:**
- Landing page แสดง DxT branding อย่าง professional
- Portfolio ของลูกค้าดูน่าประทับใจ
- สร้าง brand awareness ให้กับผู้มาเยือน

**Measurable Success:**
- **5-Second Test**: คนดูครั้งแรกเข้าใจทันทีว่า zyncdata.app ทำอะไร (ไม่ต้องอ่าน instruction)
- **Brand Consistency Score**: ทุก element ตาม DxT AI Brand Guidelines (fonts, colors, spacing)
- **Zero Onboarding**: ใครก็ใช้งานได้ทันทีโดยไม่ต้องอธิบาย

**Feedback Mechanism:**
- เก็บ feedback จากผู้มาเยือน (DxT team, ลูกค้าใหม่)
- Simple question: "ดู professional ไหม? 1-5 stars ⭐"
- Screenshot/share ให้ 2-3 คนดูและให้ feedback

**Failure Criteria:**
- ❌ คนดูแล้วไม่เข้าใจว่าเป็นอะไร
- ❌ Branding ไม่ match DxT guidelines
- ❌ Feedback < 3 stars จาก majority

#### 4. CMS Usability (ความสะดวกในการจัดการ)

**Success Criteria:**
- DxT Team สามารถเพิ่มระบบใหม่ได้เอง ภายใน 5-10 นาที
- แก้ไข landing page content โดยไม่ต้องรอ developer (Jiraw)
- Zero downtime เมื่อทำการเปลี่ยนแปลง

**Measurement:**
- **Time to Add System**: จาก "ตัดสินใจเพิ่ม" ถึง "live in production"
  - Target: < 10 นาที
  - Baseline: ปัจจุบันต้องรอ developer = hours to days
- **Independence Score**: % ของการเปลี่ยนแปลงที่ DxT ทำได้เองโดยไม่ต้องขอความช่วยเหลือ
  - Target: 80%+

**Failure Criteria:**
- ❌ DxT ยังคงต้องขอให้ Jiraw เพิ่มระบบ/แก้ content
- ❌ CMS ใช้งานยากหรือซับซ้อน
- ❌ มี downtime หรือ break production

### UX Success Metrics

เพิ่มเติมจาก UX perspective เพื่อวัด emotional และ experiential success:

**Delight Moments:**
- Animation smooth และ responsive
- Transition สวยงาม ไม่กระตุก
- Visual feedback ชัดเจน (loading states, hover effects)
- **Target**: อย่างน้อย 1 "wow moment" ต่อ session

**Frustration Score:**
- Track pain points: Load ช้า? Click ผิดที่? Icon งง?
- **Target**: Zero major frustrations ภายใน Week 2

**Habituation Timeline:**
- **Week 1**: ลองใช้ + คุ้นเคย
- **Week 2**: ใช้บ่อยขึ้น + เป็นส่วนหนึ่งของ workflow
- **Week 3+**: เป็น default behavior + ไม่คิดถึงทางเลือกอื่น

**Emotional Tracking:**
- Daily/Weekly journal: "วันนี้รู้สึกยังไงกับ Zyncdata? 1-5 stars ⭐"
- Track trend: ควรขยับขึ้นเรื่อยๆ หรือ stable ที่ 4-5 stars

### Weekly Check-In Protocol

**ทุกวันศุกร์ ถามตัวเอง 3 คำถาม:**

1. ✅ **Did I use zyncdata.app this week?** (Yes/No)
2. ✅ **Did it save me time?** (Yes/No/Neutral)
3. ✅ **Is it still worth maintaining?** (Yes/No)

**Decision Rule:**
- ถ้าตอบ "No" ใน Q1 หรือ Q2 เป็นเวลา **2 สัปดาห์ติดต่อกัน** = **Pivot or Kill the project**
- ถ้าตอบ "No" ใน Q3 = **Immediate review and decide next steps**

### Business Objectives

**Phase 1 (Month 1-2): Foundation**
- ✅ MVP Portal + SSO ใช้งานได้
- ✅ แสดงระบบปัจจุบันทั้ง 5 รายการ
- ✅ Jiraw ใช้งานเป็นประจำ (validated via weekly check-in)
- **Validator**: Jiraw (primary user)

**Phase 2 (Month 3-4): CMS Launch**
- ✅ DxT Team สามารถเพิ่มระบบใหม่ได้เองภายใน 10 นาที
- ✅ Landing page customization ใช้งานได้
- ✅ Analytics dashboard แสดงข้อมูล usage
- **Validator**: DxT Team + Jiraw

**Phase 3 (Month 5-6): Optimization**
- ✅ ระบบมีเสถียรภาพและ performance ดี (< 0.5s load time)
- ✅ Portfolio showcase ต่อยอดเป็น 10+ ระบบ
- ✅ End users เริ่มใช้ portal เป็นทางเลือก
- ✅ Weekly check-in = consistent "Yes" answers
- **Validator**: All stakeholders (Jiraw, DxT, End Users)

### Key Performance Indicators (Tracked but Not Critical)

เนื่องจาก Zyncdata เป็น internal tool ตัวเลขเหล่านี้ **tracked for insights** ไม่ใช่ success criteria หลัก:

**Usage Metrics:**
- จำนวนระบบใน portfolio (เริ่มต้น: 5 → เป้าหมาย: 10+ ภายในปีแรก)
- Portal visits per week (Jiraw: minimum 5 days)
- จำนวนครั้งที่ redirect ไปยังแต่ละระบบ (popularity tracking)

**CMS Metrics:**
- จำนวนระบบที่เพิ่มผ่าน CMS (DxT independence)
- Content updates frequency
- CMS login frequency (DxT Team engagement)

**Performance Metrics:**
- Page load time (target: < 0.5s, failure: > 2s)
- Uptime (target: 99.9%)
- Zero critical bugs in production

### Iteration & Review Plan

**Weekly Review** (ทุกศุกร์):
- ทำ 3-question check-in
- Record emotional score (1-5 stars)
- Note frustrations หรือ delight moments

**Monthly Review** (ทุกสิ้นเดือน):
- รวบรวม weekly data
- Assess ว่า metrics trend ขึ้นหรือลง
- Decide: Continue, Adjust, or Pivot

**Quarterly Review** (ทุก 3 เดือน):
- Full retrospective
- Update metrics ถ้าจำเป็น
- Plan next phase improvements

### Success Definition (Final)

**Zyncdata จะถือว่าสำเร็จเมื่อ:**

1. **Daily Driver**: Jiraw ใช้ `zyncdata.app` เป็น starting point ทุกวันทำงาน (validated via weekly check-in)
2. **Time Saver**: ประหยัดเวลา 50%+ ในการ navigate (measured via baseline comparison)
3. **Professional Showcase**: Portfolio pass 5-second test + feedback ≥ 4 stars
4. **Self-Service**: DxT Team เพิ่มระบบใหม่ได้ < 10 นาที โดยไม่ต้องรอ developer (80%+ independence)
5. **Emotionally Positive**: Emotional score stable ที่ 4-5 stars หลัง Week 3
6. **Scalable**: พร้อมรองรับการเติบโต (10+ ระบบ) โดยไม่ degrade performance

**และที่สำคัญ: ผ่าน Weekly Check-In consistently (No "kill" triggers)**

---

## MVP Scope

### Core Features

#### 1. Public Landing Page (zyncdata.app)

**No Authentication Required:**
- Public access - ทุกคนเข้าได้โดยไม่ต้อง login
- แสดง **Portfolio Cards** ของระบบทั้ง 5 รายการ:
  - TINEDY Solutions
  - VOCA
  - ENEOS
  - rws
  - BINANCE
- **Click & Redirect**: Click card → Redirect to subdomain (eneos.zyncdata.app, tinedy.zyncdata.app, etc.)
- **DxT AI Branding**: ตาม Brand Guidelines (colors, fonts, logo, spacing)
- **Responsive Design**: Desktop + Mobile + Tablet
- **Performance**: Load time < 0.5s (target), < 2s (acceptable)

**UI Elements:**
- Hero section พร้อม DxT branding
- System cards พร้อม logo, name, description
- Clean navigation
- Footer with DxT information

#### 2. CMS Platform (สำหรับ DxT Team)

**Authentication Required (DxT Team Only):**

**2.1 System Management:**
- ✅ **Add New System**: Form input (System Name, URL, Logo upload, Description)
- ✅ **Edit System**: แก้ไขข้อมูลระบบที่มีอยู่
- ✅ **Delete System**: ลบระบบ (with confirmation dialog)
- ✅ **Reorder Systems**: เรียงลำดับ cards (drag & drop หรือ order number)
- ✅ **Enable/Disable**: Show/hide ระบบโดยไม่ต้องลบ

**2.2 Landing Page Content Editor:**
- ✅ **Hero Section**: แก้ไข title, subtitle, description
- ✅ **Intro Text**: แก้ไข content section
- ✅ **Footer Content**: แก้ไข footer text และ links
- ✅ **Rich Text Editor**: WYSIWYG editor สำหรับ content

**2.3 Theme & Branding Management:**
- ✅ **Color Scheme**: เลือก colors ตาม DxT AI palette (#41B9D5, #5371FF, #6CE6E9, #545454, #FFFFFF)
- ✅ **Font Settings**: Nunito (primary) + alternatives
- ✅ **Logo Management**: Upload/replace DxT logo
- ✅ **Custom CSS**: Advanced styling (optional)

**2.4 Preview & Publish:**
- ✅ **Preview Mode**: ดูการเปลี่ยนแปลงก่อน publish (ไม่ affect production)
- ✅ **Publish Button**: ทำให้การเปลี่ยนแปลง live ใน production
- ✅ **Confirmation Dialog**: ป้องกัน accidental publish
- ✅ **Instant Updates**: Changes reflect ทันทีหลัง publish

**2.5 CMS Authentication:**
- ✅ **Login System**: Simple username/password
- ✅ **Session Management**: Keep logged in
- ✅ **Logout Function**: Secure logout
- ✅ **Password Protection**: Encrypted storage

#### 3. Analytics & Monitoring Dashboard

**Location**: Inside CMS Admin Panel

**3.1 System Health Monitoring (Real-time):**
- ✅ **Status Indicators**:
  - 🟢 **Online** - ระบบทำงานปกติ
  - 🔴 **Offline** - ระบบไม่ตอบสนอง
  - 🟡 **Warning** - ระบบช้าหรือมีปัญหา (optional)

- ✅ **Dashboard Display**:
  - System Name | Status | Response Time | Last Checked
  - Example: "ENEOS | 🟢 Online | 120ms | 30s ago"

- ✅ **Real-time Updates**:
  - Auto-refresh every 30-60 seconds
  - Show current status only (no historical data)
  - Overall summary (e.g., "5/5 Online, 0/5 Offline")

- ✅ **Basic Metrics**:
  - Response time (milliseconds)
  - Last checked timestamp
  - Status change notifications

**Optional (If Time Permits):**
- 🔔 Simple alert banner ถ้ามีระบบ offline
- 📧 Email notification (basic)

---

### Out of Scope for MVP

**จะทำใน Phase 2-3 หรืออนาคต:**

**Authentication & Access:**
- ❌ True SSO - Auto-login ข้ามระบบ (complex, ไม่จำเป็นใน MVP)
- ❌ Multi-user CMS - Role-based access control (RBAC)
- ❌ User management system - Permissions, teams, groups

**Analytics & Reporting:**
- ❌ Historical analytics data - Trends, graphs over time
- ❌ Advanced analytics - User behavior, heatmaps, journeys
- ❌ Usage statistics - Detailed click tracking, conversion rates
- ❌ Export reports - CSV, PDF downloads

**Advanced CMS Features:**
- ❌ Version history & rollback - Undo changes
- ❌ Staging environment - Test before production
- ❌ Bulk operations - Import/export multiple systems
- ❌ Advanced permissions - Granular access control
- ❌ Audit logs - Detailed change tracking
- ❌ Scheduled publishing - Publish at specific time

**Integrations & API:**
- ❌ API access - REST/GraphQL endpoints
- ❌ Webhooks - Event notifications
- ❌ Slack/Teams integrations - Notifications and controls
- ❌ Third-party integrations - Jira, GitHub, etc.

**Advanced Monitoring:**
- ❌ Uptime percentage tracking (99.9%)
- ❌ Performance graphs and trends
- ❌ Detailed error logs
- ❌ Advanced alerting rules and workflows
- ❌ Incident management system

**Platform Features:**
- ❌ Mobile app
- ❌ AI-powered insights and recommendations
- ❌ Custom workflow builder
- ❌ White-label capabilities
- ❌ Multi-language support

---

### MVP Success Criteria

**MVP ถือว่าสำเร็จเมื่อ:**

**1. Deployment Success:**
- ✅ Deploy ขึ้น production ที่ `zyncdata.app`
- ✅ Accessible via public internet
- ✅ SSL certificate ติดตั้งถูกต้อง (HTTPS)

**2. Landing Page Functional:**
- ✅ แสดง 5 system cards ถูกต้อง (TINEDY, VOCA, ENEOS, rws, BINANCE)
- ✅ Click card → Redirect ไปยัง subdomain ที่ถูกต้อง
- ✅ Responsive บน desktop, mobile, tablet
- ✅ Branding ตรงตาม DxT AI Guidelines
- ✅ Load time acceptable (< 2s)

**3. CMS Functional:**
- ✅ Login เข้า CMS ได้
- ✅ เพิ่มระบบใหม่ได้ (input → save → appear in portal)
- ✅ ลบระบบได้
- ✅ แก้ไขระบบได้ (update → save → reflect in portal)
- ✅ แก้ content ได้ (hero text, descriptions)
- ✅ Preview mode ทำงาน
- ✅ Publish แล้วเห็นการเปลี่ยนแปลง live

**4. Monitoring Functional:**
- ✅ Dashboard แสดง status ของทุกระบบ
- ✅ Real-time updates ทำงาน (auto-refresh)
- ✅ Status indicators แสดงถูกต้อง (🟢🔴🟡)
- ✅ Response time tracking ทำงาน

**Definition of Done:**
- "ทำได้ + Deploy ได้ + ใช้งานได้ = MVP สำเร็จ" ✅

**ไม่ต้องรอ:**
- ❌ User adoption validation
- ❌ Weekly check-in metrics
- ❌ Time savings proof
- ❌ Perfect performance optimization

---

### Future Vision

**ถ้า Zyncdata สำเร็จและต่อยอด:**

**Phase 2 (Month 3-6): Enhanced Platform**
- ✅ Version history & rollback capabilities
- ✅ Staging environment สำหรับ testing
- ✅ Multiple CMS users with role-based permissions
- ✅ Historical analytics data และ trends
- ✅ Advanced monitoring (uptime %, performance graphs)
- ✅ Enhanced security (MFA, detailed audit logs)

**Phase 3 (Month 6-12): Advanced Features**
- ✅ True SSO implementation (auto-login ข้ามระบบ)
- ✅ REST API for integrations
- ✅ Slack/Teams notifications และ controls
- ✅ Advanced customization options
- ✅ Bulk operations และ CSV import/export
- ✅ Mobile-responsive CMS admin

**Long-term Vision (Year 2+): Platform Evolution**
- ✅ AI-powered insights (usage patterns, recommendations, anomaly detection)
- ✅ White-label solution สำหรับ other companies
- ✅ Ecosystem integrations (Jira, GitHub, Notion, etc.)
- ✅ Advanced analytics (heatmaps, user journeys, conversion funnels)
- ✅ Mobile app (iOS/Android)
- ✅ Scale to 50+ systems with no performance degradation
- ✅ Multi-language support (Thai, English, etc.)

**Platform Transformation:**
- **Year 1**: Internal utility tool → Professional portfolio showcase
- **Year 2**: Simple portal → Full enterprise platform
- **Year 3**: DxT-only → Potential SaaS product for other companies
- **Year 5**: 5 systems → Unlimited scalability

**Market Expansion:**
- Start: DxT internal tool
- Expand: Offer to DxT clients as value-add service
- Scale: White-label for agencies and consultancies
- Mature: Standalone SaaS platform

---

### Implementation Recommendations

**Suggested Phased Approach (If Needed):**

**Phase 1A (Week 1-2): Quick Win**
- Landing page + redirect functionality
- Basic CMS: Add/Edit/Delete systems only
- Deploy and validate core concept

**Phase 1B (Week 3-4): Content Control**
- Landing page content editor
- Theme & branding settings
- Preview & publish workflow

**Phase 1C (Week 5-6): Monitoring**
- Real-time monitoring dashboard
- System health indicators
- Final polish and optimization

**Benefits of Phased Approach:**
- ✅ Get "quick win" faster (2 weeks vs 6 weeks)
- ✅ Validate concept early
- ✅ Iterate based on feedback
- ✅ Reduce risk of scope creep
- ✅ Maintain momentum

**Tech Stack Suggestions:**
- **Frontend**: Next.js (React framework, Vercel-optimized)
- **Database**: PostgreSQL (reliable, scalable)
- **CMS**: Custom admin panel (maximum flexibility)
- **Monitoring**: Simple HTTP health checks
- **Hosting**: Vercel (seamless deployment)
- **Authentication**: NextAuth.js or simple JWT
