# OASIS — Invoicing Module: Frontend Implementation Tracker

**Module:** Invoice & Payment Intelligence (Module 5) — design in [invoice.md](invoice.md)
**Scope of this tracker:** **Frontend build, phase-wise**, in the existing Next.js + TypeScript app (`frontend/`), reusing the OASIS shell, brand palette, and `Icon` set.
**Date started:** 2026-06-03

---

## Build approach

- **Frontend-first with mock data.** All screens are built and clickable against an in-memory mock data layer (`lib/invoicing/`). No backend, DB, or live AI yet (those come in the backend phase — see [invoice.md](invoice.md) §19).
- **Routes** live under `app/invoicing/*` (this takes precedence over the generic `[module]` placeholder).
- **Sample data is fictional** (made-up vendors, UTRs, amounts) — no real `Data/` content is used in the UI.
- Each phase is independently demoable; status updated below as completed.

### What is mocked vs. real (this stage)
| Concern | Now (frontend phase) | Later (backend phase) |
|---|---|---|
| Data | In-memory mock (`lib/invoicing/mockData.ts`) | PostgreSQL + Flyway |
| AI extraction | Simulated (pre-filled fields + confidence) | Azure AI Document Intelligence (pluggable) |
| Reconciliation | Simulated matched/exception data | Reconciliation engine |
| File upload | UI only (no real storage) | Object storage + async jobs |
| Notifications/scheduler | UI + mock log | Spring scheduler + email |

---

## Phase status

**Legend:** ⬜ Pending · 🟡 In Progress · ✅ Done

| Phase | Scope (invoice.md refs) | Routes / artifacts | Status |
|---|---|---|---|
| **FE-0 — Foundation** | Route + sub-nav, types, mock data, shared UI, overview | `app/invoicing/layout.tsx`, `lib/invoicing/{types,mockData}.ts`, `components/invoicing/ui.tsx`, `/invoicing` (§13.8) | ✅ Done |
| **FE-1 — Intake & Extraction** | §13.1, §13.2 (F1–F5) | `/invoicing/upload`, `/invoicing/review` — multi-file dropzone, stepper, split-view + confidence chips, per-file confirm | ✅ Done |
| **FE-2 — Billing Batch, Validation & Approval** | §13.3, §10.10, §10.11 (F6, F7, E2, E4) | `/invoicing/batches`, `/invoicing/batches/[id]` — line table, validation gate, approve/reject + comment, Smart Approval Assistant, Excel/PDF buttons | ✅ Done |
| **FE-3 — Reconciliation** | §13.5 (F10–F12) | `/invoicing/reconciliation` — upload report, Matched/Exceptions tabs, TDS net + balance check, approve | ✅ Done |
| **FE-4 — Notifications** | §13.6, §17 (F13, F18) | `/invoicing/notifications` — manual send (dedup: paid + not-notified only) + scheduled config + notification log | ✅ Done |
| **FE-5 — Search & Dashboard** | §13.4, §16 (F8, F9, F15) | `/invoicing/search` — live filters (text/status/entity/category) + dashboard/charts on `/invoicing` | ✅ Done |
| **FE-6 — Vendor Master & Configuration** | §13.7, §13.9 (F14, F4, E7) | `/invoicing/vendors` (GSTIN/PAN/MSME + onboarding), `/invoicing/config` (entities/categories/template) | ✅ Done |
| **FE-7 — Reports & Scheduled Delivery** | §16 (F15) | `/invoicing/reports` — **Report Library** (13 report types: donut / bar / ranked-bar / KPI charts + data tables, with date/entity filters & Excel/PDF/CSV export) + **Scheduled Delivery** (auto-generate & email selected reports daily/weekly/monthly to chosen recipients, with a **"report period — last N days"** window; active-schedules + delivery-history) | ✅ Done |

**Build status:** ✅ `next build` passes — 11 invoicing routes, 26 static pages generated (2026-06-03).

---

## Progress log

