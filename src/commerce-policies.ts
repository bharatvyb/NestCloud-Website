import documents from './policies.json';
import {configs,formatPrice,priceDisclosure} from './config';
type Policy=(typeof documents)[number];
type Block=Policy['blocks'][number];
export const dispatchEstimate='NestCloud aims to have confirmed orders ready for dispatch within 10 working days from the date of successful full payment, unless a different timeline is communicated to the customer. This is an estimated dispatch timeframe, not a guaranteed delivery date.';
export const shippingDisclosure='Delivery is within India only, subject to courier serviceability at the customer’s PIN code. Applicable shipping charges and the final payable amount, including shipping, will be clearly displayed before the customer confirms payment. No unexpected charges will be added afterward.';
const revisionNotice='FULL-PAYMENT REVISION — not yet published. New orders require full payment upfront. Existing orders retain their original contractual terms and historical obligations. The active Live Webstore and published websites remain unchanged until separately approved for release.';
const paragraph=(text:string):Block=>({type:'paragraph',text});
// Retain original clauses/anchors; revise only the new-order payment and dispatch wording.
function revise(path:string,change:(block:Block,section:string,text:string)=>Block[]):Policy {
 const original=documents.find(p=>p.path===path)!;let section='';
 return {...original,title:'Proposed '+original.title,updated:'Full-payment revision — publication pending',blocks:[paragraph(revisionNotice),...original.blocks.flatMap(block=>{
  if(block.type==='heading')section=block.id!;
  return change(block,section,(block.text||'').replace(/\s+/g,' ').trim());
 })]};
}
export const commercePolicyDrafts:Record<string,Policy>={
 '/policies/tc':revise('/policies/tc',(block,section,text)=>{
  if(text==='the required payment or preorder advance has been successfully received; and')return [paragraph('the required full payment has been successfully received; and')];
  if(text.startsWith('For preorder orders,'))return [paragraph('New orders use full payment upfront and are governed by these Terms & Conditions and the applicable Cancellation & Refund Policy.')];
  if(text==='All product prices will be displayed or communicated before payment.')return [block,paragraph(configs.map(c=>'NestCloud Home '+c.name+' — '+formatPrice(c.price)).join('; ')+'. '+priceDisclosure)];
  if(text.startsWith('Applicable taxes, delivery charges'))return [paragraph(shippingDisclosure)];
  if(text.startsWith('Once a preorder has been confirmed'))return [paragraph('Once an order has been confirmed and full payment has been received, the price of the selected configuration communicated for that order will apply, unless the customer subsequently requests a change in configuration.')];
  if(text.startsWith('For preorders, the initial payment'))return [paragraph('New purchases require full payment upfront through an official NestCloud payment method. No deposits, partial payments or later balance payments are offered.')];
  if(section==='section-7'){
   if(block.type==='heading')return [{type:'heading',id:block.id!,text:'7. Order Preparation & Dispatch'}];
   if(block.type==='list'||/^(Some NestCloud products|To confirm a preorder|Accordingly,|The preorder advance|The remaining balance)/.test(text))return [];
   if(text.startsWith('Once the preorder advance'))return [paragraph('Once full payment is successfully received and the order is confirmed by NestCloud, procurement, allocation, assembly, configuration and testing activities may begin specifically for that customer’s device.')];
   if(text.startsWith('NestCloud currently aims'))return [paragraph(dispatchEstimate)];
  }
  if(text==='For example:'||text.startsWith('Family Box Office is currently planned as a free upgrade'))return [];
  return [block];
 }),
 '/policies/shipping--delivery':revise('/policies/shipping--delivery',(block,section,text)=>{
  if(section==='section-3'){
   if(block.type==='heading')return [{type:'heading',id:block.id!,text:'Order Preparation & Dispatch'}];
   if(text.startsWith('Products purchased during a preorder period'))return [paragraph('Confirmed orders may require preparation before dispatch.'),paragraph(dispatchEstimate)];
   if(text.startsWith('The expected delivery window'))return [paragraph('The expected delivery window will be communicated during the order process.')];
   if(text.startsWith('Preorder delivery dates'))return [paragraph('Dispatch and delivery dates are estimates and may change because of:')];
  }
  if(text.startsWith('Applicable shipping charges,'))return [paragraph(shippingDisclosure)];
  return [block];
 }),
 '/policies/cancellation--refund':revise('/policies/cancellation--refund',(block,section,text)=>{
  // Balance-payment section is inapplicable; other existing section anchors stay stable.
  if(section==='section-3')return [];
  if(section==='section-2'){
   if(block.type==='heading')return [{type:'heading',id:block.id!,text:'Full Payment & Preparation'}];
   if(text.startsWith('To confirm a NestCloud preorder'))return [paragraph('New orders require full payment upfront through an official NestCloud payment method. No deposits, partial payments or later balance payments are offered.')];
   if(text.startsWith('Once the preorder advance'))return [paragraph('Once full payment is successfully received and the order is confirmed, NestCloud may begin procurement, allocation, assembly, configuration and testing specifically for that customer’s device.')];
   if(/^(For this reason,|The preorder advance|The remaining balance)/.test(text))return [];
   if(text.startsWith('NestCloud currently aims'))return [paragraph(dispatchEstimate)];
   if(text.startsWith('If NestCloud is unable to fulfil'))return [paragraph(text.replace('confirmed preorder','confirmed order'))];
  }
  if(text.startsWith('For standard fully-paid orders'))return [paragraph('For fully paid orders, customers may request cancellation before the product has been dispatched.')];
  if(/^(For confirmed preorders,|Any remaining amount paid beyond)/.test(text))return [];
  if(text.includes('confirmed order or preorder'))return [paragraph(text.replace('confirmed order or preorder','confirmed order'))];
  if(section==='section-8'&&text.includes('For confirmed preorders'))return [paragraph(text.replace(' For confirmed preorders cancelled before dispatch, the preorder advance terms stated above will apply.',''))];
  return [block];
 }),
 '/policies/sla':revise('/policies/sla',(block,section,text)=>{
  if(section==='section-2'&&text.startsWith('For confirmed preorders,'))return [paragraph(dispatchEstimate)];
  if(section==='section-11'&&text.startsWith('For confirmed preorders,'))return [];
  return [block];
 })
};
