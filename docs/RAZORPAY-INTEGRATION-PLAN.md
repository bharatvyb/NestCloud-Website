# Razorpay commerce integration — inspection and approval gates

Status: Phase 1 assessment only. No checkout code, provider listing, Google configuration, live price, payment, order or deployment has been changed. Commercial decisions and test-resource approval are required before implementation. Continue all payment-readiness work on this branch/PR.

## Dependency baseline

Inspected 6 November 2026 (Asia/Kolkata):

- PR #5 is draft/open, `fix/notification-preflight-contention` → main, head `aa98ba21641adfdc36710c8b76aba22f262335a3`, validation green.
- PR #6 is draft/open, `feature/master-settings` → `fix/notification-preflight-contention`, head `c6349ae35e9f6c92e182d3006ffd11d39987e0b5`, validation green.
- This Razorpay branch starts exactly at that PR #6 head, including its final fail-closed form patch. Its draft PR must target `feature/master-settings`, not main. Do not change PR #5/#6, rewrite their history or merge them during integration.
- Google TEST Web App remains version 7; it does not contain c6349ae's final fail-closed patch. Repository code and deployed code must not be assumed identical. No Apps Script/Sheet mutations are authorized by this assessment.
- Main pushes automatically publish Pages. No main push, PR merge or Pages dispatch is authorized. Repository-relative base stays `/NestCloud-Website/`; Canva/DNS/nestcloud.in remain separate and unchanged.

## Existing store and repository findings

Existing active public store: https://pages.razorpay.com/stores/st_TNDdSuG2qOGoJJ . Inspection was read-only: no editor save, stock change, cart addition or purchase occurred. Dashboard viewing was switched to Test Mode; its Webstore tab shows no storefront pages. No test store has been created.

| Configuration | Repository product price | Existing selling price | Existing listing issue |
| --- | ---: | ---: | --- |
| 512 GB | ₹49,900 | ₹49,900 | Branded Lite, description says 500 GB; struck-through ₹54,900/9% discount not approved for the new flow |
| 1 TB | ₹59,900 | ₹59,900 | Branded Family as a model; struck-through ₹66,900/10% discount needs approval |
| 1 TB + dedicated 1 TB Backup Plus SSD | ₹81,900 | ₹81,900 | Branded Backup Plus as a separate model; struck-through ₹91,900/11% discount needs approval |

These prices match `src/config.ts` and the existing server catalogue; this is not approval of GST-inclusive final payable amounts or shipping. Backup Plus has 1 TB usable storage plus a dedicated backup SSD, not 2 TB usable storage.

Other issues:

- Repository branding currently says one NestCloud Family with storage configurations; the requested NestCloud Home name needs owner confirmation before rebranding.
- Store descriptions include Priority Support/expandable-storage claims and a specific November 2026 Family Box Office upgrade promise. Confirm claims against approved shipped functionality; do not copy promises blindly.
- Store terms mention preorders. `src/policies.json` contains a non-refundable ₹10,000 preorder advance, later balance payment and an advance-based dispatch target. These conflict with the new full-upfront-payment requirement. Owner-approved replacement cancellation/refund/dispatch terms are mandatory before publication. Full upfront payment does not itself establish refund entitlement or dispatch timing.
- Current `/order` → `/purchase-enquiry` is an intentional enquiry journey, not a working payment checkout. Its tax/shipping wording defers the final amount to staff. Keep it truthful and operational until a verified replacement is ready; do not relabel an enquiry receipt as a paid-order reference.
- Existing assets include the product device WebP/PNG, home scene and logo under `public/assets`; reuse approved assets after confirming provider upload/branding scope.
- Existing MasterSettings supports global intake, individual forms, stock flags, banner and maintenance, but no payment destinations or payment verification. Never add secret keys to public settings or reuse enquiry rows as paid-order records.

## Recommended V1 architecture — pending approval and tests

Prefer the existing Razorpay-hosted Webstore with fixed-price configuration products. Public product-specific URLs are present, so the website can lead to the correct product rather than silently pass a browser-controlled amount. Preserve its store identity and history for the eventual approved live update. Use a separate Test Mode counterpart for synthetic verification; do not experiment on the live store.

This account visibly has Webstore, Products, Payment Links and Magic Checkout navigation. That confirms UI availability, not that every shipping/tax/refund/receipt feature is configured or test-proven. Verify shipping address, final tax/shipping amounts, quantity handling, payment references, failure/cancel behavior and provider status evidence in Test Mode before selecting this architecture definitively.

Do not introduce partial payments, deposits, balances, subscriptions or installment workflows. Configure and verify full product price plus only separately approved taxes/shipping. Do not silently carry over unapproved MRPs, discounts or EMI/Pay Later offerings.

Razorpay remains authoritative for payment/order status. Hosted confirmations and actual provider records—not a return URL, query parameter or enquiry receipt—establish payment evidence. A website return page must never claim payment success without trusted verification. Avoid a second order database or duplicate payment notifications.

MasterSettings can gate website purchase visibility and hold only reviewed public Razorpay destinations, if needed. A Sheet stock flag alone cannot revoke a previously shared active Razorpay URL. Hosted stock/availability must also be enforced at Razorpay. Agree on a manual provider-stock alignment procedure for V1, or investigate a supported trusted synchronization mechanism if automatic provider enforcement from Sheet edits is mandatory. Do not promise offsite enforcement from a frontend check.

Payment Pages/Links are fallback candidates if the store cannot meet approved shipping/order requirements. A custom Standard Checkout is last resort: server-created fixed-amount Orders, signature/webhook validation, idempotency, reconciliation and secret storage would then be mandatory. Do not add a custom backend just for styling.

