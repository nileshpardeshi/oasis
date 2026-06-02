import type { IconName } from '@/components/ui/Icon';

export interface NavItem {
  /** route segment used by the dynamic [module] route ('dashboard' = home) */
  slug: string;
  href: string;
  /** label shown in the sidebar */
  label: string;
  /** page title shown in the header / placeholder */
  title: string;
  /** one-line description used on placeholder screens */
  desc?: string;
  icon: IconName;
  badge?: string;
}

export interface NavSection {
  heading: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    heading: 'Main',
    items: [{ slug: 'dashboard', href: '/', label: 'Dashboard', title: 'Dashboard', icon: 'dashboard' }],
  },
  {
    heading: 'Modules',
    items: [
      {
        slug: 'procurement',
        href: '/procurement',
        label: 'Procurement',
        title: 'Procurement Intelligence',
        desc: 'Raise requests, AI vendor discovery, multi-factor price/warranty/delivery comparison and approval workflows.',
        icon: 'procurement',
        badge: '18',
      },
      {
        slug: 'administration',
        href: '/administration',
        label: 'Administration',
        title: 'Administration & Facilities',
        desc: 'Consumable inventory, asset register, AMC tracking with expiry reminders, facility requests and maintenance.',
        icon: 'administration',
      },
      {
        slug: 'workspace',
        href: '/workspace',
        label: 'Workspace',
        title: 'Workspace & Desk Booking',
        desc: 'Movie-seat style desk & meeting-room booking, WhatsApp booking, occupancy heatmaps and utilisation reports.',
        icon: 'workspace',
      },
      {
        slug: 'travel',
        href: '/travel',
        label: 'Travel Desk',
        title: 'Travel Desk',
        desc: 'AI travel agent: aggregate & compare flight/hotel quotes, assisted booking, fare-drop & schedule alerts.',
        icon: 'travel',
        badge: '9',
      },
      {
        slug: 'invoicing',
        href: '/invoicing',
        label: 'Invoicing',
        title: 'Invoicing & Payments',
        desc: 'Invoice ingestion + OCR, invoice↔UTR reconciliation, auto Paid/Unpaid status and finance dashboards.',
        icon: 'invoicing',
        badge: '42',
      },
      {
        slug: 'visa',
        href: '/visa',
        label: 'Visa Assistant',
        title: 'Visa Assistant',
        desc: 'Visa documentation guidance, checklists, compliant appointment-slot availability alerts and reminders.',
        icon: 'visa',
      },
    ],
  },
  {
    heading: 'More',
    items: [
      {
        slug: 'events',
        href: '/events',
        label: 'Events',
        title: 'Events Management',
        desc: 'Plan and track events, budgets, vendors, RSVPs and logistics.',
        icon: 'events',
      },
      {
        slug: 'helpdesk',
        href: '/helpdesk',
        label: 'Helpdesk',
        title: 'Admin Helpdesk',
        desc: 'Unified intake and SLA tracking for any admin request, with ticketing.',
        icon: 'helpdesk',
      },
      {
        slug: 'vendors',
        href: '/vendors',
        label: 'Vendors & Contracts',
        title: 'Vendors & Contracts',
        desc: 'Vendor master, onboarding, KYC and contract lifecycle management.',
        icon: 'vendors',
      },
      {
        slug: 'assets',
        href: '/assets',
        label: 'Assets',
        title: 'Asset Management',
        desc: 'Full IT / non-IT asset register, assignment, audits and depreciation.',
        icon: 'assets',
      },
      {
        slug: 'analytics',
        href: '/analytics',
        label: 'Spend Analytics',
        title: 'Spend Analytics',
        desc: 'Cross-module spend visibility, budgets and forecasts for leadership.',
        icon: 'analytics',
      },
    ],
  },
  {
    heading: 'System',
    items: [
      {
        slug: 'assistant',
        href: '/assistant',
        label: 'AI Assistant',
        title: 'AI Assistant',
        desc: 'Conversational front door across all admin services — RAG search and multi-agent actions (Web, Teams, WhatsApp, Slack).',
        icon: 'assistant',
      },
      {
        slug: 'settings',
        href: '/settings',
        label: 'Settings',
        title: 'Settings',
        desc: 'Roles & permissions, integrations, notifications and platform configuration.',
        icon: 'settings',
      },
    ],
  },
];

/** Lookup map for the dynamic [module] placeholder route. */
export const moduleBySlug: Record<string, NavItem> = Object.fromEntries(
  navSections
    .flatMap((s) => s.items)
    .filter((i) => i.slug !== 'dashboard')
    .map((i) => [i.slug, i]),
);

export interface QuickItem {
  href: string;
  title: string;
  sub: string;
  icon: IconName;
  tint: string;
}

export const quickAccess: QuickItem[] = [
  { href: '/procurement', title: 'Procurement', sub: 'Vendor discovery & AI cost comparison', icon: 'procurement', tint: 'tint-orange' },
  { href: '/administration', title: 'Administration', sub: 'Inventory & AMC tracking', icon: 'administration', tint: 'tint-blue' },
  { href: '/workspace', title: 'Workspace', sub: 'Visual desk & room booking', icon: 'workspace', tint: 'tint-info' },
  { href: '/travel', title: 'Travel Desk', sub: 'AI flight & hotel comparison', icon: 'travel', tint: 'tint-blue' },
  { href: '/invoicing', title: 'Invoicing', sub: 'UTR reconciliation & tracking', icon: 'invoicing', tint: 'tint-green' },
  { href: '/visa', title: 'Visa Assistant', sub: 'Slot alerts & doc guidance', icon: 'visa', tint: 'tint-orange' },
  { href: '/assistant', title: 'AI Assistant', sub: 'Chatbot for every service', icon: 'assistant', tint: 'tint-info' },
  { href: '/events', title: 'Events', sub: 'Plan & track company events', icon: 'events', tint: 'tint-orange' },
];
