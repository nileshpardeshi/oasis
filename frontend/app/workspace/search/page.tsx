import { redirect } from 'next/navigation';

// Search moved under Booking as the "Find people" sub-tab.
export default function SearchRedirect() {
  redirect('/workspace/booking?tab=find');
}
