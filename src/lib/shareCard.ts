import type { AdvisorResult, Fragrance } from '@/types';

export interface ShareCardInput {
  brand: string;
  name: string;
  concentration: string;
  family: string;
  sprays?: number;
  score?: number;
  reasoning?: string;
  accentColor?: string;
  imageUrl?: string;
}

export type ShareCardFormat = 'portrait' | 'story' | 'square';

export interface ShareCardOptions {
  format?: ShareCardFormat;
  /** Override theme; defaults to current app theme (body.light) */
  light?: boolean;
}

const FORMAT_DIMS: Record<ShareCardFormat, { w: number; h: number }> = {
  portrait: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
};

export function buildShareText(input: ShareCardInput): string {
  const lines = [
    "Today's Scent — ScentCap",
    '─────────────────────',
    `${input.brand} ${input.name}`,
    `${input.concentration} · ${input.family}`,
  ];
  if (input.sprays != null) lines.push(`${input.sprays} sprays recommended`);
  if (input.score != null) lines.push(`${Math.round(input.score)}% match today`);
  if (input.reasoning) lines.push('', input.reasoning);
  lines.push('', 'scentcap.app');
  return lines.join('\n');
}

export function advisorToShareInput(result: AdvisorResult): ShareCardInput {
  return {
    brand: result.primary.fragrance.brand,
    name: result.primary.fragrance.name,
    concentration: result.primary.fragrance.concentration,
    family: result.primary.fragrance.family,
    sprays: result.spray.totalSprays,
    score: result.fragranceScore,
    reasoning: result.reasoning[0],
    imageUrl: result.primary.fragrance.image,
  };
}

export function fragranceToShareInput(f: Fragrance, sprays?: number): ShareCardInput {
  return {
    brand: f.brand,
    name: f.name,
    concentration: f.concentration,
    family: f.family,
    sprays,
    imageUrl: f.image,
  };
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png');
  });
}

function isLightTheme(override?: boolean): boolean {
  if (override != null) return override;
  return typeof document !== 'undefined' && document.body.classList.contains('light');
}

async function loadShareImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Cap Neutral share card — solid bg, minimal typography */
export async function exportShareCardPng(
  input: ShareCardInput,
  accentColor = 'var(--sc-accent)',
  options: ShareCardOptions = {},
): Promise<Blob> {
  const format = options.format ?? 'square';
  const { w, h } = FORMAT_DIMS[format];
  const light = isLightTheme(options.light);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const bg = light ? '#ffffff' : '#1c1c1e';
  const textPrimary = light ? '#1d1d1f' : '#f5f5f7';
  const textSecondary = light ? '#86868b' : '#98989d';
  const textTertiary = light ? '#aeaeb2' : '#636366';
  const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, w, 6);

  let centerY = format === 'story' ? h * 0.38 : h * 0.42;

  if (input.imageUrl) {
    const img = await loadShareImage(input.imageUrl);
    if (img) {
      const maxH = format === 'square' ? 300 : 340;
      const maxW = w - 200;
      const scale = Math.min(maxW / img.width, maxH / img.height);
      const iw = img.width * scale;
      const ih = img.height * scale;
      ctx.drawImage(img, (w - iw) / 2, centerY - 280, iw, ih);
      centerY += 40;
    }
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = textTertiary;
  ctx.font = `600 24px ${font}`;
  ctx.fillText("TODAY'S SCENT", w / 2, centerY - 120);

  ctx.fillStyle = textPrimary;
  ctx.font = `700 48px ${font}`;
  ctx.fillText(input.brand, w / 2, centerY - 40);

  ctx.fillStyle = textSecondary;
  ctx.font = `500 36px ${font}`;
  ctx.fillText(input.name, w / 2, centerY + 20);

  ctx.fillStyle = accentColor;
  ctx.font = `500 22px ${font}`;
  ctx.fillText(`${input.concentration} · ${input.family}`, w / 2, centerY + 80);

  if (input.sprays != null || input.score != null) {
    const detail = [
      input.sprays != null ? `${input.sprays} sprays` : null,
      input.score != null ? `${Math.round(input.score)}% match` : null,
    ].filter(Boolean).join(' · ');
    ctx.fillStyle = textTertiary;
    ctx.font = `400 20px ${font}`;
    ctx.fillText(detail, w / 2, centerY + 130);
  }

  if (input.reasoning) {
    ctx.fillStyle = textSecondary;
    ctx.font = `400 20px ${font}`;
    const reasoningY = format === 'square' ? centerY + 180 : centerY + 200;
    wrapText(ctx, input.reasoning, w / 2, reasoningY, w - 160, 30);
  }

  ctx.fillStyle = textTertiary;
  ctx.font = `600 18px ${font}`;
  ctx.fillText('ScentCap', w / 2, h - 64);

  return canvasToBlob(canvas);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatFilename(format: ShareCardFormat): string {
  if (format === 'story') return 'scentcap-today-story.png';
  if (format === 'square') return 'scentcap-today-square.png';
  return 'scentcap-today.png';
}

export async function shareWearCard(
  input: ShareCardInput,
  accentColor?: string,
  options: ShareCardOptions = {},
): Promise<'shared' | 'copied' | 'downloaded'> {
  const format = options.format ?? 'square';
  const text = buildShareText(input);
  if (navigator.share) {
    try {
      const blob = await exportShareCardPng(input, accentColor, { ...options, format });
      const file = new File([blob], formatFilename(format), { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Today's Scent", text, files: [file] });
        return 'shared';
      }
      await navigator.share({ title: "Today's Scent", text });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    const blob = await exportShareCardPng(input, accentColor, { ...options, format });
    downloadBlob(blob, formatFilename(format));
    return 'downloaded';
  }
}
