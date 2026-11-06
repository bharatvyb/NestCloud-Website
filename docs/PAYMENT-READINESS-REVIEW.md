# Payment-readiness review — 6 November 2026

Status: **NO-GO for new Live checkout/prices**. PR #7 remains a draft stacked on `feature/master-settings`. Existing Live store `st_TNDdSuG2qOGoJJ` remains Active and unchanged. No merge, main push, Pages/Google deployment, DNS/Canva edit, Live product/settings mutation, real charge or new customer enquiry occurred.

## Approved implementation

- Catalogue remains 512 GB ₹60,499, 1 TB ₹72,499, 1 TB + dedicated 1 TB Backup Plus SSD ₹99,499. Frontend catalogue, trusted enquiry validation and exported product metadata agree. Prices include GST; no extra GST/processing surcharge. Historical accepted receipts and original policy records remain unchanged.
- `commerce-policies.ts` now derives the new-order revisions from original documents instead of replacing applicable policies with short placeholders. Only payment/dispatch-related clauses change: full payment upfront, estimated dispatch readiness within 10 working days of successful full payment, existing exceptions retained; shipping/final amount clearly before payment, no unexpected later charge. No blanket free shipping, new cancellation fee, numeric refund deadline or warranty exclusion.
- Retained published fully paid cancellation eligibility, original-method refunds, bank/provider-dependent reflection timing, consumer rights and the entire one-year hardware warranty/privacy policies. Original source/provenance hashes remain intact. New-order advance/balance/non-refundable-deposit workflows are removed from rendered revised policies, not from historical contractual source data.
- Website review/order/FAQ/Test notices now reflect the approved terms. `liveCheckoutApproved` remains FALSE. These code changes are not deployed to either public website.
- Existing shared MasterSettings reader/refresh and server enquiry checks remain. No payment secrets, webhook, second order database, stock synchronization service or new settings keys were introduced. Generated SettingsWiki descriptions and repository staff instructions clarify offsite limitations; actual Sheet SettingsWiki remains untouched pending approved deployment.

## Provider Test configuration and evidence

Only existing Test store `st_Twq3A2wp0N9cWZ` was edited: descriptions and Test-only terms updated, same approved prices/unlimited Test stock/public support contacts retained. Explicit Test restriction independently observed after publication. No Live page was edited.

Republishing regenerated all public product IDs. Current TEST destinations (do not use for Live):

| Configuration | Product ID | Quantity-one cart amount verified after republish |
| --- | --- | ---: |
| 512 GB | li_Twvji6GpLWX92U | ₹60,499 |
| 1 TB | li_Twvji6QZkd6RIc | ₹72,499 |
| Backup Plus | li_Twvji6ZXIdDIQE | ₹99,499 |

Prefix `https://pages.razorpay.com/stores/st_Twq3A2wp0N9cWZ/product/`. All three original `li_Twq3A4...` URLs independently returned product-not-found after republish. This is an operational link-rotation risk, not a successful stock synchronization. Reverify destinations after every provider edit/publication before changing approved website settings. No Sheet URL was silently rewritten.

