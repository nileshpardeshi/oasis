// OASIS — Workplace Intelligence domain types (frontend prototype).
// Every enum is a TypeScript string-literal union whose values are the EXACT lowercase
// PostgreSQL enum literals (see development_workspace.md §3) so the mock layer maps 1:1
// to the future Spring Boot DTOs and the PostgreSQL + PostGIS schema.

// ---------- enums (DB literal = FE union value) ----------
export type SpaceStatus = 'active' | 'inactive' | 'under_construction' | 'decommissioned' | 'reserved_build';
export type ServiceLineKind = 'core' | 'digital' | 'data_ai' | 'delivery' | 'hr' | 'admin' | 'others';
export type ElementKind = 'desk' | 'meeting_room' | 'zone' | 'wall' | 'door' | 'pillar' | 'amenity' | 'phone_booth' | 'collab_area' | 'reception' | 'label';
export type DeskType = 'fixed' | 'flexible' | 'shared' | 'reserved' | 'hot';
// Physical seat category as tracked in the manual register (WS / Cubicle / Cabin).
export type DeskKind = 'workstation' | 'cubicle' | 'cabin';
export type DeskState = 'available' | 'allocated' | 'blocked' | 'maintenance' | 'decommissioned';
export type AllocationType = 'permanent' | 'flexible' | 'shared' | 'reserved' | 'project';
export type BookingKind = 'hourly' | 'half_day' | 'full_day' | 'multi_day';
export type BookingStatus = 'held' | 'booked' | 'checked_in' | 'completed' | 'cancelled' | 'no_show' | 'expired';
export type OccupancyState = 'booked' | 'checked_in' | 'vacant' | 'occupied' | 'no_show';
export type OccupancyEventType = 'booked' | 'hold' | 'check_in' | 'check_out' | 'auto_release' | 'no_show' | 'sensor_occupied' | 'sensor_vacant' | 'admin_override';
export type PresenceSource = 'qr' | 'rfid' | 'biometric' | 'manual' | 'sensor' | 'hrms' | 'access_control' | 'web' | 'teams' | 'whatsapp' | 'system';
export type PriorityLevel = 'p1' | 'p2' | 'p3' | 'p4';
export type MoveStatus = 'draft' | 'planned' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
export type VisitorStatus = 'pending_approval' | 'expected' | 'checked_in' | 'checked_out' | 'no_show' | 'cancelled';
export type VisitorKind = 'visitor' | 'contractor' | 'interview' | 'vendor';
export type MeetingRoomStatus = 'available' | 'booked' | 'in_use' | 'maintenance';
export type PolicyKind = 'priority' | 'booking_window' | 'no_show' | 'privacy' | 'allocation' | 'cost' | 'governance' | 'sustainability';
export type QrKind = 'desk' | 'meeting_room' | 'zone' | 'floor' | 'visitor_pass';
export type NotificationKind = 'booking' | 'no_show' | 'move' | 'governance' | 'forecast' | 'visitor' | 'system';
export type NotificationChannel = 'email' | 'teams' | 'slack' | 'whatsapp' | 'push' | 'sms' | 'in_app';
export type NotificationStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type HeatBand = 'green' | 'yellow' | 'red';
export type HeatLevel = HeatBand;
export type VisibilityScope = 'team' | 'project' | 'account' | 'service_line' | 'floor' | 'company' | 'private';
export type EmployeeStatus = 'active' | 'on_leave' | 'remote' | 'separated' | 'contractor';
export type AppRole = 'super_admin' | 'admin' | 'facility_manager' | 'employee' | 'auditor';
export type Role = AppRole;
export type AgentKey = 'floorplan_vision' | 'workspace_planning' | 'occupancy_intelligence' | 'demand_forecasting' | 'team_seating' | 'relocation_planning' | 'cost_optimization' | 'governance' | 'executive_copilot' | 'employee_assistance';
export type AgentRunStatus = 'queued' | 'running' | 'needs_review' | 'applied' | 'rejected' | 'failed';
export type IntegrationCategory = 'hrms' | 'identity' | 'comms' | 'calendar' | 'access' | 'facilities';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error';
export type GovernanceSeverity = 'info' | 'warn' | 'critical';
export type HeatPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

