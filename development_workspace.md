# OASIS — Workplace Intelligence: Phase-wise Development Plan

**Purpose.** This is the BUILD PLAYBOOK for the OASIS Workplace Intelligence module (BRD Module 3 "Smart Workspace" expanded into a sub-platform). It is written so an AI engineer (Claude) can execute it step by step. It consolidates the 27 requirement modules into 10 capability domains + Premium, then sequences the work.

**Build order.** `FRONTEND (all screens, mock data) → BACKEND (Java 21 + Spring Boot REST) → DATABASE (PostgreSQL + PostGIS via Flyway) → AI / Integrations / Analytics (Python + FastAPI + LangGraph)`. The database schema (§3) is **designed now as the contract**; the frontend mock layer and TypeScript types mirror it 1:1, and it is **applied later** in Phase 3.

**Backing store.** PostgreSQL 16 + PostGIS 3.4 (spatial model = single source of truth), Redis 7 (holds/cache), Kafka / Azure Service Bus (events). Currency INR. Module slug `workspace`, route `/workspace`.

**References.**
- `d:\Nilesh Professional World\AI Training\AntigravityProjects\oasis\Workplace Intelligence Requirement.docx` (requirement A — 27 modules, 7 AI agents).
- `d:\Nilesh Professional World\AI Training\AntigravityProjects\oasis\implementation_Workplace.md` (approved architecture B — 10 domains + Premium).

**Date.** 2026-06-05 · **Status.** Ready to execute (start at FE-0).

> **One canonical vocabulary (read first).** To eliminate drift across layers, this plan fixes one set of names everywhere — routes, enum literals, entity names, and Flyway files. The frontend TypeScript types use **string-literal unions whose values are the exact lowercase DB enum literals** (no PascalCase TS `enum`s, no numeric enums). The canonical route set in §4 is the only route set; backend (§5) and AI (§7) reference those exact routes.

---

## 1. How to build this (principles)

1. **Frontend-first, mock-data-first.** Build the entire frontend (every screen) against a mock layer in `frontend/lib/workspace/mockData.ts`. The mock data shapes and the TypeScript types in `frontend/lib/workspace/types.ts` are **designed to map 1:1 onto the PostgreSQL schema (§3)** so each screen already "supports" the DB. Swapping mock → API later is a data-source swap, not a UI rewrite.
2. **Reuse OASIS conventions** (proven by `app/invoicing` and `app/travel`): module at `frontend/app/workspace/*`; `layout.tsx` renders `<div className="container">`, crumbs `Home > Workspace`, a page-head, and a **sticky sub-nav** of tabs with optional count badges, then `{children}`; `page.tsx` is the overview; sub-routes are folders; dynamic detail routes are `[id]/page.tsx`. Reuse design tokens from `globals.css` (`--brand-blue #064281`, `--accent #f7991f`; `.container .crumbs .page-head .card .grid-kpi .kpi .tint-* .module .grid-modules .empty .panel__* .btn .btn--ghost .btn--accent .section-title`). Reuse **StatCards**, status pills, `.data-table`/`.table-card`, `.seg` toggles. No new colour system.
3. **`'use client'` for handlers.** Any component using `onClick`/`onChange`/`useState`/canvas MUST start with `'use client'` (a server component passing `onClick` broke a prior Vercel build).
4. **Register the dedicated route (critical gotcha).** Add `'workspace'` to the `DEDICATED_ROUTES` Set in `frontend/app/[module]/page.tsx`, else the catch-all "Coming soon" placeholder shadows the real route in the Vercel/production build.
5. **Konva install.** `cd frontend && npm i konva react-konva`. `react-konva` is used only inside `'use client'` components and the canvas wrapper is `dynamic(() => import('@/components/workspace/floorplan'), { ssr:false })` (Konva touches `window`/`canvas` and breaks SSR/`next build` otherwise). No other new runtime deps; charts reuse the CSS `.chart`/`.bar` pattern.
6. **Verify every phase.** `cd frontend && npx tsc --noEmit` (type-check), dev server HTTP 200 per route, and a full `next build` before any deploy (Vercel Root Directory = `frontend`).

---

## 2. Requirement ⇄ Implementation-plan comparison

### 2.1 Coverage matrix — Core & Enterprise Modules (M1–M27)

