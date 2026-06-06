import { redirect } from 'next/navigation';

// The standalone Studio designer was merged into the Floor Plan tab's "Edit layout" mode.
export default function StudioDesignerRedirect() {
  redirect('/workspace/floor');
}
