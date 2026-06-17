import { CyclingShimmerText } from '@/components/ui/CyclingShimmerText';

export function LoadingCard({
  message,
  messages,
}: {
  message?: string;
  messages?: string[];
}) {
  return (
    <div className="hero-skeleton-premium" aria-busy="true">
      <div className="skeleton-premium h-28 w-28 rounded-3xl" />
      <div className="skeleton-premium h-3 w-24 rounded-full" />
      <div className="skeleton-premium h-7 w-48 max-w-full rounded-lg" />
      <div className="skeleton-premium h-5 w-32 rounded-lg" />
      <div className="skeleton-premium h-14 w-full rounded-2xl mt-2" />
      {messages?.length ? (
        <CyclingShimmerText messages={messages} className="text-[var(--color-text-secondary)]" />
      ) : message ? (
        <p className="shimmer-text text-sm font-medium">{message}</p>
      ) : null}
    </div>
  );
}
