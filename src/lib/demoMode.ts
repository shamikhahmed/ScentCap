const DEMO_SESSION_KEY = 'scentcap_demo_mode';

export function isDemoUrl(): boolean {
  return new URLSearchParams(window.location.search).get('demo') === '1';
}

export function markDemoSession(): void {
  try {
    sessionStorage.setItem(DEMO_SESSION_KEY, '1');
  } catch {
    /* private mode */
  }
}

export function isDemoSession(): boolean {
  try {
    return sessionStorage.getItem(DEMO_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearDemoSession(): void {
  try {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
