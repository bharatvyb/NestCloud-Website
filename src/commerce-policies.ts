import documents from './policies.json';
type Policy=(typeof documents)[number];
const intro='DRAFT FOR OWNER REVIEW — not approved for live sales. These proposed full-payment terms do not alter existing orders or historical contractual obligations. Live checkout remains disabled until shipping, cancellation, refunds and dispatch commitments are approved.';
function draft(slug:string,title:string,sections:[string,string][]):Policy {
 return {slug,path:`/policies/${slug}`,label:title,title,updated:'Proposed revision — approval pending',sourceUrl:'',blocks:[{type:'paragraph',text:intro},...sections.flatMap(([heading,text],i)=>[{type:'heading',text:heading,id:`section-${i+1}`},{type:'paragraph',text}])]};
}
export const commercePolicyDrafts:Record<string,Policy>={
 '/policies/sla':{...documents.find(p=>p.path==='/policies/sla')!,title:'Proposed Service Level Agreement',updated:'Proposed revision — approval pending',blocks:[{type:'paragraph',text:intro},...documents.find(p=>p.path==='/policies/sla')!.blocks.map(block=>/preorder/i.test(block.text||'')?{type:'paragraph',text:'New purchases require full payment upfront. Dispatch and cancellation/refund commitments require owner approval before live activation. Prior order obligations remain governed by their original terms.'}:block)]},
 '/policies/tc':draft('tc','Proposed Terms & Conditions',[
  ['Product and full payment','NestCloud Home is one product family with 512 GB, 1 TB, and 1 TB + Backup Plus configurations. Backup Plus has 1 TB primary storage and a separate dedicated 1 TB backup SSD. Full payment is required upfront; no deposits, partial payments or later balance payments are offered for new purchases.'],
  ['Prices and GST','Approved product prices are ₹60,499, ₹72,499 and ₹99,499 respectively, inclusive of GST. No additional 18% GST or separate Razorpay processing allowance is added at checkout. GST classification and invoice treatment require professional verification before live activation.'],
  ['Ordering and payment evidence','Razorpay is the authoritative payment record. An enquiry receipt, browser return URL or unverified screenshot is not proof of payment. Payment confirmation and product allocation/fulfilment are distinct; no dispatch commitment is approved yet.'],
  ['Availability and policies','India-only delivery is proposed. Stock, shipping, cancellation/refunds and dispatch conditions must be approved before any live sale. Existing customers retain the terms applicable to their original order. No new feature release date or discount is promised.']
 ]),
 '/policies/shipping--delivery':draft('shipping--delivery','Proposed Shipping & Delivery Policy',[
  ['Delivery region','Delivery is limited to serviceable addresses within India. No international delivery is offered. Exact serviceability and address collection must be verified in hosted checkout.'],
  ['Shipping charges — approval required','Free shipping is preferred but not approved. No new shipping surcharge is authorized. Live checkout must remain off until the owner approves shipping charges/rules and the exact amount shown before payment. Test checkout may use zero shipping solely for synthetic testing; that is not a live commercial commitment.'],
  ['Dispatch and tracking — approval required','The former dispatch target is not carried into this proposal. The owner must approve a dispatch commitment, stock preparation process, tracking and escalation/refund handling before publication. No delivery date is guaranteed by this draft.'],
  ['Existing orders','Existing order and shipping obligations remain governed by the terms accepted for those orders; history is not rewritten.']
 ]),
 '/policies/cancellation--refund':draft('cancellation--refund','Proposed Cancellation & Refund Policy',[
  ['Full-payment purchases','New purchases use full payment upfront. No advance-based cancellation or future balance-payment process is proposed. Existing orders and their contractual records remain unchanged.'],
  ['Cancellation — owner decision required','Before live activation, approve whether cancellation is allowed before dispatch, the cut-off/fulfilment stages and the treatment of any documented actual costs, subject to applicable law. This draft does not invent a cancellation penalty or non-refundable amount.'],
  ['Refunds — owner decision required','Approve refund eligibility, request channels, review criteria and processing timelines, including failure to fulfil and damaged/defective delivery. Razorpay/provider status must be reconciled before a refund is issued. No automatic refund action is performed by the website.'],
  ['Warranty and consumer rights','The existing one-year limited hardware warranty remains proposed, subject to wording review. Warranty handling does not replace applicable consumer rights. Live selling must wait for approved terms.']
 ])
};
