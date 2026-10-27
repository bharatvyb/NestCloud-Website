# NestCloud UI audit — 26 October 2026

Scope: all nine routes, shared components, source files, published asset inventory, GitHub Pages export, and 45 rendered views at 375, 430, 768, 1440 and 1920 px. Baseline screenshots are in review-before/. Existing source is retained; improvements will be proposed on a feature branch.

## P0 — release blockers

No reproducible broken route, missing eager image, missing local anchor or horizontal page overflow in the 45 baseline DOM checks. GitHub Pages base-path handling is functioning. Payments are intentionally disabled; this remains a commercial launch limitation, not a UI bug. No production blocker is being invented to justify a redesign.

## P1 — implement in this refinement

- **Product emphasis — src/Home.tsx / Hero:** the photograph collage dominates the actual device; the mobile product sits too far below the primary message. Lead with the supplied device, a larger product stage and a direct configuration CTA.
- **Selection continuity — src/Home.tsx / Configurator, src/Pages.tsx / OrderPage:** selection lives in separate component state. A generic Family link resets it to 1 TB. Share selection through a guarded session preference and explicit query links; URL selection must win.
- **Legibility / touch targets — src/styles.css:** supporting captions reach 7–11 px, desktop navigation is 12 px, mobile review option details are 9 px, and several controls are under 44 px. Add a deliberate type/spacing scale and comfortable controls without enlarging legal prose indiscriminately.
- **Story sequence — src/Home.tsx / HomePage:** configuration precedes setup and privacy; ownership and specification narratives repeat other pages. Put everyday value, software, setup and protection before configuration; retain deep detail on its existing dedicated page.
- **Wayfinding — src/Home.tsx / Header:** no current-page indicator. Add aria-current and visible active treatment; restore focus when dismissing mobile navigation.
- **Image delivery — public/assets, Hero, DeviceArt, Configurator, OrderPage:** the device PNG is 1.53 MB, and device imagery is loaded repeatedly without responsive alternatives. Add faithful WebP size variants and explicit dimensions while retaining original artwork.
- **Motion resilience — HomePage / styles.css:** scroll reveals depend on opacity-zero content becoming observed; full-page captures show blank areas before scroll. Keep content visible by default and animate only on entry, respecting reduced motion.

- **Follow-up interaction finding — src/App.tsx:** an initial URL containing `#configure` can render before React mounts the target, leaving the page at the top. Add post-mount fragment restoration and test the actual scroll position, not just target existence.

## P2 — engineering and polish

- **Design maintenance — styles.css:** accumulated overrides repeat component values and breakpoint fixes. Add a documented token layer and scoped refinement stylesheet; avoid an unrelated full rewrite.
- **Semantic controls — Experience / SupportPage:** improve tab Home/End support, result announcement and selected/filter focus treatment; native radios remain the configuration control.
- **Metadata/export — index.html, scripts/export-pages.mjs:** route metadata and sitemap exist. Add fallback content for disabled JavaScript and validate canonical/OG/asset paths in the export rather than relying only on successful compilation.
- **Checks — package.json:** no lint or test commands exist. Add meaningful route/configuration/export checks and a PR-only build check; do not introduce a cosmetic lint configuration or pretend an absent lint suite passed.
- **Performance evidence:** Lighthouse is not exposed by this browser environment. Asset-byte and built-bundle evidence can be measured; no Lighthouse score will be invented. Run Lighthouse in Chrome after merging if a formal score is required.

## Kept intact

One NestCloud Family model, three exact prices, 1 TB usable storage for Backup Plus, upcoming feature labels, official logos, original hardware design, verified policy links, all nine routes, disabled payment integration, live domain/DNS and main branch deployment.