| Scenario | Result / evidence |
| --- | --- |
| Full product price, all three configurations | PASS — current provider cart/Proceed-to-Pay buttons show ₹60,499 / ₹72,499 / ₹99,499. Carts cleared after checks; no new payment attempted. Earlier cart showed zero discount and no added product GST/processing surcharge. |
| Shipping disclosure | PASS, narrow scope — earlier synthetic Bengaluru address reached final Test payment selection with product ₹60,499 inclusive of taxes, FREE shipping and final total ₹60,499. Cart initially says delivery calculated during checkout. This proves that zero-fee scenario only. |
| Nonzero shipping calculation / wider serviceability | BLOCKED — actual tariff/rules not supplied. Test Webstore Page Settings expose expiry, result action and analytics, not a tariff editor. Product/business editors expose no rate rule. Separate Magic Checkout screen asks for platform integration; it was not configured. No nonzero tariff or alternative architecture was invented. Provider support/account-specific guidance is needed before claiming inability or choosing an alternative. |
| Payment success and customer confirmation | BLOCKED / earlier FAIL — user selected simulator Success but saw internal BAD_REQUEST_ERROR “The id provided does not exist”. Native payment `pay_TwqEUerMT6yjBd`, linked order `order_Twq47j14GrM45m`, ₹60,499 ultimately Failed/payment_cancelled. Rechecked in Test dashboard after edits: history and link still exist, not captured. No successful capture, paid receipt or customer confirmation is claimed. |
| Failure/cancellation handling | PASS for observed failed record; MOCK for website behavior — no website paid state from that failure or return parameters. A separate controlled bank-decline scenario remains unverified. |
| Payment-reference/customer identification | PASS for the existing failed Test record — dashboard links payment/order, item, quantity, full amount, synthetic customer/contact and shipping/billing address. Order remains Attempted (one attempt), not Paid. Its drawer misleadingly labels the displayed order amount “Total Amount Paid” despite the failed payment: staff must use captured payment + paid order/refund state, never that label alone. This is not proof of a successful order/receipt. No customer data copied to this report. |
| Product unavailable / old direct link | PASS, narrow scope — earlier Test stock zero removed Add to cart on the direct Backup Plus URL; original unlimited stock restored and Add returned. Current retired URLs also show product-not-found. Existing-cart/in-flight races remain unverified. |
| STOCK flags, Purchase disabled, maintenance | MOCK — all three frontend stock flags independently block their checkout entry; global/Purchase/maintenance gates tested; inherited backend enquiry enforcement/idempotency tests pass. No actual Sheet switches changed, and these gates do NOT revoke provider URLs. |
| Automatic stock synchronization | NOT IMPLEMENTED / BLOCKED — hosted provider checkout does not use this website's settings reader. No documented supported Webstore stock integration was verified. Dashboard stock/deactivation are available. Proposed paired manual process requires owner acceptance; no undocumented endpoint, scheduled job or secret in Sheets. |
| Duplicate attempts | MOCK for same-view duplicate clicks and Back reset; provider cross-order duplicate-paid-order handling BLOCKED. Native payment/order records must be reconciled; no guarantee that two separate visits cannot create two paid orders. |
| Policies and support | PASS — both public sites' original six policy bodies checked against repository clauses, including privacy; product/review/footer links covered by tests. Updated Test notice has approved summary and original public policy references plus support details. BLOCKED — Webstore terms box renders URLs as text, not clickable policy anchors; public policies still have old preorder wording until separately approved publication. Need provider-supported clickable placement and coordinated release, not injected HTML or a Canva edit. |
| Mobile / imagery / payment methods | BLOCKED — prior viewport override did not actually resize; no mobile pass claimed. Product placeholders remain after upload-control failure. Hosted EMI/Pay Later presentation needs review against the requested checkout experience; it is not evidence that the merchant receives partial payment. No account-wide changes made. |

## Minimal operating approach (proposal, not deployed automation)

Use native Razorpay orders/payments as the system of record. Reconcile captured/unrefunded amount, INR currency, order, configuration, quantity, customer and address before fulfilment. Never infer paid status from an enquiry receipt/redirect. No new payment verification API is necessary merely to label a website return; the website deliberately makes no paid claim.

For availability, provider stock/deactivation must be applied and independently verified before closing the matching website gate; restore provider details first, then website flags. A fresh-page check does not cancel in-flight attempts. Full instructions are in [SettingsWiki](SettingsWiki.md). Ask the owner to accept this manual V1 process rather than advertising automatic sync. If strict automated or cross-order guarantees are mandatory, agree on scope before adding a trusted payment/order integration.

