import { EnquiryForm } from './EnquiryForm';
import { useConfiguration } from './useConfiguration';
import { sitePath } from './site';

// Keep the existing contact destination until the new service is live and verified.
import { existingContactUrl, existingReservationUrl, type EnquiryType } from './enquiry';
export const contactUrl = existingContactUrl;
export function ContactFallback({type='support'}:{type?:EnquiryType}) {
 return <aside className="enquiry-fallback"><h2>Another way to reach us</h2><p>For buying questions, visit NestCloud reservations. If you already own a device, use device support. Details and storage selections entered here are not sent to either page. Confirm your configuration and current product price with our team.</p><div className="enquiry-actions">{type==='purchase'?<><a className="text-link" href={existingReservationUrl} target="_blank" rel="noreferrer">Visit NestCloud reservations (new tab)</a><a className="text-link" href={contactUrl} target="_blank" rel="noreferrer">Existing device support (new tab)</a></>:<><a className="text-link" href={contactUrl} target="_blank" rel="noreferrer">Existing device support (new tab)</a><a className="text-link" href={existingReservationUrl} target="_blank" rel="noreferrer">Visit NestCloud reservations (new tab)</a></>}</div></aside>;
}
export function PurchaseEnquiry() {
 const [configuration] = useConfiguration();
 return <><div className="enquiry-review-link"><a className="text-link" href={sitePath(`/order?configuration=${configuration.id}`)}>Review or change your storage selection</a></div><EnquiryForm type="purchase" configuration={configuration}/><ContactFallback type="purchase"/></>;
}
