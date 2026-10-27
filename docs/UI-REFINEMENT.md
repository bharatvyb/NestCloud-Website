# NestCloud UI refinement

Review period: 26–27 October 2026. Changes are proposed on `refine/premium-product-experience`; publication occurs only after review and merge.

## Result

The existing nine-page website now opens with the actual NestCloud Family appliance. The headline, one-time price and configuration action lead the story. Photos, Files, setup and local ownership lead naturally into storage selection. The original hardware image and official brand assets are retained; no fictional device was created.

The configurator and review page share a session preference, with explicit query links taking precedence. New visitors receive 1 TB by default. All three exact prices and the 1 TB usable capacity of Backup Plus are preserved. Invalid links fall back to 1 TB. Blocked session storage does not disable the control. No personal information is stored by this preference.

The shared header includes current-page state, larger controls and focus restoration when its mobile menu closes with Escape. Product detail cards become one column on phones, and tablet configuration/review layouts avoid cramped side-by-side panels. Content stays visible before scroll reveals; reduced motion disables animation and smooth scrolling.

## Design tokens

`src/refinements.css` defines the retained blue (`#0066e8`), ink (`#132744`), muted text (`#566981`), panel/background and border colors. The spacing scale uses 4, 8, 12, 16, 24, 32, 48, 64 and 96 px. Containers cap at 1280 px; panels use 24 px radii and controls 12 px. Buttons share primary/secondary styles, 48 px base height and 44 px compact height. Body copy is typically 14–16 px, supporting text 11–12 px. Headings use responsive clamps. Phone and tablet layout thresholds are 600 and 1000 px, with a large-desktop adjustment at 1600 px. Fast transitions use 180 ms; entrances use 500 ms and stop under reduced-motion preferences.

## Validation

- 45 baseline and 45 refined rendered views: all nine routes at 375, 430, 768, 1440 and 1920 px.
- One H1 per view; no reproduced horizontal page overflow, missing eager images or missing local anchor targets.
- Follow-up checks for the final tablet configuration/review adjustment passed at 768 px.
- Keyboard radio selection updates price and review links; the Backup Plus selection transfers to the review page and survives a generic Family navigation link.
- Direct `?configuration=512gb#configure` opens the right selection and scrolls the target below the sticky header. Header menu Escape restores focus. Experience tabs support arrows plus Home/End.
- FAQ search produces zero results for a non-match and resets to 20 answers; troubleshooting selection updates its guidance.
- `npm test`: four passing selection tests (default, explicit URL, session continuity, invalid input).
- `npm run build`: passing TypeScript checks and production export.
- `npm run check:export`: passing titles, descriptions, canonical/OG URLs, existing emitted assets, base path, sitemap, robots, order noindex and static entry checks for all nine routes.
- Source secret-pattern scan: no matching private-key, GitHub-token, OpenAI-token or AWS-access-key patterns. This is a bounded check, not a security certification.
- A PR-only workflow runs tests, build and export validation without deploying the branch.

The repository has no configured lint suite. Lighthouse is not exposed by the available browser tools; no Lighthouse score is claimed. Reduced-motion behavior is enforced in CSS and was inspected in source, rather than toggling the user's operating-system setting.

## Performance evidence

The original transparent PNG is 1,529,625 bytes. Faithful optimized WebP exports are 22,084 bytes (800 px) and 80,138 bytes (1600 px): approximately 98.6% and 94.8% fewer image bytes. Device images use responsive sources, explicit dimensions and asynchronous decoding. Hero/device intro images load eagerly; below-fold product/photo imagery is lazy. Original PNG files remain available.

Final production JS: 310.86 kB raw / 93.21 kB gzip. CSS: 98.69 kB raw / 20.45 kB gzip. The retained stylesheet is intentionally not rewritten in this scope; consolidating legacy duplicate rules remains a P2 maintenance task.

## Outstanding limits

Payments and actual orders remain disabled pending availability, taxes/shipping, approved terms and the payment integration. Upcoming OS features remain marked planned. DNS, live domain settings and payment integrations are untouched. Formal Lighthouse and broader assistive-technology audits remain follow-up work; these checks do not establish WCAG conformance.

Before/after hero comparisons are in `docs/review/`. The full 90-view screenshot evidence and browser check JSON are delivered alongside this task's local report.
