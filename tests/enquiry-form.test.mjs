import test,{beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {createHash,randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
const require=createRequire(import.meta.url),source=fileURLToPath(new URL('../src/',import.meta.url));
const built=await build({stdin:{contents:"export {EnquiryForm} from './EnquiryForm'; export * from './enquiry'; export {configs} from './config'; export {useConfiguration} from './useConfiguration';",resolveDir:source,loader:'tsx'},bundle:true,write:false,format:'esm',platform:'node',packages:'external',loader:{'.css':'empty'},jsx:'automatic',define:{'import.meta.env.BASE_URL':'"/NestCloud-Website/"','import.meta.env.VITE_ENQUIRY_ENDPOINT':'""','import.meta.env.VITE_ENQUIRY_CONSENT_VERSION':'""'}});
const compiled=built.outputFiles[0].text.replace(/from "([^"./][^"]*)"/g,(_,specifier)=>`from ${JSON.stringify(pathToFileURL(require.resolve(specifier)).href)}`);
const backend=vm.createContext({});vm.runInContext(await readFile(new URL('../apps-script/Code.gs',import.meta.url),'utf8'),backend);
const endpoint='https://script.google.com/macros/s/TEST_ONLY_NOT_A_DEPLOYMENT/exec';
let dom,UI,root,container,posts,createRoot,sequence=0;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
beforeEach(async()=>{
 dom=new JSDOM('<!doctype html><body></body>',{url:'https://example.invalid/NestCloud-Website/support?configuration=backup',pretendToBeVisual:true});
 for(const key of ['window','document','location','history','sessionStorage','navigator','HTMLElement','Event','MouseEvent'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true});
 ({createRoot}=await import('react-dom/client'));
 UI=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64')+'#'+sequence++);
 posts=[];dom.window.HTMLFormElement.prototype.submit=function(){posts.push({pairs:[...new dom.window.FormData(this)],action:this.action,method:this.method,enctype:this.enctype,target:this.target})};
});
afterEach(async()=>{if(root)await act(async()=>root.unmount());root=null;dom.window.close()});
function props(type='purchase',extra={}){return {type,endpoint,consentVersion:'enquiry-v1',...(type==='purchase'?{configuration:UI.configs[2]}:{}),...extra}}
async function mount(type='purchase',extra={}){if(root)await act(async()=>root.unmount());container=document.createElement('div');document.body.append(container);root=createRoot(container);await act(async()=>root.render(React.createElement(UI.EnquiryForm,props(type,extra))));return container}
async function fill(name,value){const node=container.querySelector(`[name="${name}"]`);assert.ok(node,`field ${name}`);await act(async()=>{if(node.type==='checkbox'){if(node.checked!==value)node.click()}else{const prototype=node.tagName==='TEXTAREA'?dom.window.HTMLTextAreaElement.prototype:node.tagName==='SELECT'?dom.window.HTMLSelectElement.prototype:dom.window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(node,value);node.dispatchEvent(new dom.window.Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}))}})}
async function valid(type='purchase'){await fill('full_name','Test Customer');await fill('email','test@example.invalid');await fill('mobile','+91 98765 43210');if(type==='purchase')await fill('delivery_pin','560001');else await fill('message','Please help with my enquiry.');await fill('consent',true)}
async function submit(){await act(async()=>container.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})))}
async function back(){await act(async()=>window.dispatchEvent(new dom.window.Event('pageshow')))}
const lastPayload=()=>Object.fromEntries(posts.at(-1).pairs);
function serverInput(post){const pairs=post.pairs.map(([k,v])=>[k,String(v).replace(/\r\n?|\n/g,'\r\n')]);const body=new URLSearchParams(pairs).toString();return {contentLength:body.length,postData:{type:post.enctype,contents:body},parameters:Object.fromEntries(pairs.map(([k,v])=>[k,[v]]))}}

