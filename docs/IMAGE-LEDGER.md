# ScentCap image ledger (C-42)

Policy: only Capricorn-authored art and user-captured photos may be shown as bottle imagery. Third-party retailer/catalog product photos are not redistributed.

| Asset / source | Where used | License / rights | Reuse in app |
|---|---|---|---|
| Capricorn SVG flacon (`data:image/svg+xml…` in `src/data/demoFragrances.ts`) | Demo wardrobe placeholders | Original Capricorn Systems artwork | Allowed |
| `FlaconPlaceholder` SVG (`src/components/bottle/FlaconPlaceholder.tsx`) | Fallback when no licensed art | Original Capricorn Systems artwork | Allowed |
| User camera / Photos (`photoBlobId` → IndexedDB `photos`) | User-owned bottle shots | User-provided; stays on device | Allowed (device-local) |
| Fraganty / `img.fraganty.ai` / other `http(s)` product URLs | Formerly enriched via `onlineCatalog` | **Unknown / not cleared for redistribution** | **Not allowed** — strip; show generic flacon |

## Runtime enforcement

- `src/lib/catalogImage.ts` — `needsCatalogImageRefresh` is always false; `catalogImageForDisplay` drops unlicensed remote URLs.
- `FragranceThumb` never renders remote product photos; falls back to `FlaconPlaceholder`.
- Metadata enrichment (notes/slug via Fraganty API) may continue; images from that API are not stored for display.

## Audit date

2026-09-16 — C-42 finish/scentcap-r3
