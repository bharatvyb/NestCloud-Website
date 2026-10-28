import test,{beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
const require=createRequire(import.meta.url),source=fileURLToPath(new URL('../src/',import.meta.url));
const endpoint='https://script.google.com/macros/s/TEST_ONLY_NOT_A_DEPLOYMENT/exec';
const result=await build({entryPoints:[source+'App.tsx'],bundle:true,write:false,format:'esm',platform:'node',packages:'external',loader:{'.css':'empty'},jsx:'automatic',define:{'import.meta.env.BASE_URL':'"/NestCloud-Website/"','import.meta.env.VITE_ENQUIRY_ENDPOINT':JSON.stringify(endpoint),'import.meta.env.VITE_ENQUIRY_CONSENT_VERSION':'"enquiry-v1"'}});
const compiled=result.outputFiles[0].text.replace(/from "([^"./][^"]*)"/g,(_,specifier)=>`from ${JSON.stringify(pathToFileURL(require.resolve(specifier)).href)}`);
const backend=vm.createContext({});vm.runInContext(await readFile(new URL('../apps-script/Code.gs',import.meta.url),'utf8'),backend);
let dom,App,root,createRoot,posts,sequence=0;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
beforeEach(async()=>{
 dom=new JSDOM('<!doctype html><html><head><meta name="description" content=""></head><body><div id="root"></div></body></html>',{url:'https://example.invalid/NestCloud-Website/family/',pretendToBeVisual:true});
 for(const key of ['window','document','location','history','sessionStorage','navigator','HTMLElement','Event','MouseEvent'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true});
 globalThis.requestAnimationFrame=callback=>window.requestAnimationFrame(callback);globalThis.cancelAnimationFrame=id=>window.cancelAnimationFrame(id);dom.window.HTMLElement.prototype.scrollIntoView=function(){};
 ({createRoot}=await import('react-dom/client'));({default:App}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64')+'#'+sequence++));posts=[];
 window.HTMLFormElement.prototype.submit=function(){posts.push({action:this.action,method:this.method,target:this.target,enctype:this.enctype,pairs:[...new window.FormData(this)]})};
});
afterEach(async()=>{if(root)await act(async()=>root.unmount());root=null;dom.window.close()});
async function render(){if(root)await act(async()=>root.unmount());root=createRoot(document.querySelector('#root'));await act(async()=>root.render(React.createElement(App)))}
async function navigate(href){await act(async()=>history.pushState(null,'',href));await render()}
async function follow(selector){const a=typeof selector==='string'?document.querySelector(selector):selector;assert.ok(a);await navigate(a.getAttribute('href'))}
async function fill(name,value){const node=document.querySelector(`form [name="${name}"]`);assert.ok(node,name);await act(async()=>{if(node.type==='checkbox'){if(node.checked!==value)node.click()}else{const prototype=node.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:node.tagName==='SELECT'?window.HTMLSelectElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(node,value);node.dispatchEvent(new window.Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}))}})}
async function details(type){await fill('full_name','Journey Test');await fill('email','journey@example.invalid');await fill('mobile','9876543210');if(type==='purchase')await fill('delivery_pin','560001');else await fill('message','Please help with this question.');await fill('consent',true)}
async function submit(){await act(async()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})))}
function accepted(type){assert.equal(posts.length,1);const post=posts[0];assert.equal(post.action,endpoint);assert.equal(post.method,'post');assert.equal(post.target,'_self');const body=new URLSearchParams(post.pairs).toString();const data=backend.ncValidate_({postData:{type:post.enctype,contents:body},contentLength:body.length,parameters:Object.fromEntries(post.pairs.map(([k,v])=>[k,[v]]))},{consentVersion:'enquiry-v1'});assert.ok(data);assert.equal(data.enquiry_type,type);return Object.fromEntries(post.pairs)}
for(const [index,id,price] of [[0,'512gb',49900],[1,'1tb',59900],[2,'backup',81900]])test(`${id}: product → order → Enquire to Buy → native purchase POST`,async()=>{
 await render();await act(async()=>document.querySelectorAll('#configure input[type=radio]')[index].click());await follow('.purchase-row a');assert.match(document.querySelector('.summary-total').textContent,new RegExp(price.toLocaleString('en-IN')));
 const cta=document.querySelector('.order-summary a.button');assert.equal(cta.textContent.trim(),'Enquire to Buy');await follow(cta);
 assert.equal(location.pathname,'/NestCloud-Website/purchase-enquiry');assert.equal(document.querySelector('[name=configuration_id]').value,id);assert.equal(document.querySelector('[name=displayed_price]').value,String(price));
 assert.equal(document.querySelector('[name=device_serial]'),null);assert.equal(document.querySelector('#order-enquiry-summary'),null);assert.ok(document.querySelector('.enquiry-fallback a[href="https://nestcloud.in/support"]'));
 await details('purchase');await submit();const data=accepted('purchase');assert.equal(data.configuration_id,id);assert.equal(data.displayed_price,String(price));assert.equal(data.delivery_pin,'560001');assert.doesNotMatch(document.querySelector('form').textContent,/successfully sent|received successfully/i);
 const uuid=data.submission_id;await render();assert.equal(document.querySelector('[name=email]').value,'journey@example.invalid');await submit();assert.equal(Object.fromEntries(posts[1].pairs).submission_id,uuid);
});
test('purchase selection follows reload, review changes, navigation and actual Back/Forward',async()=>{
 await navigate('/NestCloud-Website/order?configuration=backup');await follow('.order-summary a.button');await render();assert.equal(document.querySelector('[name=configuration_id]').value,'backup');
 await follow('.enquiry-review-link a');await act(async()=>document.querySelectorAll('.order-storage input')[0].click());await follow('.order-summary a.button');assert.equal(document.querySelector('[name=configuration_id]').value,'512gb');
 async function travel(direction){await act(async()=>{const popped=new Promise(resolve=>window.addEventListener('popstate',resolve,{once:true}));history[direction]();await popped});await render()}
 await travel('back');assert.match(document.querySelector('.summary-total').textContent,/49,900/);await travel('back');assert.equal(document.querySelector('[name=configuration_id]').value,'backup');await travel('forward');await travel('forward');assert.equal(document.querySelector('[name=configuration_id]').value,'512gb');
 await follow([...document.querySelectorAll('footer a')].find(a=>a.textContent==='Contact Us'));await navigate('/NestCloud-Website/order');assert.match(document.querySelector('.summary-total').textContent,/49,900/);
});
test('Contact Us entry opens general form with required message and no purchase/support fields',async()=>{
 await render();await follow([...document.querySelectorAll('footer a')].find(a=>a.textContent==='Contact Us'));assert.equal(document.title,'Contact Us — NestCloud');assert.equal(document.querySelector('[name=enquiry_type]').value,'general');
 for(const field of ['delivery_pin','configuration_id','displayed_price','device_serial','order_reference','issue_category'])assert.equal(document.querySelector(`[name=${field}]`),null);
 await details('general');await fill('message','');await submit();assert.equal(posts.length,0);assert.equal(document.activeElement.name,'message');assert.equal(document.querySelector('[name=email]').value,'journey@example.invalid');assert.ok(document.querySelector('[role=alert]'));await fill('message','I have a question about NestCloud.');await submit();accepted('general');
});
test('Technical Support entry remains support with stored selection or old configuration query',async()=>{
 await render();await follow([...document.querySelectorAll('footer a')].find(a=>a.textContent==='Technical Support'));assert.equal(location.hash,'#contact');assert.equal(document.querySelector('[name=enquiry_type]').value,'support');await navigate('/NestCloud-Website/support?configuration=backup#contact');
 for(const field of ['delivery_pin','configuration_id','displayed_price'])assert.equal(document.querySelector(`[name=${field}]`),null);
 await details('support');await fill('message','');await submit();assert.equal(posts.length,0);assert.equal(document.activeElement.name,'message');await fill('message','My photos are not backing up.');await fill('order_reference','000123');await fill('device_serial','000456');await fill('issue_category','photos');await submit();const data=accepted('support');assert.equal(data.order_reference,'000123');assert.equal(data.device_serial,'000456');assert.equal(data.issue_category,'photos');
});
test('new enquiry routes and enquiry links are exported and all internal destinations exist',async()=>{
 const routes=JSON.parse(await readFile(new URL('../src/routes.json',import.meta.url),'utf8'));const paths=new Set(routes.map(r=>r.path));for(const path of ['/order','/purchase-enquiry','/contact','/support'])assert.ok(paths.has(path));
 for(const path of ['/order?configuration=backup','/purchase-enquiry?configuration=backup','/contact','/support']){await navigate('/NestCloud-Website'+path);for(const a of document.querySelectorAll('a[href]')){const url=new URL(a.getAttribute('href'),location.href);if(url.origin===location.origin&&url.pathname.startsWith('/NestCloud-Website/'))assert.ok(paths.has(url.pathname.replace('/NestCloud-Website','').replace(/\/$/,'')||'/'),url.pathname)}assert.equal(document.querySelectorAll('.enquiry-fallback a').length,path.startsWith('/order')?0:2)}
});

