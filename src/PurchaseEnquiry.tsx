import { EnquiryForm } from './EnquiryForm';
import { useConfiguration } from './useConfiguration';
import { sitePath } from './site';

// Keep the existing contact destination until the new service is live and verified.
export const contactUrl = 'https://nestcloud.in/support';
export function ContactFallback() {
 return <aside className="enquiry-fallback"><h2>Another way to reach us</h2><p>You can also contact our team through the existing NestCloud contact page. Details entered here are not sent to that page.</p><a className="text-link" href={contactUrl} target="_blank" rel="noreferrer">Open existing contact page (new tab)</a></aside>;
}
export function PurchaseEnquiry() {
 const [configuration] = useConfiguration();
 return <><div className="enquiry-review-link"><a className="text-link" href={sitePath(`/order?configuration=${configuration.id}`)}>Review or change your storage selection</a></div><EnquiryForm type="purchase" configuration={configuration}/><ContactFallback/></>;
}
