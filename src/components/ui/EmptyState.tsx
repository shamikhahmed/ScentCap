import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { popularLocal, type LocalFragrance } from '@/catalog/local';
import { FragranceThumb } from '@/components/collection/FragranceThumb';

interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: { label: string; to: string };
  secondary?: { label: string; onClick: () => void; loading?: boolean };
  /** @deprecated kept for call-site compatibility */
  showGuide?: boolean;
}

/** First-run / empty screen: real bottle trio, one clear action. */
export function EmptyState({ eyebrow, title, description, action, secondary }: EmptyStateProps) {
  const navigate = useNavigate();
  const [trio, setTrio] = useState<LocalFragrance[]>([]);

  useEffect(() => {
    void popularLocal(3).then(setTrio);
  }, []);

  return (
    <div className="ui-page min-h-[80dvh] flex flex-col items-center justify-center text-center">
      <div className="flex items-end justify-center gap-3 mb-8 h-40" aria-hidden>
        {trio.map((f, i) => (
          <div key={f.id} className={i === 1 ? 'w-32' : 'w-24 opacity-90'}>
            <FragranceThumb fragrance={f} variant="plinth" size="md" className="!rounded-[20px] shadow-[var(--shadow-2)]" />
          </div>
        ))}
      </div>
      {eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}
      <h1 className="ui-largetitle mt-1 max-w-md">{title}</h1>
      <p className="ui-secondary mt-3 max-w-sm leading-relaxed">{description}</p>
      <div className="w-full max-w-sm mt-8 space-y-2.5">
        {action && (
          <button type="button" className="ui-btn ui-btn--primary ui-btn--block" onClick={() => navigate(action.to)}>
            {action.label}
          </button>
        )}
        {secondary && (
          <button type="button" className="ui-btn ui-btn--gray ui-btn--block" onClick={secondary.onClick} disabled={secondary.loading}>
            {secondary.loading ? 'Preparing…' : secondary.label}
          </button>
        )}
      </div>
    </div>
  );
}
