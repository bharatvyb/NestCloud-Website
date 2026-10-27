import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const require = createRequire(import.meta.url);
const source = fileURLToPath(new URL('../src/', import.meta.url));
// Compile the production TSX, never a reimplementation of its behavior.
const result = await build({stdin:{contents:`export { Configurator } from './Home'; export { default as HomePage } from './Home'; export { OrderPage, FamilyPage, OSPage, WhyPage, HowPage, BackupPage, SupportPage, PoliciesPage } from './Pages'; export { Footer } from './Home'; export { default as PolicyDocument } from './PolicyDocument';`,resolveDir:source,loader:'tsx'},bundle:true,write:false,format:'esm',platform:'node',packages:'external',loader:{'.css':'empty'},jsx:'automatic',define:{'import.meta.env.BASE_URL':'"/NestCloud-Website/"'},plugins:process.env.CONFIGURATION_HOOK_BEFORE?[{name:'baseline',setup(b){b.onLoad({filter:/useConfiguration\.ts$/},async()=>({contents:await readFile(process.env.CONFIGURATION_HOOK_BEFORE,'utf8'),loader:'ts',resolveDir:source}))}}]:[]});
const compiled = result.outputFiles[0].text.replace(/from "([^"./][^"]*)"/g,(_,specifier)=>`from ${JSON.stringify(pathToFileURL(require.resolve(specifier)).href)}`);
let sequence=0, dom, roots=[], UI;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function environment(url='https://example.test/NestCloud-Website/family/') {
 dom=new JSDOM('<!doctype html><html><body></body></html>',{url,pretendToBeVisual:true});
 for(const key of ['window','document','location','history','sessionStorage','HTMLElement','Event','MouseEvent'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true});
}
beforeEach(async()=>{environment(); UI=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64')+'#'+sequence++);});
afterEach(async()=>{await act(async()=>{for(const root of roots)root.unmount()});roots=[];dom.window.close()});
async function mount(...components){const container=document.createElement('div');document.body.append(container);const root=createRoot(container);roots.push(root);await act(async()=>root.render(React.createElement(React.Fragment,null,...components.map((Component,key)=>React.createElement(Component,{key})))));return container;}
async function click(input){await act(async()=>input.click());}
const fields=container=>[...container.querySelectorAll('fieldset')];
const chosen=fieldset=>fieldset.querySelector('input:checked')?.closest('label').textContent;
const query=()=>new URL(location.href).searchParams.get('configuration');
async function travel(direction){await act(async()=>{const changed=new Promise(resolve=>window.addEventListener('popstate',resolve,{once:true}));history[direction]();await changed;});}

test('actual product and review controls default to 1 TB; explicit URLs override saved choices',async()=>{
 sessionStorage.setItem('nestcloud.configuration','backup');history.replaceState(null,'','?configuration=512gb');
 const container=await mount(UI.Configurator,UI.OrderPage);
 for(const f of fields(container))assert.match(chosen(f),/512 GB/);
 assert.equal(sessionStorage.getItem('nestcloud.configuration'),'512gb');
 assert.match(container.querySelector('.summary-total').textContent,/49,900/);
});
test('all mounted configurators and review controls synchronize, including native radio groups',async()=>{
 const container=await mount(UI.Configurator,UI.Configurator,UI.OrderPage);
 assert.equal(fields(container)[0].querySelector('input:checked').value,'1tb');
 assert.equal(query(),'1tb');
 await click(fields(container)[0].querySelectorAll('input')[2]);
 for(const f of fields(container))assert.match(chosen(f),/Backup Plus/);
 assert.equal(query(),'backup');assert.equal(sessionStorage.getItem('nestcloud.configuration'),'backup');
 assert.match(container.querySelector('.summary-total').textContent,/81,900/);
 for(const a of container.querySelectorAll('a[href*="/order?"]'))assert.match(a.getAttribute('href'),/configuration=backup/);
});
test('selection replaces its entry while preserving history state, unrelated query and fragment',async()=>{
 const state={router:{entry:7}};history.replaceState(state,'','?campaign=family#configure');
 const container=await mount(UI.Configurator);const length=history.length;
 await click(container.querySelectorAll('input')[0]);
 assert.deepEqual(history.state,state);assert.equal(history.length,length);
 assert.equal(query(),'512gb');assert.equal(new URL(location.href).searchParams.get('campaign'),'family');assert.equal(location.hash,'#configure');
});
test('pushState, replaceState and real Back/Forward restore all mounted React views',async()=>{
 const container=await mount(UI.Configurator,UI.OrderPage);
 await act(async()=>history.pushState({entry:2},'','?configuration=512gb'));
 for(const f of fields(container))assert.match(chosen(f),/512 GB/);
 await act(async()=>history.replaceState({entry:2},'','?configuration=backup'));
 for(const f of fields(container))assert.match(chosen(f),/Backup Plus/);
 await act(async()=>history.pushState({entry:3},'','?configuration=512gb'));
 await travel('back');for(const f of fields(container))assert.match(chosen(f),/Backup Plus/);
 await travel('back');for(const f of fields(container))assert.match(chosen(f),/1 TB/);
 assert.equal(query(),'1tb');await travel('forward');assert.equal(query(),'backup');
 for(const f of fields(container))assert.match(chosen(f),/Backup Plus/);
});
test('fresh document refresh uses URL; generic navigation uses the saved session choice',async()=>{
 history.replaceState(null,'','?configuration=backup');const container=await mount(UI.Configurator);
 assert.match(chosen(fields(container)[0]),/Backup Plus/);
 const saved=sessionStorage.getItem('nestcloud.configuration');const url=location.href;
 await act(async()=>{for(const root of roots)root.unmount()});roots=[];dom.window.close();environment(url);
 UI=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64')+'#'+sequence++);
 const refreshed=await mount(UI.OrderPage);assert.match(chosen(fields(refreshed)[0]),/Backup Plus/);
 await act(async()=>{for(const root of roots)root.unmount()});roots=[];dom.window.close();environment();sessionStorage.setItem('nestcloud.configuration',saved);
 UI=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64')+'#'+sequence++);
 const navigated=await mount(UI.Configurator);assert.match(chosen(fields(navigated)[0]),/Backup Plus/);
});
test('blocked sessionStorage still supports multi-control updates, history and refresh by URL',async()=>{
 Object.defineProperty(window,'sessionStorage',{configurable:true,get(){throw new window.DOMException('Blocked','SecurityError')}});
 const container=await mount(UI.Configurator,UI.OrderPage);
 await click(fields(container)[0].querySelectorAll('input')[2]);
 for(const f of fields(container))assert.match(chosen(f),/Backup Plus/);
 assert.equal(query(),'backup');
 await act(async()=>history.pushState(null,'','?configuration=512gb'));
 for(const f of fields(container))assert.match(chosen(f),/512 GB/);
 await travel('back');for(const f of fields(container))assert.match(chosen(f),/Backup Plus/);
 await act(async()=>{for(const root of roots)root.unmount()});roots=[];
 UI=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64')+'#'+sequence++);
 const refreshed=await mount(UI.Configurator);assert.match(chosen(fields(refreshed)[0]),/Backup Plus/);
});
test('invalid URL resolves to 1 TB and StrictMode subscriptions clean up history observers',async()=>{
 history.replaceState({entry:1},'','?configuration=invalid');const push=history.pushState,replace=history.replaceState;
 const container=document.createElement('div');document.body.append(container);const root=createRoot(container);roots.push(root);
 await act(async()=>root.render(React.createElement(React.StrictMode,null,React.createElement(UI.Configurator))));
 assert.match(chosen(fields(container)[0]),/1 TB/);assert.equal(query(),'1tb');assert.deepEqual(history.state,{entry:1});
 await act(async()=>root.unmount());roots=[];
 assert.equal(history.pushState,push);assert.equal(history.replaceState,replace);
});
test('device fetch priority is reserved for homepage and family intros, not configurators or review',async()=>{
 let container=await mount(UI.HomePage);
 assert.equal(container.querySelector('.product-hero-device').getAttribute('loading'),'eager');
 assert.equal(container.querySelector('.product-hero-device').getAttribute('fetchpriority'),'high');
 assert.equal(container.querySelector('.config-device-image').getAttribute('loading'),'lazy');
 container=await mount(UI.FamilyPage);
 assert.equal(container.querySelector('.device-stage img').getAttribute('loading'),'eager');
 assert.equal(container.querySelector('.config-device-image').getAttribute('loading'),'lazy');
 container=await mount(UI.OrderPage);
 assert.equal(container.querySelector('.order-device-stage img').getAttribute('loading'),'lazy');
 assert.notEqual(container.querySelector('.order-device-stage img').getAttribute('fetchpriority'),'high');
});

const policySources=JSON.parse(await readFile(new URL('../docs/policy-source-manifest.json',import.meta.url),'utf8'));
for(const policy of policySources)test(`complete policy wording matches official capture: ${policy.path}`,()=>{
 const html=renderToStaticMarkup(React.createElement(UI.PolicyDocument,{path:policy.path}));
 const rendered=new JSDOM(html);const body=rendered.window.document.querySelector('[data-policy-body]');
 const text=[...body.children].flatMap(e=>['UL','OL'].includes(e.tagName)?[...e.children].map(li=>li.textContent):[e.textContent]).join(' ').replace(/\s+/g,' ').trim();
 assert.equal(createHash('sha256').update(text).digest('hex'),policy.normalizedBodySHA256);
 assert.ok(rendered.window.document.body.textContent.includes(policy.sourceUpdated));
 rendered.window.close();
});
test('Helpful details footer destinations are all local policy pages',()=>{
 const rendered=new JSDOM(renderToStaticMarkup(React.createElement(UI.Footer)));
 const links=[...rendered.window.document.querySelectorAll('.footer-legal a')];
 assert.equal(links.length,7);
 for(const link of links){assert.ok(link.getAttribute('href').startsWith('/NestCloud-Website/policies'));assert.equal(link.getAttribute('target'),null)}
 rendered.window.close();
});

// Customer-facing copy must never expose migration or implementation status.
test('all 15 pages use customer-facing launch copy while preserving product limits',async()=>{
 const pages=[UI.HomePage,UI.FamilyPage,UI.OSPage,UI.WhyPage,UI.HowPage,UI.BackupPage,UI.SupportPage,UI.OrderPage,UI.PoliciesPage];
 const forbidden=/development (?:web)?site|copied from|reproduced from|view original document|checkout (?:will open|not yet)|payments are not enabled|before payment is enabled|Razorpay integration|approved (?:order|payment) flow|not presented as a currently available feature|confirmed here/i;
 for(const Page of pages){
  const container=await mount(Page);
  assert.doesNotMatch(container.textContent,forbidden,Page.name);
 }
 for(const policy of policySources){
  const rendered=new JSDOM(renderToStaticMarkup(React.createElement(UI.PolicyDocument,{path:policy.path})));
  assert.doesNotMatch(rendered.window.document.body.textContent,forbidden,policy.path);
  assert.equal(rendered.window.document.querySelector('a[href="'+policy.sourceUrl+'"]'),null);
  rendered.window.close();
 }
 const order=await mount(UI.OrderPage);
 const contact=order.querySelector('.order-summary a.button');
 assert.match(contact.getAttribute('href'),/^\/NestCloud-Website\/support\?configuration=1tb#contact$/);
 await click(order.querySelectorAll('input')[2]);
 assert.match(contact.getAttribute('href'),/configuration=backup#contact$/);
 assert.match(order.querySelector('.summary-total').textContent,/81,900/);
 assert.match(order.textContent,/before you pay/);
 const os=await mount(UI.OSPage);
 assert.match(os.textContent,/Planned · NestCloud OS v1.1/);
 assert.match(os.textContent,/not currently available features/);
});
