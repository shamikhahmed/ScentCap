# ScentCap — Monetization Plan

## Model: Freemium → Pro ($2.99–4.99/mo or $39.99/yr)

### Why someone pays
Fragrance collectors are one of the highest-spending hobby niches. A person with 50+ bottles and $5,000+ invested in their wardrobe will pay $4.99/mo without thinking. The free tier (12 bottles) creates real friction for serious collectors. Analytics, layering lab, and travel kit are must-haves once someone is managing a real wardrobe.

### Current state (PWA-only)
All features unlocked. No Pro / App Store CTA in Settings. `LAUNCH_PREVIEW` stays `true` in `src/lib/pro.ts` so gates stay open; paywall UI is not shown. Native IAP is later.

### Revenue logic
- Target: 500 MAU at 10% Pro conversion = 50 × $4.99 = **$249/mo**
- Fragrance hobbyists: higher LTV than mainstream apps, lower churn
- Annual plan ($39.99/yr = $3.33/mo) projected 50% uptake of Pro subscribers

---

## Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| Wardrobe (bottles) | Up to 12 | ✅ Unlimited |
| Daily wear logging | ✅ | ✅ |
| Smart Advisor (basic) | ✅ | ✅ |
| Offline PWA | ✅ | ✅ |
| Collection Analytics | ❌ | ✅ Rotation health, value insights |
| Layering Lab | ❌ | ✅ Save scent combos |
| Travel Kit | ❌ | ✅ Plan decants & travel sizes |
| Data Export (JSON/CSV) | ❌ | ✅ |
| Smart Advisor (weather + occasion) | Partial | ✅ Full |
| Future: cloud sync (opt-in E2E) | ❌ | ✅ Roadmap |

---

## Implementation gates (current)
- `LAUNCH_PREVIEW` flag in `src/lib/pro.ts` — set `true` = all free, `false` = paywall active
- `ProGate` component wraps: `/analytics`, `/layering`, `/travel` routes
- `requestFeature('bottle_limit')` called when adding 13th bottle
- Paywall modal: `src/components/ui/Paywall.tsx` — renders plan comparison
- `openPaywall()` from `usePro()` hook triggers the modal

## Payment path (current)
- Waitlist / "coming to App Store" CTA in Settings
- Next: RevenueCat for App Store IAP (Capacitor) or Stripe for web PWA

---

*Last updated: 2026-06-28*
