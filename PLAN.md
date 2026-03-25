# Kartis — Strategic Plan (Tomer App Method)

> **Last updated:** 2026-03-11
> **App Type:** SaaS Platform (B2B2C — Nightlife Ticketing + Smart Table Management)
> **Status:** Mid-development — Foundation + Core Features built, needs hardening + growth

---

## What Is Kartis?

A nightlife ticketing and smart table management platform. Organizers create events, set up floor plans, sell tickets and table packages. Promoters drive sales via affiliate links and earn commissions. Staff check in attendees via QR codes. Guests browse events, buy tickets/tables, and receive digital passes.

## Who Is the User?

| Persona | Problem | Current Alternative | Switch Trigger |
|---------|---------|-------------------|----------------|
| **Event Organizer** (primary) | Managing ticket sales, table reservations, floor plans, and promoter payouts across disconnected tools | Spreadsheets + Eventbrite + WhatsApp + manual payouts | Unified platform, smart tables, real-time ops |
| **Promoter** | Tracking referrals and getting paid on time | Manual counting, trust-based payouts | Transparent tracking, automated commissions |
| **Staff** | Checking in hundreds of guests quickly | Paper lists, manual name lookup | QR scan in <2 seconds |
| **Guest** | Finding events and booking tables | Instagram DMs, phone calls | Instant booking, digital pass |

## Core Loop

```
Organizer creates event → Sets up floor plan + tickets + tables →
Promoter shares affiliate link → Guest buys ticket/table →
Guest receives QR pass → Staff scans at door →
Organizer sees real-time dashboard → Promoter gets commission
```

---

## Tech Stack (Current)

| Layer | Choice | Status |
|-------|--------|--------|
| Framework | Astro 5 (SSR) + React 18 | ✅ |
| Styling | Tailwind CSS + shadcn/ui + Radix | ✅ |
| Database | PostgreSQL + Prisma | ✅ |
| Auth | Auth-Astro (NextAuth) + RBAC | ✅ |
| Payments | Stripe Checkout | ✅ Webhooks complete |
| Email | Nodemailer (Resend SMTP) | ✅ |
| Real-time | Pusher | ✅ Fully wired |
| Maps | Konva (canvas) | ✅ |
| i18n | en + he (URL-based routing) | ✅ |
| Deploy | Vercel | ✅ |
| Analytics | — | ❌ Missing |
| Error tracking | — | ❌ Missing |
| Monitoring | — | ❌ Missing |

---

## Phase Assessment

### Phase 1: Foundation ✅ COMPLETE
- [x] Project setup (Astro, Tailwind, TypeScript, CI)
- [x] Database schema (Users, Venues, Events, Tickets, Tables, Orders, Promoters)
- [x] Auth (signup, login, RBAC with 5 roles)
- [x] Core data model CRUD
- [x] Basic UI (layout, nav, app shell)
- [x] Deploy to Vercel

### Phase 2: Core Features ✅ ~95% COMPLETE
- [x] Event CRUD (create, list, publish)
- [x] Ticket type management
- [x] Table package management
- [x] Venue map editor (Konva canvas — zones, tables, drag-and-drop)
- [x] Stripe checkout (tickets + tables)
- [x] QR pass generation + staff check-in
- [x] Promoter affiliate links + tracking
- [x] External checkout (RSVP/paid)
- [x] CMS event import (Posh VIP, Vibe)
- [x] **Map API endpoints** — `POST/GET /api/map/layouts` (save/load zones + tables)
- [x] **Promoter API endpoints** — `GET /api/promoter/stats`, `POST/PATCH /api/promoter/payout`
- [x] **Search & filtering** on events page (text search + venue filter)
- [x] **Create Event flow** — `/app/organizer/events/new` with ticket type creation
- [x] **Settings page** — `/app/settings` (profile, password change)

### Phase 2: ✅ COMPLETE

### Phase 3: Polish & Growth ✅ ~90% COMPLETE
- [x] Stripe webhooks — `POST /api/stripe/webhook` (checkout.completed, expired, refund)
- [x] Reports dashboard — `/app/organizer/events/[id]/report` + `GET /api/reports/event`
- [x] Pusher real-time — live ops stats auto-update on order-paid + guest-checkin
- [x] Activity feed — `/app/activity` + `GET /api/reports/activity` (cursor-paginated audit log)
- [x] Settings page — `/app/settings` + `PATCH /api/settings/profile`
- [x] Email confirmation — `sendConfirmationEmail()` in webhook on checkout.completed
- [x] Pusher live ops — `LiveStats.tsx` subscribes to `order-paid` + `guest-checkin`, webhook publishes
- [x] Reports API — `GET /api/reports/event` returns revenue, orders, ticket sales, table sales, promoter stats, check-in, daily orders
- [x] CSV export — `downloadCSV()` in `EventReport.tsx` exports full event report
- [ ] Organizer billing/subscription (B2B SaaS pricing) — **deferred by decision**
- [ ] Commission payouts (Stripe Connect for promoters)
- [ ] Help / documentation pages