| Module | Domain | Covered? | Phase | Notes |
|---|---|---|---|---|
| **M1** Workspace Master Mgmt | D1 | Yes | MVP | Masters + status lifecycle; org hierarchy Company→…→Project is the spatial backbone. |
| **M2** Employee Master | D10 | Yes | MVP | Employee import in MVP; HRMS stays system-of-record, OASIS integrates. |
| **M3** Interactive Floor Plan Designer (+AI generator from PDF/Image/CAD/Visio/Excel) | D2 | Partial (manual=Yes; AI auto-gen=deferred) | MVP (manual + image-trace) / Intelligence (assisted import) | Manual drag-drop + background-image trace ship first; AI auto-detect is human-review-gated and deferred (#1 technical risk, §2.3). |
| **M4** Smart Desk Allocation (fixed/flexible/shared/reserved) | D3 | Yes | MVP | All allocation modes in the booking engine. |
| **M5** Service Line Zone Mgmt (colour zones) | D1 | Yes | MVP | Zones as PostGIS geometry with service-line colour; folded into spatial master. |
| **M6** Smart Desk Booking (hourly/half/full/multi-day; 15/30/60d window) | D3 | Yes | MVP | Configurable booking window; modify/cancel/extend. |
| **M7** QR Workspace Experience (book/confirm/modify/cancel/view; owner-only arrival + admin override) | D3 | Yes | MVP | Per-desk unique QR; owner-only arrival confirm with audited admin override; idempotent endpoints. |
| **M8** Smart Occupancy Tracking (states; no-show alerts+escalation) | D4 (tracking) + D6 (analytics) | Yes | MVP (states/no-show) / Intelligence (analytics) | Booked/Checked-In/Vacant/Occupied/No-Show; no-show → alert + auto-release + escalation. Live presence in D4, aggregation in D6. |
| **M9** Search & Workspace Discovery → highlight on plan | D5 | Yes | MVP | Search by desk/employee/ID/SL/account/project/floor/location; PostGIS highlight-on-plan. People-search is privacy-scoped (§8). |
| **M10** Meeting Room Intelligence (capacity/equipment/availability + Outlook) | D5 | Yes | Intelligence | Capacity/equipment metadata on plan; integrate Outlook/Graph rather than build a parallel scheduler. |
| **M11** Neighborhood/Team Seating Intelligence | D7 | Yes | Intelligence | Sit-near team/manager/project/account/collaborators via PostGIS proximity; privacy-scoped. |
| **M12** Workspace Heatmap Engine (green/yellow/red; daily→quarterly) | D6 | Yes | Intelligence | Heatmap overlay on same geometry; aggregation thresholds applied. |
| **M13** Move Planning & Relocation Mgmt | D8 | Yes | Intelligence | Relocation Planning agent (plan → human approves). |
| **M14** Visitor & Contractor Workspace Mgmt | D3 | Partial | Intelligence | Temporary sponsored desk in D3/booking with sponsor + validity-window + auto-expiry. Visitor *vehicle/parking* is P3. |
| **M15** Workspace Cost Optimization Engine | D8 | Yes | Intelligence | Cost/desk/employee/floor/SL + consolidation savings; Cost Optimization agent. |
| **M16** Employee Collaboration Intelligence | D7 | Yes | Intelligence | Merged with M11; opt-in/aggregated, excluded from HR appraisal (§8). |
| **M17** Reservation Priority Engine (CEO=p1…others=p4) | D3 (enforced) + D8 (policy) | Yes | MVP (engine) / Intelligence (full policy console) | Implemented as a config-driven policy/rules engine, not hardcoded grades. Priority stored as `p1..p4` literal everywhere (§3.1). |
| **M18** Workspace Demand Forecasting | D6 | Yes | Intelligence | Demand Forecasting agent over lakehouse history; MAPE-evaluated. |
| **M19** Employee Attendance Correlation (HRMS/access/biometric/QR) | D4 | Partial | MVP (QR/manual) / P3 (access/biometric) | QR/manual correlation in MVP; biometric/RFID/IoT presence is P3, privacy-gated, read-only. |
| **M20** Smart Notification Engine | D9 | Yes | MVP (basic) / Intelligence (core) | Reuses OASIS shared Notification Hub; event-driven (book/check-in/no-show feed it). Event catalog + escalation ladder defined in the policy engine. |
| **M21** Digital Twin Office (2D/3D + overlays; PREMIUM) | P3 | Yes (Premium) | Premium | 2D→3D path; same geometry. **UI-placeholder only in FE-4 — no table/type/endpoint until P3.** Separate ROI/legal gate. |
| **M22** Workplace Sustainability Dashboard (energy/carbon) | D6 | Partial | Intelligence (proxies) / P3 (IoT data) | Utilisation-derived proxies in Intelligence; metered energy/carbon deferred to P3. FE energy/carbon fields are **optional** to match estimate-until-IoT. |
| **M23** Executive Command Center | D9 | Yes | Intelligence | Consolidated into the single role-aware Conversational/Exec AI layer + dashboards. |
| **M24** Workplace Copilot (Web/Teams/WhatsApp/Mobile) | D9 | Yes | Intelligence | Same conversational layer, employee + executive personas; QR = mobile web. Native mobile app = separate later decision. |
| **M25** AI Workplace Governance Engine | D8 | Yes | Intelligence | No-show patterns, booking abuse, capacity breaches; policy/rules engine + Governance agent. |
| **M26** Workspace Analytics Data Lake | D6 | Yes | Intelligence | Analytics lakehouse; every event published to it. Event schema + retention/aggregation policy defined alongside DPIA before forecasting build. |
| **M27** Integration Hub (HRMS/Identity/Comms/Calendar/Access/Facilities) | D10 | Yes (phased) | MVP (HRMS/AD) → Intelligence (Teams/WhatsApp/Calendar) → P3 (Access/IoT) | Anti-corruption adapters, idempotent webhooks, secrets vault. Connectors land in the phase that needs them. |

### 2.2 Coverage matrix — AI Agents (canonical list = 10)

> **Reconciled count.** The requirement names 7 agents. Design B adds **Floor-Plan Vision** (for M3 assisted import) and splits the single conversational layer into the two personas the requirement implies — **Executive Analytics/Copilot** (M23, read) and **Employee Assistance** (M24, confirm-actions) — giving a canonical **10**. The `AgentKey` union (§4.3) enumerates exactly these ten and nothing else.

| Agent (`AgentKey`) | Domain | Mode | Phase | Notes |
|---|---|---|---|---|
| `floorplan_vision` | D2 | review-gated | Intelligence (opt-in) | CV extraction from PDF/Image/CAD/Visio/Excel → ghosted proposals; manual-first, never autopilot. |
| `workspace_planning` | D7/D8 | suggest | Intelligence | Best seating; SL/account/project clustering. |
| `occupancy_intelligence` | D6 | alerts | Intelligence | Utilisation, busy/low periods, anomalies. |
| `demand_forecasting` | D6 | read | Intelligence | Predicted occupancy vs capacity; MAPE-evaluated. |
| `team_seating` | D7 | suggest (privacy-scoped) | Intelligence | Sit-near suggestions; payload = `SitNearOptions` (= `TeamSeatingSuggestion[]`, §4.3). |
| `relocation_planning` | D8 | plan → human approves | Intelligence | Move plan + employee↔desk mapping. |
| `cost_optimization` | D8 | recommend | Intelligence | Cost rollups + consolidation savings (INR). |
| `governance` | D8 | alerts / gated enforcement | Intelligence | No-show/abuse/capacity-breach detection. |
| `executive_copilot` | D9 | read | Intelligence | NL Q&A + report generation over workspace data (RAG, read). |
| `employee_assistance` | D9 | confirm actions | Intelligence | Conversational book/cancel/find (Teams/WhatsApp/Web), user confirms. |

All ten are **capabilities behind the shared OASIS orchestrator**, not standalone apps.

### 2.3 Coverage matrix — Future-Roadmap (P3)

| Roadmap item | Domain | Covered? | Phase | Notes |
|---|---|---|---|---|
| IoT / sensors presence | P3 (D4 consumes) | Designed-for | Premium | Privacy-gated, read-only correlation. |
| Face recognition | P3 | Partial | Premium | Sensitive PII; explicit consent + separate legal/DPIA sign-off; kept out of the spatial schema. |
| Biometric check-in | P3 (D4) | Designed-for | Premium | Consent + legal gate. |
| Parking / visitor-vehicle | P3 | Partial | Premium | P3 design stub (vehicle/slot reuses spatial/booking model); out of MVP/Intelligence contract. |
| Digital Twin / 3D / AR | P3 (=M21) | Yes | Premium | 2D→3D + AR; same spatial model. UI-placeholder only until P3. |
| Smart-building / energy hardware | P3 (feeds D6 M22) | Partial | Premium | Hardware deferred; advanced sustainability depends on it. |

### 2.4 Genuine gaps / under-specified items (with resolutions)

- **Parking & visitor-vehicle** — only P3 scope, no entity. *Resolution:* P3 design stub (vehicle/slot entity reusing spatial/booking model); out of MVP/Intelligence.
- **Face-recognition presence** — P3, no concrete consent flow. *Resolution:* gate behind standalone DPIA + biometric-consent workflow + legal sign-off; keep out of the spatial schema.
- **M22 energy/carbon depth** — reporting shell exists; data source (IoT) is P3. *Resolution:* ship utilisation-derived proxies in Intelligence (FE fields optional); defer metered data to P3.
- **Visitor/Contractor lifecycle (M14)** — sponsor approval, badge/access, expiry. *Resolution:* `visitor` entity carries sponsor (`host_employee_id`), validity window, status, and an **auto-expiry sweeper** (§3 + §5.2.D4); approval state added to `visitor_status`.
- **Mobile (M24)** — served via QR/responsive web + Teams/WhatsApp, no native app. *Resolution:* confirm responsive web + QR + Teams/WhatsApp satisfies "Mobile"; native app is a separate later decision.
- **Notification engine (M20) richness** — templates, escalation ladders, quiet-hours. *Resolution:* define notification event catalog + escalation policy (no-show → owner → manager → facility) inside the policy engine in Intelligence.
- **Data-lake schema/retention (M26)** — retention, anonymisation, feature tables. *Resolution:* define event schema + retention/aggregation-threshold policy alongside the DPIA before forecasting build.

*(No requirement module is uncovered — all 27 map to a domain; gaps above are depth/sequencing, not omissions.)*

### 2.5 Reconciliation notes (intentional consolidation/sequencing deltas)

- **27 modules → 10 domains + Premium.** B collapses heavy overlap (M23+M24+chatbot/exec-copilot → one role-aware Conversational AI layer; M8+M12+M18+M22+M26 → one Occupancy & Analytics domain; M11+M16 → one collaboration-aware seating capability). The matrix still accounts for every module 1:1.
- **M3 AI floor-plan generator deliberately split/resequenced.** Manual designer + background-image trace ship first; AI auto-detection is a later, opt-in, confidence-scored, human-in-the-loop track (robust CV from arbitrary CAD/scans is R&D-grade; mirrors how OASIS treated AI invoice extraction).
- **M17 priority reinterpreted as a config-driven policy/rules engine** (`p1..p4` tiers in config), not hardcoded grades; the same engine serves M25 governance and zone/capacity rules.
- **M10 meeting rooms integrate Outlook/Graph** instead of a parallel scheduler; OASIS owns the floor-plan view + capacity/equipment metadata.
- **M19 attendance & M8 presence sources phased by trust/privacy.** MVP = QR/manual; access-control/biometric/IoT correlation = P3, read-only, privacy-gated. OASIS never runs physical security.
- **Privacy/monitoring governance is a first-class design pillar** (DPIA, role-scoped people-location with opt-out, aggregation thresholds, who-viewed-whom audit, analytics excluded from HR appraisal). B's most significant "do-it-better" over A.
- **Spatial model = single source of truth (PostGIS).** One shared desk/zone/floor geometry powers allocation, booking, occupancy, heatmap, search-highlight, and proximity.

---

## 3. The data contract — PostgreSQL + PostGIS schema (designed now, applied later)

> The schema below is the **single source of truth**. The frontend types (`lib/workspace/types.ts`) and mock data (`lib/workspace/mockData.ts`) are designed to map 1:1 onto these tables so the mock layer can be swapped for the Spring Boot REST layer with **zero shape changes**. SRID **0** (synthetic floor-plan CAD plane) is used for all in-building geometry; SRID **4326** (lat/long) is reserved for office/building footprints only.

### 3.0 Conventions

- **snake_case**; PK = `id uuid DEFAULT gen_random_uuid()` unless noted.
- Every business table carries `code text`, `status`, `created_at/updated_at timestamptz`, `created_by/updated_by uuid` (listed once here; omitted per-table for brevity). Soft-delete via `deleted_at` on master tables.
- Multi-tenant: `company_id` denormalised onto every operational table for RBAC/ABAC row filters and partition pruning. **The schema supports row-level security; RLS policy DDL is authored in the backend phase (§5.3), not in the migrations themselves.**
- **Unit system (fixed once):** all in-building geometry is in **pixels** on the CAD plane. `floor.width_px/height_px`, `floor.scale_cm_per_px` (real-distance calibration). The FE `Floor` type uses the **same px units** (`widthPx/heightPx/scaleCmPerPx`) — no metres anywhere. Geometry mirrors to FE-friendly bbox columns (`bbox_x,bbox_y,bbox_w,bbox_h,rot_deg`) so Konva renders `{x,y,w,h,rot}` without parsing WKT. Desk points use a fixed desk size for `w/h`.

### 3.1 Enums (DB literal = FE union value)

> **FE rule (systemic):** every enum maps to a **TypeScript string-literal union with the *same lowercase string values***. No PascalCase TS `enum`s, no numeric enums. Examples: `type DeskType = 'fixed'|'flexible'|'shared'|'reserved'|'hot'`; `type PriorityLevel = 'p1'|'p2'|'p3'|'p4'`.

```sql
CREATE TYPE space_status         AS ENUM ('active','inactive','under_construction','decommissioned','reserved_build');
CREATE TYPE service_line_kind    AS ENUM ('core','digital','data_ai','delivery','hr','admin','others');
CREATE TYPE element_kind         AS ENUM ('desk','meeting_room','zone','wall','door','pillar','amenity','phone_booth','collab_area','reception','label');
CREATE TYPE desk_type            AS ENUM ('fixed','flexible','shared','reserved','hot');
CREATE TYPE desk_state           AS ENUM ('available','allocated','blocked','maintenance','decommissioned');
CREATE TYPE allocation_type      AS ENUM ('permanent','flexible','shared','reserved','project');
CREATE TYPE booking_kind         AS ENUM ('hourly','half_day','full_day','multi_day');
CREATE TYPE booking_status       AS ENUM ('held','booked','checked_in','completed','cancelled','no_show','expired');
CREATE TYPE occupancy_state      AS ENUM ('booked','checked_in','vacant','occupied','no_show');
CREATE TYPE occupancy_event_type AS ENUM ('booked','hold','check_in','check_out','auto_release','no_show','sensor_occupied','sensor_vacant','admin_override');
CREATE TYPE presence_source      AS ENUM ('qr','rfid','biometric','manual','sensor','hrms','access_control','web','teams','whatsapp','system');
CREATE TYPE priority_level       AS ENUM ('p1','p2','p3','p4');   -- CEO=p1 ... others=p4 (config-driven)
CREATE TYPE move_status          AS ENUM ('draft','planned','approved','in_progress','completed','cancelled');
CREATE TYPE visitor_status       AS ENUM ('pending_approval','expected','checked_in','checked_out','no_show','cancelled');
CREATE TYPE visitor_kind         AS ENUM ('visitor','contractor','interview','vendor');
CREATE TYPE meeting_room_status  AS ENUM ('available','booked','in_use','maintenance');
CREATE TYPE policy_kind          AS ENUM ('priority','booking_window','no_show','privacy','allocation','cost','governance','sustainability');
CREATE TYPE qr_kind              AS ENUM ('desk','meeting_room','zone','floor','visitor_pass');
CREATE TYPE notification_kind    AS ENUM ('booking','no_show','move','governance','forecast','visitor','system');
CREATE TYPE notification_channel AS ENUM ('email','teams','slack','whatsapp','push','sms','in_app');
CREATE TYPE notification_status  AS ENUM ('queued','sent','delivered','read','failed');
CREATE TYPE heat_band            AS ENUM ('green','yellow','red');
CREATE TYPE visibility_scope     AS ENUM ('team','project','account','service_line','floor','company','private');
CREATE TYPE employee_status      AS ENUM ('active','on_leave','remote','separated','contractor');
CREATE TYPE app_role             AS ENUM ('super_admin','admin','facility_manager','employee','auditor');
CREATE TYPE agent_key            AS ENUM ('floorplan_vision','workspace_planning','occupancy_intelligence','demand_forecasting','team_seating','relocation_planning','cost_optimization','governance','executive_copilot','employee_assistance');
CREATE TYPE agent_run_status     AS ENUM ('queued','running','needs_review','applied','rejected','failed');
CREATE TYPE integration_category AS ENUM ('hrms','identity','comms','calendar','access','facilities');
CREATE TYPE integration_status   AS ENUM ('connected','disconnected','error');
```

### 3.2 Extensions & Flyway (single canonical migration list)

```sql
-- V1__extensions.sql (run first; owner/superuser)
CREATE EXTENSION IF NOT EXISTS postgis;        -- geometry + GiST
CREATE EXTENSION IF NOT EXISTS btree_gist;     -- REQUIRED for the no-double-booking exclusion constraint
CREATE EXTENSION IF NOT EXISTS pgcrypto;       -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;         -- case-insensitive email
```

Migrations live in `backend/src/main/resources/db/migration`, **authored now (this contract), applied in Phase 3.** Canonical, unified numbering (used identically by §5 and §6):

| File | Contents |
|---|---|
| `V1__extensions.sql` | postgis, btree_gist, pgcrypto, citext |
| `V2__platform_audit_idempotency.sql` | `app_user`, `user_role`, `audit_log` (partitioned), `idempotency_record`, RLS policy DDL |
| `V3__masters_hierarchy.sql` | `company, office, phase, building, floor, zone, service_line, account, project` + enums + GiST on geometry |
| `V4__spatial_space_element.sql` | `space_element` (geometry SSOT) + GiST/zone indexes |
| `V5__desk_room_inventory.sql` | `desk`, `meeting_room` (1:1 extensions) + deferred FKs |
| `V6__employee_master.sql` | `employee` (self-FK), resolve deferred `service_line.head_employee_id`, `project.manager_employee_id`, `employee.home_desk_id` |
| `V7__allocation_booking.sql` | `allocation` (+`allocation_one_permanent`), `booking` (+EXCLUDE no-overlap desk & room), `qr_code`, `visitor` |
| `V8__occupancy.sql` | `check_in` (+owner-only trigger), `occupancy_event` (partitioned), `occupancy_status`, `no_show`, `attendance_day` |
| `V9__policy_engine.sql` | `policy`, `policy_rule` |
| `V10__optimization_governance.sql` | `move_plan`, `move_item`, `governance_finding` |
| `V11__notifications_privacy.sql` | `notification_log`, `privacy_setting`, `integration` |
| `V12__analytics_rollups.sql` | `occupancy_daily`, `cost_snapshot`, `demand_forecast`, `sustainability_daily`, `collaboration_edge`, `agent_suggestion` |

### 3.3 Org hierarchy & spatial (D1 — M1, M5)

`Company → Office → Phase → Building → Floor → Zone → Service Line → Account → Project → Employee`. Key tables (representative DDL; full columns per V3–V4):

```sql
CREATE TABLE floor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company(id),
  building_id uuid NOT NULL REFERENCES building(id) ON DELETE CASCADE,
  code text NOT NULL, name text NOT NULL, level_no int NOT NULL,
  outline geometry(Polygon,0) NOT NULL,         -- CAD-plane boundary (SRID 0)
  width_px numeric(10,2) NOT NULL, height_px numeric(10,2) NOT NULL,   -- Konva stage extent (px)
  scale_cm_per_px numeric(10,4),                -- calibration for proximity/cost-per-area
  bg_image_url text, bg_opacity numeric(3,2) DEFAULT 0.5,             -- traced background (D2 manual-first)
  total_desks int DEFAULT 0, total_rooms int DEFAULT 0,
  status space_status NOT NULL DEFAULT 'active',
  UNIQUE (building_id, code)
);
CREATE INDEX floor_outline_gix ON floor USING gist (outline);

CREATE TABLE zone (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company(id),
  floor_id uuid NOT NULL REFERENCES floor(id) ON DELETE CASCADE,
  service_line_id uuid REFERENCES service_line(id),  -- colour-zone owner (M5); null = common area
  kind element_kind NOT NULL DEFAULT 'zone',
  code text NOT NULL, name text NOT NULL,
  area geometry(Polygon,0) NOT NULL,            -- colour zone polygon (containment / heatmap)
  color_hex text NOT NULL DEFAULT '#064281',
  bbox_x numeric(10,2), bbox_y numeric(10,2), bbox_w numeric(10,2), bbox_h numeric(10,2),
  capacity int, status space_status NOT NULL DEFAULT 'active',
  UNIQUE (floor_id, code)
);
CREATE INDEX zone_area_gix ON zone USING gist (area);
```

`service_line` (kind + `color_hex` drives zone colouring), `account`, `project` (account→project), plus `office`/`building` carry `geometry(Point|Polygon,4326)` footprints (server-only; not sent to FE).

### 3.4 Spatial element SSOT, Desk, Meeting Room (D2 — M3; D1/D3 — M4)

`space_element` is the canonical Konva canvas object (desk/meeting_room/zone/wall/door/pillar/amenity/phone_booth/collab_area/reception/label). `desk` and `meeting_room` are 1:1 typed extensions sharing the `space_element.id` PK.

```sql
CREATE TABLE space_element (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company(id),
  floor_id uuid NOT NULL REFERENCES floor(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES zone(id) ON DELETE SET NULL,  -- derived by ST_Within, persisted
  kind element_kind NOT NULL, code text, label text,
  geom geometry(Geometry,0) NOT NULL,           -- Point for desks; Polygon for rooms/zones/walls
  bbox_x numeric(10,2) NOT NULL, bbox_y numeric(10,2) NOT NULL,
  bbox_w numeric(10,2) NOT NULL DEFAULT 0, bbox_h numeric(10,2) NOT NULL DEFAULT 0,
  rot_deg numeric(6,2) NOT NULL DEFAULT 0, z_index int NOT NULL DEFAULT 0,
  style_json jsonb, is_bookable boolean NOT NULL DEFAULT false,
  status space_status NOT NULL DEFAULT 'active', deleted_at timestamptz,
  UNIQUE (floor_id, code)
);
CREATE INDEX space_element_geom_gix ON space_element USING gist (geom);
CREATE INDEX space_element_kind_ix  ON space_element (floor_id, kind);

CREATE TABLE desk (
  id uuid PRIMARY KEY,                          -- = space_element.id (1:1)
  company_id uuid NOT NULL REFERENCES company(id),
  floor_id uuid NOT NULL REFERENCES floor(id),
  zone_id uuid REFERENCES zone(id),
  service_line_id uuid REFERENCES service_line(id),
  desk_no text NOT NULL,
  desk_type desk_type NOT NULL DEFAULT 'flexible',
  desk_state desk_state NOT NULL DEFAULT 'available',
  has_monitor boolean DEFAULT false, has_dock boolean DEFAULT false,
  is_standing boolean DEFAULT false, is_accessible boolean DEFAULT false,
  amenities jsonb, monthly_cost numeric(12,2),  -- INR; feeds cost engine (M15)
  centroid geometry(Point,0) NOT NULL,          -- = space_element.geom
  CONSTRAINT desk_se_fk FOREIGN KEY (id) REFERENCES space_element(id) ON DELETE CASCADE,
  UNIQUE (floor_id, desk_no)
);
CREATE INDEX desk_centroid_gix ON desk USING gist (centroid);
CREATE INDEX desk_state_ix ON desk (floor_id, desk_state);

CREATE TABLE meeting_room (
  id uuid PRIMARY KEY,                          -- = space_element.id (1:1)
  company_id uuid NOT NULL, floor_id uuid NOT NULL REFERENCES floor(id),
  zone_id uuid REFERENCES zone(id), room_no text NOT NULL, name text NOT NULL,
  capacity int NOT NULL, equipment jsonb,
  status meeting_room_status NOT NULL DEFAULT 'available',
  outlook_resource_email citext, external_calendar_id text,  -- M10 Outlook/Graph
  area geometry(Polygon,0) NOT NULL,
  CONSTRAINT room_se_fk FOREIGN KEY (id) REFERENCES space_element(id) ON DELETE CASCADE,
  UNIQUE (floor_id, room_no)
);
```

### 3.5 Employee master & platform users/roles (D10 — M2)

`employee` (HRMS-mirrored: `emp_no, email citext, grade, title, service_line_id, account_id, project_id, manager_id self-FK, home_office_id, home_desk_id, priority priority_level DEFAULT 'p4', status employee_status, hrms_source, external_ref, photo_url`). `app_user` (SSO: `employee_id?, email, idp, external_sub, mfa_enabled`), `user_role` (`role app_role, scope_type, scope_id` for ABAC). **`app_user`/`user_role` are IdP-managed (Entra/Okta) — no CRUD UI; surfaced read-only via the role context and Privacy/Audit screens.**

### 3.6 Allocation, Booking, QR, Visitor (D3 — M4, M6, M7, M14, M17)

Holds are **folded into `booking` (`status='held'`, `hold_expires_at`)** — there is no separate `hold` table; the FE `BookingHold` type and the backend "Hold" concept both project onto held bookings + a Redis lock. QR is a first-class `qr_code` table (lifecycle/rotation). Room bookings reuse `booking.meeting_room_id` (there is **no separate `room_booking` table**; `booking` carries `title`, `organiser_id`, `party_size`, `source` to serve meeting-room screens).

```sql
CREATE TABLE allocation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, desk_id uuid NOT NULL REFERENCES desk(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employee(id), project_id uuid REFERENCES project(id),
  alloc_type allocation_type NOT NULL, priority priority_level NOT NULL DEFAULT 'p4',
  valid_from date NOT NULL DEFAULT current_date, valid_to date,
  validity daterange GENERATED ALWAYS AS (daterange(valid_from, valid_to, '[)')) STORED,
  status space_status NOT NULL DEFAULT 'active',
  CHECK (employee_id IS NOT NULL OR project_id IS NOT NULL)
);
-- only ONE active permanent allocation per desk:
CREATE UNIQUE INDEX allocation_one_permanent ON allocation (desk_id)
  WHERE (alloc_type = 'permanent' AND status = 'active');

CREATE TABLE booking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, code text NOT NULL,
  desk_id uuid REFERENCES desk(id) ON DELETE CASCADE,
  meeting_room_id uuid REFERENCES meeting_room(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employee(id),   -- owner (arrival is owner-only)
  booked_by uuid REFERENCES employee(id),               -- admin-on-behalf
  title text, organiser_id uuid REFERENCES employee(id), party_size int,  -- room bookings
  kind booking_kind NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  span tstzrange GENERATED ALWAYS AS (tstzrange(starts_at, ends_at, '[)')) STORED,
  status booking_status NOT NULL DEFAULT 'held', priority priority_level NOT NULL DEFAULT 'p4',
  hold_expires_at timestamptz,                          -- Redis-mirrored hold TTL
  idempotency_key text, source presence_source DEFAULT 'qr', notes text,
  CHECK (ends_at > starts_at),
  CHECK (desk_id IS NOT NULL OR meeting_room_id IS NOT NULL),
  UNIQUE (company_id, code)
);
CREATE INDEX booking_span_gix ON booking USING gist (span);
-- NO-DOUBLE-BOOKING (core invariant), desk + room:
ALTER TABLE booking ADD CONSTRAINT booking_no_overlap_desk
  EXCLUDE USING gist (desk_id WITH =, span WITH &&)
  WHERE (desk_id IS NOT NULL AND status IN ('held','booked','checked_in'));
ALTER TABLE booking ADD CONSTRAINT booking_no_overlap_room
  EXCLUDE USING gist (meeting_room_id WITH =, span WITH &&)
  WHERE (meeting_room_id IS NOT NULL AND status IN ('held','booked','checked_in'));
```

**Idempotency note (reconciled).** `booking.idempotency_key` is **not** a globally-unique column. Idempotency is enforced by a dedicated `idempotency_record(key, route, request_hash, response, created_at)` table (Redis-fronted, 24h TTL, scoped by `key+route+request_hash`); `booking.idempotency_key` is a nullable audit reference only. This avoids QR-nonce/route reuse collisions.

**Booking window (15/30/60d).** The DB intentionally does **not** constrain the horizon — it is enforced at runtime by the `booking_window` policy (§3.8). No column/constraint is expected here.

**Allocation vs booking overlap.** A `permanent`/`fixed`-allocated desk is **not bookable by others**: `desk.is_bookable=false` (and `space_element.is_bookable=false`) for fixed-allocated desks, set when the permanent allocation is created and cleared when vacated. The booking service rejects bookings on non-bookable desks (`WS-POLICY-DENIED`); the owner's own use is recorded as occupancy, not a booking. (Flexible/shared/reserved desks remain bookable and are guarded only by the time-overlap exclusion constraints above.)

`qr_code (kind qr_kind, target_id, token UNIQUE, url, is_active, rotated_at)`; `visitor (kind, full_name, org, host_employee_id, office_id, desk_id, expected_from/to, checked_in/out_at, badge_no, status visitor_status)` with `pending_approval` start state and an auto-expiry sweeper (§5.2.D4).

### 3.7 Check-in, Occupancy, No-show, Attendance (D4 — M7, M8, M19)

```sql
CREATE TABLE check_in (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, booking_id uuid NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employee(id),
  checked_in_at timestamptz NOT NULL DEFAULT now(), checked_out_at timestamptz,
  source presence_source NOT NULL DEFAULT 'qr',
  is_override boolean NOT NULL DEFAULT false, override_by uuid REFERENCES employee(id),
  qr_code_id uuid REFERENCES qr_code(id), geo_at geometry(Point,0),
  CHECK (checked_out_at IS NULL OR checked_out_at >= checked_in_at)
);
-- OWNER-ONLY ARRIVAL enforced at DB level (defence in depth; also enforced in service):
CREATE FUNCTION check_in_owner_guard() RETURNS trigger AS $$
BEGIN
  IF NOT NEW.is_override AND NEW.employee_id <> (SELECT employee_id FROM booking WHERE id = NEW.booking_id)
  THEN RAISE EXCEPTION 'WS-NOT-OWNER: arrival must be by booking owner unless overridden'; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER check_in_owner_trg BEFORE INSERT ON check_in
  FOR EACH ROW EXECUTE FUNCTION check_in_owner_guard();
```

`occupancy_event` (append-only, **PARTITIONED BY RANGE (occurred_at)** monthly; feeds occupancy + data lake), `occupancy_status` (1 row/desk live projection driving the floor colour), `no_show (grace_minutes DEFAULT 15, detected_at, released_at, escalation_level, escalated_to, resolved)`, `attendance_day` (one row/employee/day; columns: `present_office, first_seen_at, last_seen_at, desk_id, sources presence_source[], hrms_present, access_present, biometric_present, qr_present, hours_in_office`).

### 3.8 Policy/Rules, Optimization, Governance (D8 — M13, M15, M17, M25)

Reconciled to a **parent `policy` + child `policy_rule`** model (matches the FE `Policy{rules:PolicyRule[]}` shape):

```sql
CREATE TABLE policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, kind policy_kind NOT NULL, code text NOT NULL, name text NOT NULL,
  description text, scope_type text, scope_id uuid, is_active boolean NOT NULL DEFAULT true,
  effective_from date, effective_to date, UNIQUE (company_id, kind, code)
);
CREATE TABLE policy_rule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
  when_expr text NOT NULL, then_expr text NOT NULL,     -- human-readable rule engine
  priority_order int NOT NULL DEFAULT 100,              -- lower wins
  definition jsonb                                       -- declarative conditions+actions
);
```

`move_plan (code, name, reason, from_floor_id, to_floor_id, scheduled_for, status move_status, est_cost numeric INR, approver_id)`, `move_item (move_plan_id, employee_id, from_desk_id, to_desk_id, sequence_no, done)`, `cost_snapshot (period, scope_type, scope_id, total_cost INR, utilization_pct, cost_per_used_seat, consolidation_saving, recommendation jsonb)`, `governance_finding (policy_id, severity, message, entity_type, entity_id, raised_at, resolved)`.

### 3.9 Conversational, Notifications, Audit, Privacy, Integration (D9/D10)

`notification_log (recipient_employee_id, kind notification_kind, channel notification_channel, template_code, subject, body, related_type, related_id, status notification_status, sent_at/delivered_at/read_at, error)`. `audit_log` (PARTITIONED monthly; `actor_user_id, actor_employee_id, action, entity_type, entity_id, target_employee_id, ip, user_agent, before_json, after_json, occurred_at`) — **`action='view_person_location'` rows are the who-viewed-whom log** (the FE `PeopleLocationViewLog` is a projection of `audit_log`, not a separate table). `privacy_setting (employee_id PK, location_visibility visibility_scope DEFAULT 'team', show_on_search, share_presence, collab_analytics_opt_in DEFAULT false, attendance_analytics_opt_in DEFAULT false)`. `integration (category integration_category, provider, status integration_status, last_sync_at, config jsonb)` — the single canonical entity (FE `Integration` and the AI-plan `Connector` are the same thing; live-status persisted here). **`ChatMessage` is ephemeral — no table; `/copilot/chat` does not persist threads in MVP.**

### 3.10 Analytics / aggregates (M8/M12 heatmap, M15 cost, M16 collab, M18 forecast, M22)

`occupancy_daily (work_date, desk_id, floor_id, zone_id, service_line_id, booked_minutes, occupied_minutes, utilization_pct, was_no_show, heat_band)` — **heatmap *periods* (daily/weekly/monthly/quarterly) are query-time rollups over `work_date`, not a stored column**; the FE `HeatCell.period` is a request parameter, not a persisted field. `demand_forecast`, `sustainability_daily (energy_kwh, carbon_kg, occupancy_pct — all nullable)`, `cost_snapshot` (§3.8). **`collaboration_edge (a_employee_id, b_employee_id, shared_project_id, proximity_score, meetings_count, period, opt_in_confirmed boolean)`** is a lakehouse-derived aggregate table that backs `/workspace/collaboration` (opt-in only). **`agent_suggestion`** persists the HITL queue (§4.3 envelope: `agent agent_key, status agent_run_status, confidence, rationale, citations jsonb, payload jsonb, requires_review, reviewed_by/at/note`). **`WorkspaceKpis`/`ExecKpi` are computed (not stored)** — derived from `occupancy_status`/`occupancy_daily`/`cost_snapshot` at query time.

> **Heatmap query pattern:** `occupancy_daily` joined to `zone.area`/`desk.centroid`, aggregated by `floor_id` over a date range → per-element `utilization_pct` + `heat_band`; Konva paints the geometry. `ST_Within` keeps `space_element.zone_id`/`desk.zone_id` accurate for O(index) containment rollups.

### 3.11 TypeScript `lib/workspace/types.ts` ⇄ PostgreSQL mapping

| TS type (camelCase) | PostgreSQL | Notes |
|---|---|---|
| `Company/Office/Phase/Building` | `company/office/phase/building` | `office.geo? {lat,lng}` ⇄ Point(4326); building footprint server-only |
| `Floor` | `floor` | `widthPx/heightPx/scaleCmPerPx/bgImageUrl/bgOpacity`; `outline` omitted in FE |
| `Zone` | `zone` | `floorId, serviceLineId?, kind:ElementKind, colorHex, bbox:{x,y,w,h}`; server holds true polygon |
| `ServiceLine/Account/Project` | `service_line/account/project` | `kind:ServiceLineKind`, `colorHex` |
| `Employee` | `employee` | `priority:PriorityLevel ('p1'..'p4')`, `status:EmployeeStatus`; FK ids only |
| `SpaceElement` (**FE adds**) | `space_element` | `kind:ElementKind`, `geometry:{x,y,w,h,rot}` ⇄ bbox/rot, `styleJson?`, `zIndex`, `isBookable` |
| `Desk` | `desk` | `deskType:DeskType (incl 'hot')`, `deskState:DeskState (incl 'decommissioned')`, `amenities:string[]`, `monthlyCost?`, `geometry:{x,y,w,h,rot}` (point uses fixed w/h) |
| `MeetingRoom` | `meeting_room` | `status:MeetingRoomStatus ('available'|'booked'|'in_use'|'maintenance')`, `equipment:string[]`, `outlookResourceEmail?` |
| `Allocation` | `allocation` | `allocType:AllocationType ('permanent'|'flexible'|'shared'|'reserved'|'project')`, `priority:PriorityLevel`, `validFrom/To: ISO date` |
| `Booking` | `booking` | `kind:BookingKind`, `status:BookingStatus ('held'|'booked'|'checked_in'|'completed'|'cancelled'|'no_show'|'expired')`, `startsAt/endsAt: ISO`, `source:PresenceSource`, `title?/organiserId?/partySize?` (rooms) |
| `BookingHold` | `booking` (held rows) | projection: `{id, deskId, slot, heldByEmployeeId, expiresAt}` from `status='held'`+`hold_expires_at` |
| `QrCode` (**FE adds**) | `qr_code` | `kind:QrKind`, `targetId`, `token`, `url?`, `isActive` |
| `Visitor` | `visitor` | `kind:VisitorKind`, `status:VisitorStatus (incl 'pending_approval')` |
| `CheckIn` (**FE adds**) | `check_in` | `bookingId`, `checkedInAt/Out?`, `isOverride`, `source:PresenceSource` |
| `OccupancyEvent` | `occupancy_event` | `type:OccupancyEventType`, `state?:OccupancyState`, `source:PresenceSource` (unified vocab), `at:ISO` |
| `OccupancyStatus`/`DeskLiveStatus` | `occupancy_status` | `state:OccupancyState`, drives live floor colour |
| `NoShowAlert` | `no_show` | `escalationLevel`, `resolved` |
| `AttendanceCorrelation` | `attendance_day` | aligned fields: `presentOffice, hrmsPresent, accessPresent, biometricPresent, qrPresent, sources:PresenceSource[], hoursInOffice, deskUsed` |
| `MovePlan/MoveItem` | `move_plan/move_item` | `status:MoveStatus`, `estCost?` INR |
| `CostMetric` | `cost_snapshot` | `scopeType`, `costPerUnit/totalCost`, `consolidationSaving?` |
| `Policy`+`PolicyRule` | `policy`+`policy_rule` | parent + children; `PolicyRule{when,then,priority}` ⇄ `when_expr/then_expr/priority_order` |
| `GovernanceFinding` | `governance_finding` | `severity:'info'|'warn'|'critical'`, `resolved` |
| `HeatCell` | `occupancy_daily` (+ query period) | `period` is a query param, not stored; `level:HeatLevel` ⇄ `heat_band` |
| `ForecastPoint` | `demand_forecast` | `predictedOccupancy/confidence` |
| `CollaborationEdge` | `collaboration_edge` | lakehouse aggregate; opt-in |
| `TeamSeatingSuggestion` / `SitNearOptions` | `agent_suggestion` | persisted HITL payload of `team_seating` agent |
| `SustainabilityMetric` | `sustainability_daily` | `energyKwh?/carbonKg?` **optional** (proxies until IoT) |
| `Notification` | `notification_log` | `kind:NotificationKind`, `channel:NotificationChannel`, `read`↔`status='read'` |
| `ChatMessage` | — (ephemeral) | not persisted |
| `PeopleLocationViewLog` | `audit_log` (projection) | `action='view_person_location'`, `targetEmployeeId` |
| `PrivacyOptOut`/`PrivacySetting` | `privacy_setting` | `locationVisibility:VisibilityScope`, opt-ins |
| `Integration` (= `Connector`) | `integration` | `category:IntegrationCategory`, `status:IntegrationStatus` |
| `AgentSuggestion<T>` | `agent_suggestion` | §4.3 envelope; `agent:AgentKey`, `status:AgentRunStatus` |
| `AppUser/UserRole` | `app_user/user_role` | IdP-managed, no CRUD UI |
| `WorkspaceKpis/ExecKpi` | computed | derived, not stored |

**FE primitive rules (1:1):** uuid/bigint → `string`; enum → string-literal union (identical lowercase literals); `timestamptz` → ISO datetime `string`; `date` → ISO date `'YYYY-MM-DD'`; `numeric` money → `number` (INR via `Money`/`inr()`); `jsonb` → typed interface; geometry → `{x,y,w,h,rot}` (canvas) / `{x,y}` (point) / `{lat,lng}` (4326); range types → endpoint pairs (`startsAt/endsAt`, `validFrom/validTo`) — the range is DB-internal for the exclusion constraint.

### 3.12 Mock-mirroring guidance (`lib/workspace/mockData.ts`)

1. **IDs as stable strings, reference by id** (never embed nested objects where the DB has an FK); provide `byId` getters (`getDesk`, `getEmployee`) — these become the GET-by-id calls.
2. **Enums = exact DB literal unions** in data (`deskType:'flexible'`, `status:'checked_in'`); format only in the UI layer.
3. **Geometry as `{x,y,w,h,rot}`** on every `SpaceElement`/`Desk`/`Zone`; one floor's elements in an array keyed by `floorId`.
4. **Dates as ISO strings** (`startsAt/endsAt` datetimes; allocations/attendance `'YYYY-MM-DD'`); helpers `nowISO()`, `addDays()`, `inr()`.
5. **Respect invariants:** no overlapping bookings per desk (`hasOverlap()` guard), one active permanent allocation per desk, fixed-allocated desks `isBookable=false`.
6. **Aggregates as precomputed arrays** (`occupancyDaily[]`, `costSnapshot[]`, `demandForecast[]`, `collaborationEdge[]`) read like API responses; derive `heatBand` from `utilizationPct` via one shared helper.
7. **Privacy/role mock:** `privacySetting` rows + a `currentUser{role,scope}`; `scopedSearch()` honours `locationVisibility`/`showOnSearch`; `heatmapBins(threshold)` returns "insufficient data" below N — privacy is structural from day one.
8. **Service boundary = one mock module per future controller** (group helpers by domain D1–D10) so each maps to a Spring `@RestController` later.

---

## 4. PHASE 1 — FRONTEND (entire frontend, mock data)

Build the entire frontend first, against the mock layer. `C` = client component (`'use client'` — has handlers/canvas/state). `S` = server component. All file paths are relative to repo `frontend/`.

### FE-0 — Foundation (build & `tsc`-verify before any screen)

**Pre-flight:** `cd frontend && npm i konva react-konva`.

**0.1 `app/[module]/page.tsx`** — add `'workspace'` to `DEDICATED_ROUTES` (critical gotcha):
```ts
const DEDICATED_ROUTES = new Set(['invoicing', 'travel', 'workspace']);
```

**0.2 `components/ui/Icon.tsx`** — extend `IconName` + `PATHS`: `desk, floor, building, office, zone, qr, map, grid, seat, meetingRoom, heatmap, forecast, relocation, visitor, shield, robot, clock, userGroup, lock, unlock, zoomIn, zoomOut, crosshair, image, filter, calendar`. Reuse: `search, bell, analytics, settings, check, alert, eye, edit, trash, plus, download, upload, arrowLeft, chevronRight/Down, close, workspace`.

**0.3 `lib/workspace/types.ts`** — all domain types as **string-literal unions** mirroring §3 exactly. Includes (per §3.11): the org/spatial types, **`SpaceElement` + `ElementKind`** (walls/doors/pillars/labels — required by Studio), `Desk` (with `geometry:{x,y,w,h,rot}`, `deskType` incl `'hot'`, `deskState` incl `'decommissioned'`), `MeetingRoom`, `Employee` (`priority:PriorityLevel`), `Allocation`, `Booking` (incl room fields), `BookingHold`, **`QrCode`+`QrKind`**, `Visitor`, **`CheckIn`**, `OccupancyEvent`/`OccupancyStatus`/`NoShowAlert`/`AttendanceCorrelation` (aligned fields), intelligence types (`HeatCell`, `ForecastPoint`, `CollaborationEdge`, `TeamSeatingSuggestion`, `SustainabilityMetric` with optional energy/carbon), `MovePlan`/`MoveItem`/`CostMetric`/`Policy`+`PolicyRule`/`GovernanceFinding`, `Notification`(+`kind`+`channel`)/`ChatMessage`/`ExecKpi`, privacy/platform (`Role`, `PeopleLocationViewLog`, `PrivacySetting`, `Integration`), **agent envelope `AgentKey`/`AgentRunStatus`/`AgentSuggestion<T>`** + per-agent payloads (`DetectedLayout`, `SeatingPlanProposal`, `OccupancyInsight`, `OccupancyForecast`, `SitNearOptions`, `MovePlan`, `CostOptimization`, `GovernanceFinding`), `WorkspaceKpis`.

The agent envelope (mock now, Java DTO later, Python response later — identical shape):
```ts
export type AgentKey = 'floorplan_vision'|'workspace_planning'|'occupancy_intelligence'|'demand_forecasting'
  |'team_seating'|'relocation_planning'|'cost_optimization'|'governance'|'executive_copilot'|'employee_assistance';
export type AgentRunStatus = 'queued'|'running'|'needs_review'|'applied'|'rejected'|'failed';
export interface AgentSuggestion<T> {
  id: string; agent: AgentKey; status: AgentRunStatus; confidence: number; rationale: string;
  citations?: { source: string; ref: string }[]; payload: T; requiresReview: boolean;
  createdAt: string; createdBy: string; reviewedBy?: string; reviewedAt?: string; reviewNote?: string;
}
```

**0.4 `lib/workspace/mockData.ts`** — rich, internally-consistent datasets per §3.12: hierarchy (≥3 floors, one with `bgImageUrl`), 7 service lines, 5 accounts, projects; spatial (`spaceElements[]` incl walls/doors, `zones[]`, ≥120 `desks[]` with `geometry`+`zoneId`, all desk types/states, some `monthlyCost`, `meetingRooms[]`); ≥60 `employees[]` (manager chains, FKs, `priority`, `homeDeskId`) + `employeeImportPreview[]`; `allocations[]`, `bookings[]` (all statuses/kinds incl `held`, today+window), `qrCodes[]`, `visitors[]` (incl `pending_approval`); `occupancyEvents[]`, `deskLiveStatus[]`, `noShowAlerts[]`, `attendance[]`; `heatCells[]`, `forecast[]`, `collaborationEdges[]`, `teamSeatingSuggestions[]`, `sustainability[]`; `movePlans[]`+`moveItems[]`, `costMetrics[]`, `policies[]`+rules, `governanceFindings[]`; `agentSuggestions[]` (mixed confidence), `chatSeed[]`, `notifications[]`, `execKpis[]`, `integrations[]`, `privacySettings[]`, `viewLogs[]`; aggregates `kpis`, `monthlyUtilization[]`, `floorUtilization[]`, `serviceLineMix[]`. Helpers: `inr`, `pct`, `fmtDate/Time`, `nowISO`, `addDays`, `deskStateColor(state)`, `heatColor(level)`, `utilisation()`, `heatmapBins(threshold)`, `scopedSearch(query,filters,currentUser)`, `hasOverlap()`, and getters (`getFloor`, `getDesksByFloor`, `getZonesByFloor`, `getEmployee`, `getDesk`, `getBooking`, `getLiveStatus`, `searchAll`, `getMyBookings`, `getRoom`).

**0.5 `components/workspace/ui.tsx`** (server-safe, no hooks) — `StatCards`/`Stat`; badge-per-enum: `DeskStateBadge, BookingStatusBadge, DeskTypeBadge, SpaceStatusBadge, HeatBadge, PriorityBadge, RoomStatusBadge, VisitorStatusBadge, GovernanceSeverityBadge`; `Money, Pct, Legend, EmptyState`; **agent/privacy components** `AgentSuggestionCard, ConfidenceChip, ReviewGateControls, ConnectorCard, ScopeNotice, AuditBanner`.

**0.6 `components/workspace/floorplan.tsx`** (`'use client'`, consumed via `dynamic(ssr:false)`) — single reusable Konva canvas powering Floor view, Studio, Search highlight, Heatmap, Occupancy, Team-seating. Consumes `SpaceElement[]` (`{x,y,w,h,rot}`). Props:
```ts
interface FloorPlanProps {
  floor: Floor; elements: SpaceElement[]; desks: Desk[]; zones: Zone[]; rooms?: MeetingRoom[];
  mode: 'view'|'design'|'heatmap'|'occupancy'|'search';
  liveStatus?: Record<string, DeskState | OccupancyState>; heat?: Record<string, HeatLevel>;
  highlightDeskIds?: string[]; selectedDeskId?: string;
  showZones?: boolean; showRooms?: boolean; showLabels?: boolean; showMinimap?: boolean;
  backgroundImageUrl?: string; backgroundOpacity?: number;
  onSelectDesk?: (id: string) => void; onMoveDesk?: (id: string, pos: Point) => void;
  onAddElement?: (kind: ElementKind, pos: Point) => void; onDrawZone?: (poly: Polygon) => void;
}
```
Behaviour: background image (traceable in design mode), zone polygons (filled `colorHex`, low alpha), desks as draggable points, rooms/walls/doors/pillars as labelled polygons (palette of `ElementKind`). Wheel-zoom + drag-pan, fit-to-screen, optional minimap. Desk colour map by `mode` from the single source `deskStateColor()`/`heatColor()` (shared with `<Legend>`). `design` mode: drag→`onMoveDesk`, palette drop→`onAddElement`, polygon tool→`onDrawZone`; `search` mode pulses highlights and dims the rest.

**0.7 `app/workspace/workspace.css`** — imported by `layout.tsx`; reuses `globals.css` tokens; adds `ws-`-prefixed classes (mirror travel): `.ws-subnav`/`.ws-tab__badge`, `.ws-toolbar`/`.field`/`.spacer`, `.ws-stat-strip`/`.ws-stat-card`+`__icon/__value/__label/--accent`, `.data-table`/`.table-card`, `.ws-pill` tones (`ws-ok ws-vacant ws-booked ws-occupied ws-noshow ws-warn ws-info ws-muted ws-danger`), `.seg`, `.row-actions`/`.btn--icon`, plus floor-plan: `.ws-canvas-wrap`, `.ws-canvas-toolbar`, `.ws-legend`/`__swatch`, `.ws-minimap`, `.ws-heat-cell`, `.ws-split`, `.ws-inspector`.

**0.8 `app/workspace/layout.tsx`** (`'use client'`) — mirror `app/travel/layout.tsx`: `import './workspace.css'`, crumbs `Home > Workspace`, page-head, sticky `<nav className="ws-subnav">`. Canonical tabs:

| Tab | href | icon | badge |
|---|---|---|---|
| Overview | `/workspace` | dashboard | — |
| Floor | `/workspace/floor` | map | — |
| Studio | `/workspace/studio` | grid | — |
| Booking | `/workspace/booking` | seat | — |
| Occupancy | `/workspace/occupancy` | crosshair | open no-shows |
| Search | `/workspace/search` | search | — |
| Rooms | `/workspace/rooms` | meetingRoom | — |
| Intelligence | `/workspace/heatmap` | heatmap | — |
| Masters | `/workspace/masters` | building | — |
| Admin | `/workspace/governance` | shield | open findings |
| Copilot | `/workspace/copilot` | robot | — |

`isActive` = exact for `/workspace`, `startsWith` otherwise. Secondary routes live as in-page links to avoid an overcrowded bar.

**FE-0 exit checklist**
- [ ] `npx tsc --noEmit` passes (foundation only).
- [ ] `'workspace'` in `DEDICATED_ROUTES`.
- [ ] `konva`/`react-konva` installed; `floorplan.tsx` is `'use client'` and imported only via `dynamic(ssr:false)`.
- [ ] Every type is a string-literal union with the exact DB literal; each interface has a 1:1 table mapping (§3.11).
- [ ] `next build` succeeds with a temporary `app/workspace/page.tsx` placeholder rendering StatCards from mock `kpis`.

### Canonical route / screen inventory (`app/workspace/*`)

> **This is the single canonical route set.** Backend (§5) and AI (§7) reference these exact paths. Where earlier drafts used variants (`/book`, `/bookings`, `/dashboard`, `/seating`, `/integrations`, `/desks`, `/floor/[id]`, `/qr/[token]`), the canonical names below win.

**D1 — Master & Spatial**

| Route | Purpose | Key components | C/S |
|---|---|---|---|
| `masters/page.tsx` | Hierarchy tree Company→…→Zone + counts; tabbed master tables | tree, StatCards, `data-table` | C |
| `masters/floors/[id]/page.tsx` | Floor detail: meta + desk roster + mini preview | FloorPlan(`view`), `data-table` | C |
| `masters/desks/page.tsx` | Desk master table: type/status/zone/cost, filters | `ws-toolbar`, `data-table`, DeskTypeBadge | C |
| `zones/page.tsx` | Service-line colour zones manager | Legend, `data-table`, FloorPlan(`view`,showZones) | C |

**D2 — Floor-Plan Studio**

| Route | Purpose | Key components | C/S |
|---|---|---|---|
| `studio/page.tsx` | Launcher: pick floor, list plans, import-background/start-blank | `grid-modules`, `data-table` | C |
| `studio/[floorId]/page.tsx` | Manual designer: place/move elements (desks/walls/doors/…), draw zones, trace background; inspector | FloorPlan(`design`), `ws-inspector`, `ws-canvas-toolbar` | C |
| `studio/import/page.tsx` | Assisted import: upload PDF/Image/CAD/Visio/Excel → AI-detect (review-gated) + review queue (ghosted proposals) | dropzone, `AgentSuggestionCard`, `ReviewGateControls`, review table | C |

**D3 — Allocation & Booking**

| Route | Purpose | Key components | C/S |
|---|---|---|---|
| `floor/page.tsx` | Interactive seat-map (movie-seat UX): pick floor, click desk→book; legend; live states | FloorPlan(`view`+liveStatus), Legend, booking drawer | C |
| `allocation/page.tsx` | Allocation admin (fixed/flexible/shared/reserved); assign employee↔desk; AI seating proposals panel | `data-table`, DeskTypeBadge, assign modal, `AgentSuggestionCard` | C |
| `booking/page.tsx` | Booking: date/window (15/30/60d)/kind (hourly/half/full/multi-day), pick desk on map, "sit near team" toggle | `seg`, date picker, FloorPlan(`view`), confirm panel | C |
| `booking/my/page.tsx` | My bookings: upcoming/past, modify/cancel | `data-table`, BookingStatusBadge, row-actions | C |
| `booking/[id]/page.tsx` | Booking detail + QR token + actions | QR block, StatCards | C |
| `qr/page.tsx` | QR experience: book / confirm-arrival (owner-only) / modify / cancel / view; admin-override toggle | action buttons, status pill, role guard | C |
| `visitors/page.tsx` | Visitor/contractor: register (sponsor), assign temp desk, badge, validity, approval | `data-table`, VisitorStatusBadge, add modal | C |

**D4 — Occupancy & Presence**

| Route | Purpose | Key components | C/S |
|---|---|---|---|
| `occupancy/page.tsx` | Live board: Booked/Checked-In/Vacant/Occupied/No-Show, floor map + counts | FloorPlan(`occupancy`), StatCards, Legend | C |
| `occupancy/no-shows/page.tsx` | No-show alerts + escalation ladder, resolve | `data-table`, GovernanceSeverityBadge, row-actions | C |
| `occupancy/attendance/page.tsx` | Attendance correlation (HRMS/access/biometric/QR) — opt-in, excluded-from-appraisal banner | `data-table`, `ScopeNotice`/privacy banner | C |

**D5 — Search & Wayfinding + Meeting Rooms**

| Route | Purpose | Key components | C/S |
|---|---|---|---|
| `search/page.tsx` | Search desk/employee/ID/SL/account/project/floor/location → results + highlight on plan (privacy-scoped) | search box, filter `seg`, results, FloorPlan(`search`), `ScopeNotice` | C |
| `rooms/page.tsx` | Meeting-room intelligence: capacity/equipment/availability grid | `ws-toolbar`, room cards, `data-table`, RoomStatusBadge | C |
| `rooms/[id]/page.tsx` | Room detail + availability timeline + "Outlook (future)" stub | timeline, equipment, StatCards | C |

**D6 — Intelligence & Analytics**

| Route | Purpose | Key components | C/S |
|---|---|---|---|
| `heatmap/page.tsx` | Heatmap green/yellow/red, period seg (daily/weekly/monthly/quarterly) | FloorPlan(`heatmap`), `seg`, HeatBadge, Legend | C |
| `forecast/page.tsx` | Demand forecasting: predicted occupancy vs capacity per floor/SL | `.chart` bars, confidence pills, `data-table` | C |
| `sustainability/page.tsx` | Sustainability (energy/carbon vs occupancy; estimates badge) | StatCards, `.chart`, `data-table` | C |
| `reports/page.tsx` | Reports hub: utilization/cost/no-show/mix; export stubs | StatCards, `.chart`, `data-table`, download btns | C |

**D7 — Collaboration-Aware Seating**

| Route | Purpose | Key components | C/S |
|---|---|---|---|
| `team-seating/page.tsx` | Sit-near: target (team/manager/project/account/collaborators) → suggested desks on map | `seg`, suggestion cards, FloorPlan(`search`) | C |
| `collaboration/page.tsx` | Collaboration intelligence graph/table (opt-in banner) | proximity table, opt-in notice | C |

**D8 — Optimization & Governance**

| Route | Purpose | Key components | C/S |
|---|---|---|---|
| `relocation/page.tsx` | Move plans list, status, affected employees | `data-table`, status pills | C |
| `relocation/[id]/page.tsx` | Move-plan detail: from→to items, simulate on map | FloorPlan(`view`+highlight), `data-table` | C |
| `cost/page.tsx` | Cost engine: cost per desk/employee/floor/SL + consolidation savings (INR) | StatCards, `data-table`, Money, `seg` | C |
| `governance/page.tsx` | Governance engine: findings list, severity, resolve | `data-table`, GovernanceSeverityBadge | C |
| `policies/page.tsx` | Policy/Rules engine: rule sets (booking/priority/occupancy/privacy/governance), enable toggles | `data-table`, rule editor cards, toggles | C |

**D9 — Conversational, Executive & Notifications**

| Route | Purpose | Key components | C/S |
|---|---|---|---|
| `copilot/page.tsx` | Workplace Copilot chat (Web; Teams/WhatsApp/Mobile channel stubs) | chat thread, input, suggested actions | C |
| `command-center/page.tsx` | Executive command center: org-wide KPIs, utilization, cost, alerts | ExecKpi StatCards, `.chart`, alert feed | C |
| `notifications/page.tsx` | Notification engine: feed, filters, mark-read | feed, filter `seg`, read toggle | C |

**D10 — Platform, Identity, Integration + Privacy + Audit**

| Route | Purpose | Key components | C/S |
|---|---|---|---|
| `employees/page.tsx` | Employee master list (filter by SL/account/project) | `ws-toolbar`, `data-table`, row-actions | C |
| `employees/import/page.tsx` | Import: upload → column map → validation preview (ok/warn/error) | dropzone, mapping `seg`, preview table | C |
| `employees/[id]/page.tsx` | Employee detail: desk, allocations, bookings, locate-on-map, privacy toggle | StatCards, FloorPlan(`search`) | C |
| `settings/page.tsx` | Settings & Integration Hub: HRMS/Identity/Comms/Calendar/Access/Facilities connectors | `ConnectorCard`, status pills, toggles | C |
| `privacy/page.tsx` | Privacy console: role-scoped visibility, opt-outs, aggregation-threshold note | opt-out toggles, `ScopeNotice` | C |
| `audit/page.tsx` | Auditor (read-only): who-viewed-whom log, override log, agent-action log | `data-table` (view logs), `AuditBanner` | C |
| `page.tsx` | **Overview dashboard:** KPIs, utilization chart, needs-attention (no-shows/findings), quick actions, mini live map | StatCards, `.chart`, `act` list, `grid-modules`, FloorPlan(`occupancy`,compact) | C |

> **Premium stub (FE-4):** `digital-twin/page.tsx` — 2D/3D overlay placeholder, "PREMIUM" badge, `empty`-state teaser. **No table/type/endpoint** until P3.

### FE sub-phases (ordered)

**FE-1 — Spine (MVP).** `page.tsx` (Overview), `floor`, `studio`+`studio/[floorId]`, `masters`+`masters/floors/[id]`+`masters/desks`, `zones`, `employees`+`employees/import`+`employees/[id]`, `allocation`, `booking`+`booking/my`+`booking/[id]`, `qr`, `occupancy`+`occupancy/no-shows`, `search`.
Exit: sub-nav active+badges; floor seat-map zoom/pan/minimap, click-select, state colours+legend via `deskStateColor()`; Studio places/moves elements + draws zone + traces background (`'use client'`); booking reads window/kind, shows held/booked desks; QR enforces owner-only arrival + admin-override toggle; occupancy shows 5 states, no-shows resolvable; search highlights on plan (privacy-scoped); import shows ok/warn/error; `tsc --noEmit` clean, every route HTTP 200, `next build` green.

**FE-2 — Intelligence.** `heatmap`, `forecast`, `sustainability`, `reports`, `team-seating`, `collaboration`, `rooms`+`rooms/[id]`, `occupancy/attendance`, `studio/import` (assisted-import review stub), `command-center`.
Exit: heatmap overlay + period seg; forecast/sustainability charts from mock; rooms show capacity/equipment/availability + Outlook stub; team-seating seg highlights suggestions; collaboration/attendance show opt-in + excluded-from-appraisal banners; assisted-import shows ghosted proposals + `ReviewGateControls`; `tsc` clean, 200, `next build` green.

**FE-3 — Admin / governance.** `relocation`+`relocation/[id]`, `cost`, `governance`, `policies`, `visitors`, `settings`, `privacy`, `audit`, `notifications`.
Exit: relocation detail simulates from→to on map; cost engine per desk/employee/floor/SL + savings (INR); policy/rules with enable toggles; governance findings resolvable; privacy console + audit (who-viewed-whom) + aggregation-threshold note; settings shows all 6 connector categories; `tsc` clean, 200, `next build` green.

**FE-4 — Conversational + Premium stubs.** `copilot` (chat + Teams/WhatsApp/Mobile channel stubs), `digital-twin` (premium placeholder), AR/IoT/biometric "future" notes on relevant screens.
Exit: copilot chat works against `chatSeed`, actions link to real routes; digital-twin renders without 3D deps; full `tsc --noEmit` clean across all routes; dev server 200 on every `/workspace/*`; `next build` green and `/workspace` is NOT shadowed by the catch-all.

**Files to create/edit (absolute):** `frontend\app\[module]\page.tsx` (edit), `frontend\components\ui\Icon.tsx` (edit), `frontend\lib\workspace\types.ts`, `frontend\lib\workspace\mockData.ts`, `frontend\components\workspace\ui.tsx`, `frontend\components\workspace\floorplan.tsx` (`'use client'`), `frontend\app\workspace\workspace.css`, `frontend\app\workspace\layout.tsx` (`'use client'`), and all `frontend\app\workspace\*` route files above.

---

## 5. PHASE 2 — BACKEND (Spring Boot services + REST APIs)

Built **after** the frontend. The mock types in `frontend/lib/workspace/types.ts` are the **API contract**: every DTO is the JSON serialization of those types, so the FE swaps mock → API screen-by-screen with no shape changes. Stack: **Java 21 + Spring Boot 3.x**, modular monolith `oasis-workspace-service` (internal modules per domain; cross-module calls via published service interfaces only). PostgreSQL 16 + PostGIS 3.4, Redis 7, Kafka / Azure Service Bus, object store, Entra ID / OIDC. Base path `/api/workspace/v1`. DB migrations authored as the contract (§3.2), applied in Phase 3.

### 5.1 Module breakdown

| Module | Domain | Owns |
|---|---|---|
| `ws-platform` | cross-cutting | Security chain, RBAC/ABAC + privacy `ScopeResolver`, RFC-7807 error model, pagination, idempotency store, audit writer, event publisher, OpenAPI |
| `ws-spatial-master` | D1 | company/office/phase/building/floor/zone/service_line/account/project; status lifecycle; hierarchy tree; zone↔SL colour |
| `ws-floorplan` | D2 | `space_element` (SSOT geometry), `desk`, `meeting_room`, plan versions, background refs, assisted-import jobs (HITL) |
| `ws-allocation-booking` | D3 | allocation, booking (held→booked lifecycle), check_in, qr_code, visitor; concurrency (exclusion constraint + Redis holds + idempotent QR); priority via Policy |
| `ws-occupancy` | D4 | occupancy_event (append-only), occupancy_status projection, no_show detection scheduler + escalation, attendance correlation (P2) |
| `ws-search-wayfinding` | D5 | unified search → geometry refs for highlight-on-plan; meeting-room availability (Outlook/Graph adapter P2) |
| `ws-analytics` | D6 | KPI rollups, heatmap aggregation (PostGIS), utilisation/trends, sustainability (P2), forecast read API; aggregation thresholds |
| `ws-optimization-governance` | D8 | move/relocation plans, cost model, consolidation, governance findings; gated by Policy |
| `ws-policy` | policy engine (D3,D8) | policy + policy_rule; `evaluate(context)→decision`; priority tiers p1..p4; booking-window/capacity/zone rules — no hardcoded priorities |
| `ws-collab-seating` | D7 | sit-near via PostGIS proximity + org graph (privacy-scoped); opt-in collaboration analytics |
| `ws-identity-integration` | D10 | employee master (HRMS mirror), import (CSV/Excel + sync), integration adapters, auto-release-on-exit, webhook intake |
| `ws-conversational` | D9 | notification dispatch, channel routing, copilot gateway → Python orchestrator, exec command-center read |
| `oasis-workspace-ai` (Python, P2+) | AI | the 10 agents (LangGraph); Spring calls over HTTP; HITL/review-gated |

### 5.2 REST API (mapped to canonical screens)

Conventions: JSON; DTOs = serialized FE types; list endpoints `?page&size&sort`+filters → `Page<T>`; creates accept `Idempotency-Key` header; responses carry `traceId`; errors = RFC-7807 (§5.3).

**D1 `/masters`, `/spatial`:** `GET /spatial/hierarchy` (→ all filter bars, `masters`); `GET|POST|PUT|PATCH /masters/{type}[/{id}][/status]` (`masters`); `GET /masters/service-lines`; `GET|POST|PUT /masters/zones[?floorId]` (`zones`, `floor`, `studio`); `GET /masters/accounts/{id}/projects`.

**D2 `/floors`,`/elements`,`/desks`,`/rooms`:** `GET /floors/{floorId}/plan` (single fetch powering `floor` + `studio/[floorId]` — floor extent, bg, all `space_element`, zones, desks, rooms); `GET /floors/{floorId}/plan/versions`; `POST /floors/{floorId}/elements`·`PUT /elements/{id}`·`PATCH /elements/bulk`·`DELETE /elements/{id}` (`studio/[floorId]`); `POST|PUT /desks`·`PATCH /desks/{id}/status`·`GET /desks?floorId&zoneId&type&state&serviceLineId` (`masters/desks`); `POST|PUT /rooms` (`studio`,`rooms`); `POST /floors/{floorId}/background`; `POST /floors/{floorId}/import-jobs`·`GET /import-jobs/{jobId}`·`POST /import-jobs/{jobId}/apply` (`studio/import`, HITL).

**D3 `/allocations`,`/bookings`,`/qr`,`/visitors`:** `GET /desks/availability?floorId&date&from&to&type` (`floor`,`booking`); `POST /holds` (creates `booking status='held'` + Redis lock; 120s TTL; 409 if contended)·`DELETE /holds/{id}` (`booking`); `POST /bookings` (confirm from hold; Policy eval; transactional; emits `booking.confirmed`; returns booking+QR)·`GET /bookings?…`·`GET /bookings/{id}` (`booking/[id]`,`booking/my`)·`PATCH /bookings/{id}`·`POST /bookings/{id}/extend`·`DELETE /bookings/{id}`; `GET|POST|PUT|DELETE /allocations[…]`·`POST /allocations/bulk` (`allocation`,`floor`); `GET|POST|PATCH /visitors` (`visitors`). **QR** (idempotent, mobile-web): `GET /qr/{qrToken}`·`POST /qr/{qrToken}/book`·`POST /qr/{qrToken}/arrive` (owner-only; `WS-NOT-OWNER` 403; admin-override audited; emits `checkin.confirmed`)·`POST /qr/{qrToken}/modify|cancel`·`POST /qr/admin/regenerate?deskId=` — all → `qr`.

**D4 `/occupancy`,`/no-shows`:** `POST /occupancy/events` (append-only, idempotent); `GET /floors/{floorId}/occupancy` (live projection → `floor` overlay, `occupancy`); `GET /occupancy/stream` (SSE/WebSocket → live board); `GET /no-shows?floorId&date`·`POST /no-shows/{bookingId}/release` (`occupancy/no-shows`). **No-show scheduler (specified):** a grace-window job (per booking `grace_minutes`, default 15) flips `booking.status='no_show'`, inserts `no_show`, sets `released_at`, frees the desk (`occupancy_status='vacant'`), emits `noshow.detected` → escalation ladder (owner→manager→facility via notification + `escalation_level`). **Visitor auto-expiry sweeper:** flips overdue `visitor.status` to `checked_out`/`no_show` past `expected_to`.

**D5 `/search`,`/rooms`:** `GET /search?q=&type=…` (→ `{floorId,elementId,geometryRef,label}` for highlight; privacy-scoped)·`GET /search/suggest?q=` (`search`); `GET /employees/{id}/location` (privacy-scoped, audited who-viewed-whom → `search`,`employees/[id]`); `GET /rooms?floorId&capacityMin&equipment&availableAt`·`GET /rooms/{id}/availability?date`·`POST /rooms/{id}/book` (Outlook/Graph in P2 → `rooms`,`rooms/[id]`).

**D6 `/analytics`,`/heatmap`,`/forecast`:** `GET /analytics/kpis?scope&scopeId&from&to` (`page`,`command-center`); `GET /analytics/utilization?groupBy&period` (`reports`); `GET /heatmap?floorId&period=daily|weekly|monthly|quarterly&date` (PostGIS-aggregated; aggregation threshold suppresses groups < N → `heatmap`,`floor`); `GET /analytics/no-show-trends`; `GET /forecast?floorId&horizon` (`forecast`); `GET /analytics/sustainability?scope` (`sustainability`); `GET /reports`·`POST /reports/schedule`·`GET /reports/{id}/export?format=csv|xlsx|pdf` (`reports`; reuse Invoicing scheduler).

**D7 `/seating`:** `GET /seating/recommendations?employeeId&floorId&date&prefer=team|manager|project|account|collaborators` (privacy-scoped → `booking` toggle, `team-seating`); `GET /seating/neighborhood?teamId|projectId` (`team-seating`); `GET /analytics/collaboration?scope` (opt-in, aggregated, excluded-from-appraisal → `collaboration`).

**D8 `/moves`,`/cost`,`/governance`:** `GET /moves`·`GET /moves/{id}`·`POST /moves`·`POST /moves/{id}/simulate`·`POST /moves/{id}/approve|execute` (`relocation`,`relocation/[id]`); `GET /cost/summary?scope&scopeId`·`GET /cost/consolidation` (`cost`); `GET /governance/findings?type`·`POST /governance/findings/{id}/action` (`governance`).

**Policy `/policies`:** `GET /policies?domain`·`GET /policies/{id}`·`POST|PUT|DELETE /policies/{id}`·`PATCH /policies/{id}/status`·`POST /policies/evaluate` (`policies`).

**D10 `/employees`,`/integrations`:** `GET /employees?serviceLineId&accountId&projectId&q`·`GET /employees/{id}`·`PATCH /employees/{id}/privacy` (`employees`,`employees/[id]`,`privacy`); `POST /employees/import`·`GET /employees/import/{jobId}`·`POST /employees/import/{jobId}/commit` (`employees/import`); `GET /integrations`·`POST /integrations/{category}/sync`·`POST /integrations/webhooks/{provider}` (HRMS exit → auto-release; → `settings`).

**D9 `/copilot`,`/notifications`,`/exec`:** `POST /copilot/chat` (role-aware; proxies Python orchestrator → `copilot`); `GET /notifications?status`·`PATCH /notifications/{id}/read` (`notifications`); `GET /exec/command-center?scope` (`command-center`).

### 5.3 Cross-cutting backend concerns

- **AuthN:** Entra ID / OIDC resource server (JWT bearer), MFA at IdP; claims (roles + office/SL/account/project/grade) → `WorkspacePrincipal`.
- **RBAC:** Super Admin / Admin / Facility Manager / Employee / Auditor → `@PreAuthorize`.
- **ABAC:** `ScopeResolver` injects an office/SL/account/project predicate into every repository query (Hibernate filters/Specifications) — enforced at the **data layer**.
- **RLS (DB):** `V2` ships row-level-security policy DDL using `company_id` (and scope columns); the backend sets the session tenant/scope. (The §3 migrations support RLS; the **policy statements themselves live in `V2`**, authored in this phase.)
- **Privacy scoping (mandatory):** `GET /employees/{id}/location` and `/seating/*` are role-scoped (Employee → team/project only); respect `privacy_setting` opt-out; aggregation threshold (`min_group_size`, default 5) on all analytics/heatmap; **who-viewed-whom** writes `audit_log(action='view_person_location')` on every lookup. Collaboration/attendance analytics are opt-in, aggregated, flagged excluded-from-HR-appraisal.
- **Events (transactional outbox):** `DomainEventPublisher` → Kafka/Service Bus; events written in the same DB tx, relayed by a poller. Topics: `booking.held|confirmed|modified|cancelled|extended`, `checkin.confirmed`, `occupancy.changed`, `noshow.detected|escalated`, `allocation.changed`, `move.executed`, `employee.exited`. Consumers: Analytics, Notification, Governance, Data Lake (M26), live SSE.
- **Validation & errors:** Bean Validation + service invariants; RFC-7807 `application/problem+json` with stable codes `WS-VALIDATION`, `WS-CONFLICT-DESK` (409), `WS-HOLD-EXPIRED` (410), `WS-FORBIDDEN-SCOPE` (403), `WS-NOT-OWNER` (403), `WS-POLICY-DENIED` (422), `WS-IDEMPOTENT-REPLAY` (replay original), `WS-NOT-FOUND`.
- **Pagination/idempotency/holds/transactions:** `Pageable` (default 25, max 200); `Idempotency-Key` on all unsafe creates, stored as `key+route+request_hash` in the `idempotency_record` table/Redis (24h), replay returns stored response, mismatch → 409; Redis `hold:{deskId}:{range}` `SET NX PX`; booking confirm in one `@Transactional` guarded by the `EXCLUDE` constraint (catch violation → `WS-CONFLICT-DESK`); `@Version` optimistic locking on desk/booking transitions.

### 5.4 Build order & mock → API swap

**Service order (maximise unblocked screens, mirror P1→P2):** 1) `ws-platform`. 2) `ws-identity-integration` (employee + import) + `ws-spatial-master`. 3) `ws-floorplan` (`GET /floors/{id}/plan`, elements/desks) — unblocks `studio` + read side of `floor`. 4) `ws-policy` (thin: priority tiers + booking window). 5) `ws-allocation-booking` (holds→bookings→allocations→QR). 6) `ws-occupancy` (events, projection, no-show scheduler). 7) `ws-search-wayfinding`. 8) `ws-analytics` (KPIs, utilisation, heatmap) — **end of P1 spine.** 9) **P2:** `ws-collab-seating` → `ws-optimization-governance` → `ws-conversational`+notifications → meeting-rooms+Outlook → `ws-floorplan` assisted-import (Vision/HITL) → forecasting/sustainability.
**Rule:** a service ships only when the screens it unblocks already exist in the FE with mock data.

