# Prepared Razorpay support request — NOT SENT

Submit from the correct authenticated merchant account. Add merchant/account identification privately in the support portal if requested; do not post credentials, session tokens, OTPs or customer contact details in this repository. No API secrets or private customer details are needed in this draft.

## Subject

Hosted TEST Webstore / Magic Checkout simulator returns BAD_REQUEST_ERROR after Success; payments remain uncaptured

## Reproduction

Environment: India, TEST Mode only. Existing Webstore `st_Twq3A2wp0N9cWZ`, named “NestCloud Home - TEST ONLY”. No merchant-developed checkout/payment backend is used. Our GitHub website is not involved in this direct-provider reproduction.

Current product URL:
https://pages.razorpay.com/stores/st_Twq3A2wp0N9cWZ/product/li_Twvji6GpLWX92U

1. Open the current Test product, confirm the Test-only restriction, add quantity one, proceed at INR 60,499.
2. Enter an authorized contact and fictional delivery details for Bengaluru PIN 560001. Do not save card/address or enable promotional messages.
3. Final checkout shows the full GST-inclusive product amount and zero delivery fee for this tested address. No extra tax/processing surcharge is passed by a merchant frontend.
4. Select Cards and use the domestic Test Visa documented in your [Standard Checkout guide](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/), ending 1007, future expiry and random test CVV.
5. In the simulated bank flow select Success. The owner reproduced the error in both the Codex in-app browser and a separate ordinary Chrome attempt. Earlier simulated HDFC netbanking Success also produced the same error.

Actual simulator callback:

```json
{"error":{"code":"BAD_REQUEST_ERROR","description":"The id provided does not exist","source":"internal","step":"payment_initiation","reason":"input_validation_failed","metadata":{}}}
```

Expected: a successful Test capture, matching Paid order and hosted confirmation. Actual: no Captured payment or Paid order independently verified. Payment records exist in the TEST Dashboard. No real payment was attempted.

## Dashboard correlation (6 November 2026, IST)

| Attempt | Payment ID | Linked order | Amount | Independent observation |
| --- | --- | --- | ---: | --- |
| Earlier HDFC netbanking, 15:03 | pay_TwqEUerMT6yjBd | order_Twq47j14GrM45m | INR 60,499 | Failed / payment_cancelled; order Attempted |
| Fresh official Test Visa, in-app browser, 20:44 | pay_Tww2pXZjPrRqoF | order_TwvyzVW6nWqpaw | INR 60,499 | Initially Created after the callback error; later Customer–Payment Cancelled after leaving the stalled checkout; order Attempted |
| Separate Chrome Test Visa reproduction, 20:55 | pay_TwwEz1Y45WEeUO | order_TwwCd2F31FZblb | INR 60,499 | Observed Created/uncaptured after the callback error; linked order independently Attempted, not Paid. Please inspect final lifecycle in provider logs. |

The error screenshots were supplied by the owner; the Chrome clicks were manual because the browser connector failed. Dashboard record checks were independent of the success/error popup. We do not claim the underlying provider/account-specific cause is proven, nor that selecting simulator Success means a successful payment.

Attach the [callback error screenshot](review/payment-readiness/test-callback-error.png). Stock-cutoff examples: [fresh zero-stock view](review/payment-readiness/direct-link-zero-stock.png) and [cached cart](review/payment-readiness/cached-cart-zero-stock.png). No customer contact, account identifier or session token is included in these screenshots.

## Checks already performed

- Dashboard TEST controls were selected; public Webstore explicitly limits payments to Test Mode; records were independently located in the Test Dashboard.
- Fresh Visa attempts used the current public product URL after publication. No store republish or 512 GB price/stock change occurred during those attempts. The amount, product and linked order agree in the dashboard.
- A previous store republish rotated `li_*` product IDs. All old product URLs now return product-not-found; those retired links were NOT used for the fresh Visa attempts. No publication occurred during the later cutoff test.
- No GitHub frontend, Google Apps Script payment handler, browser-supplied amount, custom callback URL or merchant webhook was involved. Do not ask us to deploy a custom backend merely to repair a native hosted flow.
- No automatic retries, manual capture, refund, deletion, Live switch or account-wide payment configuration changes were performed. Preserve history and inspect unresolved states before any further attempt.

## Requested payment investigation

1. Identify which internal ID is missing (payment/order/authentication/callback entity) and why a simulator Success cannot finish against the existing Test records.
2. Check Test/Live/merchant ownership and native hosted order/payment correlation in server logs for the IDs/times above.
3. Confirm the supported Test instruments/authentication flow specifically for hosted Webstore / Magic Checkout and whether any merchant Test activation/configuration is missing. The standard guide's Test card was used, but we have not assumed every product has identical sandbox prerequisites.
4. Confirm whether the order drawer's “Total Amount Paid” value on an Attempted/unpaid order is an amount-label issue. We require actual Captured + Paid/refund-state reconciliation, not that label.
5. Provide a supported fix or exact Test configuration/steps. Do not change our Live store, merchant payment methods or prices as part of the investigation without owner approval.

## Additional hosted-store capability questions

- Shipping: your [Storefront announcement](https://razorpay.com/blog/razorpay-storefront/) describes shipping-fee/delivery-day configuration. This account's Webstore editor, Page Settings and operational Settings menu expose no tariff/rate-rule control. The separate Magic Checkout page requests an e-commerce platform integration. Is there an account-specific native shipping editor, a different product/version or activation prerequisite? Can the hosted Webstore apply PIN-based or fixed nonzero delivery charges and disclose the final total before confirmation? We have NOT approved or set a numeric tariff and will not assume nationwide free delivery.
- Stock cutoff: after product stock was set to zero, a fresh direct product view showed Out of stock. An already-open cart retained an enabled Proceed-to-Pay button; pressing it did not advance during the test, with no clear rejection message. Does stock zero block existing carts and already-created/in-flight orders at payment authorization/capture? Does store deactivation differ? Please specify the guaranteed cutoff; do not imply it cancels pending payments.
- Policies: what native per-Webstore control provides clickable Terms, Shipping, Refund, Warranty and Privacy links? Plain URLs entered in the terms textarea render as text, not anchors. We have not injected HTML or changed account-wide settings.
- Stable destinations: is there a documented stable product URL across Webstore republish? Current publication regenerated all `li_*` IDs. We will reverify/update approved destinations rather than depend on undocumented catalogue/preview routes.
- Presentation: how can we restrict EMI/Pay Later presentation for this Webstore without affecting another store in the same account? Account-level Payment Configuration is broader and the standard configuration is read-only. Please distinguish display configuration from enabling/disabling payment instruments.

We need Test-only resolution and reproducible evidence before considering a separately approved Live release. No real transaction or Live edit is authorized by this request.
