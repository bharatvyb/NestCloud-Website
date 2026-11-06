import {useEffect,useRef,useState} from 'react';
import {type Configuration,formatPrice,priceDisclosure,liveCheckoutApproved} from './config';
import {usePublicSettings} from './usePublicSettings';

/** Razorpay owns cart, payment, receipt and order status. No browser-supplied amount. */
export function CheckoutPanel({configuration}:{configuration:Configuration}) {
 const settings=usePublicSettings(),busy=useRef(false),[leaving,setLeaving]=useState(false);
 const url=settings?.checkout.urls[configuration.id]||'';
 const allowed=!!(settings?.available && settings.forms.purchase && settings.stock[configuration.id] && !settings.maintenance.enabled && settings.checkout.enabled && url && (settings.checkout.mode==='test'||liveCheckoutApproved));
 useEffect(()=>{const resume=()=>{busy.current=false;setLeaving(false)};window.addEventListener('pageshow',resume);return()=>window.removeEventListener('pageshow',resume)},[]);
 useEffect(()=>{busy.current=false;setLeaving(false)},[configuration.id]);
 return <section className="checkout-panel" aria-label="Secure checkout"><p>{priceDisclosure}</p>
 {settings?.checkout.mode==='test'&&allowed&&<p role="status"><strong>Test checkout — no real charge.</strong> Applicable shipping charges and the final total must be shown before payment. Estimated dispatch is within 10 working days from successful full payment, subject to policy conditions. This is not a live offer.</p>}
 {allowed?<a className="button" href={url} aria-disabled={leaving||undefined} onClick={event=>{if(busy.current){event.preventDefault();return}busy.current=true;setLeaving(true)}}>{leaving?'Opening Razorpay…':`${settings?.checkout.mode==='test'?'Test checkout':'Pay securely'} · ${formatPrice(configuration.price)}`}</a>:<p role="status">Secure checkout is not available for this configuration right now. You can contact our team or send an enquiry below. No payment has been taken.</p>}
 <p className="fine-print">Razorpay confirms the amount before you pay and provides the payment reference. A failed or cancelled checkout is not a paid order. Returning to NestCloud does not confirm payment. If you are unsure, check the Razorpay receipt or contact support before paying again.</p>
 </section>;
}
