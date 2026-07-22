import { useEffect, useState } from 'react';
import { CloudOff } from 'lucide-react';

export function OfflineStatusBar() {
  const [offline, setOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false));

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="sc-offline-banner flex items-center justify-center gap-2 z-50 sticky top-0" role="status">
      <CloudOff size={14} strokeWidth={2} aria-hidden />
      <span>Offline · Your wardrobe remains fully available</span>
    </div>
  );
}
