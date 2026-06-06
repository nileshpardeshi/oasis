import { redirect } from 'next/navigation';

// Studio was merged into the Floor Plan tab (View / Edit-layout toggle).
export default function StudioRedirect() {
  redirect('/workspace/floor');
}
