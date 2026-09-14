import { useEffect, useState } from 'react';

/** In-app offline indicator — SW still serves cached shell via index.html fallback. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="cap-offline-banner" role="status" aria-live="polite">
      You&apos;re offline — your wardrobe and logs still work on this device.
    </div>
  );
}
