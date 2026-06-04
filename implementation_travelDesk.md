# OASIS — Travel Desk: Frontend Implementation Tracker

Tracks the **phase-wise frontend build** of Module 4 (AI Travel Desk Agent), per [travelDesk_requirement.md](travelDesk_requirement.md). Backend (Spring Boot + Python AI services + travel-content APIs) comes later; this stage is **UI-first with mock data**.

## Build approach
- **Next.js (App Router) + TypeScript + React**, mirroring the Invoicing module's structure & styling.
- Routes live under `frontend/app/travel/*`; the sidebar already links **Travel Desk → `/travel`** (overrides the `[module]` placeholder).
- Module styles in `frontend/app/travel/travel.css`; shared shell/KPI/card/tint from `globals.css`.
- Domain types in `frontend/lib/travel/types.ts`; mock data in `frontend/lib/travel/mockData.ts` (grounded in the real `Data/Travel Desk/` HYD→SFO vendor sample — PII-free).
- Shared presentational bits in `frontend/components/travel/ui.tsx`.
- **Phase 1 = Rate Benchmarking** (no in-portal booking): the hero is the **Quote Comparison Workspace** (vendor quotes + AI benchmark → good/average/high verdict). Monitoring / Trip-pack are Phase 4b.

### What is mocked vs. real (this stage)
- **Mocked:** all data (requests, vendor quotes, AI benchmark, vendors, trips, alerts, KPIs); AI search/normalisation/scoring are pre-computed in mock; "send RFQ", "approve", "book" are simulated.
- **Real (later, backend):** travel-content APIs (TBO/Tripjack + Duffel + Amadeus) for the live benchmark, AI quote-ingestion/normalisation, policy engine, fare/schedule monitoring jobs, notifications, persistence.

## Phase status
**Legend:** ⬜ Pending · 🟡 In Progress · ✅ Done

| Phase | Scope | Status |
|---|---|---|
| **FE-0** | Foundation — types, mock data (grounded), shared UI, `travel.css`, sub-nav layout | ✅ Done |
| **FE-1** | Overview dashboard — KPIs, queues, savings, alerts | ✅ Done |
| **FE-2** | Requests — desk queue (filters) + guided **intake** form | ✅ Done |
| **FE-3** | **Quote Comparison Workspace** (request detail) — vendor quotes + AI benchmark, normalised grid, verdict, lenses, recommend/approve, negotiate | ✅ Done |
| **FE-4** | Vendor scorecard — price index, SLA, service rating, win rate | ✅ Done |
| **FE-5** | Trips — booked-trip register + trip record (itinerary) | ✅ Done (basic) |
| **FE-6** | Monitoring board — fare-watch + schedule/PNR alerts *(Phase 4b)* | ✅ Done (basic, mock) |
| **FE-7** | Reports — library + scheduled delivery | ✅ Done (basic) |
| **FE-8** | Configuration — travel policy, fare-watch, providers, channels | ✅ Done (basic) |
| **FE-9** | **AI Trip Pack** — day-by-day itinerary + travel pack (trip detail `/trips/[id]`) | ✅ Done |

## Progress log
- _2026-06-04_ — Tracker created; FE-0 foundation + FE-1…FE-8 built (UI, mock data grounded in the HYD→SFO sample). Sub-nav: Overview · Requests · Comparison · Trips · Monitoring · Vendors · Reports · Configuration. Open **Travel Desk** in the sidebar.
- _2026-06-04_ — **Flow correction (vendors have no API):** the request is **created in OASIS** (no electronic RFQ) — intake CTA → "Create request"; the request detail gains **Fetch best rates (AI)** + **Upload vendor quote** actions (gated + simulated) and an action-forward "No options yet" empty state, after which AI analyses **uploaded quotes + benchmark together**. Mock seeded a Sourcing request (TRV-64418, PNQ→BLR) to demo the empty→fetch→upload path. Synced travelDesk_requirement.md → v0.6 (§1.1, §6, §7-C, D-T5). Type-check clean; verified on Compared (TRV-64393) + Sourcing (TRV-64418).
- _2026-06-04_ — **FE-9 AI Trip Pack built:** trip detail `/travel/trips/[id]` — TZ-aware **day-by-day itinerary** (flights/transfer/hotel/meeting with conflict flag), plus **weather, local transport, safety & emergency, destination basics, documents**, and Download PDF / Add-to-calendar / Send actions. Flagship pack seeded for TRP-64393 (HYD→SFO, Mon 10:00 client meeting); other trips show a "pack assembles after ticketing" state. Trips list now links to the pack. Type-check clean; verified.
- _Next:_ remaining Phase-4b polish (hotel + ground-transit in the comparison workspace; scheduled-reports config) is optional; otherwise the **frontend is feature-complete** for this module → backend phase (content APIs + AI services).

## How to run
Dev server runs the whole OASIS app; open **Travel Desk** from the sidebar (`/travel`). Type-check with `npx tsc --noEmit` in `frontend/`.
