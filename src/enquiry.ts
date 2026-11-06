import type { Configuration } from './config';
export const existingContactUrl = 'https://nestcloud.in/support';
export const existingReservationUrl = 'https://nestcloud.in/reserve';
export type EnquiryType = 'purchase' | 'general' | 'support';
export type EnquiryFields = { full_name:string; email:string; mobile:string; delivery_pin:string; message:string; consent:boolean; order_reference:string; device_serial:string; issue_category:string; website:string };
export const emptyEnquiry = ():EnquiryFields => ({full_name:'',email:'',mobile:'',delivery_pin:'',message:'',consent:false,order_reference:'',device_serial:'',issue_category:'',website:''});
export const issueCategories = ['setup','photos','files','remote-access','backup','hardware','other'] as const;
export const draftLifetime = 24 * 60 * 60 * 1000;
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function newSubmissionId():string {
 try {
 const crypto = window.crypto;
 if (crypto.randomUUID) return crypto.randomUUID();
 if (!crypto.getRandomValues) return '';
 const bytes=crypto.getRandomValues(new Uint8Array(16)); bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
 } catch {return ''}
}
export function validEndpoint(value:string):boolean {
 return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(value);
}
export const enquirySettings = {
 endpoint: import.meta.env.VITE_ENQUIRY_ENDPOINT?.trim() || '',
 consentVersion: import.meta.env.VITE_ENQUIRY_CONSENT_VERSION?.trim() || '',
};
export function validConsentVersion(value:string){return /^[a-zA-Z0-9._-]{1,40}$/.test(value)}
export type PublicEnquirySettings={available:boolean;consentVersion:string;returnUrl:string;stock:Record<Configuration['id'],boolean>;forms:Record<EnquiryType,boolean>;banner:{enabled:boolean;message:string;link:string};maintenance:{enabled:boolean;message:string};checkout:{enabled:boolean;mode:'test'|'live';urls:Record<Configuration['id'],string>}};
export function validCheckoutUrl(value:string){return value==='' || /^https:\/\/pages\.razorpay\.com\/stores\/st_[A-Za-z0-9]+\/product\/li_[A-Za-z0-9]+$/.test(value)}
export function validBannerLink(value:string):boolean {
 if(value==='')return true;
 if(value.length>2048 || /[\s\\<>"\x00-\x1f\x7f]/.test(value))return false;
 try{const url=new URL(value);return /^https:\/\//i.test(value) && url.protocol==='https:' && !url.username && !url.password && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(url.hostname)}catch{return false}
}
export async function loadPublicEnquirySettings(endpoint:string,signal:AbortSignal):Promise<PublicEnquirySettings> {
 if(!validEndpoint(endpoint))throw new Error('Enquiry settings unavailable');
 // Simple anonymous GET: no credentials, private keys or preflight headers.
 const response=await fetch(`${endpoint}?resource=settings`,{signal,credentials:'omit',cache:'no-store',redirect:'follow'});
 if(!response.ok)throw new Error('Enquiry settings unavailable');
 const data=await response.json();
 if(!data || typeof data.available!=='boolean' || typeof data.consentVersion!=='string' || !validConsentVersion(data.consentVersion) || !['https://nestcloud.in/','https://bharatvyb.github.io/NestCloud-Website/'].includes(data.returnUrl) || !data.stock || !['512gb','1tb','backup'].every(id=>typeof data.stock[id]==='boolean'))throw new Error('Enquiry settings unavailable');
 // A missing form projection must never authorize new submissions.
 const forms=data.forms===undefined?{purchase:false,general:false,support:false}:data.forms;
 const banner=data.banner===undefined?{enabled:false,message:'Welcome to NestCloud!',link:''}:data.banner;
 const maintenance=data.maintenance===undefined?{enabled:false,message:'Website temporarily unavailable.'}:data.maintenance;
 const checkout=data.checkout===undefined?{enabled:false,mode:'test',urls:{'512gb':'','1tb':'',backup:''}}:data.checkout;
 if(!checkout || typeof checkout.enabled!=='boolean' || !['test','live'].includes(checkout.mode) || !checkout.urls || !['512gb','1tb','backup'].every(id=>typeof checkout.urls[id]==='string' && validCheckoutUrl(checkout.urls[id])))throw new Error('Checkout settings unavailable');
 const message=(value:unknown)=>typeof value==='string' && value.length<=500 && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value);
 if(!forms || !['purchase','general','support'].every(type=>typeof forms[type]==='boolean') || !banner || typeof banner.enabled!=='boolean' || !message(banner.message) || typeof banner.link!=='string' || !validBannerLink(banner.link) || !maintenance || typeof maintenance.enabled!=='boolean' || !message(maintenance.message))throw new Error('Enquiry settings unavailable');
 return {available:data.available,consentVersion:data.consentVersion,returnUrl:data.returnUrl,stock:{'512gb':data.stock['512gb'],'1tb':data.stock['1tb'],backup:data.stock.backup},forms:{purchase:forms.purchase,general:forms.general,support:forms.support},banner:{enabled:banner.enabled,message:banner.message,link:banner.link},maintenance:{enabled:maintenance.enabled,message:maintenance.message},checkout:{enabled:checkout.enabled,mode:checkout.mode,urls:{'512gb':checkout.urls['512gb'],'1tb':checkout.urls['1tb'],backup:checkout.urls.backup}}};
}
export function payloadFor(type:EnquiryType, fields:EnquiryFields, consentVersion:string, configuration?:Configuration):Record<string,string> {
 const payload:Record<string,string>={enquiry_type:type,full_name:fields.full_name.trim(),email:fields.email.trim().toLowerCase(),mobile:fields.mobile.trim(),message:fields.message.trim().replace(/\r\n?|\n/g,'\r\n'),consent:fields.consent?'yes':'',consent_version:consentVersion,website:fields.website.trim()};
 let mobile=payload.mobile.replace(/[ ()-]/g,'');
 if (/^(?:\+91|91)[6-9]\d{9}$/.test(mobile)) mobile=mobile.replace(/^(?:\+91|91)/,'');
 if (/^[6-9]\d{9}$/.test(mobile)) payload.mobile='+91'+mobile;
 if(type==='purchase' && configuration){payload.delivery_pin=fields.delivery_pin.trim();payload.configuration_id=configuration.id;payload.displayed_price=String(configuration.price)}
 if(type==='support'){payload.order_reference=fields.order_reference.trim();payload.device_serial=fields.device_serial.trim();payload.issue_category=fields.issue_category}
 return payload;
}
export function validateEnquiry(type:EnquiryType, fields:EnquiryFields):Record<string,string> {
 const errors:Record<string,string>={};
 const limits:Record<string,number>={full_name:100,email:254,mobile:32,message:3000,website:254,...(type==='purchase'?{delivery_pin:6}:{}),...(type==='support'?{order_reference:80,device_serial:80,issue_category:32}:{})};
 for(const [key,max] of Object.entries(limits)){
  const value=String(fields[key as keyof EnquiryFields]);
  if(value.length>max) errors[key]=`Please use ${max} characters or fewer.`;
  else if(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value) || (key!=='message' && /[\r\n]/.test(value)))errors[key]='Please remove unsupported characters.';
 }
 if(fields.full_name.trim().length<2)errors.full_name='Please enter your full name.';
 if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(fields.email.trim()))errors.email='Please enter a valid email address.';
 const mobile=fields.mobile.trim().replace(/[ ()-]/g,'');
 if(!/^[+\d ()-]+$/.test(fields.mobile.trim()) || !/^(?:(?:\+91|91))?[6-9]\d{9}$/.test(mobile))errors.mobile='Enter a 10-digit Indian mobile number, with or without +91.';
 if(type==='purchase' && !/^[1-9]\d{5}$/.test(fields.delivery_pin.trim()))errors.delivery_pin='Please enter a valid six-digit Indian PIN code.';
 if(type!=='purchase' && !fields.message.trim())errors.message='Please tell us how we can help.';
 if(fields.message.length<=3000 && fields.message.replace(/\r\n?|\n/g,'\r\n').length>3000)errors.message='Please shorten your message; line breaks count toward the 3,000-character limit.';
 if(type==='support' && fields.issue_category && !issueCategories.includes(fields.issue_category as typeof issueCategories[number]))errors.issue_category='Please choose an issue category from the list.';
 if(!fields.consent)errors.consent='Please confirm that we may contact you about this enquiry.';
 if(fields.website)errors.website='We couldn’t prepare this enquiry. Please start a new enquiry.';
 return errors;
}
export type EnquiryDraft={version:1;type:EnquiryType;fields:EnquiryFields;submissionId:string;fingerprint:string;savedAt:number};
export function readDraft(key:string,type:EnquiryType):EnquiryDraft|null {
 try {
  const raw=window.sessionStorage.getItem(key); if(!raw)return null;
  const record=JSON.parse(raw) as EnquiryDraft;
  const valid=record.version===1 && record.type===type && uuidPattern.test(record.submissionId) && typeof record.fingerprint==='string' && record.fingerprint.length<20000 && Number.isFinite(record.savedAt) && record.savedAt<=Date.now() && Date.now()-record.savedAt<draftLifetime && record.fields && typeof record.fields.consent==='boolean' && Object.keys(emptyEnquiry()).every(k=>k==='consent' || typeof record.fields[k as keyof EnquiryFields]==='string') && Object.entries(record.fields).every(([k,v])=>Object.prototype.hasOwnProperty.call(emptyEnquiry(),k) && (typeof v==='boolean' || (typeof v==='string' && v.length<=3000)));
  if(valid)return record;
  window.sessionStorage.removeItem(key);return null;
 } catch {
  // Invalid JSON can still contain personal information. Do not leave it behind.
  try {window.sessionStorage.removeItem(key)}catch{/* Storage may be unavailable. */}
  return null;
 }
}