Primary vendor references:

- [Webstore creation](https://razorpay.com/docs/payments/webstore/create/): hosted/no-code catalogue, separate test/live resources, prices and configuration.
- [Webstore management](https://razorpay.com/docs/payments/webstore/manage/): listing and provider stock controls.
- [Hosted customer flow](https://razorpay.com/docs/payments/webstore/how-it-works/): provider selection and payment journey.
- [Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/): server Orders and payment verification when custom integration is necessary.

## Decisions required before implementation/provider updates

1. Approve the umbrella name (current NestCloud Family versus NestCloud Home) and three storage configurations. Confirm 512 GB, not the old store's 500 GB.
2. Confirm ₹49,900 / ₹59,900 / ₹81,900 as full product prices, GST-inclusive or GST-extra (with approved rates/rules), shipping charges and serviceable delivery locations. Decide whether to remove old struck-through MRPs/discount claims. Do not infer free shipping or tax treatment.
3. Confirm availability for each configuration and safe stock enforcement across website and provider. No quantities are invented.
4. Approve full-payment cancellation/refund conditions, refund processing expectations, dispatch commitments and warranty wording. Existing one-year limited hardware warranty is a reference, not fresh approval of every commercial term. Replace advance/balance policies only with approved terms, preserving historical contractual records.
5. Approve creating/configuring a clearly named Test Mode store because none exists, and the intended synthetic checkout test batch. No live changes, actual charges, Google mutations or public publication are included in that approval. Live catalogue/financial-setting changes need their own reviewed approval.

## Verification status

PASS (inspection only): PR dependencies/c6349ae ancestry; catalogue price consistency; existing active store/public product routes; outdated names/descriptions/promotional and preorder terms; Test Mode availability and empty Webstore list.

Draft PR #7 targets `feature/master-settings`. The inherited review workflow currently filters PR bases to main and the earlier backend/notification branches, so it does not run for this new stacked base. No payment CI pass is claimed. Add that base to the review-only trigger on this Razorpay branch when implementation begins, without touching the Pages publication workflow or existing PRs, then require all test/build/export checks.

NOT RUN / BLOCKED: success/failure/cancel payments, customer receipt/order references, shipping/tax correctness, duplicates, stock bypass prevention, mobile checkout, order reconciliation and live payment activation. No payment test passed merely because a product page loaded. No payment reference or successful charge has been generated. The inherited PR #6 has 263 passing tests; those are not Razorpay coverage.

## Single release plan for all three PRs

1. Obtain commercial decisions and Test Mode resource approval. Implement and test only on this Razorpay branch, updating this same draft PR. Keep PR #5/#6 and the existing live store unchanged meanwhile.
2. Obtain separate approval to update the existing TEST Apps Script deployment with reviewed c6349ae-or-later code before payment integration depends on its fail-closed settings. If essential new public payment settings are approved, deploy a compatible reader before adding them; preserve the existing 21 settings, private bootstrap, cutover, trigger and history. Keep notifications disabled. Do not point public settings at live checkout during staging.
3. Test all approved configurations and full payable amounts in Razorpay Test Mode. Verify provider payment states and genuine references independently for success, failure, cancellation and repeated-click cases. Check stock controls, abandoned checkout, receipt behavior, mobile/desktop, Contact/Support, maintenance and settings refresh. Never collect credentials or secret keys in chat.
4. Run full automated tests, TypeScript, build, static export and GitHub validation. Require reviewed code and evidence before payment-readiness approval. Record MOCK versus provider-verified results separately.
5. Resolve automatic deployment consequences before merging anything: every main push triggers Pages, including PR #5. Obtain explicit merge-and-publication approval or separately approved workflow pausing/gating. Do not change the workflow/settings unilaterally.
6. Merge PR #5 into main first after approval. Synchronize PR #6 without rewriting history, retarget it to main, review its diff and rerun CI. After separate approval merge PR #6. Synchronize this Razorpay branch, retarget its SAME PR to main only after its dependency is merged, inspect the resulting diff and rerun CI. Do not accidentally reintroduce stacked notification changes.
7. Before payment publication, separately approve live store/product/tax/shipping/policy changes and required backend deployment. Preserve the existing live store identity and records. Verify exact live fixed amounts, provider stock, authoritative confirmation, approved links and rollback readiness before switching website destinations. No real charge is included without explicit authorization.
8. Publish GitHub Pages only after explicit approval covering the selected endpoint/destinations and auto-deployment consequences. Keep `/NestCloud-Website/`; leave Canva, DNS and nestcloud.in untouched. Perform only the approved manual testing batch.

## Rollback

- Before publication, discard/disable unapproved test checkout links and leave current public purchase/enquiry behavior unchanged. Do not delete test or live payment history.
- If a published payment flow must be stopped, use an approved website checkout gate and separately approved provider deactivation/stock control so direct hosted URLs cannot still accept orders. Reverting only the frontend is not sufficient to revoke shared hosted checkout URLs.
- Restore reviewed prior website/configuration versions only after checking settings-schema compatibility; version 6 cannot read expanded MasterSettings keys. Never blindly roll back over incompatible settings, delete legacy properties or reset notification cutover/history.
- Preserve all Razorpay orders/payments/customer records and Google enquiries/notifications. Already captured payments are financial obligations requiring an approved fulfillment/refund decision, not automatic deletion or resend.
- Keep notifications off until separately authorized. Do not roll DNS or Canva as part of this integration.