**Swap mechanics:** add `frontend/lib/workspace/api/` (one typed client per domain — `spatial.ts, floorplan.ts, booking.ts, occupancy.ts, search.ts, analytics.ts, seating.ts, governance.ts, policy.ts, employee.ts`) exporting the **same signatures** the screens import from `mockData.ts`. A single facade `frontend/lib/workspace/dataSource.ts` re-exports mock or API per a per-domain feature flag (`NEXT_PUBLIC_WS_BOOKING=live` etc.). Screens import only from `dataSource.ts` (the one FE refactor before backend work). Because `types.ts` mirrors the DB, API DTOs deserialize 1:1 with no mapping. Base URL via `NEXT_PUBLIC_WORKSPACE_API_BASE`; bearer from the existing OASIS Entra session.

---

## 6. PHASE 3 — DATABASE (PostgreSQL + PostGIS via Flyway)

Apply the schema designed in **§3** (it is the contract; the FE/mock and backend DTOs already mirror it). Steps:

1. **Provision** PostgreSQL 16 + PostGIS 3.4; create DB/role; configure connection from `oasis-workspace-service` (HikariCP).
2. **Apply migrations in order** (the single canonical list in §3.2): `V1__extensions` → `V12__analytics_rollups`. Spatial GiST indexes (`floor_outline_gix`, `zone_area_gix`, `space_element_geom_gix`, `desk_centroid_gix`), the **no-double-booking** `EXCLUDE` constraints (need `btree_gist`), `allocation_one_permanent`, the **owner-only check-in trigger**, and the **RLS policy DDL** (`V2`) are part of these migrations.
3. **Partitioning** for `occupancy_event` and `audit_log` (monthly RANGE); add a job to pre-create the next 1–2 partitions.
4. **Seed** reference data mirroring the FE mock (company OPUS, offices, 7 service lines + colours, 5 accounts, projects, sample floors with `bg_image_url`, zones, ≥120 desks, ≥60 employees, default policies incl `priority` p1..p4 + `booking_window`, privacy defaults) so demo parity holds.
5. **Wire backend:** point repositories at the live DB; flip `dataSource.ts` flags per domain as each service's screens validate against real data; verify `EXCLUDE`/trigger/RLS behaviour with integration tests (overlap rejected, non-owner arrival rejected, cross-tenant rows filtered).