// ---------- geometry (canvas/CAD plane, pixels) ----------
export interface Point { x: number; y: number }
export interface Geometry { x: number; y: number; w: number; h: number; rot: number }
export type Polygon = Point[];

// ---------- org hierarchy & spatial (D1) ----------
export interface Company { id: string; code: string; name: string }
export interface Office { id: string; companyId: string; code: string; name: string; city: string; country: string; timezone: string; geo?: { lat: number; lng: number } }
export interface Phase { id: string; officeId: string; code: string; name: string }
export interface Building { id: string; phaseId: string; code: string; name: string }
export interface Floor {
  id: string; companyId: string; buildingId: string; code: string; name: string; levelNo: number;
  widthPx: number; heightPx: number; scaleCmPerPx?: number;
  bgImageUrl?: string; bgOpacity?: number;
  totalDesks: number; totalRooms: number; status: SpaceStatus;
}
export interface ServiceLine { id: string; kind: ServiceLineKind; code: string; name: string; colorHex: string; headEmployeeId?: string; headcount?: number }
export interface Account { id: string; code: string; name: string; kind?: 'client' | 'internal'; headcount?: number }
export interface Project { id: string; accountId: string; code: string; name: string; managerEmployeeId?: string }
export interface Zone {
  id: string; companyId: string; floorId: string; areaId?: string; serviceLineId?: string; accountId?: string; kind: ElementKind;
  code: string; name: string; colorHex: string; bbox: Geometry; capacity?: number; status: SpaceStatus;
  // phase/area metadata mirrored from the manual tracking (e.g. "Phase II — Innovation Centre Unit I")
  phase?: string; capWs?: number; capCub?: number; capCab?: number; occupied?: number; vacant?: number;
}

// ---------- spatial element SSOT + desk + room (D2/D3) ----------
export interface SpaceElement {
  id: string; floorId: string; zoneId?: string; kind: ElementKind; code?: string; label?: string;
  geometry: Geometry; zIndex: number; styleJson?: Record<string, unknown>; isBookable: boolean; status: SpaceStatus;
}
export interface Desk {
  id: string; floorId: string; zoneId?: string; areaId?: string; serviceLineId?: string; accountId?: string; deskNo: string;
  deskType: DeskType; deskKind?: DeskKind; deskState: DeskState;
  // from the manual register: assigned occupant, drawer/locker key number, desk phone extension
  empId?: string; occupantName?: string; drawerKey?: string; extNumber?: string; isVacant?: boolean; isAsset?: boolean;
  hasMonitor?: boolean; hasDock?: boolean; isStanding?: boolean; isAccessible?: boolean;
  amenities?: string[]; monthlyCost?: number; geometry: Geometry; isBookable: boolean;
}
// Phase/Area within a floor, mirrored from the manual tracking's Main Data tab.
export interface Area {
  id: string; floorId: string; name: string; phase: string;
  capWs: number; capCub: number; capCab: number; capTotal: number;
  occTotal: number; vacTotal: number; occPct: number;
}
// One row of the real desk-allocation register (the "Open Office" tab).
export interface SeatRegisterRow {
  id: string; floorId: string; areaId?: string; zoneId?: string; deskId?: string;
  empId?: string; deskKind: DeskKind; seatNo: string; drawerKey?: string; occupantName?: string; extNumber?: string;
  serviceLineId?: string; accountId?: string; rawGroup?: string; rawAccount?: string;
  isVacant: boolean; isAsset?: boolean;
}
export type MeetingRoomKind = 'meeting' | 'phone_booth' | 'board' | 'training';
export interface MeetingRoom {
  id: string; floorId: string; zoneId?: string; roomNo: string; name: string;
  capacity: number; kind?: MeetingRoomKind; location?: string;
  equipment?: string[]; status: MeetingRoomStatus; outlookResourceEmail?: string; geometry: Geometry;
}
// Main-Data style capacity vs occupied vs vacant rollup (per phase/area).
export interface CapacityRow {
  id: string; floorId: string; area: string; phase: string;
  capWs: number; capCub: number; capCab: number; capTotal: number;
  occTotal: number; vacTotal: number; occPct: number;
  isTotalRow?: boolean;
}

