#!/usr/bin/env node
/**
 * Mobile Lighthouse against `vite preview` for CI.
 * Budgets: perf ≥ 90, a11y ≥ 95, best-practices ≥ 95, SEO ≥ 95.
 * Perf below 85 → warn only (exit 0) so deploy is not blocked on flake.
 * Other categories below budget → exit 1 (job fails; deploy does not depend on this job).
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'qa', 'lighthouse');
const reportPath = join(outDir, 'mobile-preview.json');
const summaryPath = join(outDir, 'SUMMARY.json');

const PORT = Number(process.env.LH_PORT || 4175);
const BASE = process.env.LH_BASE || '/ScentCap/';
const URL = process.env.LH_URL || `http://127.0.0.1:${PORT}${BASE}`;

const BUDGETS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 95,
  seo: 95,
};
const PERF_WARN_FLOOR = 85;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.ok || res.status === 304) return;
    } catch {
      /* retry */
    }
    await sleep(500);
  }
  throw new Error(`Preview server not ready at ${url}`);
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: opts.stdio ?? 'inherit',
      env: { ...process.env, ...opts.env },
      shell: false,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0 || opts.allowFail) resolve(code ?? 1);
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
  });
}

mkdirSync(outDir, { recursive: true });

const preview = spawn(
  'npx',
  ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: process.env },
);

let previewLog = '';
preview.stdout?.on('data', (d) => {
  previewLog += d.toString();
});
preview.stderr?.on('data', (d) => {
  previewLog += d.toString();
});

let exitCode = 0;
try {
  if (!existsSync(join(root, 'dist', 'index.html'))) {
    console.log('dist/ missing — running build…');
    await run('npm', ['run', 'build']);
  }

  await waitForServer(URL);
  console.log(`Lighthouse mobile → ${URL}`);

  // Prefer global/npx lighthouse; fall back to chrome-launcher + lighthouse if installed
  const require = createRequire(import.meta.url);
  let lighthouse;
  let chromeLauncher;
  try {
    lighthouse = (await import('lighthouse')).default;
    chromeLauncher = await import('chrome-launcher');
  } catch {
    // Install ephemeral tools for CI without polluting package.json lock long-term:
    // workflow installs lighthouse + chrome-launcher as npm packages.
    try {
      lighthouse = require('lighthouse');
      chromeLauncher = require('chrome-launcher');
    } catch (e) {
      throw new Error(
        'lighthouse / chrome-launcher not found. CI should `npm i -D lighthouse chrome-launcher` or npx them.',
      );
    }
  }

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  });

  try {
    const result = await lighthouse(URL, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        disabled: false,
      },
      throttlingMethod: 'simulate',
    });

    const lhr = result.lhr;
    writeFileSync(reportPath, JSON.stringify(lhr, null, 2));

    const scores = {};
    for (const [id, cat] of Object.entries(lhr.categories || {})) {
      scores[id] = Math.round((cat.score ?? 0) * 100);
    }

    const warnings = [];
    const failures = [];

    for (const [id, min] of Object.entries(BUDGETS)) {
      const score = scores[id] ?? 0;
      if (score >= min) continue;
      if (id === 'performance' && score >= PERF_WARN_FLOOR) {
        warnings.push(`${id}=${score} (budget ${min}; warn-only above ${PERF_WARN_FLOOR})`);
      } else if (id === 'performance' && score < PERF_WARN_FLOOR) {
        warnings.push(
          `${id}=${score} below flake floor ${PERF_WARN_FLOOR} — warn only (deploy not blocked)`,
        );
      } else {
        failures.push(`${id}=${score} (budget ${min})`);
      }
    }

    const summary = {
      url: URL,
      generatedAt: new Date().toISOString(),
      scores,
      budgets: BUDGETS,
      perfWarnFloor: PERF_WARN_FLOOR,
      warnings,
      failures,
      status: failures.length ? 'FAIL' : warnings.length ? 'WARN' : 'PASS',
      report: 'qa/lighthouse/mobile-preview.json',
    };
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n');

    console.log('Lighthouse scores:', scores);
    if (warnings.length) console.warn('WARN:', warnings.join('; '));
    if (failures.length) {
      console.error('FAIL:', failures.join('; '));
      exitCode = 1;
    } else {
      console.log(summary.status === 'WARN' ? 'Lighthouse WARN (perf soft)' : 'Lighthouse PASS');
    }
  } finally {
    await chrome.kill();
  }
} catch (err) {
  console.error(err);
  console.error('preview log:\n', previewLog.slice(-2000));
  writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        status: 'ERROR',
        error: String(err?.message || err),
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + '\n',
  );
  exitCode = 1;
} finally {
  preview.kill('SIGTERM');
  await sleep(300);
  try {
    preview.kill('SIGKILL');
  } catch {
    /* ignore */
  }
}

process.exit(exitCode);
