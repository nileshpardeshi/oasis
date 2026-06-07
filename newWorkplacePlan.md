# OASIS — Workplace Redesign Plan — **Booking & Allocation**
*Status: proposal for review · Author: solution/design + engineering*

> **This document has two parts:**
> **Part 1 — Booking Portal** (employee + admin desk booking) — *approved; B1 built.*
> **Part 2 — Allocation Register** (admin space/seat management) — *new; for your review below (§A).*

---

# Part 1 — Booking Portal Redesign Plan
*Scope: the Booking section of the Workplace module*

> Goal you set: *"Accessible by all employees and admin. I don't want too many things on this section, but it should be advanced — feature-wise and look-wise. The booking UI should be very nice and easy to use, with proper colour codes."*
>
> This plan reviews the current build, benchmarks it against **Archie** and other standards (Robin, Deskbird, Envoy, OfficeRnD), maps **your original requirement** to concrete features, and proposes a **clean, professional redesign** with a defined colour system, screen layout, AI usage, rules, and a phased build. Nothing is implemented yet — please review and mark it up.

---

## 1. Review of the current Booking page (what's weak)

| Area | Current state | Problem |
|---|---|---|
| Date selection | Raw `<input type="date">` | Clunky; no sense of which days are busy. |
| "Booking window 15/30/60d" segmented control | User toggles it | This is an **admin policy** ("book up to X days ahead"), not a per-booking choice — it doesn't belong in the user flow. |
| Slot / time | 4 labels (hourly/half/full/multi) that don't actually pick hours | Your requirement needs **slot + expected arrival time** (Outlook-like). Missing. |
| Floor map | Generic view, "Taken" in legend | Taken desks don't show **who booked & for how long** (you explicitly asked for this). |
| Desk detail | 3 lines of text in a thin panel | No amenities, zone/service line, occupant, restrictions. |
| Confirm | Flips a flag, "QR sent" | No real summary, no **multi-channel confirmation**, no QR pass, no arrival/check-in. |
| My bookings | A plain table on a separate page | No **schedule/timeline** view; cancel only; no change-schedule, no check-in. |
| Rules | None visible | No **booking window**, **eligible-area-only**, or **permanent-desk** handling surfaced. |
| Look & feel | Standard toolbar; flat | Doesn't read as a polished, modern booking product. |

**Verdict:** functional skeleton, but not professional and missing the core of your requirement (slots, arrival, QR check-in, who-booked-what, cancel/change, rules, AI). Worth a focused redesign.

---

## 2. How standard apps do it (patterns we'll adopt)

From **Archie**, Robin, Deskbird, Envoy, OfficeRnD — the winning booking UX has a consistent shape:

