# NestCloud Home — PR #7 implementation and release gates

## Current scope

Only `feature/razorpay-commerce`, stacked on PR #6 at c6349ae. PR #5 and PR #6 remain unchanged and unmerged. No main push, Pages deployment, Google code/settings mutation, live Razorpay edit, real charge, DNS or Canva change.

Approved catalogue: NestCloud Home — 512 GB ₹60,499; 1 TB ₹72,499; 1 TB + Backup Plus ₹99,499. These are final GST-inclusive product prices. The internal processing allowance is not a customer surcharge. Backup Plus has 1 TB primary storage and a separate dedicated 1 TB backup SSD, not 2 TB usable primary storage.

Frontend display and SEO derive from `src/config.ts`. The trusted Apps Script catalogue independently enforces the same amounts; export tests compare all three directly against the backend. Current names/prices/copy updated in homepage, product overview/configurator/comparison, order and enquiry pages, FAQ, page metadata and ProductGroup structured data. `/family` stays stable for existing links. Historical enquiry/notification fixtures and original policy source records retain old amounts/terms intentionally. Previously accepted receipts are recovered before new catalogue checks.

## Architecture and gates

`CheckoutPanel` reuses the shared 60-second MasterSettings loader. It navigates to an allowlisted fixed-price Razorpay Webstore product, never sends a browser-controlled amount, and adds no payment backend, secret or order database. Existing enquiry, Contact and Support flows remain available subject to their existing controls. Missing checkout settings disable checkout. Global intake, Purchase, stock and maintenance switches gate the entry link. Repeated clicks are blocked until Back/pageshow; no redirect, enquiry receipt or URL parameter establishes payment success.

Five optional settings are prepared (see SettingsWiki). Checkout is disabled by default; `liveCheckoutApproved` is FALSE. A separately reviewed code change is required before live checkout is allowed even if Sheet mode is switched to live. Mode is an operator assertion, not cryptographic detection of a provider URL: validate each destination in Razorpay before enabling it.

The existing Google TEST deployment is version 7 and is behind this repository, including the final PR #6 fail-closed patch and new prices. Do not publish the new frontend against that old backend: fresh purchase enquiries would fail price validation. No Google update has been performed.

## Provider evidence (6 November 2026)

PASS — One authorized Test-only Webstore created: `st_Twq3A2wp0N9cWZ`, named **NestCloud Home - TEST ONLY**. Provider visibly states “Only test payments can be made on this store”. No sample product remains.

| Configuration | Test product ID | Verified hosted price |
| --- | --- | ---: |
| 512 GB | li_Twq3A4awsi2PD6 | ₹60,499 |
| 1 TB | li_Twq3A4jUvjAirT | ₹72,499 |
| 1 TB + Backup Plus | li_Twq3A4rShQfyRQ | ₹99,499 |

Base: https://pages.razorpay.com/stores/st_Twq3A2wp0N9cWZ . Append `/product/` and the product ID for each reviewed destination. These are TEST-only references, not production links or configured Sheet values.

PASS — 512 GB quantity-one hosted cart shows ₹60,499 subtotal/grand total and ₹0 discount, no extra product GST or processing surcharge. Delivery fee is explicitly “To be added during checkout”; shipping is NOT yet verified or approved. Hosted checkout opens with a visible Test Mode marker and Contact → Address → Payment steps.

PASS — Using owner-authorized Test contact data and a fictional address (not saved), hosted checkout accepted the Bengaluru PIN and showed subtotal **inclusive of taxes ₹60,499**, delivery FREE and grand total ₹60,499. Provider rejects the literal word “test” in name/street fields even in Test Mode; normally formatted fictional fields were accepted. No real delivery address was used. Free TEST delivery does not approve live shipping terms.

FAIL — Owner selected Success on the simulated HDFC netbanking page, but its callback displayed BAD_REQUEST_ERROR, source internal, step payment_initiation, reason input_validation_failed, “The id provided does not exist”. Independently observed dashboard payment `pay_TwqEUerMT6yjBd` for ₹60,499, linked to `order_Twq47j14GrM45m`, ultimately **Failed**, reason payment_cancelled, step payment_authentication; no capture or successful receipt. These are two distinct observed error surfaces; the exact underlying callback cause is not established. No NestCloud payment API is involved in this direct hosted flow, so no speculative frontend fix is justified. Do not automatically retry or infer success from selecting the simulator button. Reconcile provider records before an intentional new TEST attempt; provider assistance may be required.

