import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
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
        <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center safe-pt safe-pb bg-[var(--color-bg)]">
          <p className="text-caption text-[var(--color-text-tertiary)]">ScentCap</p>
          <h1 className="text-title mt-2">Something went wrong</h1>
          <p className="text-subhead text-[var(--color-text-secondary)] mt-3 max-w-sm leading-relaxed">
            The app hit an unexpected error. Your wardrobe data is still on this device — try reloading.
          </p>
          <Button className="mt-8 btn-glow" size="lg" onClick={this.retry}>
            Reload app
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
