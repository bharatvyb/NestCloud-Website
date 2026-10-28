import { useEffect, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { formatPrice, type Configuration } from './config';
import { sitePath } from './site';
import { draftLifetime, emptyEnquiry, enquirySettings, issueCategories, newSubmissionId, payloadFor, readDraft, validConsentVersion, validEndpoint, validateEnquiry, type EnquiryDraft, type EnquiryFields, type EnquiryType } from './enquiry';
import './enquiry.css';

type Props = {endpoint?:string;consentVersion?:string;draftKey?:string} & ({type:'purchase';configuration:Configuration}|{type:'general'|'support';configuration?:never});
const titles:Record<EnquiryType,string>={purchase:'Let’s bring your cloud home.',general:'What would you like to know?',support:'Let’s get things working.'};
const issueLabels:Record<string,string>={setup:'Getting started',photos:'Photos & videos',files:'Files', 'remote-access':'Access away from home',backup:'Backups',hardware:'Device or hardware',other:'Something else'};

/** Standalone component for Phase 3A; page integration is intentionally separate. */
export function EnquiryForm({type,configuration,endpoint=enquirySettings.endpoint,consentVersion=enquirySettings.consentVersion,draftKey='default'}:Props) {
 // Key the inner form so changing its purpose cannot leak fields between enquiry types.
 return <EnquiryFormFields key={`${type}:${draftKey}`} {...{type,configuration,endpoint,consentVersion,draftKey}}/>;
}
function EnquiryFormFields({type,configuration,endpoint,consentVersion,draftKey}:{type:EnquiryType;configuration?:Configuration;endpoint:string;consentVersion:string;draftKey:string}) {
 const key=`nestcloud.enquiry.v1.${type}.${draftKey}`;
 const [restored]=useState(()=>readDraft(key,type));
 const [fields,setFields]=useState<EnquiryFields>(()=>restored?.fields || emptyEnquiry());
 const [submissionId,setSubmissionId]=useState(()=>restored?.submissionId || newSubmissionId());
 const [record,setRecord]=useState<EnquiryDraft|null>(restored);
 const [errors,setErrors]=useState<Record<string,string>>({});
 const [notice,setNotice]=useState('');
 const [submitting,setSubmitting]=useState(false);
 const busy=useRef(false),formRef=useRef<HTMLFormElement>(null),id=useId();
 const configured=validEndpoint(endpoint) && validConsentVersion(consentVersion);
 useEffect(()=>{
  const resume=()=>{busy.current=false;setSubmitting(false)};
  window.addEventListener('pageshow',resume);
  return()=>window.removeEventListener('pageshow',resume);
 },[]);
 useEffect(()=>{
  if(!record)return;
  const timer=window.setTimeout(()=>{
   try {const saved=readDraft(key,type);if(!saved || saved.savedAt===record.savedAt)window.sessionStorage.removeItem(key)}catch{/* Storage may be blocked after submission. */}
  },Math.max(0,record.savedAt+draftLifetime-Date.now()));
  return()=>window.clearTimeout(timer);
 },[record,key,type]);
 function update<K extends keyof EnquiryFields>(key:K,value:EnquiryFields[K]){
  setFields(previous=>({...previous,[key]:value}));setErrors(previous=>{const next={...previous};delete next[key];return next});setNotice('');
 }
 function startNew(){
  try{window.sessionStorage.removeItem(key)}catch{setNotice('We couldn’t clear the saved details in this tab. Please check your browser’s site storage settings.');return}
  setFields(emptyEnquiry());setSubmissionId(newSubmissionId());setRecord(null);setErrors({});setNotice('A new enquiry is ready. Your saved details have been cleared.');busy.current=false;setSubmitting(false);
  formRef.current?.querySelector<HTMLInputElement>('[name="full_name"]')?.focus();
 }
 function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy.current)return;
  if(!configured){setNotice('This form is not accepting enquiries yet. Nothing has been sent.');return}
  const nextErrors=validateEnquiry(type,fields);
  const payload=payloadFor(type,fields,consentVersion,configuration);
  // Match browser form newline encoding when checking the backend's 20 KB limit.
  const nativeFields=Array.from(new window.FormData(event.currentTarget),([name,value])=>[name,String(value).replace(/\r\n?|\n/g,'\r\n')] as [string,string]);
  if(new URLSearchParams(nativeFields).toString().length>20000)nextErrors.message='Your message is too long to send. Please shorten it.';
  setErrors(nextErrors);
  if(Object.keys(nextErrors).length){setNotice('Please check the highlighted details. Nothing has been sent.');formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();return}
  const fingerprint=JSON.stringify(payload);
  const nextId=record ? (record.fingerprint===fingerprint?record.submissionId:newSubmissionId()):submissionId;
  if(!nextId){setNotice('We couldn’t prepare a safe enquiry reference. Please use an up-to-date browser. Nothing has been sent.');return}
  const next:EnquiryDraft={version:1,type,fields:{...fields},submissionId:nextId,fingerprint,savedAt:Date.now()};
  try{window.sessionStorage.setItem(key,JSON.stringify(next))}catch{setNotice('We couldn’t keep your details for a safe retry. Please allow storage for this tab and try again. Nothing has been sent.');return}
  busy.current=true;
  // Commit the new hidden UUID before starting the native POST. Never fetch or infer delivery.
  flushSync(()=>{setSubmissionId(nextId);setRecord(next);setSubmitting(true);setNotice('Opening the enquiry confirmation page. Please wait for Google’s confirmation before assuming your enquiry was received.');});
  try{window.HTMLFormElement.prototype.submit.call(formRef.current)}catch{busy.current=false;setSubmitting(false);setNotice('We couldn’t open the confirmation page. Your details are kept in this tab. Retry without changing them if you did not receive confirmation.');}
 }
 function input(name:Exclude<keyof EnquiryFields,'consent'|'website'>,label:string,options:{required?:boolean;type?:string;maxLength:number;autoComplete?:string;hint?:string;inputMode?:'tel'|'numeric'|'email';multiline?:boolean}){
  const fieldId=`${id}-${name}`,error=errors[name];
  const common={id:fieldId,name,value:fields[name],required:options.required,maxLength:options.maxLength,autoComplete:options.autoComplete,'aria-invalid':error?'true' as const:undefined,'aria-describedby':[options.hint?`${fieldId}-hint`:'',error?`${fieldId}-error`:''].filter(Boolean).join(' ')||undefined,onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>update(name,e.target.value)};
  return <div className={`enquiry-field ${options.multiline?'enquiry-wide':''}`}><label htmlFor={fieldId}>{label} <span>{options.required?'(required)':'(optional)'}</span></label>{options.multiline?<textarea {...common} rows={5}/>:<input {...common} type={options.type || 'text'} inputMode={options.inputMode}/>} {options.hint&&<p className="enquiry-hint" id={`${fieldId}-hint`}>{options.hint}</p>}{error&&<p className="enquiry-error" id={`${fieldId}-error`}>{error}</p>}</div>;
 }
 return <section className="enquiry-card" aria-labelledby={`${id}-title`}>
  <p className="eyebrow">{type==='purchase'?'PURCHASE ENQUIRY':type==='general'?'CONTACT NESTCLOUD':'TECHNICAL SUPPORT'}</p>
  <h2 id={`${id}-title`}>{titles[type]}</h2>
  <p className="enquiry-intro">{type==='purchase'?'Tell us a little about yourself. We’ll help with availability and delivery.':type==='general'?'Ask a question and our team will get back to you.':'Tell us what’s happening, and we’ll help you find the next step.'} Fields marked required need an answer.</p>
  {type==='purchase' && configuration && <div className="enquiry-product" aria-label="Your selected NestCloud"><div><strong>NestCloud Family · {configuration.name}</strong><p>{configuration.storage}</p></div><div><strong>{formatPrice(configuration.price)}</strong><p>One-time product price</p></div><p className="enquiry-wide">Availability, taxes and shipping are confirmed separately. This is an enquiry, not an order or payment.</p></div>}
  {restored&&<p className="enquiry-restored">Your previous details are restored. Retry unchanged only if you did not receive confirmation. Changing the details you send starts a new enquiry.</p>}
  <form ref={formRef} method="post" encType="application/x-www-form-urlencoded" action={configured?endpoint:undefined} target="_self" noValidate onSubmit={submit} aria-busy={submitting}>
   <input type="hidden" name="submission_id" value={submissionId}/><input type="hidden" name="enquiry_type" value={type}/><input type="hidden" name="consent_version" value={consentVersion}/>
   {type==='purchase'&&configuration&&<><input type="hidden" name="configuration_id" value={configuration.id}/><input type="hidden" name="displayed_price" value={String(configuration.price)}/></>}
   <div hidden aria-hidden="true"><label htmlFor={`${id}-website`}>Leave this field empty</label><input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" value={fields.website} onChange={e=>update('website',e.target.value)}/></div>
   <div className="enquiry-grid">
    {input('full_name','Full name',{required:true,maxLength:100,autoComplete:'name'})}
    {input('email','Email address',{required:true,type:'email',maxLength:254,autoComplete:'email',inputMode:'email'})}
    {input('mobile','Mobile / WhatsApp number',{required:true,type:'tel',maxLength:32,autoComplete:'tel',inputMode:'tel',hint:'Indian mobile number, with or without +91.'})}
    {type==='purchase'&&input('delivery_pin','Delivery PIN code',{required:true,maxLength:6,autoComplete:'postal-code',inputMode:'numeric',hint:'Your six-digit Indian PIN code.'})}
    {type==='support'&&<>{input('order_reference','Order reference',{maxLength:80,autoComplete:'off'})}{input('device_serial','Device serial number',{maxLength:80,autoComplete:'off'})}<div className="enquiry-field"><label htmlFor={`${id}-issue`}>What do you need help with? <span>(optional)</span></label><select id={`${id}-issue`} name="issue_category" value={fields.issue_category} onChange={e=>update('issue_category',e.target.value)}><option value="">Choose a topic</option>{issueCategories.map(category=><option key={category} value={category}>{issueLabels[category]}</option>)}</select></div></>}
    {input('message',type==='support'?'How can we help?':'Your message',{required:type!=='purchase',maxLength:3000,multiline:true,hint:type==='support'?'Please don’t include passwords, access links or payment details.':'Please don’t include payment details.'})}
   </div>
   <div className="enquiry-consent"><input id={`${id}-consent`} name="consent" type="checkbox" value="yes" checked={fields.consent} required aria-invalid={errors.consent?'true':undefined} aria-describedby={errors.consent?`${id}-consent-error`:undefined} onChange={e=>update('consent',e.target.checked)}/><label htmlFor={`${id}-consent`}>I agree that NestCloud may use these details to respond to my enquiry. <span>(required)</span> Read our <a href={sitePath('/policies/privacy-policy')} target="_blank" rel="noreferrer">Privacy Policy (opens in a new tab)</a>.</label></div>
   {errors.consent&&<p className="enquiry-error" id={`${id}-consent-error`}>{errors.consent}</p>}
   <p className="enquiry-privacy"><ShieldCheck size={18} aria-hidden="true"/>On submission, your details are saved in this tab for retries and expire after 24 hours. Clear them below when you’re done. We do not collect payment details.</p>
   {!configured&&<p className="enquiry-unavailable" role="status">This form is not accepting enquiries yet.</p>}
   {!submissionId&&<p className="enquiry-unavailable" role="status">We couldn’t prepare a safe enquiry reference. Please use an up-to-date browser.</p>}
   <div className="enquiry-actions"><button className="button" type="submit" disabled={!configured || !submissionId || submitting}>{submitting?'Opening confirmation…':'Send enquiry'}<ArrowRight size={16} aria-hidden="true"/></button><button className="enquiry-clear" type="button" disabled={submitting} onClick={startNew}>Clear details & start a new enquiry</button></div>
   <p className="enquiry-notice" role={Object.keys(errors).length?'alert':'status'} aria-live="polite">{notice || 'Your enquiry is received only when the Google-hosted confirmation page says so.'}</p>
  </form>
 </section>;
}