for(const type of ['purchase','general','support'])test(`${type}: native POST uses exact backend contract and no irrelevant fields`,async()=>{
 await mount(type);await valid(type);if(type==='support'){await fill('order_reference','000123');await fill('device_serial','000456');await fill('issue_category','photos')}
 await submit();assert.equal(posts.length,1);const post=posts[0];assert.equal(post.method,'post');assert.equal(post.enctype,'application/x-www-form-urlencoded');assert.equal(post.target,'_self');assert.equal(post.action,endpoint);
 assert.equal(new Set(post.pairs.map(x=>x[0])).size,post.pairs.length,'no duplicate fields');assert.ok(UI.uuidPattern.test(lastPayload().submission_id));
 const normalized=backend.ncValidate_(serverInput(post),{consentVersion:'enquiry-v1'});assert.ok(normalized,'real Apps Script validator accepts native form payload');assert.equal(normalized.enquiry_type,type);assert.equal(normalized.mobile,'+919876543210');
 if(type==='purchase'){assert.equal(lastPayload().configuration_id,'backup');assert.equal(lastPayload().displayed_price,'81900');assert.match(container.textContent,/₹81,900/);for(const key of ['device_serial','order_reference','issue_category'])assert.equal(container.querySelector(`[name=${key}]`),null)}
 else {for(const key of ['delivery_pin','configuration_id','displayed_price'])assert.equal(container.querySelector(`[name=${key}]`),null)}
 assert.doesNotMatch(container.textContent,/successfully sent|enquiry has been received/i);assert.match(container.textContent,/wait for Google’s confirmation/);
});
for(const index of [0,1,2])test(`purchase ${index}: displayed selection and server-authoritative catalogue agree`,async()=>{
 await mount('purchase',{configuration:UI.configs[index]});await valid();await submit();const p=lastPayload();assert.equal(p.configuration_id,UI.configs[index].id);assert.equal(Number(p.displayed_price),backend.NC_CATALOGUE_[p.configuration_id].price);
});
test('not configured, malformed/non-Google endpoint, and missing consent version never submit',async()=>{
 for(const extra of [{endpoint:''},{endpoint:'https://example.invalid/exec'},{endpoint:'https://script.google.com/macros/s/test/dev'},{endpoint:endpoint+'?secret=x'},{endpoint:'http://script.google.com/macros/s/test/exec'},{consentVersion:''}]){
  await mount('general',extra);assert.ok(container.querySelector('[type=submit]').disabled);await valid('general');await submit();assert.equal(posts.length,0);assert.match(container.textContent,/not accepting enquiries yet/);
 }
});
test('client errors are inline, labelled, focus the first invalid field, and prevent native submission',async()=>{
 await mount();await submit();assert.equal(posts.length,0);assert.equal(document.activeElement.name,'full_name');for(const name of ['full_name','email','mobile','delivery_pin','consent']){const node=container.querySelector(`[name=${name}]`);assert.equal(node.getAttribute('aria-invalid'),'true');assert.ok(document.getElementById(node.getAttribute('aria-describedby').split(' ').at(-1)))}
 assert.match(container.textContent,/highlighted/);await valid();await submit();assert.equal(posts.length,1);
});
for(const [type,name,value] of [['purchase','email','not-email'],['purchase','mobile','12345'],['purchase','delivery_pin','012345'],['purchase','message','x'.repeat(3001)],['general','message','   '],['support','device_serial','x'.repeat(81)],['general','full_name','x'.repeat(101)],['general','message','bad\0'],['purchase','website','bot']])test(`reject invalid ${type} ${name}`,async()=>{
 await mount(type);await valid(type);await fill(name,value);await submit();assert.equal(posts.length,0);assert.ok(container.querySelector(`[name=${name}]`).getAttribute('aria-invalid')==='true' || name==='website');
});
test('purchase message is optional; consent and general/support messages are required',async()=>{
 await mount();await valid();await fill('consent',false);await submit();assert.equal(posts.length,0);await fill('consent',true);await submit();assert.equal(posts.length,1);
});
test('UTF-8 encoded body exceeding 20 KB fails before POST even within character limit',async()=>{
 await mount();await valid();await fill('message','漢'.repeat(2500));await submit();assert.equal(posts.length,0);assert.match(container.textContent,/message is too long/);
});
test('exact retry retains UUID and details after remount; changed submitted details get a new UUID',async()=>{
 await mount();await valid();await submit();const first=lastPayload();await mount();assert.match(container.textContent,/previous details are restored/);assert.equal(container.querySelector('[name=email]').value,'test@example.invalid');assert.ok(container.querySelector('[name=consent]').checked);await submit();assert.deepEqual(lastPayload(),first);
 await back();await fill('message','A different enquiry');await submit();assert.notEqual(lastPayload().submission_id,first.submission_id);const changed=lastPayload();await mount();await submit();assert.deepEqual(lastPayload(),changed);
});
test('equivalent normalized email, mobile and outer whitespace remain a genuine retry',async()=>{
 await mount();await valid();await submit();const id=lastPayload().submission_id;await back();await fill('email','TEST@EXAMPLE.INVALID');await fill('mobile','9876543210');await fill('full_name',' Test Customer ');await submit();assert.equal(lastPayload().submission_id,id);
});
test('new configuration changes UUID and displayed price; unmodified retry does not',async()=>{
 await mount();await valid();await submit();const id=lastPayload().submission_id;await back();await act(async()=>root.render(React.createElement(UI.EnquiryForm,props('purchase',{configuration:UI.configs[0]}))));await submit();assert.notEqual(lastPayload().submission_id,id);assert.equal(lastPayload().displayed_price,'49900');
});
test('purchase wrapper can use existing URL/session configuration store without a second selection store',async()=>{
 function Connected(){const [configuration]=UI.useConfiguration();return React.createElement(UI.EnquiryForm,props('purchase',{configuration}))}
 await mount();await act(async()=>root.render(React.createElement(Connected)));await valid();await act(async()=>history.pushState(null,'','?configuration=512gb'));await submit();assert.equal(lastPayload().configuration_id,'512gb');assert.equal(lastPayload().displayed_price,'49900');
});
test('busy guard prevents double POST; pageshow restores retry after browser Back',async()=>{
 await mount();await valid();await submit();await submit();assert.equal(posts.length,1);assert.ok(container.querySelector('[type=submit]').disabled);await back();assert.equal(container.querySelector('[type=submit]').disabled,false);await submit();assert.equal(posts.length,2);assert.equal(Object.fromEntries(posts[0].pairs).submission_id,lastPayload().submission_id);
});
test('blocked or full session storage fails closed rather than sending a non-retryable enquiry',async()=>{
 await mount();await valid();Object.defineProperty(window,'sessionStorage',{configurable:true,get(){throw new Error('Storage blocked')}});await submit();assert.equal(posts.length,0);assert.match(container.textContent,/safe retry/);
});
test('clear explicitly removes PII, unchecks consent, and creates a fresh submission reference',async()=>{
 await mount();await valid();await submit();const id=lastPayload().submission_id;await back();await act(async()=>container.querySelector('.enquiry-clear').click());assert.equal(sessionStorage.length,0);assert.equal(container.querySelector('[name=email]').value,'');assert.equal(container.querySelector('[name=consent]').checked,false);assert.notEqual(container.querySelector('[name=submission_id]').value,id);
});
test('purpose changes isolate fields and drafts; support metadata never appears for prospective buyers',async()=>{
 await mount('support');await valid('support');await fill('device_serial','000123');await submit();await act(async()=>root.render(React.createElement(UI.EnquiryForm,props('purchase'))));assert.equal(container.querySelector('[name=device_serial]'),null);assert.equal(container.querySelector('[name=email]').value,'');
});
test('malformed and expired drafts are discarded; draft keys isolate separate forms',async()=>{
 sessionStorage.setItem('nestcloud.enquiry.v1.purchase.default','{bad');await mount();assert.equal(container.querySelector('[name=email]').value,'');await valid();await submit();const saved=JSON.parse(sessionStorage.getItem('nestcloud.enquiry.v1.purchase.default'));saved.savedAt=Date.now()-UI.draftLifetime-1;sessionStorage.setItem('nestcloud.enquiry.v1.purchase.default',JSON.stringify(saved));await mount();assert.equal(container.querySelector('[name=email]').value,'');
 await mount('purchase',{draftKey:'separate'});assert.equal(container.querySelector('[name=email]').value,'');
});
test('all controls have explicit unique labels; privacy link is local; honeypot is inaccessible to keyboard',async()=>{
 await mount('support');for(const node of container.querySelectorAll('input:not([type=hidden]),textarea,select'))assert.ok(container.querySelector(`label[for="${node.id}"]`));assert.ok(container.querySelector('[name=website]').closest('[hidden]'));assert.equal(container.querySelector('[name=website]').tabIndex,-1);assert.equal(container.querySelector('.enquiry-consent a').getAttribute('href'),'/NestCloud-Website/policies/privacy-policy');
});
test('native navigation exception keeps the same persisted UUID for retry and never announces delivery',async()=>{
 window.HTMLFormElement.prototype.submit=function(){throw new Error('Navigation failed')};await mount();await valid();await submit();assert.match(container.textContent,/couldn’t open/);const id=container.querySelector('[name=submission_id]').value;await mount();assert.equal(container.querySelector('[name=submission_id]').value,id);assert.doesNotMatch(container.textContent,/successfully sent/i);
});
test('secure getRandomValues fallback still produces UUID v4',async()=>{
 Object.defineProperty(window.crypto,'randomUUID',{configurable:true,value:undefined});assert.ok(UI.uuidPattern.test(UI.newSubmissionId()));
});

