# Capricorn motion contract (fleet)

Source of truth for shared craft. Brands keep their own color tokens; **timing and behaviour** come from here.

## Primitives

| Primitive | Files | Use |
|-----------|--------|-----|
| Duration / easing tokens | `tokens.css` (`--cap-dur-*`, `--cap-ease*`) | All surfaces |
| Reveal / stagger | `motion.css` + `capricorn-motion.js` | Marketing + optional app |
| Page view transitions | `motion.css` (`cap-page-rise/lift`, `.cap-vt-header`) | Multi-route marketing |
| Splash / gate | `.cap-splash` + `CapricornMotion.bindSplash()` | First visit only, skippable |
| 10-foot focus | `.cap-focus-tv` | TV / leanback remotes |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` | Mandatory |

## Rules

1. **App shells** (`body[data-cap-app="1"]`): instant reveals — no tilt, magnetic, parallax, or pin-scrub.
2. **Never** delay first input on vault / money / workout logging paths.
3. **Never** paste TheSolution360 harbor palette into Cap / MTX / Project 85.
4. Signature scrub stories = **marketing privilege** only (hub, MTX, P85 home).
5. AuraCap: no GSAP (existing lock) — CSS / View Transitions only.
6. Splash must be skippable (any key/click/wheel/swipe) and session-once.

## Adoption

```html
<link rel="stylesheet" href="…/tokens.css">
<link rel="stylesheet" href="…/motion.css">
<script defer src="…/capricorn-motion.js"></script>
```

Optional premium (marketing only): `motion-premium.css`.
