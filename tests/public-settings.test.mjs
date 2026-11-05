import test,{beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
const endpoint='https://script.google.com/macros/s/TEST_ONLY_NOT_A_DEPLOYMENT/exec';
const require=createRequire(import.meta.url),source=fileURLToPath(new URL('../src/',import.meta.url));
const built=await build({stdin:{contents:"export {default as App} from './App';export {SiteNotices} from './SiteNotices';export {EnquiryForm} from './EnquiryForm';export {configs} from './config';export * from './enquiry';",resolveDir:source,loader:'tsx'},bundle:true,write:false,format:'esm',platform:'node',packages:'external',loader:{'.css':'empty'},jsx:'automatic',define:{'import.meta.env.BASE_URL':'"/NestCloud-Website/"','import.meta.env.VITE_ENQUIRY_ENDPOINT':JSON.stringify(endpoint),'import.meta.env.VITE_ENQUIRY_CONSENT_VERSION':'"old-build-v1"'}});
const compiled=built.outputFiles[0].text.replace(/from "([^"./][^"]*)"/g,(_,specifier)=>`from ${JSON.stringify(pathToFileURL(require.resolve(specifier)).href)}`);
const defaults=()=>({available:true,consentVersion:'current-v2',returnUrl:'https://nestcloud.in/',stock:{'512gb':true,'1tb':true,backup:true},forms:{purchase:true,general:true,support:true},banner:{enabled:false,message:'Welcome to NestCloud!',link:''},maintenance:{enabled:false,message:'Website temporarily unavailable.'}});
let dom,UI,root,container,settings,requests,timers,sequence=0,serial=0;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
beforeEach(async()=>{
 dom=new JSDOM('<!doctype html><head><meta name="description" content=""></head><body></body>',{url:'https://example.invalid/NestCloud-Website/contact',pretendToBeVisual:true});
 for(const key of ['window','document','location','history','sessionStorage','navigator','HTMLElement','Event','MouseEvent'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true});
 globalThis.requestAnimationFrame=callback=>window.requestAnimationFrame(callback);globalThis.cancelAnimationFrame=id=>window.cancelAnimationFrame(id);
 settings=defaults();requests=[];timers=new Map();window.setInterval=(callback,ms)=>{const id=++serial;timers.set(id,{callback,ms});return id};window.clearInterval=id=>timers.delete(id);
 globalThis.fetch=async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>JSON.parse(JSON.stringify(settings))}};
 UI=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64')+'#'+sequence++);
 const {createRoot}=await import('react-dom/client');container=document.createElement('div');document.body.append(container);root=createRoot(container);
});
afterEach(async()=>{if(root)await act(async()=>root.unmount());assert.equal(timers.size,0,'refresh timer removed after final consumer unmounts');dom.window.close()});
async function render(node){await act(async()=>root.render(node))}
const form=(type='purchase',extra={})=>React.createElement(UI.EnquiryForm,{type,...(type==='purchase'?{configuration:UI.configs[2]}:{}),...extra});
const send=()=>container.querySelector('[type=submit]');
async function tick(){assert.equal(timers.size,1);await act(async()=>[...timers.values()][0].callback())}