1. **One smart page, not many.** Date + time at top, filters on the left, **interactive map** in the centre, **desk detail + booking summary** on the right. (Archie's exact model.)
2. **Quick-book first.** A prominent "Book for **Today / Tomorrow**" one-tap action with smart defaults; power users go deeper only if they want to.
3. **Day strip**, not a date field — a horizontal row of upcoming days (limited to the policy window), each showing how busy it is.
4. **Slot + arrival time** like a calendar: Full day / Morning / Afternoon / Custom hours, plus expected arrival.
5. **Colour-coded map** with crisp semantics (available / yours / taken / in-use / restricted) and a **desk popover** showing occupant + duration when taken.
6. **Map ⇄ List toggle** — list view gives "first available" one-click booking for people who don't care where.
7. **Neighbourhoods + "sit near team" + favourites/recent** desks.
8. **My schedule** as an Outlook-style week timeline with check-in / change / cancel.
9. **Check-in via QR** with a clear **booked vs. arrived** distinction.
10. **AI**: recommended desk, natural-language booking, no-show prediction, utilisation analytics.

We adopt these but **trim ruthlessly** to keep the page calm (see §10 "kept out").

---

## 3. Your requirement → feature mapping

| Your requirement | How the redesign delivers it |
|---|---|
| Move from fixed → flexible desk booking | Booking portal centred on a flexible-area map; permanent desks shown but **not bookable**. |
| Book via OASIS portal **and** WhatsApp / Teams / email | Portal = this redesign. Other channels share the same booking service + **confirmation chips** (Email · Teams · WhatsApp) shown on confirm. (Bots = Phase B3.) |
| Portal: select seat on map; other channels: give desk no. + slot + date + arrival time | Map select **or** list select; **slot + date + expected arrival** picker is first-class in the UI. |
| Slot = specific hrs / full day, based on arrival time | Slot selector: Full day / Morning / Afternoon / **Custom hours** + **Expected arrival**; visualised on a time bar. |
| Confirmation to booked channel + employee email | Confirmation screen lists delivery channels + a **QR pass**. |
| QR per desk (config), paste on desk; scan → book/confirm arrival | **QR pass** on each booking + **"I've arrived" check-in**; Admin config (QR generation) lives in Admin, deep-link to WhatsApp/Teams menu. |
| Cancel / change schedule | Per-booking **Cancel** and **Change** in My Schedule + desk detail. |
| Book only for next **X** days (admin config) | Day strip limited to the **admin-configured window** (default **7 days** for now); over-window days disabled with a tooltip. |
| Book only **eligible area** for the service line | Default scope = employee's **own service-line/account area + the admin-reserved flexible/hot-desk pool**; **which areas show is admin-configurable** (can be whole floor). Permanent/ineligible desks render restricted (not selectable) with a reason. |
| When a flexible seat is selected, show **who booked & for how long** | Desk popover shows occupant + slot/duration for taken desks. |
| Only booker can check-in / cancel / change; **admin = full rights** | Ownership enforced in UI; **Admin mode** banner lets admins act on anyone + search by employee. |
| Admin reports: by service line / account / project, booked vs. used, cancellations | Lives in **Intelligence/Admin** (not on the booking page) — booking page stays clean; we link to it. |
| Notify employee when admin changes/allocates their desk | Notification on admin override (channel chips), surfaced in My Schedule. |
| Use AI (chatbots, dashboards, reports) | §8 — recommended desk, NL booking, no-show prediction, utilisation analytics. |

---

## 4. Proposed layout (single page, calm + advanced)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Book a desk                              [👤 Booking as: You ▾]  (admin: any) │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ ⚡ Quick book:  [ Today · Full day ]  [ Tomorrow · Full day ]          │   │
│  │ 🔎 "desk near Data & AI on Fri afternoon"           (AI natural book)  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  Day strip:  [Mon 9·62%] [Tue 10·54%] [Wed 11·40%] … (only within X-day window)│
│  Slot:  ( Full day | Morning | Afternoon | Custom 10:00–14:00 )  Arrival: 10:30│
├───────────────┬──────────────────────────────────────────┬───────────────────┤
│  FILTERS      │   MAP  ⇄  LIST                            │  DESK / SUMMARY    │
│ ● My area +   │  ┌────────────────────────────────────┐  │  WS 214            │
│   hot-desk    │  │   (default scope · admin-set;        │  │                    │
│   (admin-set) │  │    can be whole floor)               │  │                    │
│  Floor ▾      │  │  interactive floor plan, desks      │  │  🟢 Available      │
│  Amenities    │  │  colour-coded by booking state      │  │  Core · Mastercard │
│   ☐ Monitor   │  │  (click a desk → detail →)          │  │  Monitor · Standing│
│   ☐ Standing  │  │                                     │  │  ───────────────   │
│   ☐ Accessible│  │  [neighbourhood zones + chairs]     │  │  Wed 11 · Full day │
│  ☐ Sit near   │  │                                     │  │  Arrival 10:30     │
│     my team   │  └────────────────────────────────────┘  │  [ Confirm booking]│
│  ★ Favourites │   Legend ●Available ●Yours ●Taken …       │  Email·Teams·WA ✓  │
└───────────────┴──────────────────────────────────────────┴───────────────────┘
   ▸ "My schedule →" link  (opens the separate /booking/my page: week timeline · check-in / change / cancel)
```

**When a taken desk is clicked:** popover → *"Booked by Neil Engineer · Data & AI · 09:30–18:00 · checked-in."* (Your "show who booked & for how long".)

**When a restricted/permanent desk is clicked:** *"Permanent seat — reserved for <name>. Not bookable."* (greyed, hatched).

---

## 5. Visual design & **colour system** (proper, accessible)

Built on existing OASIS tokens (brand blue `#064281`, accent orange `#f7991f`). Each state pairs a **colour + label + icon** (never colour alone — colourblind-safe).

| State | Meaning | Fill | Dot / accent | Token |
|---|---|---|---|---|
| 🟢 **Available** | Free to book | `#e7f6ec` | `#16a34a` | `--success` |
| 🟠 **Selected** | Your current pick (ring) | — | `#f7991f` ring | `--accent` |
| 🔵 **Your booking** | Booked by you | `#eaf1f9` | `#064281` | `--brand-blue` |
| ⚪ **Booked (others)** | Taken by a colleague | `#eef1f5` | `#94a3b8` | slate |
| 🟦 **In use / arrived** | Checked-in at desk | `#d9f2ee` | `#0d9488` | teal |
| 🔴 **No-show / released** | Grace passed, freed | `#fdecec` | `#dc2626` | `--danger` |
| ▦ **Restricted / permanent** | Not bookable | hatched `#e2e8f0` | `#94a3b8` | muted |
| ✨ **Suggested (AI / near team)** | Recommended | halo | `#f7991f` glow | `--accent` |

**Look & feel principles**
- **Calm canvas, one accent.** Blue for primary actions/your data; orange only for *selection + AI suggestions* (scarce = meaningful). Everything else neutral.
- **Soft cards, generous spacing, rounded 12–16px**, subtle shadows (reuse existing `--shadow-sm/md`).
- **Status as pills + icons**, consistent with the rest of the module.
- **Time as a calendar bar** (the slot renders on a 8am–8pm track so the booking reads visually like Outlook).
- **Mobile-friendly**: filters collapse, list view becomes primary (most employees book from phone).

---

## 6. Component inventory (for the FE build)

- `QuickBook` — Today/Tomorrow one-tap + NL search box.
- `DayStrip` — days within policy window, each with a busy% mini-bar; over-window disabled.
- `SlotPicker` — Full/Morning/Afternoon/Custom + arrival time, rendered on a time bar.
- `BookingFilters` — My area, floor, amenities, sit-near-team, favourites/recent.
- `ViewToggle` — Map ⇄ List.
- `DeskMap` — reuse the new floor-plan engine in a **`booking` mode** with the colour states above.
- `DeskList` — sortable available desks + "Book first available".
- `DeskDetailPopover` — amenities, area, status, occupant+duration (taken), reason (restricted).
- `BookingSummary` — date/slot/arrival/desk/area + Confirm + channel chips.
- `ConfirmationCard` — success + **QR pass** + "Add to calendar" + channels delivered.
- `MySchedule` — week timeline; per-booking **Check-in / Change / Cancel**; status (booked vs arrived).
- `AdminModeBar` — visible only to admins: "Booking on behalf of ▾", override rights.

---

## 7. AI features (woven in, not cluttering)

- **Recommended for you** — one highlighted desk (your usual / near team / quiet zone), with a one-line rationale.
- **Natural-language booking** — "desk near Data & AI Friday afternoon" → pre-fills day, slot, scope, suggested desk.
- **Day busy-forecast** — each day in the strip shows predicted occupancy ("Fri quiet · 31%").
- **No-show risk** (admin) — flag bookings likely to no-show; auto-release reminder.
- **Utilisation analytics** (Admin/Intelligence, linked, not on this page) — booked vs. used, by service line / account / project.

---

## 8. Rules & permissions (enforced in UI, later in backend)

- **Window**: book only within the **admin-configured window** (default **7 days** now) — day strip enforces.
- **Eligibility**: desks in the employee's **service-line/account area + admin-reserved flexible/hot-desk pool**; the visible area set is **admin-configurable** (may be whole floor). Permanent desks excluded with reason.
- **Ownership**: only the booker can **check-in / change / cancel**; QR check-in validates identity.
- **Admin**: full override — book/cancel/reassign for anyone; changes notify the affected employee.
- **Conflicts**: a desk can't be double-booked for overlapping slots (validated on confirm).

---

## 9. Data & mock additions (frontend-first, DB-ready)

Mostly already present (`bookings`, `deskLiveStatus`, `qrCodes`, `policies`). To support the redesign we add to mock (and later to Postgres):
- `Booking`: `expectedArrival`, `slot` (full/morning/afternoon/custom), `channel` (portal/teams/whatsapp/email), `checkedInAt`.
- `BookingPolicy`: `windowDays`, per-service-line **eligible zones**, grace minutes.
- Desk: `isBookable`/`isPermanent` (have), `amenities` (have), `favouriteOf` (recent/favourites — derive client-side for now).
- Day occupancy forecast (mock series for the day strip).

No schema redesign needed — these are additive.

---

## 10. Deliberately kept OUT (to stay clean, as you asked)

- **Room booking** stays in the separate **Rooms** tab (don't mix desks + rooms here).
- **Admin reports / config** stay in **Admin / Intelligence** — booking page links to them, doesn't host them.
- **QR generation, bot setup, notification templates** = Admin config, not the employee booking page.
- No dense settings, no clutter — the page is a focused, friendly booking experience.

---

## 11. Phased implementation

**Phase B1 — Frontend redesign (mock data)** ← *what I'd build first after you approve*
- New Booking page: QuickBook + NL box, DayStrip, SlotPicker (with arrival + time bar), Filters, Map⇄List, DeskDetailPopover (who-booked + duration + restricted reasons), BookingSummary, ConfirmationCard (QR + channels).
- MySchedule week timeline with check-in / change / cancel; booked-vs-arrived states.
- Colour system + components above; AdminModeBar; "Recommended for you".
- Verify: tsc, build, responsive.

**Phase B2 — Backend (Spring Boot + Postgres)**
- Booking service: window/eligibility/permanent/conflict rules; ownership checks; admin override + audit.
- QR generation + check-in endpoints; notifications (Email/Teams/WhatsApp) on confirm/change/override.

**Phase B3 — Channels & AI**
- WhatsApp + Teams chatbots sharing the booking service; QR → bot deep-link menu (Book / Change / My booking / Arrival).
- NL booking, no-show prediction, utilisation analytics for admins.

---

## 12. Decisions (confirmed) + minor defaults

**Confirmed by product owner:**
1. **Booking window** — always read from **Admin configuration** (not hard-coded). Default for now = **7 days**. The day strip renders exactly the configured window.
2. **My schedule** — stays a **separate sub-page** (`/workspace/booking/my`). The booking page is purely for *making* bookings; it links to My schedule.
3. **Confirmation channels** — **Email + MS Teams + WhatsApp** (all three) shown on confirm.
4. **Default desk scope** — show the employee's **own service-line / account area first**, **plus** the **flexible / hot-desk pool** the admin team has reserved. *Which area(s) appear is itself admin-configurable* — in some cases admins may choose to show the **whole floor**. So scope = config-driven, with the my-area + hot-desk default.

**Minor defaults I'll assume (tell me to change):**
- **Default slot** = Full day (Morning / Afternoon / Custom available).
- **Office-hours time bar** = 08:00–20:00.
- These two are also admin-config in the backend phase; the above are just the v1 UI defaults.

---

*Once you've reviewed/edited this, I'll build **Phase B1** (frontend, mock) and we iterate on the look — same as we did with the floor plan.*

---
---

# Part 2 — **Allocation Register** Redesign Plan
*Scope: the Allocation section · Audience: **admin / facility team only** (not employees) · Status: proposal for your review*

> Your brief: *"Allocation is not just assigning a desk — it also allocates **areas** to service lines and defines **flexible / hot‑desk** areas. It must support **bulk movement** (move 30–40 people to another area that already has people — AI resolves conflicts). Leverage AI. Show proper numbers. Your '1000‑ft' idea: a new **Allocation Register** tab with sub‑tabs — **Allocate Desk** (with floor map, swap, reallocation, find bay by service‑line/account/project, AI suggestions), **Current Allocation**, and others."*
>
> I've taken your 1000‑ft idea and made it a complete, edge‑case‑aware design, benchmarked against space‑management tools.

## A1. Review of the current Allocation page (what's weak)

| Area | Current state | Problem |
|---|---|---|
| Purpose | A **read‑only register table** (Emp ID, Type, Seat, Key, Name, Ext, Group, Account) with filters | It only *shows* who sits where — you can't actually allocate, swap, move or define areas. |
| Assign / swap / reallocate | "New allocation" button → `alert()` mock | No real assignment flow, no map, no displacement handling. |
| Area governance | None | Can't define which area belongs to a service line / account, or mark an area flexible / hot‑desk. |
| Bulk movement | None | Can't move a team of 30–40; no conflict resolution. |
| Floor map | None | Admins can't *visualise* to allocate (you asked for this). |
| AI | None | No best‑seat suggestion, no auto‑pack, no consolidation. |
| Numbers | 6 generic stat cards | No per‑area / per‑service‑line / per‑account allocation %, no "unseated" count. |

**Verdict:** it's a register *report*, not an allocation *workspace*. Rebuild it as a proper admin space‑management tool.

## A2. How space‑management tools do it (patterns we'll adopt)

From **Archie** (space management + assigned seating + neighbourhoods), OfficeRnD, Robin, SpaceIQ/Eptura, OfficeSpace:

1. **Three seat models, explicit:** **Assigned (fixed)**, **Flexible** (team area, first‑come), **Hot‑desk pool** (open booking). Allocation governs all three.
2. **Neighbourhoods / areas** are first‑class: you assign an *area* to a team/department (service line) / account / project, set its type & capacity — this drives booking eligibility.
3. **Map‑driven assignment:** a people panel beside the floor map; **drag a person onto a desk**, or pick desk → assign. Swap two people; reassign with displacement handling.
4. **Move management / stack planning:** plan moves of **groups**, draft → review impact → approve → execute → notify. **Scenario / what‑if** before committing.
5. **Vacancy & utilisation everywhere** — every area shows capacity / assigned / free / %, and "unseated people".
6. **Audit + notifications** on every change (your requirement: notify the employee).
7. **AI**: optimal seat, auto‑pack a group, least‑disruption relocation, consolidation of under‑used areas.

## A3. Proposed structure — **Allocation Register** tab with 5 sub‑tabs

> Refines your idea: *Allocate Desk* + *Current Allocation* + the missing pieces (Areas, Bulk Move). Admin‑only.

| Sub‑tab | Purpose |
|---|---|
| **1 · Overview** | The numbers: seats by area / service line / account / project — capacity vs **assigned / flexible / vacant / utilisation %**, plus **unseated employees**. The control tower. |
| **2 · Assign desk** | Map‑driven single allocation: pick an employee → **AI suggests seats** → click to **assign / swap / reallocate**. **Find bay** by service‑line / account / project. Drag‑drop. |
| **3 · Areas & neighbourhoods** | **Service‑line desk allocation on the floor map** — pick a service line → click or bulk‑select the desks that belong to it (they can span several areas), each marked **Fixed** or **Flexible** (Flexible = Hot‑desk; the two are merged into one). Per‑service‑line stats + target‑count progress (e.g. "Core needs 50"). This is the single source of service‑line → desk ownership, fetched by Booking eligibility & the Floor view. |
| **4 · Bulk move (Move planner)** | Move a **group** (30–40) to a target area; **AI auto‑packs**, flags overflow, proposes relocations for people already there; preview → approve → execute → notify. **What‑if** scenarios. |
| **5 · Register** | The detailed seat register (today's table) — search, filter, **export**, audit trail. |

### Layout — "Assign desk" (sub‑tab 2)
```
┌──────────────── Allocation Register ─────────────────────────────────────────┐
│ [Overview] [Assign desk] [Areas] [Bulk move] [Register]      🔎 find employee  │
├───────────────────────────────┬───────────────────────────────────────────────┤
│  PEOPLE                        │   FLOOR MAP (assign mode)                      │
│  Filter: SL ▾ Account ▾ Proj ▾ │   ┌────────────────────────────────────────┐  │
│  ⦿ Unseated (12)               │   │  desks colour-coded:                    │  │
│  ─ Ananya Rao    · seat WS 145 │   │   🟦 assigned  🟢 free  🟧 selected     │  │
│  ─ Karthik Iyer  · unseated    │   │   ▦ other team  ✦ AI-suggested          │  │
│  ─ Maya Chandra  · WS 204      │   │  (Find bay → highlights the SL/account  │  │
│  …                             │   │   neighbourhood + its free seats)       │  │
│  Selected: Karthik Iyer        │   └────────────────────────────────────────┘  │
│  ✦ AI suggests: WS 151 (near   │   Click a desk →  Assign · Swap · Reallocate   │
│     his project, monitor)      │                                               │
└───────────────────────────────┴───────────────────────────────────────────────┘
```
- **Assign**: free desk → assign selected person → notify.
- **Swap**: two occupied desks → swap occupants → notify both.
- **Reallocate**: occupied desk → move occupant elsewhere (or displace → AI suggests where the current person goes).
- **Find bay**: choose service line / account / project → map flies to that neighbourhood and highlights free seats.

### Layout — "Bulk move" (sub‑tab 4)
```
1) Who:   Group = [Cardtronics ODC ▾] (32 people)   or pick people ▢▢▢
2) Where: Target area = [2nd Floor · Phase II ▾]   (free 28 · occupied 12)
3) AI plan:  ✦ Auto-pack → 28 seated, 4 overflow
             ⚠ 12 already seated there → AI proposes:
                • keep 8 in place (same team)
                • relocate 4 to adjacent free seats  [review]
   Impact:  moved 32 · displaced 4 · team-cohesion 92% · avg move 1 floor
4) [Preview seat-by-seat]  →  [Approve & execute]  →  notifies all affected
```

## A4. Edge cases (handled by design)

- **Reassign an occupied desk** → must resolve the current occupant: *swap*, *move to a free seat*, or *unseat* — explicit confirm + notify.
- **Bulk move into an occupied area** → two modes: **Vacant‑only** (no displacement, overflow flagged) or **Make room** (AI relocates existing occupants, least disruption).
- **Capacity exceeded** → block + AI suggests split across areas or an alternative area.
- **Permanent ⇄ Flexible/Hot conversion** → converting an assigned area to hot‑desk **releases** fixed seats (notify owners); reverse needs assignees.
- **Active future bookings** on a desk being reassigned/converted → cancel + notify, or block (admin choice).
- **Accessibility** → if the employee needs an accessible desk, AI enforces it and warns on manual override.
- **Eligibility / cross‑area** → assigning outside the employee's service‑line area is allowed for admins but **flagged**.
- **Locked seats** (CEO/VP cabins, permanent leadership) → protected from bulk moves.
- **New joiners (unseated)** & **leavers** → unseated list + freed seats reflected live.
- **One fixed owner per seat**; flexible/hot seats have none — integrity enforced.
- **Audit + undo** → every change logged (who/when/why); session‑level undo.
- **Live numbers** → all counts update as you assign/move.

## A5. AI features (where they add real value)

- **Best‑seat suggestion** (single assign) — near team/manager, right amenities, accessible.
- **Auto‑pack a group** (bulk) — optimal placement minimising team fragmentation; "32 → 28 placed, 4 overflow."
- **Least‑disruption relocation** — when displacing, propose who moves where with the smallest impact.
- **Move plan from intent (NL)** — "move Cardtronics ODC to 2nd‑floor Phase II" → full draft seat plan + impact.
- **Consolidation** — detect under‑used areas, suggest merges to free a wing (ties into Cost/Intelligence).
- **Impact analysis** — displaced count, avg distance moved, team‑cohesion score, seats freed.

## A6. Numbers we'll surface (your "show proper numbers")

- **Overview KPIs:** total seats · assigned (fixed) · flexible + hot‑desk pool · vacant · **unseated employees** · utilisation %.
- **By area:** capacity / assigned / flexible / vacant / util % / owner (service line · account).
- **By service line / account / project:** headcount vs seats held vs vacant.
- **Bulk move:** to‑move · target free · overflow · displaced · seats freed.

## A7. Data & mock additions (frontend‑first, DB‑ready)

- **Area** → add `kind` ('assigned' | 'flexible' | 'hotdesk'), owner `serviceLineId` / `accountId` / `projectId`, `capacity` (have), derived assigned/vacant.
- **Allocation** (have) → add `allocType`, `validFrom/To`, `assignedBy`, status; **history/audit** log.
- **MovePlan / MoveItem** (have) → extend: status `draft|proposed|approved|executed`, item action `assign|swap|relocate`, `fromDeskId|toDeskId`.
- **Unseated** = employees with no `homeDeskId` (derive).
- All additive — no schema redesign.

## A8. Phased implementation

**Phase A1 — Frontend (mock)** ← *what I'd build after you approve*
- Allocation Register tab + 5 sub‑tabs. **Assign desk** (people panel + map + assign/swap/reallocate + find‑bay + AI suggest). **Areas** governance (set owner + type + capacity on the map). **Bulk move** planner (group → target → AI auto‑pack + relocation + impact + preview/approve, mock). **Overview** numbers. **Register** (today's table + export). Notifications surfaced on changes.

**Phase A2 — Backend** — allocation service (rules, integrity, audit), move execution, notifications (Email/Teams/WhatsApp), eligibility sync to Booking.

**Phase A3 — AI** — real optimisation (constraint solver for auto‑pack/relocation), NL move intent, consolidation recommendations.

## A9. Decisions (confirmed by product owner)

1. **Placement** — **Allocation** becomes its **own admin‑only top sub‑nav tab** (replaces today's Admin‑linked "Allocation"). Hidden for non‑admin roles.
2. **Bulk‑move execution** — **Draft → Approve → Execute** (with impact review + audit trail), then notify all affected. No immediate apply for group moves.
3. **Displacement default** — **Vacant‑only** (fill free seats, flag overflow). "Make room" (AI relocates existing occupants) is an explicit opt‑in per move.
4. **Permissions** — **Admin / facility managers only** for all allocation actions (no delegated service‑line leads in v1).
5. Sub‑tabs — keep all **5** (Overview · Assign desk · Areas · Bulk move · Register).

*Approved — next I'll build **Phase A1** (frontend, mock) and iterate on the look, same flow as Booking.*