test('Google fixed return-to-home destination provides a route back to the saved purchase and its configuration',async()=>{
 await navigate('/NestCloud-Website/purchase-enquiry?configuration=backup');await details('purchase');await submit();const id=Object.fromEntries(posts[0].pairs).submission_id;
 await navigate('/NestCloud-Website/');const resume=[...document.querySelectorAll('a')].find(a=>a.textContent==='Review saved purchase enquiry');assert.ok(resume);assert.match(resume.getAttribute('href'),/purchase-enquiry\?configuration=backup$/);await follow(resume);assert.equal(document.querySelector('[name=email]').value,'journey@example.invalid');assert.equal(document.querySelector('[name=submission_id]').value,id);assert.equal(document.querySelector('[name=configuration_id]').value,'backup');
});

for(const type of ['general','support'])test(`${type} saved form can be recovered after the fixed Google return-to-home link`,async()=>{
 await navigate('/NestCloud-Website/'+(type==='general'?'contact':'support#contact'));await details(type);await submit();const first=Object.fromEntries(posts[0].pairs);await navigate('/NestCloud-Website/');await follow([...document.querySelectorAll('a')].find(a=>a.textContent===`Review saved ${type==='general'?'contact':'support'} enquiry`));assert.equal(document.querySelector('[name=message]').value,first.message);assert.equal(document.querySelector('[name=submission_id]').value,first.submission_id);
});

test('purchase fallback targets the verified buyer route and retains device support separately',async()=>{
 await navigate('/NestCloud-Website/purchase-enquiry?configuration=backup');const fallback=document.querySelector('.enquiry-fallback');const links=[...fallback.querySelectorAll('a')];assert.equal(links[0].getAttribute('href'),'https://nestcloud.in/reserve');assert.equal(links[1].getAttribute('href'),'https://nestcloud.in/support');assert.match(fallback.textContent,/not sent to either page/);assert.match(fallback.textContent,/Confirm your configuration and current product price/);
});
