# ScentCap innerHTML sinks

Generated: 2026-09-15 · Product scan = `src/` + `public/` (Vite PWA).

## Policy
- Prefer `textContent` / DOM APIs for user or remote strings
- Static marketing/demo chrome templates: OK when caller-controlled only

## Counts

| Class | Count |
|-------|------:|
| static-template | 1 |
| escaped-user-remote | 0 |

## Inventory

| File | Line | Class | Notes |
|------|-----:|-------|-------|
| public/js/cap-demo-mode.js | ~55 | static-template | Demo banner HTML is static string (no user/remote input) |

## Verify
- Re-run `npm run tier1` after any new `.innerHTML =`
