# ScentCap — iOS simulator pass (v7 §7.4)

Date: 2026-10-22 · Capacitor iOS target (`ios/` present)

## Devices (one at a time)

| Device | Light | Dark | Larger Text AX3 | VoiceOver (10 controls) |
|---|---|---|---|---|
| iPhone SE (3rd gen) | ✅ | ◐ in progress | ◐ | ✅ spot (tab bar, search, add, sheet Cancel/Done, back) |
| iPhone 16 Pro | ◐ | ◐ | ◐ | ◐ |
| iPad Air 11" (M2) | ◐ | ◐ | ◐ | ◐ |

## Evidence (gitignored)

Screenshots: `ScentCap/build/qa/v7/sim/*.png`  
Run log: `ScentCap/build/qa/v7/sim/sim-run.jsonl`  
Script: `capricorn-tooling/scripts/v7-sim-pass.mjs` (Safari via `simctl openurl`)

## Notes

- Demo URL: `https://shamikhahmed.github.io/ScentCap/?demo=1` (seeded persona data).
- Native Capacitor shell: `npm run cap:ios` after `cap:sync` (owner signing for TestFlight).
- Dynamic Type: AX3 via Simulator accessibility prefs + `?dt=` web parity in `ios-tokens.css`.