### Phase 4: Production Hardening ❌ NOT STARTED
- [ ] Testing (unit, integration, E2E)
- [ ] Error tracking (Sentry)
- [ ] Security audit (CSRF, rate limiting beyond QR, input validation)
- [ ] Performance optimization
- [ ] Monitoring & alerting

### Phase 5: Scale & Iterate ❌ NOT STARTED
- [ ] Mobile companion app
- [ ] Public API + developer docs
- [ ] Multi-currency support (framework exists)
- [ ] White-label / multi-tenant
- [ ] Zapier integration

---

## Immediate Priorities (Next Sprint)

Finish Phase 2, then tackle critical Phase 3 items. Ordered by impact:

### Priority 1: Complete the Gaps (Phase 2 finish)

| # | Task | Impact | Effort | Notes |
|---|------|--------|--------|-------|
| 1 | **Map API — save/load layouts** | High | Small | Canvas editor exists but can't persist. Wire `/api/map/` endpoints |
| 2 | **Promoter API — payouts** | High | Medium | Commission ledger exists. Add payout request + status endpoints |
| 3 | **Stripe webhooks** | Critical | Medium | Orders stuck in PENDING without webhook confirmation. Handle `checkout.session.completed`, `invoice.payment_failed` |
| 4 | **Search & filtering** | Medium | Small | Add to events listing page. Postgres ILIKE is fine at current scale |
| 5 | **Organizer onboarding** | Medium | Medium | First-time flow: create venue → draw map → create event → publish |

### Priority 2: Revenue & Operations (Phase 3 critical)

| # | Task | Impact | Effort | Notes |
|---|------|--------|--------|-------|
| 6 | **Reports dashboard** | High | Medium | Organizer needs: ticket sales, revenue, table utilization, promoter performance |
| 7 | **Live ops — Pusher wiring** | High | Medium | Real-time table status, attendee count, staff notifications |
| 8 | **Email notifications** | Medium | Small | Order confirmation, pass delivery, event reminders. Templates table exists |
| 9 | **Organizer billing** | High | Large | B2B subscription: Free → Pro → Enterprise. Stripe Billing |
| 10 | **Commission payouts** | High | Large | Stripe Connect for promoter payouts |

### Priority 3: Production Readiness (Phase 4 critical)

| # | Task | Impact | Effort | Notes |
|---|------|--------|--------|-------|
| 11 | **Sentry integration** | High | Small | Error tracking across server + client |
| 12 | **E2E tests** | High | Medium | Playwright: auth flow, ticket purchase, QR check-in |
| 13 | **Security hardening** | Critical | Medium | CSRF on mutations, rate limiting on auth, Stripe signature verification |

---

## Architecture Decisions

### Current: Monolith ✅
Astro SSR handles everything — pages, API routes, auth. This is correct for current scale. No need to split.

### When to Split
- If API response times degrade under load → extract API to standalone Hono/Fastify service
- If map editor becomes heavy → consider separate SPA for editor
- If real-time features grow → dedicated WebSocket service

### Data Flow
```
Guest browses event (SSR page)
  → Selects tickets/tables (React client component)
  → POST /api/checkout/create-session (Stripe checkout)
  → Stripe redirects to success page
  → Webhook confirms payment → Order status = PAID
  → QR pass generated + emailed
  → Staff scans QR → POST /api/qr/validate
  → Organizer sees live dashboard (Pusher updates)
  → Promoter commission calculated → ledger entry
```

---

## Success Criteria

### Phase 2 Done When:
- [ ] Map layouts persist to database and reload in editor
- [ ] Promoter can request payout, organizer can approve
- [ ] Stripe webhooks update order status automatically
- [ ] Events page has search/filter
- [ ] New organizer can go from signup to published event in <5 minutes

### Phase 3 Done When:
- [ ] Organizer sees sales/revenue dashboard with charts
- [ ] Live ops dashboard updates in real-time (no refresh)
- [ ] Guests receive email confirmation with QR pass
- [ ] At least one paying organizer on a subscription plan

### Production Ready When:
- [ ] Sentry catches errors before users report them
- [ ] E2E tests cover auth → purchase → check-in flow
- [ ] No critical security vulnerabilities (OWASP top 10)
- [ ] p95 API response < 500ms

---

## File Reference

| Purpose | Path |
|---------|------|
| Database schema | `prisma/schema.prisma` |
| Auth config | `auth.config.ts` |
| Astro config | `astro.config.mjs` |
| API routes | `src/pages/api/` |
| Dashboard pages | `src/pages/[locale]/app/` |
| Public pages | `src/pages/[locale]/` |
| Components | `src/components/` |
| Utilities | `src/lib/` |
| i18n messages | `src/messages/` |
| Seed data | `prisma/seed.ts` |
