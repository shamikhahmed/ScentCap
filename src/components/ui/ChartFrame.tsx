import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Recharts ResponsiveContainer fails in WKWebView — measure container first. */
export function ChartFrame({ height = 192, children }: { height?: number; children: (width: number, height: number) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full" style={{ height, minHeight: height }}>
      {width > 0 ? children(width, height) : null}
    </div>
  );
}
