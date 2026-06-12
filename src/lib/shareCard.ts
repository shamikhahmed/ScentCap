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
}

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
  };
}

export function fragranceToShareInput(f: Fragrance, sprays?: number): ShareCardInput {
  return {
    brand: f.brand,
    name: f.name,
    concentration: f.concentration,
    family: f.family,
    sprays,
  };
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png');
  });
}

export async function exportShareCardPng(input: ShareCardInput, accentColor = '#c9a87c'): Promise<Blob> {
  const w = 1080;
  const h = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0c0a09');
  grad.addColorStop(0.45, `${accentColor}33`);
  grad.addColorStop(1, '#0c0a09');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = accentColor;
  ctx.font = '600 28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("TODAY'S SCENT", w / 2, 180);

  ctx.fillStyle = '#fafaf9';
  ctx.font = '700 52px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(input.brand, w / 2, 320);

  ctx.fillStyle = 'rgba(250,250,249,0.75)';
  ctx.font = '500 40px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(input.name, w / 2, 390);

  ctx.fillStyle = accentColor;
  ctx.font = '500 26px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`${input.concentration} · ${input.family}`, w / 2, 470);

  if (input.sprays != null || input.score != null) {
    const detail = [
      input.sprays != null ? `${input.sprays} sprays` : null,
      input.score != null ? `${Math.round(input.score)}% match` : null,
    ].filter(Boolean).join(' · ');
    ctx.fillStyle = 'rgba(250,250,249,0.55)';
    ctx.font = '400 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(detail, w / 2, 530);
  }

  if (input.reasoning) {
    ctx.fillStyle = 'rgba(250,250,249,0.45)';
    ctx.font = '400 22px -apple-system, BlinkMacSystemFont, sans-serif';
    wrapText(ctx, input.reasoning, w / 2, 620, w - 160, 32);
  }

  ctx.fillStyle = 'rgba(201,168,124,0.6)';
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('ScentCap', w / 2, h - 80);

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

export async function shareWearCard(input: ShareCardInput, accentColor?: string): Promise<'shared' | 'copied' | 'downloaded'> {
  const text = buildShareText(input);
  if (navigator.share) {
    try {
      const blob = await exportShareCardPng(input, accentColor);
      const file = new File([blob], 'scentcap-today.png', { type: 'image/png' });
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
    const blob = await exportShareCardPng(input, accentColor);
    downloadBlob(blob, 'scentcap-today.png');
    return 'downloaded';
  }
}