for(const type of ['purchase','general','support'])test(`${type} switch disables only its matching React form`,async()=>{
 settings.forms[type]=false;await render(form(type));assert.equal(send().disabled,true);assert.match(container.textContent,/not accepting enquiries/);
 const other=type==='general'?'support':'general';await render(form(other));assert.equal(send().disabled,false);
 settings.forms[type]=true;await tick();await render(form(type));assert.equal(send().disabled,false);
});
test('announcement renders plain text and an optional safe HTTPS link, and hides when disabled',async()=>{
 settings.banner={enabled:true,message:'<img src=x onerror=alert(1)> Welcome!',link:'https://example.invalid/help'};
 await render(React.createElement(UI.SiteNotices));const banner=container.querySelector('[aria-label="NestCloud announcement"]');assert.ok(banner);assert.match(banner.textContent,/<img src=x/);assert.equal(banner.querySelector('img,script'),null);assert.equal(banner.querySelector('a').href,'https://example.invalid/help');
 settings.banner.link='';await tick();assert.equal(container.querySelector('[aria-label="NestCloud announcement"] a'),null);
 settings.banner.enabled=false;await tick();assert.equal(container.querySelector('[aria-label="NestCloud announcement"]'),null);
});
test('maintenance shows configured plain text, blocks all forms and preserves contact/support navigation',async()=>{
 settings.maintenance={enabled:true,message:'Maintenance <please wait>'};await render(React.createElement(UI.App));
 const notice=container.querySelector('[aria-label="Website maintenance"]');assert.ok(notice);assert.match(notice.textContent,/Maintenance <please wait>/);assert.equal(notice.querySelector('please'),null);assert.ok(notice.querySelector('a[href="/NestCloud-Website/contact"]'));assert.ok(notice.querySelector('a[href="/NestCloud-Website/support#contact"]'));assert.ok(notice.querySelector('a[href="https://nestcloud.in/support"]'));assert.ok(container.querySelector('main'));assert.ok(container.querySelector('footer'));assert.equal(send().disabled,true);
 for(const type of ['purchase','general','support']){await render(form(type));assert.equal(send().disabled,true)}
 settings.maintenance.enabled=false;await tick();assert.equal(send().disabled,false);
});
test('site notices and multiple forms share one initial GET and one 60-second refresh timer',async()=>{
 await render(React.createElement(React.Fragment,null,React.createElement(UI.SiteNotices),form('general'),form('support')));
 assert.equal(requests.length,1);assert.equal(timers.size,1);assert.equal([...timers.values()][0].ms,60000);assert.equal(requests[0].url,endpoint+'?resource=settings');assert.equal(requests[0].options.credentials,'omit');
 settings.forms.general=false;settings.banner.enabled=true;settings.banner.message='Updated without redeployment';await tick();assert.equal(requests.length,2);assert.equal(container.querySelectorAll('[type=submit]')[0].disabled,true);assert.equal(container.querySelectorAll('[type=submit]')[1].disabled,false);assert.match(container.textContent,/Updated without redeployment/);
 await act(async()=>window.dispatchEvent(new window.Event('pageshow')));assert.equal(requests.length,3);
});
test('failed refresh disables submission and next refresh recovers without changing entered fields',async()=>{
 await render(form('general'));assert.equal(send().disabled,false);const name=container.querySelector('[name=full_name]');await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(name,'Synthetic User');name.dispatchEvent(new window.Event('input',{bubbles:true}))});
 globalThis.fetch=async()=>{throw Error('Network unavailable')};await tick();assert.equal(send().disabled,true);assert.equal(name.value,'Synthetic User');
 globalThis.fetch=async()=>({ok:true,json:async()=>defaults()});await tick();assert.equal(send().disabled,false);assert.equal(name.value,'Synthetic User');
});
test('refresh aborts an overlapping old GET; late responses cannot overwrite newer settings',async()=>{
 let resolveOld;globalThis.fetch=(url,options)=>{requests.push({url,options});return new Promise(resolve=>{resolveOld=resolve})};await render(form('general'));assert.equal(send().disabled,true);
 globalThis.fetch=async()=>({ok:true,json:async()=>({...defaults(),forms:{purchase:true,general:false,support:true}})});await tick();assert.equal(requests[0].options.signal.aborted,true);
 await act(async()=>resolveOld({ok:true,json:async()=>defaults()}));assert.equal(send().disabled,true);
});
test('legacy public response gets compatible V1 defaults but malformed new fields fail closed',async()=>{
 const old=defaults();delete old.forms;delete old.banner;delete old.maintenance;globalThis.fetch=async()=>({ok:true,json:async()=>old});const parsed=await UI.loadPublicEnquirySettings(endpoint,new AbortController().signal);assert.deepEqual(parsed.forms,{purchase:true,general:true,support:true});assert.equal(parsed.banner.enabled,false);assert.equal(parsed.maintenance.enabled,false);
 for(const change of [{forms:null},{forms:{purchase:'true',general:true,support:true}},{banner:{enabled:true,message:'Hello',link:'javascript:alert(1)'}},{banner:{enabled:true,message:'Hello',link:'https://user:pass@example.invalid'}},{banner:{enabled:true,message:'x'.repeat(501),link:''}},{maintenance:{enabled:'false',message:'Wait'}}]){
  globalThis.fetch=async()=>({ok:true,json:async()=>({...defaults(),...change})});await assert.rejects(()=>UI.loadPublicEnquirySettings(endpoint,new AbortController().signal));
 }
});
