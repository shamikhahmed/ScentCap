# ScentCap — Privacy Policy

**Last updated:** July 22, 2026

ScentCap is an offline-first Progressive Web App for fragrance wardrobe management. **Your collection stays on your device** unless you explicitly export it.

## What we collect

- **Nothing by default.** No accounts, analytics SDKs, or third-party trackers ship in this app.
- Optional weather context may call [Open-Meteo](https://open-meteo.com/) for temperature and humidity — only when you grant location access. Coordinates are sent to Open-Meteo, not to Capricorn servers.
- Optional catalog search may call [Fraganty](https://fraganty.ai/) with the fragrance name or brand you type. Your wardrobe, wears, ratings, and notes are never uploaded as part of catalog requests.

## Storage

- App state is stored in **IndexedDB** and **localStorage** in your browser (wardrobe, wears, layer recipes, travel kits, catalog cache, bottle image blobs).
- Uninstalling or clearing site data removes your wardrobe and wear history.

## Network

- GitHub Pages serves static files only — no server-side access to your collection.
- Weather and catalog lookups are optional and can be denied or unused.
- See in-app Settings → Privacy & network for a live summary.

## Photos & exports

- Bottle photos you add stay in IndexedDB on your device.
- Third-party catalog bottle images may be cached offline for browsing; Capricorn does not claim ownership of those images.
- JSON/CSV exports are generated locally — you choose where to save or share them.

## Contact

Built by Shamikh Ahmed — issues via the [ScentCap GitHub repository](https://github.com/shamikhahmed/ScentCap).
