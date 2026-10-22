# ScentCap — iOS simulator pass (v7 §7.4)

Date: 2026-10-22 · Capacitor iOS target · Safari via simctl openurl

## Devices (one at a time)

| Device | Light | Dark | Larger Text AX3 | VoiceOver (10 controls) |
|---|---|---|---|---|
| iPhone SE (3rd gen) | ✅ | ✅ | ✅ | ✅ spot (a11y tree) |
| iPhone 16 Pro | ✅ | ✅ | ✅ | ✅ spot (a11y tree) |
| iPad Air 11" (M2) | ✅ | ✅ | ✅ | ✅ spot (a11y tree) |

## Evidence (gitignored)

Screenshots: `ScentCap/build/qa/v7/sim/*.png` (11 PNGs)
Run log: `ScentCap/build/qa/v7/sim/sim-run.jsonl`
Script: `capricorn-tooling/scripts/v7-sim-pass.mjs` + `run-v7-sim-fleet.sh`

## VoiceOver spot-check (honest — live page a11y tree / aria labels)

Native VoiceOver not automated in CI; labels pulled from live demo via Playwright accessibility tree (https://shamikhahmed.github.io/ScentCap/?demo=1).

| # | Role | Label |
|---|---|---|
| 1 | `a` | Skip to content |
| 2 | `button` | Use my collection |
| 3 | `div` | Weather 18 degrees |
| 4 | `a` | View Dolce & Gabbana Light Blue Pour Homme |
| 5 | `img` | Dolce & Gabbana Light Blue Pour Homme |
| 6 | `button` | Wear this today |
| 7 | `button` | Share |
| 8 | `button` | Office |
| 9 | `button` | Date |
| 10 | `button` | Weekend |

## Notes

- Demo URL: `https://shamikhahmed.github.io/ScentCap/?demo=1`
- Matrix: 3 devices × light / dark / Larger Text AX3 (`--larger-text`).
- Dynamic Type AX3 via Simulator Accessibility prefs; appearance via `simctl ui`.
