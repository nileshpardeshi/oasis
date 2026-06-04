// OASIS — Travel Desk domain types (frontend prototype)

export type TripType = 'One-way' | 'Round-trip' | 'Multi-city';
export type CabinClass = 'Economy' | 'Premium Economy' | 'Business' | 'First';
export type Entity = 'OSPL' | 'OSSPL' | 'OCSI';
export type QuoteSource = 'vendor' | 'benchmark';
export type FareVerdict = 'Good' | 'Average' | 'High';

export type RequestStatus =
  | 'Draft'
  | 'Submitted'
  | 'Policy Checked'
  | 'Sourcing'
  | 'Compared'
  | 'Pending Approval'
  | 'Approved'
  | 'Booked'
  | 'Closed'
  | 'Rejected';

export interface Traveller {
  id: string;
  name: string;
  empNo: string;
  grade: string;
  homeOffice: string;
  serviceLine: string;
  project: string;
  email: string;
  mobile?: string;
  passportNo?: string;
  visa?: string;
  frequentFlyer?: string;
  seatPref?: string;
  mealPref?: string;
}

export interface FlightSegment {
  carrier: string;       // 'AI — Air India'
  flightNo: string;
  cabin: CabinClass;
  date: string;          // ISO 'YYYY-MM-DD'
  fromCity: string;
  fromCode: string;      // IATA
  toCity: string;
  toCode: string;
  dep: string;           // 'HH:MM' local
  arr: string;           // 'HH:MM' local
  arrNextDay?: boolean;  // '*'/'#' markers in the source
  durationMin: number;
  baggage: string;       // '1PC' / '2PC'
}

export interface QuoteOption {
  id: string;
  source: QuoteSource;       // vendor | benchmark
  sourceName: string;        // vendor name OR 'OASIS · Duffel' etc.
  airline: string;           // primary marketing carrier
  cabin: CabinClass;
  segments: FlightSegment[];
  stops: number;             // derived (one-way leg)
  layovers: string[];        // ['DEL · 2h 55m'] (display)
  totalDurationMin: number;  // door-to-door (round trip)
  fare: number;              // landed cost, INR
  refundable: boolean;
  refundableFare?: number;   // optional refundable variant
  baggage: string;           // overall
  changeRule?: string;
  cancelRule?: string;
  score: number;             // 0–100 (weighted, §10)
  inPolicy: boolean;
  policyNote?: string;
}

export type VendorQuoteStatus = 'Received' | 'Awaiting' | 'Late';

export interface VendorQuote {
  id: string;
  vendorId: string;
  vendorName: string;
  receivedAt?: string;       // ISO datetime
  turnaroundHrs?: number;
  status: VendorQuoteStatus;
  options: QuoteOption[];
}

export interface TravelRequest {
  id: string;
  code: string;              // 'TRV-64393'
  traveller: Traveller;
  coTravellers?: string[];   // names, for group
  tripType: TripType;
  originCity: string;
  originCode: string;
  destCity: string;
  destCode: string;
  international: boolean;
  departDate: string;
  returnDate?: string;
  cabin: CabinClass;
  purpose: string;
  entity: Entity;
  billToClient: boolean;
  budget?: number;
  status: RequestStatus;
  raisedOn: string;
  dueBy: string;
  needHotel: boolean;
  needTransit: boolean;
  vendorQuotes: VendorQuote[];
  benchmark: QuoteOption[];  // AI market-search options
  recommendedOptionId?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  avgTurnaroundHrs: number;
  priceIndex: number;        // 100 = market median; <100 = cheaper than market
  serviceRating: number;     // 1–5
  winRate: number;           // %
  quotesYtd: number;
  status: 'Active' | 'Inactive';
}

export type TripStatus = 'Booked' | 'Ticketed' | 'Travelling' | 'Completed' | 'Cancelled';

export interface Trip {
  id: string;
  code: string;              // 'TRP-...'
  requestCode: string;
  traveller: string;
  routeLabel: string;        // 'HYD → SFO → HYD'
  airline: string;
  pnr: string;
  departDate: string;
  returnDate?: string;
  fare: number;
  vendorName: string;
  entity: Entity;
  status: TripStatus;
  paymentStatus: 'Advance Due' | 'Paid' | 'Scheduled';
  fareWatch: boolean;
}

export type AlertKind = 'fare-drop' | 'schedule' | 'risk';

export interface TravelAlert {
  id: string;
  kind: AlertKind;
  tripCode: string;
  traveller: string;
  routeLabel: string;
  message: string;
  detail?: string;
  netSaving?: number;        // for fare-drop (after penalties)
  raisedAt: string;
  severity: 'info' | 'warning' | 'success';
}
