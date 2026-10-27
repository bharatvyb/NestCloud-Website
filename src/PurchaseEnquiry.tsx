import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Copy } from 'lucide-react';
import { formatPrice } from './config';
import { useConfiguration } from './useConfiguration';

export const contactUrl = 'https://nestcloud.in/support';

export function PurchaseEnquiry() {
 const [configuration] = useConfiguration();
 const [status, setStatus] = useState('');
 const field = useRef<HTMLTextAreaElement>(null);
 const summary = [
  'I’d like to enquire about NestCloud Family.',
  `Configuration: ${configuration.name}`,
  `Product price: ${formatPrice(configuration.price)} (one-time)`,
  `Storage: ${configuration.storage}`,
  'Colour: Charcoal',
  'Please confirm availability, delivery, applicable taxes, shipping and payment details.',
 ].join('\n');
 useEffect(() => setStatus(''), [configuration.id]);
 async function copySummary() {
  try {
   if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
   await navigator.clipboard.writeText(summary);
   if (field.current?.value === summary) setStatus('Order summary copied. Paste it into your enquiry on the contact page.');
  } catch {
   if (field.current?.value !== summary) return;
   field.current?.focus();
   field.current?.select();
   setStatus('Select and copy the summary below, then paste it into your enquiry.');
  }
 }
 return <div className="purchase-enquiry">
  <h3>Your order enquiry</h3>
  <p>Copy your selection, open the contact page, and paste it into your message. Your selection is not automatically sent to the contact form.</p>
  <label htmlFor="order-enquiry-summary">Your selected NestCloud and product price</label>
  <textarea ref={field} id="order-enquiry-summary" readOnly value={summary} rows={8}/>
  <div className="enquiry-actions">
   <button type="button" className="button button-secondary" onClick={copySummary}><Copy size={16}/> Copy order summary</button>
   <a className="button" href={contactUrl} target="_blank" rel="noreferrer">Open NestCloud contact page <ArrowUpRight size={16}/></a>
  </div>
  <p role="status" aria-live="polite">{status || 'Keep this summary open while you complete your enquiry. Taxes and shipping are confirmed with your order.'}</p>
 </div>;
}
