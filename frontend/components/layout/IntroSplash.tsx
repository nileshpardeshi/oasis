'use client';

import { useEffect, useRef, useState } from 'react';

// Full-screen OASIS animation shown on every page load / refresh, then fades into the app.
// Dismisses on video end, Skip, a safety timeout, or any load error so it can never block.
export default function IntroSplash() {
  const [show, setShow] = useState(true);
  const [closing, setClosing] = useState(false);
  const dismissed = useRef(false);

  function dismiss() {
    if (dismissed.current) return;
    dismissed.current = true;
    setClosing(true);
    window.setTimeout(() => setShow(false), 550); // match the fade-out duration
  }

  useEffect(() => {
    if (!show) return;
    const safety = window.setTimeout(dismiss, 9000); // never trap the user
    return () => window.clearTimeout(safety);
  }, [show]);

  if (!show) return null;

  return (
    <div className={'oasis-intro' + (closing ? ' oasis-intro--closing' : '')} role="dialog" aria-label="OASIS intro">
      <video
        className="oasis-intro__video"
        src="/oasis-intro.mp4"
        autoPlay
        muted
        playsInline
        onEnded={dismiss}
        onError={dismiss}
      />
      <button className="oasis-intro__skip" type="button" onClick={dismiss}>Skip intro ›</button>
    </div>
  );
}
