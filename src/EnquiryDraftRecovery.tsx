import { useEffect, useState } from 'react';
import { configs } from './config';
import { draftLifetime, readDraft, type EnquiryType } from './enquiry';
import { sitePath } from './site';

const purposes:EnquiryType[]=['purchase','general','support'];
const labels={purchase:'Review saved purchase enquiry',general:'Review saved contact enquiry',support:'Review saved support enquiry'};
function savedForms(){
 return purposes.flatMap(type=>{
  const draft=readDraft(`nestcloud.enquiry.v1.${type}.default`,type);
  if(!draft)return [];
  let href=type==='purchase'?'/order':type==='general'?'/contact':'/support#contact';
  if(type==='purchase'){
   try{
    const id=JSON.parse(draft.fingerprint).configuration_id;
    if(configs.some(config=>config.id===id))href=`/purchase-enquiry?configuration=${id}`;
   }catch{/* A corrupt selection must be reviewed on Order, never silently guessed. */}
  }
  return [{type,href,expires:draft.savedAt+draftLifetime}];
 });
}
/** Google's fixed return link goes home. Surface the same form and selection there. */
export function EnquiryDraftRecovery(){
 const [drafts,setDrafts]=useState(savedForms);
 useEffect(()=>{
  const refresh=()=>setDrafts(savedForms());
  window.addEventListener('pageshow',refresh);
  const timer=drafts.length?window.setTimeout(refresh,Math.max(0,Math.min(...drafts.map(draft=>draft.expires))-Date.now())):undefined;
  return()=>{window.removeEventListener('pageshow',refresh);if(timer!==undefined)window.clearTimeout(timer)};
 },[drafts]);
 if(!drafts.length)return null;
 return <section className="container enquiry-recovery" aria-labelledby="saved-enquiry-title"><h2 id="saved-enquiry-title">Your saved enquiry forms</h2><p>Received a confirmation? There’s no need to send again. You can open your form to clear your saved details. If you didn’t receive confirmation, return to the same form and retry without changing your details.</p><nav aria-label="Saved enquiry forms">{drafts.map(draft=><a className="text-link" key={draft.type} href={sitePath(draft.href)}>{labels[draft.type]}</a>)}</nav></section>;
}