test('body-size check uses actual submitted text, not trimmed fingerprint data',async()=>{
 await mount();await valid();await fill('message','　'.repeat(2999));await submit();assert.equal(posts.length,0);assert.match(container.textContent,/message is too long/);
});
test('restoring a multiline message preserves backend-normalized payload on retry',async()=>{
 await mount('support');await valid('support');await fill('message','First line\nSecond line');await submit();const first=backend.ncValidate_(serverInput(posts[0]),{consentVersion:'enquiry-v1'});await mount('support');await submit();const retry=backend.ncValidate_(serverInput(posts[1]),{consentVersion:'enquiry-v1'});assert.deepEqual(JSON.parse(JSON.stringify(retry)),JSON.parse(JSON.stringify(first)));
});
test('session quota failure prevents POST without leaving a submitting state',async()=>{
 await mount();await valid();Object.defineProperty(window.Storage.prototype,'setItem',{configurable:true,value(){throw new Error('Quota exceeded')}});await submit();assert.equal(posts.length,0);assert.equal(container.querySelector('form').getAttribute('aria-busy'),'false');
});
test('clearing unavailable storage does not falsely claim saved personal details were removed',async()=>{
 await mount();await valid();await submit();await back();Object.defineProperty(window.Storage.prototype,'removeItem',{configurable:true,value(){throw new Error('Blocked')}});await act(async()=>container.querySelector('.enquiry-clear').click());assert.match(container.textContent,/couldn’t clear/);assert.equal(container.querySelector('[name=email]').value,'test@example.invalid');
});
test('a browser without secure randomness cannot submit',async()=>{
 Object.defineProperty(window.crypto,'randomUUID',{configurable:true,value:undefined});Object.defineProperty(window.crypto,'getRandomValues',{configurable:true,value:undefined});await mount();assert.equal(container.querySelector('[name=submission_id]').value,'');assert.ok(container.querySelector('[type=submit]').disabled);await valid();await submit();assert.equal(posts.length,0);assert.match(container.textContent,/safe enquiry reference/);
});

