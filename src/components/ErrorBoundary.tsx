import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

async function hardResetApp() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  window.location.href = `${base}?reset=${Date.now()}`;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ScentCap] Uncaught render error', error, info.componentStack);
  }

  private retry = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div
          className="min-h-dvh flex flex-col items-center justify-center px-6 text-center safe-pt safe-pb"
          style={{ background: 'var(--sc-bg)', color: 'var(--sc-text)' }}
        >
          <p style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.55 }}>ScentCap</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginTop: 12 }}>Couldn’t open</h1>
          <p style={{ marginTop: 12, maxWidth: 320, lineHeight: 1.5, opacity: 0.75, fontSize: 15 }}>
            App crashed or cache is stale. Wardrobe data stays on this device. Reload, or clear cache if it keeps failing.
          </p>
          <button
            type="button"
            onClick={this.retry}
            style={{
              marginTop: 28,
              padding: '14px 28px',
              borderRadius: 12,
              border: 'none',
              background: 'var(--sc-accent)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => void hardResetApp()}
            style={{
              marginTop: 12,
              padding: '12px 20px',
              borderRadius: 12,
              border: '1px solid var(--sc-border)',
              background: 'transparent',
              color: 'var(--sc-text)',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Clear cache & reopen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export { hardResetApp };
