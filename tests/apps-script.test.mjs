import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const source=await readFile(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const id='11111111-1111-4111-8111-111111111111';
function context(){return vm.createContext({Date,Number,JSON,Object,Array,String,Error});}
function harness(overrides={}){
 const c=context();vm.runInContext(source,c);
 const settings={ALLOW_SUBMISSIONS:'true',SPREADSHEET_ID:'test-only-sheet-identifier',CONSENT_VERSION:'enquiry-v1',...overrides};
 const rows=[], flags={locked:false,released:0,read:0,append:0,flush:0}, now={value:Date.parse('2026-10-28T00:00:00Z')};let serial=0;
 const services={properties:{getProperty:k=>settings[k]??null},hash:s=>createHash('sha256').update(s).digest('hex'),now:()=>now.value,uuid:()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`,
  lock:()=>({tryLock(){if(flags.busy)return false;flags.locked=true;return true},releaseLock(){flags.released++;flags.locked=false}}),
  sheets(){if(flags.readFail)throw Error('Read failed');return {metadata(){assert.ok(flags.locked);flags.read++;return rows.map(x=>x.values.slice(0,5))},append(tab,values){assert.ok(flags.locked);flags.append++;if(flags.writeFail)throw Error('Write failed');rows.push({tab,values});if(flags.persistThenThrow)throw Error('Acknowledgement lost')}}},
  flush(){flags.flush++;if(flags.flushFail)throw Error('Flush failed')}};
 return {c,settings,services,rows,flags,now,run:fields=>c.ncProcess_(event(fields),services)};
}
function fields(extra={}){return {submission_id:id,enquiry_type:'purchase',full_name:'Test Customer',email:'test@example.invalid',mobile:'+91 98765 43210',delivery_pin:'560001',message:'',consent:'yes',consent_version:'enquiry-v1',configuration_id:'1tb',displayed_price:'59900',website:'',...extra}}
function event(extra={}){const f=fields(extra);const body=new URLSearchParams(f).toString();return {contentLength:body.length,postData:{type:'application/x-www-form-urlencoded;charset=UTF-8',contents:body},parameters:Object.fromEntries(Object.entries(f).map(([k,v])=>[k,[v]]))}}
function nonPurchase(type='general',extra={}){return {enquiry_type:type,configuration_id:'',displayed_price:'',delivery_pin:'',message:'Please help with my enquiry.',...extra}}
for(const [config,price,personal,backup] of [['512gb',49900,'512 GB',''],['1tb',59900,'1 TB',''],['backup',81900,'1 TB','1 TB']])test(`authoritative catalogue and capacities: ${config}`,()=>{
 const h=harness(),r=h.run({configuration_id:config,displayed_price:String(price)});assert.equal(r.code,'success');assert.equal(h.rows[0].tab,'Purchase Enquiries');assert.equal(h.rows[0].values[15],price);assert.equal(h.rows[0].values[17],personal);assert.equal(h.rows[0].values[18],backup);assert.equal(h.flags.flush,1);assert.equal(h.flags.released,1);
});
for(const type of ['general','support'])test(`routes ${type} with required message and optional support fields`,()=>{
 const h=harness();const r=h.run(nonPurchase(type,type==='support'?{order_reference:'000123',device_serial:'000456',issue_category:'backup'}:{}));assert.equal(r.code,'success');assert.equal(h.rows[0].tab,type==='general'?'General Contact':'Technical Support');assert.equal(h.rows[0].values[15],'');
});
for(const change of [
 {full_name:''},{full_name:'a'},{full_name:'x'.repeat(101)},{email:'bad'},{mobile:'12345'},{mobile:'++919876543210'},
 {consent:''},{consent:'true'},{consent_version:'obsolete'},{delivery_pin:'012345'},{delivery_pin:'56000'},
 {message:'x'.repeat(3001)},{message:'bad\u0000'},{full_name:'Bad\nName'},{configuration_id:'__proto__'},
 {displayed_price:'59900.00'},{displayed_price:'₹59,900'},{enquiry_type:'unknown'},{submission_id:'guessable'},
 {website:'spam'},{order_reference:'x'},{issue_category:'other'},nonPurchase('general',{message:''}),
 nonPurchase('support',{message:''}),nonPurchase('support',{issue_category:'invalid'}),nonPurchase('support',{device_serial:'x'.repeat(81)}),
 nonPurchase('general',{order_reference:'0001'}),nonPurchase('general',{configuration_id:'1tb'})
])test(`rejects invalid fields ${JSON.stringify(change).slice(0,90)}`,()=>{const h=harness();assert.equal(h.run(change).code,'invalid');assert.equal(h.rows.length,0)});
test('rejects duplicate/unknown parameters, wrong content type and oversized body',()=>{
 const h=harness();for(const e of [Object.assign(event(),{contentLength:20001}),Object.assign(event(),{postData:{type:'application/json'}}),Object.assign(event(),{parameters:{...event().parameters,email:['a','b']}}),Object.assign(event(),{parameters:{...event().parameters,unexpected:['x']}})])assert.equal(h.c.ncProcess_(e,h.services).code,'invalid');assert.equal(h.rows.length,0);
});
test('price discrepancy is explicit, writes nothing, and permits reviewed resubmission',()=>{
 const h=harness();let r=h.run({displayed_price:'49900'});assert.equal(r.code,'price');assert.match(r.price,/59,900/);assert.equal(h.rows.length,0);assert.equal(h.flags.append,0);r=h.run();assert.equal(r.code,'success');
});
test('same successful submission returns original receipt before cooldown/global limits',()=>{
 const h=harness({GLOBAL_MAX_SUBMISSIONS:'1'}),first=h.run();assert.equal(h.run().receipt,first.receipt);assert.equal(h.rows.length,1);assert.equal(h.flags.append,1);assert.equal(h.flags.flush,1);
});
test('idempotency survives a new process and consent/catalogue configuration changes',()=>{
 const h=harness(),first=h.run();h.settings.CONSENT_VERSION='enquiry-v2';h.c.NC_CATALOGUE_={...h.c.NC_CATALOGUE_,'1tb':{name:'1 TB',price:60000}};
 const fresh=context();vm.runInContext(source,fresh);assert.equal(fresh.ncProcess_(event(),h.services).receipt,first.receipt);assert.equal(h.rows.length,1);
});
test('same ID with changed details conflicts, not a new row',()=>{const h=harness();h.run();assert.equal(h.run({message:'Different'}).code,'conflict');assert.equal(h.rows.length,1)});
test('same email with a different submission ID is a new enquiry after cooldown',()=>{const h=harness();h.run();assert.equal(h.run({submission_id:'22222222-2222-4222-8222-222222222222'}).code,'rate');h.now.value+=60000;assert.equal(h.run({submission_id:'22222222-2222-4222-8222-222222222222'}).code,'success');assert.equal(h.rows.length,2)});
test('global window limits and total row safety cap are configurable',()=>{
 const h=harness({GLOBAL_MAX_SUBMISSIONS:'1'});h.run();const next={submission_id:'22222222-2222-4222-8222-222222222222',email:'other@example.invalid'};assert.equal(h.run(next).code,'rate');h.now.value+=600000;assert.equal(h.run(next).code,'success');
 const capped=harness({MAX_TOTAL_ROWS:'1'});capped.run();capped.now.value+=60000;assert.equal(capped.run(next).code,'rate');assert.equal(capped.run().code,'success');
});
test('formula-like user text and phone prefixes are escaped; reference zeros survive',()=>{
 const h=harness();h.run(nonPurchase('support',{full_name:'=HYPERLINK("bad")',message:' \t=IMPORTXML("bad")',order_reference:'000123',device_serial:'@evil'}));
 const r=h.rows[0].values;assert.ok(r[6].startsWith("'="));assert.ok(r[10].startsWith("'="));assert.equal(r[8],"'+919876543210");assert.equal(r[19],'000123');assert.equal(r[20],"'@evil");
 for(const s of ['=1','+1','-1','@x',' \t=1'])assert.ok(h.c.ncCell_(s).startsWith("'"));
});
for(const fault of ['writeFail','flushFail','persistThenThrow'])test(`write fault ${fault} never falsely reports success; retry is safe`,()=>{
 const h=harness();h.flags[fault]=true;assert.equal(h.run().code,'unavailable');assert.equal(h.flags.locked,false);h.flags[fault]=false;
 const r=h.run();assert.equal(r.code,'success');assert.equal(h.rows.length,1);assert.equal(h.run().receipt,r.receipt);
});
test('busy lock and read errors fail closed without writing',()=>{
 for(const fault of ['busy','readFail']){const h=harness();h.flags[fault]=true;assert.equal(h.run().code,'unavailable');assert.equal(h.rows.length,0)}
});
test('invalid operational settings fail closed',()=>{
 for(const settings of [{ALLOW_SUBMISSIONS:'false'},{GLOBAL_MAX_SUBMISSIONS:'0'},{EMAIL_COOLDOWN_SECONDS:'bad'},{SPREADSHEET_ID:''},{CONSENT_VERSION:''}]){const h=harness(settings);assert.throws(()=>h.run());assert.equal(h.rows.length,0)}
});
test('HTML escapes untrusted strings and return URL cannot redirect elsewhere',()=>{
 const h=harness();assert.equal(h.c.ncEscape_('<img src=x onerror="x">&\''),'&lt;img src=x onerror=&quot;x&quot;&gt;&amp;&#39;');assert.equal(h.c.ncSafeReturn_('javascript:alert(1)'),'https://nestcloud.in/');
 let template;h.c.HtmlService={createTemplateFromFile:()=>template={evaluate:()=>({setTitle(){return this},addMetaTag(){return this}})}};
 h.c.ncRender_({code:'success',title:'<b>',message:'<script>',receipt:'<id>',price:'<x>'},'https://evil.invalid');
 assert.equal(template.title,'&lt;b&gt;');assert.equal(template.message,'&lt;script&gt;');assert.equal(template.returnUrl,'https://nestcloud.in/');
});
test('GET never accesses sheets or reflects request parameters; public handlers catch failures',()=>{
 const h=harness();let rendered;h.c.ncRender_=(r)=>{rendered=r;return r};h.c.PropertiesService={getScriptProperties:()=>({getProperty:()=>null})};h.c.ncServices_=()=>{throw Error('private detail')};
 h.c.doGet({parameter:{submission_id:id,receipt:'private'}});assert.equal(rendered.code,'information');assert.ok(!JSON.stringify(rendered).includes(id));assert.equal(h.c.doPost(event()).code,'unavailable');assert.ok(!JSON.stringify(rendered).includes('private detail'));
});
test('spreadsheet adapter checks schema, reads all tabs, formats text before a single row write',()=>{
 const h=harness(),calls=[];const sheets=Object.fromEntries(['Purchase Enquiries','General Contact','Technical Support'].map(name=>[name,{
  getLastColumn:()=>23,getLastRow:()=>1,getMaxRows:()=>100,
  getRange:(row,col,n,width)=>({getValues:()=>[Array.from(h.c.NC_HEADERS_)],setNumberFormat:format=>calls.push(['format',format]),setValues:values=>calls.push(['write',values])})
 }]));
 h.c.PropertiesService={getScriptProperties:()=>h.services.properties};h.c.SpreadsheetApp={openById:()=>({getSheetByName:name=>sheets[name]})};
 const adapter=h.c.ncServices_().sheets('test');assert.equal(adapter.metadata().length,0);adapter.append('Purchase Enquiries',['000123']);assert.equal(calls[0][0],'format');assert.equal(calls[0][1],'@');assert.equal(calls[1][0],'write');
 sheets['General Contact'].getLastColumn=()=>22;assert.throws(()=>h.c.ncServices_().sheets('test'));
});

test('malformed persisted metadata fails closed instead of confirming a partial row',()=>{
 const h=harness();h.run();h.rows[0].values[1]='';assert.equal(h.run().code,'unavailable');assert.equal(h.rows.length,1);
});
// Render the actual template with its Apps Script scriptlets, without Google services.
function renderTemplate(html,values){
 let code="let out='';\n",start=0;
 for(const match of html.matchAll(/<\?([\s\S]*?)\?>/g)){
  code+='out+='+JSON.stringify(html.slice(start,match.index))+';\n';
  const tag=match[1];code+=tag.startsWith('!=')?'out+=('+tag.slice(2)+');\n':tag+'\n';
  start=match.index+match[0].length;
 }
 code+='out+='+JSON.stringify(html.slice(start))+';return out;';
 return new Function(...Object.keys(values),code)(...Object.values(values));
}
for(const kind of ['success','price','unavailable'])test(`actual branded HTML template renders ${kind} without exposing submitted details`,async()=>{
 const h=harness();let props;
 h.c.HtmlService={createTemplateFromFile:()=>props={evaluate(){return {setTitle(){return this},addMetaTag(){return this}}}}};
 const r=kind==='success'?h.run():kind==='price'?h.run({displayed_price:'1'}):h.c.ncError_('unavailable');
 h.c.ncRender_(r,'https://nestcloud.in/');
 const html=renderTemplate(await readFile(new URL('../apps-script/Confirmation.html',import.meta.url),'utf8'),props);
 assert.match(html,/Nest<span>Cloud/);assert.match(html,/Return to NestCloud/);assert.match(html,/lang="en"/);
 assert.doesNotMatch(html,/test@example.invalid|9876543210|560001|<\?/);
 if(kind==='success')assert.ok(html.includes(r.receipt));else assert.doesNotMatch(html,/Your enquiry reference/);
 if(kind==='price')assert.match(html,/59,900/);
});
