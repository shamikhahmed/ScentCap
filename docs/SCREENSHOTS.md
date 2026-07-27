# App Store Screenshots

Six iPhone 15 Pro screenshots for App Store Connect, captured at **393×852** viewport with **3× device scale** (1290×2556 effective pixels).

**Visual system:** Atelier (v2.0.4+) — chalk light + forest accent. Regen after any UI remint.

## Output location

```
docs/screenshots/
├── 01-today-home.png
├── 02-office-safe.png
├── 03-advisor-spray-map.png
├── 04-layering-lab.png
├── 05-analytics.png
└── 06-travel-kit.png
```

## Regenerate

```bash
# Build first (preview server serves dist/)
npm run build

# Capture all 6 screenshots (~30s)
npm run screenshots
```

The script (`e2e/screenshots.spec.ts`) will:

1. Load the demo wardrobe
2. Capture Today/Home
3. Enable Office Safe in Settings, return to Home
4. Open Advisor → Get recommendation → Application map
5. Open Layering Lab
6. Open Analytics
7. Open Travel Kit

## App Store Connect upload order

| Order | File | Caption (from APP-STORE.md) |
|-------|------|-----------------------------|
| 1 | `01-today-home.png` | Your daily scent pick — matched to weather and mood |
| 2 | `02-office-safe.png` | Desk-friendly mode for work days — low projection, max sprays |
| 3 | `03-advisor-spray-map.png` | Where to apply — pulse points, skin, and clothing |
| 4 | `04-layering-lab.png` | Find and save compatible scent combos |
| 5 | `05-analytics.png` | Rotation health, value, and wear patterns |
| 6 | `06-travel-kit.png` | Pack the right decants for any trip |

## Tips

- Re-run after major UI changes or version bumps.
- For marketing site mirrors, copy PNGs to `public/app-store-screenshots/` if needed.
- App Store also accepts 6.7" and 6.5" sizes — these 6.1" captures scale acceptably; regenerate at other viewports if Apple requests them.