**Scale callouts (design-now, tune-later):** partition the two high-volume tables; GiST on `span` + partial index on active statuses keeps the exclusion constraint cheap (consider monthly partitioning of `booking` by `starts_at` only at very high scale); spatial GiST powers highlight (`ST_Intersects`), sit-near (`ST_DWithin`), containment (`ST_Within`); `occupancy_daily`/`cost_snapshot` are the curated marts, raw `occupancy_event` partitions archive to the lakehouse (M26).

---

## 7. PHASE 4 — AI, Integrations & Analytics

Post-MVP-spine tracks: D6 analytics, D7 seating, D8 optimization/governance, D9 conversational/exec + notifications, D10 integration hub, the D2 Floor-Plan Vision assist track, and the cross-cutting privacy program. **Golden rule (reused from Invoicing's AI invoice extraction): AI proposes, a human disposes** — every agent that mutates the spatial/booking/people model is gated behind a typed HITL review surface and audited.

### 7.1 Conventions
- Agents are **capabilities behind the shared OASIS orchestrator**, not separate apps; the FE never calls an agent directly.
- Every agent/integration/analytic has a **mock surface first** (FE phase) implementing the same contract the backend later fulfils.
- One **`AgentSuggestion<T>` envelope** (§4.3), persisted in `agent_suggestion` (§3.10); HITL gate = `requiresReview===true` → suggestion lands in a review queue and cannot auto-apply; apply-actions route back through the **Java domain services** (agents never write the SSOT DB directly). Audit everything via `audit_log` (agent or human actor).
- Build-rule reminders carry over: `'use client'` for handlers; `'workspace'` in `DEDICATED_ROUTES`; Konva dynamic `ssr:false`; `tsc --noEmit` + `next build`.

### 7.2 Agent platform (build before individual agents — P2 start)
Python 3.12 / FastAPI service `oasis-workspace-ai`, LangGraph for stateful agents, shared OASIS **LLM Gateway** (frontier model for planning/vision, fast/cheap for chat/classification), shared **RAG** (floor plans, seating policy, utilisation history, governance rules). Orchestrator contract: Java calls `POST /agents/{agentKey}/run` → `AgentSuggestion<T>` (sync for fast agents; `202 + run-id + poll/stream` for vision/forecast). Orchestrator handles model routing, retries, tracing, token budgets, and the HITL queue. **Eval harness gates each agent:** vision precision/recall on a labelled set; forecasting MAPE/backtests; copilot task-success/deflection; seating acceptance rate — no agent ships without an eval baseline.

### 7.3 The 10 agents (canonical) — inputs · outputs · gate · screen · phase

- **`floorplan_vision`** (D2, hardest, mandatory hard HITL): asset (PDF/image/CAD-DXF/Visio-VSDX/Excel) → `AgentSuggestion<DetectedLayout>` (proposed `space_element[]` with per-element confidence). Lands in `studio/import` review mode as ghosted proposals; nothing enters the live model until a human commits. **P2 opt-in** (manual designer + background-trace shipped in P1; #1 technical risk; framed as *assist*).
- **`workspace_planning`** (D7/D8, suggest): spatial model + org + allocations + policy + collaboration signals → `SeatingPlanProposal` (desk↔team clustering + before→after utilisation). Surfaces on `allocation` (AI proposals panel); feeds `relocation`.
- **`occupancy_intelligence`** (D4/D6, alerts): event stream + aggregates → `OccupancyInsight` (utilisation, busy/low periods, anomalies). Surfaces on `occupancy` + `command-center`. Computed client-side from mock events in FE.
- **`demand_forecasting`** (D6, read): history + calendar → `OccupancyForecast` (by day×floor/zone + confidence). Surfaces on `forecast`. Start with seasonal-naïve/Prophet baseline, MAPE-gated.
- **`team_seating`** (D7, suggest, privacy-scoped): team/manager/project/collaborators (opt-in) + PostGIS proximity + available desks → `SitNearOptions` (= `TeamSeatingSuggestion[]`, persisted in `agent_suggestion`). Surfaces on `booking` ("sit near" toggle) + `team-seating`. Default scope team/project; respects opt-out; never reveals out-of-scope colleagues.
- **`relocation_planning`** (D8, plan → human approves): allocations + target + constraints + forecast/cost → `MovePlan` (sequenced moves, phasing, draft comms). Surfaces on `relocation`; approval executes via allocation service.
- **`cost_optimization`** (D8, recommend): inventory + cost model + utilisation + forecast → `CostOptimization` (cost per desk/employee/floor/SL + consolidation ₹ savings). Surfaces on `cost` + `command-center` (INR).
- **`governance`** (D8, alerts/gated): events + policy engine + audit → `GovernanceFinding` (no-show patterns, abuse, capacity breaches → actions). Soft actions auto-fire per policy; hard actions gated to admin. Surfaces on `governance` + notifications + `audit`.
- **`executive_copilot`** (D9, read): NL question + RAG (role/persona) → NL answer + report/chart + citations. Surfaces on shared `/assistant` (exec persona) + a panel on `command-center`.
- **`employee_assistance`** (D9, confirm actions): NL request from Web/Teams/WhatsApp → book/cancel/modify/find; each mutating action returns a confirmation prompt before executing via the booking service (idempotent; arrival owner-only, override audited). Surfaces on `/assistant` (employee persona) + Teams/WhatsApp + in-module chat on `copilot`.

### 7.4 Integrations (Integration Hub, M27 / D10)
Anti-corruption adapters per system, idempotent webhooks, secrets vault, retry/dead-letter, per-connector health. **Every connector ships a FE "Connect" stub first** on `settings` (card + status + last-sync + mock Connect), persisted in `integration` (§3.9).

| Integration | Does | Sequence | FE now | Backend later |
|---|---|---|---|---|
| HRMS (Workday/SuccessFactors/BambooHR) | Employee import; **auto-release on exit**; org sync | P1 → enrich P2 | import screen + CSV mock; Connect stub | adapter + delta sync + termination webhook → auto-release + governance event |
| Identity SSO (Entra/Okta, OIDC+MFA) | AuthN; RBAC/ABAC | P1 (reuse OASIS SSO) | role/persona switcher; "Connected via Entra" | OIDC + group→role + ABAC claims |
| Calendar (Outlook/Graph; Google later) | Meeting-room availability/booking (OASIS owns plan+metadata, calendar owns scheduling) | P2 | rooms availability grid + Connect stub | Graph API read/create; two-way sync |
| Comms (Teams/WhatsApp; Slack optional) | Conversational booking + notifications | P2 | channel Connect stubs; notification log + template editor mock | Teams bot + WhatsApp Business API; fan-out; idempotent inbound |
| Notification Hub (Email+Teams+WhatsApp) | Outbound across all events | P2 (reuse OASIS hub) | notification log + per-event template (mock send) | real fan-out; delivery status; routing |
| Access/RFID/Biometric | Read-only presence correlation (M19) | **P3, privacy-gated** | disabled connector + "requires DPIA + consent" note | read-only correlation under strict controls + consent + legal sign-off |
| IoT/smart-building sensors | Sensor presence; sustainability | **P3, ROI gate** | locked card; sustainability shows estimates + "P3" badge | sensor ingestion → occupancy/sustainability |

**Boundary:** HRMS/Identity remain systems of record; access/biometric is read-only correlation; OASIS never runs physical security. **Auto-release on exit:** HRMS termination webhook → allocation service releases fixed desk + cancels future bookings → emits events + notifies facility.

### 7.5 Analytics pipeline
Event-driven spine: every `book/hold/check-in/no-show/QR-scan/release/move` emits an `occupancy_event`. One pipeline, many consumers (analytics, notifications, governance, lakehouse).
- **Client-side from mock NOW (FE phase):** utilisation %, KPI tiles, heatmap colouring (green/yellow/red, daily→quarterly) with aggregation thresholds baked into `heatmapBins(threshold)`, mock forecast/cost, occupancy insights. Types map 1:1 onto the PostGIS + lakehouse aggregate tables.
- **Backend/lakehouse LATER:** real event ingestion → operational aggregates in PostGIS for live views + roll-ups into the lakehouse (M26); server-side heatmap aggregation (thresholds enforced again — defence in depth); real forecasting (seasonal-naïve → ML, MAPE-gated); cost model from real desk-cost config; sustainability from IoT (P3, labelled estimates until then); lakehouse as system of record for history → forecasting + exec copilot RAG.
- **Reports:** reuse Invoicing's scheduler (utilisation, trends, no-show, heatmaps, allocation, cost, consolidation, sustainability) — mock list/preview now, real generation/delivery later.

---

## 8. Cross-cutting: security/privacy, testing, rollout, deployment

### 8.1 Security & privacy (first-class — most important "do-it-better")
This is a people-tracking system handling sensitive PII (where-is-John, collaboration M16, attendance M19, face-recognition P3). Privacy is a workstream, not a checkbox.

| Phase | Task | UI surface |
|---|---|---|
| P0 Discovery | **DPIA** before build; GDPR / India DPDP / works-council review; purpose-limitation; role-scoped visibility model | process gate (output = policy config driving UI rules) |
| P0/P1 | **RBAC + ABAC** (roles + office/SL/account/project/grade) enforced at API + data layers + RLS | role/persona switcher; scoped data everywhere; admin-only actions hidden |
| P1 | **Role-scoped people-location** (default team/project for "find a colleague"; full directory = admin/facility) | `search`: scoped results + "scoped to your team/project" notice; admin sees broader scope with audit banner |
| P1 | **Opt-out / privacy mode** per employee | `employees/[id]`/`privacy` toggle "Hide my desk location"; opted-out render "location hidden" |
| P1 | **Aggregation thresholds** (never show a group < N) — mock now, server-side later | heatmap/dashboard cells "insufficient data" below threshold |
| P1 | **Who-viewed-whom + override audit** (immutable) | `audit` (Auditor read-only): location-lookup, override, agent-action logs |
| P2 | **Collaboration (M16) + attendance (M19) = opt-in + aggregated, excluded from HR/appraisal** | opt-in consent before activation; "space-planning only — not for performance review" label; individual views suppressed |
| P2 | **Agent privacy scope** (team-seating + assistance only reveal in-scope people; copilot RAG respects ABAC at retrieval) | sit-near names only in-scope colleagues; copilot refuses out-of-scope location questions |
| P3 | **Biometric/face/access correlation** — explicit consent + separate legal sign-off + read-only + classified Restricted | locked connectors + consent-capture flow |
| All | Encryption in transit/at rest; PII classified Restricted; immutable audit; **zero privacy incidents** = tracked KPI | settings → data classification & retention |

### 8.2 Testing strategy
- **Frontend:** `npx tsc --noEmit` after every sub-phase; dev-server HTTP 200 per route; full `next build` before any deploy; verify `/workspace` not shadowed by the catch-all; manual smoke of canvas interactions (zoom/pan/drag/draw).
- **Backend:** unit tests per service; **integration tests for invariants** — no-double-booking (`EXCLUDE` rejects overlap), owner-only arrival (trigger rejects non-owner unless override), fixed-allocated desk not bookable, idempotent replay returns original, RLS filters cross-tenant rows; concurrency test (parallel confirms on one desk → exactly one succeeds, others 409); no-show scheduler test (grace window → status flip + release + event).
- **AI:** eval harness gates each agent (§7.2); HITL apply-path tests (suggestion → human accept → domain-service write + audit).
- **Privacy:** scope tests (employee can't locate out-of-scope colleague), aggregation-threshold tests (group < N → "insufficient data"), who-viewed-whom audit row written on every location lookup.

### 8.3 Rollout
P0 Discovery (DPIA/privacy sign-off, HRMS/AD discovery, model-routing + eval baselines, lock contracts) → **P1 MVP spine** (FE all screens mock → backend services 1–8 → DB applied → HRMS import + SSO + auto-release affordance; client-side analytics; role-scoped search, opt-out, aggregation thresholds, who-viewed-whom audit in the MVP; Studio manual + background-trace, Vision deferred) → **P2 Intelligence** (agents, Vision assist, Outlook rooms, Teams/WhatsApp, notification hub, lakehouse + real forecasting/heatmaps/cost, opt-in collaboration/attendance) → **P3 Premium/R&D** (Digital Twin 2D→3D, AR, IoT/biometric/face behind ROI + legal gates, advanced sustainability) — each capability piloted.

### 8.4 Environments & deployment
- **Frontend:** Vercel, Root Directory = `frontend`; env `NEXT_PUBLIC_WORKSPACE_API_BASE`, per-domain `NEXT_PUBLIC_WS_*` data-source flags; build = `next build` (must be green and `/workspace` un-shadowed).
- **Backend:** `oasis-workspace-service` (Java 21 / Spring Boot 3.x) container; Redis 7; Kafka / Azure Service Bus; object store; Entra ID / OIDC.
- **Database:** PostgreSQL 16 + PostGIS 3.4; Flyway-managed (`V1…V12`); monthly partition pre-create job; lakehouse (M26) for history.
- **AI:** `oasis-workspace-ai` (Python 3.12 / FastAPI + LangGraph) behind the shared OASIS orchestrator + LLM Gateway.
- **Currency:** INR throughout (`Money`/`inr()`).

---

## 9. Build sequencing checklist (execute in this order)

**FE-0 — Foundation**
- [ ] `npm i konva react-konva` in `frontend`.
- [ ] Add `'workspace'` to `DEDICATED_ROUTES` in `app/[module]/page.tsx`.
- [ ] Add workspace icons to `components/ui/Icon.tsx`.
- [ ] `lib/workspace/types.ts` — all string-literal-union types (incl `SpaceElement`/`ElementKind`, `QrCode`, `CheckIn`, agent envelope) mirroring §3.
- [ ] `lib/workspace/mockData.ts` — datasets + helpers (privacy/aggregation enforced).
- [ ] `components/workspace/ui.tsx` (badges, StatCards, agent/privacy components).
- [ ] `components/workspace/floorplan.tsx` (`'use client'`, dynamic `ssr:false`).
- [ ] `app/workspace/workspace.css` + `app/workspace/layout.tsx` (`'use client'`, sticky sub-nav).
- [ ] `tsc --noEmit` clean; `next build` green with placeholder `page.tsx`.

**FE-1 — Spine (MVP):** build Overview, `floor`, `studio`(+`[floorId]`), `masters`(+`floors/[id]`,`desks`), `zones`, `employees`(+`import`,`[id]`), `allocation`, `booking`(+`my`,`[id]`), `qr`, `occupancy`(+`no-shows`), `search`. → `tsc` clean, routes 200, `next build` green.

**FE-2 — Intelligence:** `heatmap`, `forecast`, `sustainability`, `reports`, `team-seating`, `collaboration`, `rooms`(+`[id]`), `occupancy/attendance`, `studio/import` (HITL review stub), `command-center`. → gates.

**FE-3 — Admin/Governance:** `relocation`(+`[id]`), `cost`, `governance`, `policies`, `visitors`, `settings`, `privacy`, `audit`, `notifications`. → gates.

**FE-4 — Conversational + Premium:** `copilot` (+ channel stubs), `digital-twin` (premium placeholder), future-notes. → full `tsc` clean, all routes 200, `next build` green, `/workspace` un-shadowed.

**BACKEND (Phase 2):** add `dataSource.ts` facade + `api/*` clients (one FE refactor). Build services in order: 1) `ws-platform` → 2) `ws-identity-integration` + `ws-spatial-master` → 3) `ws-floorplan` → 4) `ws-policy` → 5) `ws-allocation-booking` → 6) `ws-occupancy` → 7) `ws-search-wayfinding` → 8) `ws-analytics` (end P1 spine) → 9) P2: `ws-collab-seating` → `ws-optimization-governance` → `ws-conversational`+notifications → rooms+Outlook → `ws-floorplan` assisted-import → forecasting/sustainability. Flip `NEXT_PUBLIC_WS_*` per domain as each service's screens validate.