PASS — Set only the Test Backup Plus catalogue stock to zero. Its existing direct product URL immediately displayed “Out of stock” with no Add-to-cart control. Restored the original unlimited Test stock and independently reloaded the same URL: Add to cart returned. No live stock or Sheet setting changed. This proves entry prevention for a fresh direct product view, not concurrent-cart/in-flight payment race handling.

BLOCKED — Hosted payment options include EMI and Pay Later. These conflict with the requested no-installment purchase experience and require a separately reviewed provider configuration before live activation; no account-wide changes were made. Images still show placeholders: the approved PNG upload failed in browser controls and no image save is claimed. Desktop local order layout was visually inspected. The browser viewport override did not actually change the measured width (1280 px), so a mobile visual pass is NOT claimed; the override was reset. Embedded payment buttons also required owner assistance because automation could fill fields but not click them. No real transaction occurred.

MOCK — Automated React tests cover all three configuration destinations/prices, GST-inclusive/full-payment copy, stock/global/form/maintenance/checkout/live gates, repeated clicks, Back reset, safe failure/cancel messaging and unsafe URL rejection. Existing Contact/Support journeys and notification reliability regressions run unchanged. A mock pass does not prove provider settlement, shipping, invoicing or actual payment completion.

## Commercial approval still required

Draft terms, shipping, cancellation/refund and SLA overlays remove advance/balance workflows without rewriting original contractual source records. Rendered drafts are explicitly marked for owner review, not approved live terms. India-only; free shipping is preferred but unapproved. No new dispatch or refund deadline is invented. Proposed one-year limited hardware warranty retains existing exclusions for review. Confirm GST classification/invoicing and actual account processing charges before live activation. Do not copy the live store's old discounts, feature-date promises or preorder terms.

Sheet stock flags only hide/disable this website's purchase entry. They cannot revoke a copied Razorpay product URL. V1 operator process: disable the provider product/stock first, verify its direct URL rejects purchase, then set the matching Sheet stock FALSE. To reopen, verify provider price/availability and then set Sheet TRUE. Test this process in Test Mode before live use; live edits require approval. No quantities or automatic synchronization are invented.

## Combined release order and rollback

1. Complete Test-only checkout evidence with authorized contact data, images, provider stock checks and synthetic success/failure/cancel records. Keep live checkout gated off and notifications FALSE.
2. Obtain separate approval to deploy reviewed Apps Script code (including PR #5 reliability, PR #6 fail-closed forms, PR #7 prices/settings) to the SAME TEST deployment. Preserve records, bootstrap, legacy properties, cutover and single trigger. Deploy the compatible reader BEFORE migrating the five new settings. Verify enquiry idempotency and public projection; only approved synthetic submissions/emails may run.
3. Require full test/TypeScript/build/export and PR review CI. Before ANY merge, obtain explicit approval covering automatic GitHub Pages publication on every main push; alternatively obtain separate approval to pause publication. No implicit deployment approval.
4. Merge PR #5 first only after approval. Synchronize PR #6 without rewriting history, retarget to main, inspect its isolated diff and rerun CI; merge only when separately approved. Then synchronize PR #7, retarget that SAME PR to main, review isolated diff and rerun CI. Preserve the stacked history until dependencies merge.
5. Publishing a test-linked frontend requires approval and the compatible backend. Keep `/NestCloud-Website/`, existing TEST endpoint, DNS/Canva/nestcloud.in unchanged. No live checkout until shipping/refunds/warranty/GST/invoicing/fees and provider payment evidence pass review, live store edits are approved and the code gate is deliberately reviewed.
6. Rollback: disable website CHECKOUT_ENABLED and separately disable provider products to revoke copied links. Preserve payment/order history. Restore compatible reviewed frontend/backend versions together; old strict readers reject new settings. Keep notifications FALSE and never reset cutover, legacy properties or outbox/enquiry records. Reconcile current Sheet values before any legacy rollback. Captured payments require fulfilment/refund decisions, never deletion. No DNS rollback is involved.

Production payment activation: **NO-GO** until the above gates are resolved. Safe code review and controlled TEST verification can continue.