- _2026-06-03_ — Tracker created; FE-0 started.
- _2026-06-03_ — **FE-0 → FE-6 all implemented** (frontend, mock data). All invoicing screens built and clickable; `next build` passes (10 routes). Open **Invoicing** in the sidebar.
- _2026-06-03_ — **FE-7 Reports module added**: a Report Library (13 report types with charts + tables + export) and Scheduled Delivery (auto-generate & email reports daily/weekly/monthly to recipients) with delivery history. `next build` passes (11 routes). New "Reports" tab in the invoicing sub-nav.
- _2026-06-04_ — Refinements: scheduled-delivery gains a **"report period — last N days"** field; **Reports** tab moved to last in the sub-nav; **Records → Search** (route renamed `/invoicing/records` → `/invoicing/search`).
- _2026-06-04_ — Scheduled delivery: **Edit & Delete** actions on Active schedules (edit pre-fills the form & updates in place; delete with confirm), an **Email subject** field in the config (shown per schedule), and an Enabled/Disabled toggle. Type-check clean.
- _2026-06-04_ — Billing Batches: added **search filters** (code/period text, entity, status); **View / Edit / Delete** per batch (edit code/entity/period/status, delete with confirm); **"Add invoice"** to an existing batch on the detail view (upload + quick-entry, appends a line & recomputes totals); renamed **Open → View** and the **Lines → Invoices** column (list + detail). Type-check clean.
- _2026-06-04_ — Billing Batches refinements: **entity moved to invoice level** (removed `payingEntityCode` from batch; per-invoice Entity column; batch list derives entities from its invoices); **per-invoice Edit / reupload / Delete** in the batch view; **multiselect bulk Approve/Reject** of invoices (select-all, per-line approval status, counts); **tabs restyled** as a light-shaded bordered bar (UX). Type-check clean.
- _2026-06-04_ — Original-invoice access (F5): each invoice line now carries its uploaded **file reference** (`fileName`/`fileType`), shown as a 📎 attachment under the bill no; **View** opens a preview modal of the original invoice with **Download**; review screen also gets a Download on the original-invoice pane. (Real file preview/storage lands with the backend object-storage phase.) Type-check clean.
- _2026-06-04_ — **Vendor grouping for combined payments** (Finance pays each vendor as one payment / one UTR): batch view groups invoices **per vendor (accordion)** with per-vendor total due + "1 payment · 1 UTR" cue (tracking stays per invoice); **reconciliation** matched results grouped by vendor (combined net + single UTR); **notifications** send **one consolidated email per vendor** (all bills + combined net + single UTR). Mock enriched (2nd PrimeGuard invoice paid under the same UTR). Synced invoice.md (§8/§13.3/§13.5/§13.6/§17). Type-check clean.
- _2026-06-04_ — Reports: added **Batch Report** type — pick a batch (or filter by processed **date range**) → full **invoicing + reconciliation** detail on screen, **downloadable** (Excel/PDF); also selectable in the **scheduler**. Synced to invoice.md §13.10. Type-check clean.
- _2026-06-04_ — Payment-cycle fields + Finance workflow: added **Bill Received Date, Credit Period, Due Date, Payment Priority (I ≤7th / II ≤22nd), Sent-to-Finance** across Upload (columns + per-invoice Recurring/Non-recurring), Extraction Review, and the Billing-batch invoices table (horizontally scrollable). **Send to Finance** now simulates an email to finance + sets batch status `Sent to Finance` (+ sent date per invoice). New **Finance role** (demo toggle on the batch): per-invoice **Approve for Payment** (bulk multiselect) / send-back, batch **Approved By Finance** / send-back-for-correction, and finance can **edit/correct** invoices directly; finance reviews the Payment Priority column. Type-check clean.
- _Next:_ backend phase — Spring Boot services + PostgreSQL (Flyway) + Azure AI extraction provider + report generation/scheduler/email, replacing the mock layers.

---

## How to run

```
cd frontend
npm run dev
```
Then open the app and go to **Invoicing** in the sidebar (`/invoicing`).