// ---------- employee (D10) ----------
export interface Employee {
  id: string; empNo: string; name: string; email: string; grade: string; title: string;
  serviceLineId: string; accountId?: string; projectId?: string; managerId?: string;
  homeOfficeId: string; homeDeskId?: string; priority: PriorityLevel; status: EmployeeStatus;
  phone?: string; photoUrl?: string;
}

// ---------- allocation, booking, QR, visitor (D3) ----------
export interface Allocation {
  id: string; deskId: string; employeeId?: string; projectId?: string;
  allocType: AllocationType; priority: PriorityLevel; validFrom: string; validTo?: string; status: SpaceStatus;
}
export interface Booking {
  id: string; code: string; deskId?: string; meetingRoomId?: string; employeeId: string; bookedBy?: string;
  title?: string; organiserId?: string; partySize?: number;
  kind: BookingKind; startsAt: string; endsAt: string; status: BookingStatus; priority: PriorityLevel;
  holdExpiresAt?: string; source: PresenceSource; notes?: string; qrToken?: string; checkedInAt?: string;
}
export interface BookingHold { id: string; deskId: string; slot: string; heldByEmployeeId: string; expiresAt: string }
export interface QrCode { id: string; kind: QrKind; targetId: string; token: string; url?: string; isActive: boolean; rotatedAt?: string }
export interface Visitor {
  id: string; kind: VisitorKind; fullName: string; org?: string; hostEmployeeId: string; officeId: string; deskId?: string;
  expectedFrom: string; expectedTo: string; checkedInAt?: string; checkedOutAt?: string; badgeNo?: string; status: VisitorStatus; purpose?: string;
}

// ---------- occupancy & presence (D4) ----------
export interface CheckIn { id: string; bookingId: string; employeeId: string; checkedInAt: string; checkedOutAt?: string; isOverride: boolean; source: PresenceSource }
export interface OccupancyEvent { id: string; deskId?: string; type: OccupancyEventType; state?: OccupancyState; source: PresenceSource; at: string; employeeId?: string }
export interface DeskLiveStatus { deskId: string; state: OccupancyState; employeeId?: string; since?: string }
export interface NoShowAlert { id: string; bookingId: string; deskId: string; employeeId: string; graceMinutes: number; detectedAt: string; releasedAt?: string; escalationLevel: number; resolved: boolean }
export interface AttendanceCorrelation {
  employeeId: string; date: string; presentOffice: boolean; hrmsPresent: boolean; accessPresent: boolean;
  biometricPresent: boolean; qrPresent: boolean; sources: PresenceSource[]; hoursInOffice: number; deskUsed?: string;
}

// ---------- intelligence & analytics (D6/D7) ----------
export interface HeatCell { deskId?: string; zoneId?: string; period: HeatPeriod; level: HeatLevel; utilizationPct: number }
export interface ForecastPoint { date: string; scopeType: string; scopeLabel: string; predictedOccupancy: number; capacity: number; confidence: number }
export interface CollaborationEdge { aEmployeeId: string; bEmployeeId: string; sharedProjectId?: string; proximityScore: number; meetingsCount: number; period: string; optInConfirmed: boolean }
export type SitNearTarget = 'team' | 'manager' | 'project' | 'account' | 'collaborators';
export interface TeamSeatingSuggestion { id: string; target: SitNearTarget; forEmployeeId: string; suggestedDeskIds: string[]; rationale: string; nearbyCount: number }
export interface SustainabilityMetric { date: string; floorId?: string; energyKwh?: number; carbonKg?: number; occupancyPct?: number }

