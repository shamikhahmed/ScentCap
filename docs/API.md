# ScentCap API & network

Offline-first. Network improves discovery and weather; never required for wardrobe/wear/analytics.

| Integration | Class | Data sent | Mock |
|-------------|-------|-----------|------|
| Fraganty (`https://fraganty.ai/api`) | FREE public (+ optional user key) | Search query / slug only | `e2e/mocks/fraganty.ts` |
| Open-Meteo | FREE public | Coordinates when permitted | Playwright geolocation + weather mocks in `e2e/helpers.ts` |

Never sent: wardrobe, wears, ratings, notes, travel kits.

Provider adapter: `src/catalog/` (`CatalogProvider`). Default: Fraganty.

Optional Capricorn Worker/BFF: documented design only — **not shipped in 2.0**.
