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


## Focused PR #2 correction pass (27 October 2026)

This section supersedes the earlier 20-test result and enquiry-handoff description.

### Findings and corrections

- Reproduced lost selection at the final external contact action. Support now renders a read-only, copyable enquiry from the shared configuration store when an explicit configuration arrives from Order. It includes the exact name, product price, personal/backup capacities and colour. All Support contact shortcuts lead to this contact section first. The final external link remains https://nestcloud.in/support, without invented prefill parameters.
- Clipboard success is announced only after writeText resolves for the displayed selection. If clipboard access is blocked or unavailable, the textarea is focused and selected for manual copy. A delayed result cannot announce success for a different selection. The summary remains open when the contact page opens in another tab.
- Fixed duplicate SEO suffixes: privacy policy policy and service level agreement policy. Static-export checks now compare generated descriptions with their route definitions.
- Restored cautious roadmap wording in homepage FAQs, Support/Family FAQs, feature cards and OS roadmap: Family Box Office, storage expansion, final capacity, compatibility and timing remain subject to release confirmation; no scheduled release is promised.
- All six legal bodies and original dates remain unchanged, as verified by the original six body fingerprint tests. Configuration prices, backup capacity, current product features, payment integration, DNS and deployment settings are unchanged.

### External destination verification and limits

The final external action opened the live NestCloud support page in another tab. Its embedded Canva form rendered a message field and Raise Support Ticket control. The complete Backup Plus enquiry (including ₹81,900 and 1 TB personal + 1 TB backup storage) was entered into the actual message field, visibly verified, then cleared without submitting. The form also requires real name, email, phone, model and device-address values and uses legacy model labels. The live Reserve page was inspected too: it has legacy model choices and no general message field, so it was not substituted for Support.

No verified prefill contract or test mode was exposed. Browser automation's virtual clipboard did not expose the page's native clipboard contents, so actual-field acceptance was checked by manual text entry; clipboard content correctness and failure behavior are covered by React tests. No ticket was submitted and delivery/receipt of an enquiry is **not verified**. No customer details or contact endpoints were invented.

### Final checks

- 30 automated tests pass: all three full product → order → support → copied summary paths, unchanged external destination, blocked/missing clipboard, delayed clipboard completion, URL/history changes, blocked storage, ordinary support visits, cautious roadmap copy, unique SEO descriptions and all previous legal/configuration/image checks.
- Standalone TypeScript check, production build and export validation pass for all 15 routes.
- Relevant browser routes (Home, Family, OS, Support enquiry, Order, Privacy and SLA) checked at actual 375px and 1440px widths, without horizontal overflow. Selection and prices are visible/readable; actual external message-field acceptance verified separately.
- Current screenshots: docs/review/enquiry-correction/enquiry-desktop.png, enquiry-mobile.png, external-message.png. Earlier screenshots remain historical records.