For shipping, first obtain the actual tariff/serviceability rules and account-specific provider guidance. Do not silently assume zero shipping. If the hosted store cannot support the approved rules, report the limitation before changing architecture. The smallest potential fallback is the existing enquiry/staff-quote flow followed by an official fixed full-payment Razorpay link including disclosed shipping; this is a proposal only, not implemented or authorized here.

## Release checklist — all remain separately gated

Changed files in this revision: `src/commerce-policies.ts`, `src/CheckoutPanel.tsx`, `src/Home.tsx`, `src/Pages.tsx`, `src/config.ts`, `src/content.ts`, `src/routes.json`; generated SettingsWiki descriptions in `apps-script/Code.gs`; `tests/react-configuration.test.mjs`, `tests/public-settings.test.mjs`; `docs/SettingsWiki.md`, `docs/COMMERCE-POLICY-COMPARISON.md`, `docs/RAZORPAY-V1-IMPLEMENTATION.md`, `docs/RELEASE-CHECKLIST.md` and this report. `src/policies.json`, warranty/privacy source, backend pricing/idempotency/notification execution and the publication workflow remain unchanged in this revision.

- [ ] Verify nonzero shipping and final payable total for approved representative PINs/configurations, including invalid/unserviceable addresses; no late surcharge.
- [ ] Resolve simulator failure; verify actual Test capture + matching paid order, receipt/confirmation and staff identification for all configurations; controlled failure/cancel/retry/duplicate cases.
- [ ] Agree on V1 availability operations; test direct URLs plus open-cart/in-flight cases and restoration. Do not describe paired manual updates as automatic synchronization.
- [ ] Verify clickable provider policy links, approved new-order full-payment publication, imagery, responsive layout and allowed payment-method presentation. Preserve old contractual records and Canva/DNS.
- [ ] Confirm GST classification/invoicing and actual account fees; no browser/Sheet secrets, extra GST or processing surcharge.
- [ ] Require full automated tests, TypeScript, build, 17-page export/base-path checks and green PR review CI.
- [ ] Obtain separate approval before updating existing TEST Apps Script version 7 to the reviewed code. Deploy compatible reader before migrating five checkout keys; preserve Sheet data, legacy properties, cutover, single trigger and notifications FALSE. Do not release new-price enquiry frontend against the old-price backend.
- [ ] Obtain explicit merge AND automatic Pages-publication approval (every main push publishes). Merge PR #5 first; synchronize/retarget PR #6 to main, inspect diff/CI, then obtain its merge approval; repeat for same PR #7. No history rewrite or new PR.
- [ ] Obtain separate Live product/shipping/policy/settings and activation approval. Preserve Live store URL/history, verify current product links after publication, then deliberately review the code's Live gate and approved MasterSettings destinations. Never point Test URLs at Live purchases.
- [ ] Keep `/NestCloud-Website/`, the approved endpoint selection and Canva/nestcloud.in/DNS unchanged. No real test charge without separate authorization.

Rollback: stop provider acceptance only with explicit authorization; a website gate alone is insufficient. Restore compatible reviewed code/settings together, preserve records/payment obligations, legacy properties and cutover, keep notifications FALSE, and never automatically refund/resend/capture or delete failed/history records. See [combined release plan](RAZORPAY-V1-IMPLEMENTATION.md).

Local evidence screenshots: `/tmp/nestcloud-approved-test-product.png`, `/tmp/nestcloud-old-test-product-retired.png`, earlier cart/publication/stock evidence. No private customer/contact screenshots are committed. Repository tests provide MOCK coverage, not payment success evidence.

Automated verification for this revision: **283/283 tests pass**, including backend/enquiry/notification/settings regressions, policy preservation and approved dispatch/shipping disclosure, all three checkout stock flags, duplicate-click/Back behavior and forged payment-return parameters. TypeScript, production build and 17-page static export/base-path validation pass. Require the pushed revision's separate GitHub review check before considering CI complete.
