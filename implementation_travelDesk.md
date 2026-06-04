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
| **FE-9** | AI Trip Pack (day-by-day pack) *(Phase 4b)* | ⬜ Pending |

## Progress log
- _2026-06-04_ — Tracker created; FE-0 foundation + FE-1…FE-8 built (UI, mock data grounded in the HYD→SFO sample). Sub-nav: Overview · Requests · Comparison · Trips · Monitoring · Vendors · Reports · Configuration. Open **Travel Desk** in the sidebar.
- _Next:_ AI Trip Pack screen (FE-9); then backend phase — content APIs + AI services.

## How to run
Dev server runs the whole OASIS app; open **Travel Desk** from the sidebar (`/travel`). Type-check with `npx tsc --noEmit` in `frontend/`.
