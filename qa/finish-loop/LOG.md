# ScentCap finish LOG

### SCNT-P1-01 monogram ✅
### SCNT-P1-02 Today + FND-04 Switch/ConfirmDialog ✅
### SCNT-P1-03 native pack
PrivacyInfo.xcprivacy + ITSAppUsesNonExemptEncryption=false + docs/store/*
⛔ BLOCKED-EXTERNAL: xcodebuild needs full Xcode (only CLT present) — cannot verify iOS 26 SDK build here.
### SCNT-P1-05 About disclaimer ✅

### SCNT-P1-04 !important ✅
Stripped non-a11y `!important` from premium-craft, scent-premium-overrides, index, cap-premium-base, capricorn-core (kept reduced-motion / forced-colors / transparency overrides). Tab/shelf captions bumped to 11px.

### SCNT-P1-06 dirty files ✅
`preserve/pre-finish-2026-09-14` already holds BoutiqueSplash + OfflineBanner.
- OfflineBanner: superseded by OfflineStatusBar (already wired in AppShell) — not ported.
- BoutiqueSplash: not ported (fleet rule: no cold-load splash).

### SCNT-P1-07 LAUNCH_PREVIEW ✅
No `LAUNCH_PREVIEW` / Pro gate found in tree.

### SCNT-P2 (partial→done) ✅
Location only via “Use my location” + city fallback; permission_denied copy; photo denied copy; self-hosted Figtree/Newsreader Variable; privacy.html rewritten (no marketing JS).

### FND-04 ✅
Button, Card, Switch, ConfirmDialog, Banner, Toast, ErrorState, EmptyState under `src/components/ui/`.
