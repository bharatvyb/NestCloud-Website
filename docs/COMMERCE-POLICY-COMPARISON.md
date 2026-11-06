# Published policy comparison — full-payment transition proposal

Reviewed 6 November 2026. **Proposal only; no Live Razorpay, Canva, Pages or Google changes.** The existing Live Webstore remains Active and unchanged at the owner's instruction. Continue only in Test Mode and draft PR #7.

## Sources and verification

Read the rendered policy pages on both public websites and compared every substantive source block with `src/policies.json`, ignoring whitespace/Unicode presentation differences. No repository clause was missing from either published version across these five policies:

| Policy | Canva | GitHub Pages | Source blocks verified on each |
| --- | --- | --- | ---: |
| Terms & Conditions | [Published](https://nestcloud.in/policies/tc) | [Published](https://bharatvyb.github.io/NestCloud-Website/policies/tc/) | 105 |
| Shipping & Delivery | [Published](https://nestcloud.in/policies/shipping--delivery) | [Published](https://bharatvyb.github.io/NestCloud-Website/policies/shipping--delivery/) | 63 |
| Cancellation & Refund | [Published](https://nestcloud.in/policies/cancellation--refund) | [Published](https://bharatvyb.github.io/NestCloud-Website/policies/cancellation--refund/) | 71 |
| Warranty | [Published](https://nestcloud.in/policies/warranty) | [Published](https://bharatvyb.github.io/NestCloud-Website/policies/warranty/) | 72 |
| SLA | [Published](https://nestcloud.in/policies/sla) | [Published](https://bharatvyb.github.io/NestCloud-Website/policies/sla/) | 117 |

Terms, shipping, cancellation/refunds and warranty show 7 August 2026; SLA shows 17 September 2026. These published sources agree on the relevant terms. The conflict is with the proposed new payment model, not between the two websites. Clause presence is not a legal opinion or new owner approval.

Repository review: `src/policies.json` retains the original published material; `docs/policy-source-manifest.json` records its original provenance/hashes. `src/PolicyDocument.tsx` currently chooses PR #7's unapproved `src/commerce-policies.ts` draft overlays for Terms, shipping, cancellation/refunds and SLA; warranty/privacy still use original documents. Those broad draft overlays are NOT what either public website currently publishes. The narrower clause-level approach below should replace the broad proposals after owner approval; do not discard applicable existing clauses or publish placeholder policy decisions.

## Existing terms and minimum proposed changes

| Topic | Existing published position | Proposed treatment for NEW full-payment orders |
| --- | --- | --- |
| Delivery coverage | India only; courier serviceability at the customer's PIN; no international launch shipping | Preserve unchanged. |
| Shipping charges | Any applicable charge disclosed before final payment; free shipping only where explicitly stated at checkout/order confirmation. Redispatch charges may apply after specified failed-delivery circumstances | Preserve; change “final payment” to “payment” where needed. This is NOT a blanket free-shipping promise. A chosen checkout tariff still needs owner approval before activation. |
| Preparation / delivery | Preparation, software installation, configuration and quality checks; dispatch notice/tracking where available; post-dispatch timing depends on destination/courier; communicate material delays | Preserve. Do not convert an estimate into a guarantee. |
| Dispatch target | Terms §7, Cancellation “Preorder Advance”, SLA §2: aim for dispatch readiness within 10 working days of RECEIPT OF PREORDER ADVANCE, unless another timeline is communicated | Owner decision required: carry the same estimated target over from receipt of FULL PAYMENT, with existing exceptions, or communicate an order-specific estimate before payment. Existing wording does not decide this for new fully paid orders. |
| Advance / balance | ₹10,000 non-refundable preorder advance, later balance before dispatch, with inability-to-fulfil/legal exceptions | Remove these workflows for new orders; require the approved full GST-inclusive product price upfront. Preserve original terms/records for historical orders. Do not reinterpret ₹10,000 as a new cancellation fee or make the whole payment non-refundable. |
| Cancellation before dispatch | Standard fully paid, non-preorder orders may request cancellation; if accepted, eligible paid amounts return to the original method | Reuse this already-published full-payment rule. Preserve acceptance/eligibility wording; do not promise unconditional cancellation or invent a fee. Remove only advance-specific exceptions from the new-order version. |
| Cancellation after dispatch / returns | Cancellation may no longer be possible; return requests assessed by eligibility/circumstances; change-of-mind returns after delivery not automatic; consumer rights preserved | Preserve; remove only the reference back to preorder advance deductions. |
| Seller cancellation / defects | Seller-attributable cancellation refunds amounts received to the original method. Damaged/incorrect products are reviewed with reasonable evidence; repair, replacement or appropriate remedy | Preserve without new exclusions, deadlines or penalties. |
| Refund timing | Approved refunds normally to original payment method; confirmation where available; reflection depends on method/provider/bank and may take several working days | Preserve. No fixed initiation SLA or numeric bank-credit deadline exists here. Do NOT copy a provider error screen's 5–7-day message into the merchant policy. |
| Warranty | One-year limited hardware warranty from delivery unless invoice/order documentation specifies otherwise; appliance-level coverage coordinated by NestCloud; existing exclusions/remedies/process and consumer rights | Preserve the complete published policy, including shipping responsibility varying by claim/location and remaining original coverage after repair/replacement. No new exclusions or fresh one-year restart. |
| Support | SLA aims at initial response within 1–2 business days during normal operations; not a guaranteed resolution time | Preserve; do not confuse this with dispatch or refund timing. |

Product catalogue proposal remains NestCloud Home 512 GB ₹60,499; 1 TB ₹72,499; 1 TB + Backup Plus ₹99,499. GST-inclusive, no added 18% or separate processing surcharge, no deposits or later balance. Preserve the published warning that planned software features are not guaranteed; remove the stale specific November 2026 release-date example rather than inventing a replacement date. Historical contractual obligations remain unchanged.

## Approval boundary

No new refund deadline, cancellation fee or warranty exclusion is needed to reuse the published full-payment terms. Only the new-order dispatch trigger/target and actual checkout shipping tariff cannot be determined from existing policies. Present the above comparison before requesting approval. A policy proposal approval is not permission to edit the active store, deploy either website, merge PRs, update Google code/settings or enable notifications.

## Test continuation

Provider-verified in this review: quantity-one 1 TB cart subtotal/grand total ₹72,499 and Backup Plus ₹99,499, ₹0 discount, visible Test-only restriction. Delivery remains “To be added during checkout” at the cart stage. Cart was cleared after each check; no payment attempted or new order submitted. Earlier 512 GB final Test checkout amount ₹60,499 including taxes/free Test delivery remains recorded separately. This does not prove shipping tariffs for other addresses/configurations or successful payment capture.

Earlier failed simulated payment, EMI/Pay Later presentation, image upload and mobile validation gates remain unresolved; no success or production-readiness claim is made. See [implementation evidence and release/rollback plan](RAZORPAY-V1-IMPLEMENTATION.md).