**DATABASE (Phase 3):** provision PG16+PostGIS3.4 → apply `V1…V12` (extensions, RLS, EXCLUDE constraints, owner-only trigger, GiST, partitions) → seed mirroring mock → wire repositories → integration-test invariants.

**AI / INTEGRATIONS / ANALYTICS (Phase 4):** P2 — stand up `oasis-workspace-ai` platform + LLM Gateway + RAG + HITL queue + eval harness → ship agents `workspace_planning, occupancy_intelligence, demand_forecasting, team_seating, relocation_planning, cost_optimization, governance, executive_copilot, employee_assistance` → ship `floorplan_vision` (opt-in, review-gated) → wire integrations (HRMS enrich, Calendar/Outlook, Teams/WhatsApp, Notification Hub) → lakehouse + real analytics. P3 — Digital Twin, AR, IoT/biometric/face (behind ROI + legal gates), advanced sustainability.

**Cross-cutting (every phase):** DPIA + privacy gates (P0), RBAC/ABAC/RLS, role-scoped search + opt-out + aggregation thresholds + who-viewed-whom audit (P1), opt-in collaboration/attendance (P2), consent + legal for biometric/face (P3); testing gates after each phase; deploy via Vercel (FE) + container (backend) + Flyway (DB).

---

*This plan is ready to execute starting at FE-0.*