test('native component payloads recover the original receipt through the actual backend processor',async()=>{
 let now=Date.now();const rows=[];
 const settings={ALLOW_SUBMISSIONS:'true',SPREADSHEET_ID:'synthetic-test-sheet-identifier',CONSENT_VERSION:'enquiry-v1'};
 const services={properties:{getProperty:k=>settings[k]??null},hash:s=>createHash('sha256').update(s).digest('hex'),now:()=>now,uuid:randomUUID,lock:()=>({tryLock:()=>true,releaseLock(){}}),sheets:()=>({metadata:()=>rows.map(r=>r.slice(0,5)),append:(tab,values)=>rows.push(values)}),flush(){}};
 await mount();await valid();await submit();const first=backend.ncProcess_(serverInput(posts[0]),services);assert.equal(first.code,'success');
 await mount();await submit();const retry=backend.ncProcess_(serverInput(posts[1]),services);assert.equal(retry.receipt,first.receipt);assert.equal(rows.length,1);
 await back();await fill('message','Please contact me tomorrow.');await submit();now+=60000;const changed=backend.ncProcess_(serverInput(posts[2]),services);assert.equal(changed.code,'success');assert.notEqual(changed.receipt,first.receipt);assert.equal(rows.length,2);
});
test('multiple forms use distinct labels and explicit draft keys',async()=>{
 await mount('general');await act(async()=>root.render(React.createElement(React.Fragment,null,React.createElement(UI.EnquiryForm,props('general',{draftKey:'one'})),React.createElement(UI.EnquiryForm,props('general',{draftKey:'two'})))));
 const ids=[...container.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);assert.equal(container.querySelectorAll('form').length,2);
});
