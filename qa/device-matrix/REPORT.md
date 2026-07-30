# ScentCap device-matrix QA report

**Date:** 2026-07-30  
**App:** ScentCap **v2.0.10** · SW `scentcap-v210`  
**Prompt:** [qa/DEVICE-MATRIX-QA-MASTER-PROMPT.md](../DEVICE-MATRIX-QA-MASTER-PROMPT.md)  
**Harness:** `npm run matrix` (`DEVICE_MATRIX=1 playwright test e2e/device-matrix.spec.ts`)  
**Shots:** 96 under `qa/device-matrix/{iphone|ipad|browser}/` · `meta.json` (PNGs gitignored)

**App hooks**

| Hook | Value |
|------|--------|
| Path | `/Users/shamikhahmed/Desktop/Cap-Apps/ScentCap` |
| Live | https://shamikhahmed.github.io/ScentCap/ |
| Shell BP | **700px** (`--breakpoint-md` + CSS) — tabs ≤699 · sidebar ≥700 |
| Tabs | `.atelier-tabbar` / `.atelier-tab` |
| Sidebar | `[data-testid="desktop-sidebar"]` |
| Unlock | `e2e/helpers.ts` → `loadDemoWardrobe` |
| Dense list | `/collection` |
| Secondary | `/advisor` |
| Overlay/form | `/add` |
| Welcome | `/onboarding` (no PIN lock) |

---

## 1. Matrix summary (exit)

| device-id | layout | overflow | Wear↔tabs | verdict |
|-----------|--------|----------|-----------|---------|
| iphone-se … iphone-16-pro-max | mobile-tabs | no | clear (SE gap 113px) | **OK** |
| browser-phone-360 | mobile-tabs | no | clear | **OK** |
| **ipad-mini** | **sidebar** | no | n/a | **OK** (was phone tabs @768) |
| ipad-air-11 … ipad-pro-13-land | sidebar | no | n/a | **OK** |
| browser-sm-laptop … ultrawide | sidebar | no | n/a · VER `v2.0.10` | **OK** |

`ALL_LAYOUT_OK` from meta. Viewport contract (375 / 699 / 700 / 744 / 1280): **5 passed**.

---

## 2. Fixed this loop

| Severity | Issue | Fix |
|----------|-------|-----|
| **High** | iPad mini 744 kept phone tabs (Tailwind `md`=768) | Cap BP **700** — `@theme --breakpoint-md` + shell CSS media |
| **High** | SE Wear CTA under tab bar (`wearTabGap` −44) | Compact hero `@media (max-height:720px)` **after** craft `280px` rule (cascade) |
| **Med** | Demo banner vs safe-top double pad | Banner `env(safe-area-inset-top)`; home skips double when banner present |
| **Med** | Sidebar missing version | Foot `v{APP_VERSION}` |
| **Med** | No matrix harness | `e2e/device-matrix*.ts` + `qa/` + Wear clearance probe |

---

## 3. What looks RIGHT

- SE Today: Wear fully above tabs; labels readable (`iphone-se/dashboard.png`)
- iPad mini: sidebar + `v2.0.10` (`ipad-mini/dashboard.png`)
- Laptop Settings: sidebar + profile chips; version synced
- Zero horizontal overflow across 96 shots
- Welcome / onboarding uses `safe-pt` / `safe-pb`

---

## 4. Residual (Low)

- Ultrawide: intentional `max-w` content column (empty side margins — not a bug)
- Chromium cannot draw real notch/island chrome; safe inject verified via CSS vars + banner pad
- Tab label density on SE remains tight (still ≥ readable; no truncation probe fail)

---

## 5. Plans (brief)

- **Architecture:** Cap fleet shell BP aligned with VaultCap (700).
- **Test:** Matrix gated by `DEVICE_MATRIX=1`; Wear clearance asserted on phone dashboards.
- **Rollback:** Restore `--breakpoint-md: 768px` + remove short-height hero block.

---

## 6. Loop prompt

Reuse fleet master: `qa/DEVICE-MATRIX-QA-MASTER-PROMPT.md`. Exit only when criteria all true.
