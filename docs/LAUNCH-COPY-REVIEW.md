# Customer-facing launch copy review

Reviewed all 15 routes on 27 October 2026. This pass changes customer-facing wording and the enquiry handoff; it does not enable a payment gateway or change deployment settings.

## Changes

- Removed migration/source attribution from the policy overview and all six policy layouts. Complete legal bodies and update dates remain unchanged (six fingerprint tests pass).
- Removed development-site, checkout implementation, payment-integration and internal approval notes from the homepage, order review, policies and FAQs.
- Replaced unavailable-checkout messaging with a team-assisted purchase journey: select storage, review price, contact NestCloud, confirm availability/delivery/taxes/shipping before payment. Configuration remains in the local contact URL.
- Added a labelled contact section in Support. Kept the existing NestCloud support destination; no new unverified email, phone number or payment endpoint was invented.
- Updated route descriptions used in page metadata and social previews, and simplified image captions. Interface illustrations remain labelled; product-roadmap dates/status, backup limitations and legal terms remain accurate.

## Validation

- 20 automated tests pass, including all-page copy regression coverage, configuration/history/session-storage behavior, image priority and unchanged legal documents.
- TypeScript, production build and static-export validation pass for all 15 routes.
- Browser checks: 15 routes at 375, 768 and 1440 pixels; no horizontal overflow. No draft/migration wording in page text. Verified order-to-local-contact navigation with Backup Plus selected and ₹81,900 displayed.
- Desktop/mobile policy screenshots are in `docs/review/launch-copy/` and reflect this change.

## Domain cutover dependency

The existing support destination is https://nestcloud.in/support. Its embedded form redirected to Canva, which automatic browser approval blocked from inspection. Before replacing the current main domain, retain that support channel or supply a direct sales/support email, WhatsApp number, or independently hosted form. This copy PR does not claim payment processing or successful form submission.