// ---------- optimization & governance (D8) ----------
export interface MovePlan { id: string; code: string; name: string; reason?: string; fromFloorId: string; toFloorId: string; scheduledFor?: string; status: MoveStatus; estCost?: number; approverId?: string; employeeCount: number }
export interface MoveItem { id: string; movePlanId: string; employeeId: string; fromDeskId?: string; toDeskId?: string; sequenceNo: number; done: boolean }
export interface CostMetric { id: string; period: string; scopeType: string; scopeId?: string; scopeLabel: string; totalCost: number; utilizationPct: number; costPerUsedSeat: number; consolidationSaving?: number; recommendation?: string }
export interface PolicyRule { id: string; when: string; then: string; priority: number }
export interface Policy { id: string; kind: PolicyKind; code: string; name: string; description?: string; isActive: boolean; rules: PolicyRule[] }
export interface GovernanceFinding { id: string; severity: GovernanceSeverity; message: string; entityType?: string; entityId?: string; raisedAt: string; resolved: boolean; policyId?: string }

// ---------- conversational, notifications, executive (D9) ----------
export interface Notification { id: string; recipientEmployeeId: string; kind: NotificationKind; channel: NotificationChannel; subject: string; body?: string; relatedType?: string; relatedId?: string; status: NotificationStatus; read: boolean; at: string }
export interface ChatMessage { id: string; role: 'user' | 'assistant'; text: string; at: string; actions?: { label: string; href: string }[] }
export interface ExecKpi { label: string; value: string; unit?: string; delta?: string; dir?: 'up' | 'down' | 'flat' }

// ---------- platform, identity, privacy, audit (D10) ----------
export interface PeopleLocationViewLog { id: string; actorEmployeeId: string; targetEmployeeId: string; at: string; action: string }
export interface PrivacySetting { employeeId: string; locationVisibility: VisibilityScope; showOnSearch: boolean; sharePresence: boolean; collabAnalyticsOptIn: boolean; attendanceAnalyticsOptIn: boolean }
export interface Integration { id: string; category: IntegrationCategory; provider: string; status: IntegrationStatus; lastSyncAt?: string; config?: Record<string, unknown> }
export interface CurrentUser { employeeId: string; name: string; role: Role; scopeType: string; scopeId?: string }

// ---------- AI agent envelope (mock now, Java DTO + Python response later) ----------
export interface AgentSuggestion<T> {
  id: string; agent: AgentKey; status: AgentRunStatus; confidence: number; rationale: string;
  citations?: { source: string; ref: string }[]; payload: T; requiresReview: boolean;
  createdAt: string; createdBy: string; reviewedBy?: string; reviewedAt?: string; reviewNote?: string;
}
export interface DetectedElement { kind: ElementKind; geometry: Geometry; confidence: number; deskNo?: string }
export interface DetectedLayout { floorId: string; sourceFile: string; elements: DetectedElement[] }
export interface SeatingPlanProposal { scope: string; moves: { employeeId: string; deskId: string }[]; collaborationGain: number }
export interface OccupancyInsight { scopeLabel: string; utilizationPct: number; trend: 'up' | 'down' | 'flat'; note: string }
export interface OccupancyForecast { points: ForecastPoint[] }
export interface SitNearOptions { target: SitNearTarget; suggestedDeskIds: string[]; nearbyCount: number }
export interface CostOptimization { scopeLabel: string; currentUtilizationPct: number; recommendation: string; annualSaving: number }

// ---------- dashboards ----------
export interface WorkspaceKpis { totalCapacity: number; occupied: number; vacant: number; booked: number; checkedIn: number; noShows: number; utilizationPct: number }
