# Final hardening and local policy pages

27 October 2026 — PR #1 remains unmerged.

## Configuration findings and fixes

The original hook held separate React state for each mounted instance. Selecting storage in one instance left its siblings stale. It also passed `null` to replaceState, discarding existing history state; programmatic history changes did not notify React. Its best-effort storage handling did not provide shared in-document updates when sessionStorage was blocked.

A document-level external store now backs the hook through useSyncExternalStore. All controls read one snapshot, observe pushState/replaceState and popstate while subscribed, and remove those observers when the last control unmounts. Selection updates replace the current entry without adding one for every radio click. Existing history state, unrelated query parameters and fragments are preserved. Explicit URL selection takes precedence; absent/invalid configuration is normalized, with a default of 1 TB and an optional saved session preference. A guarded memory fallback supports blocked storage within a document, and explicit URLs preserve a choice across refresh. With storage blocked, a fresh generic URL in another document has no saved preference and defaults to 1 TB.

Each rendered configurator now uses a distinct native radio group. React StrictMode subscription cleanup is covered. Eight actual React/DOM integration tests cover mounted product/review controls, URL precedence, multiple instances, state preservation, Back/Forward, navigation/refresh, blocked storage, cleanup and image-loading priority. Running the regression tests against the original hook reproduced five failing scenarios. All final tests pass.

## Images and mobile copy

The homepage and Family intro device images retain eager/high priority. Configurator and order-review instances are lazy. Purchase-critical mobile explanations—usable capacity, backup-drive purpose, backup caveats, one-time pricing and checkout limitations—are at least 14 px in the checked selectors. No price or product claim was changed.

## Six complete local policies

The footer, policy overview, review-page links and inline warranty/SLA links now point into this website:

- /policies/tc — Terms & Conditions
- /policies/privacy-policy — Privacy Policy
- /policies/shipping--delivery — Shipping & Delivery
- /policies/cancellation--refund — Cancellation & Refund
- /policies/warranty — Warranty
- /policies/sla — Service Level Agreement

Full document wording was captured from the visible official pages on nestcloud.in, including every paragraph and list, with the source update dates preserved. No legal language, preorder conditions, timelines or contact details were rewritten. `policy-source-manifest.json` records source URLs and independent normalized-text fingerprints. Six rendered-content tests check those fingerprints; another checks every Helpful details footer link is local. Each page includes a source link and responsive section navigation. Policy text/styles are a separate lazy-loaded chunk, so full legal documents do not inflate the initial product bundle.

## Validation and evidence

- 19 tests pass: 8 actual React/DOM behavior and image tests, 6 full-policy fidelity checks, 1 footer destination check, 4 existing resolver tests.
- TypeScript and production build pass. All 15 exported entry pages pass titles, descriptions, canonical/OG URLs, asset/base-path, sitemap, robots and order-noindex checks.
- 75 rendered route/viewport checks (15 routes × 375, 430, 768, 1440, 1920 px): no reproduced horizontal page overflow, missing eager images, missing local anchors or duplicate H1s.
- The six policies retain all source body text after whitespace normalization. Formatting and navigation are new; the document language is unchanged.
- Fresh desktop/mobile hero and configurator comparisons and policy screenshots are in docs/review/. Its manifest fingerprints the exact application source and screenshot bytes used for final review; this supersedes earlier screenshots.
- GitHub Actions must be checked against the final PR head, not an earlier successful run. The final result is linked in the PR description after completion.

Payments remain disabled. Main, deployment workflow, hosting settings and DNS are unchanged. No merge or production publication is performed. Lighthouse and a broader assistive-technology audit remain outside this focused verification.
