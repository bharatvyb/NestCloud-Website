import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const source=await readFile(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const uuid=n=>`11111111-1111-4111-8111-${String(n).padStart(12,'0')}`;
function saved(n=1,type='purchase',time='2026-11-03T12:00:00.000Z') {
  return [uuid(n),'NC-'+uuid(n),time,'a'.repeat(64),'b'.repeat(64),type,'Synthetic Customer','synthetic@example.invalid',"'+919000000000",type==='purchase'?'560001':'','Synthetic message','enquiry-test-v1',time,type==='purchase'?'backup':'',type==='purchase'?'1 TB + Backup Plus':'',type==='purchase'?81900:'',type==='purchase'?'INR':'',type==='purchase'?'1 TB':'',type==='purchase'?'1 TB':'',type==='support'?'TEST-ORDER-001':'',type==='support'?'TEST-SERIAL-001':'',type==='support'?'backup':'','New'];
}
function harness(overrides={}) {
  const c=vm.createContext({Date,Number,JSON,Object,Array,String,Error});vm.runInContext(source,c);
  const settings={SPREADSHEET_ID:'synthetic-private-sheet-reference',CONSENT_VERSION:'enquiry-test-v1',ALLOW_SUBMISSIONS:'true',NOTIFICATIONS_ENABLED:'true',NOTIFICATION_START_UTC:'2026-11-03T12:00:00.000Z',...overrides};
  const properties={getProperty:k=>settings[k]??null,setProperty(k,v){settings[k]=v;}};
  const rows=[],sources=[],mails=[],flags={locked:false,quota:100,flushes:0};const clock={now:Date.parse(settings.NOTIFICATION_START_UTC || '2026-11-03T12:00:00Z')};let serial=100;
  const store={
    entries(){if(flags.readFail)throw Error('private storage error');return rows.map(r=>({...r}));},
    append(record){assert.ok(flags.locked);if(flags.appendFail)throw Error('private append error');rows.push({...record,row:rows.length+2});if(flags.persistAppendFail)throw Error('acknowledgement lost');},
    write(record){assert.ok(flags.locked);if(flags.writeFail===record.status || flags.writeFailError===record.error)throw Error('private write error');const i=rows.findIndex(r=>r.row===record.row);assert.ok(i>=0);rows[i]={...record};if(flags.persistWriteFail===record.status || flags.persistWriteFailError===record.error)throw Error('acknowledgement lost');},
    sources(){if(flags.sourceFail || (++flags.sourceReads===flags.failSourceRead))throw Error('private source error');return sources.map(r=>r.slice());}
  };
  flags.sourceReads=0;
  const services={properties,now:()=>clock.now,uuid:()=>uuid(++serial),store:()=>store,
    lock:()=>{let held=false;return {tryLock(){if(flags.locked || flags.busy)return false;held=flags.locked=true;return true;},waitLock(){if(!this.tryLock())throw Error('busy');},releaseLock(){assert.ok(held);held=flags.locked=false;}};},
    flush(){flags.flushes++;if(flags.flushFail)throw Error('private flush error');},
    quota(){assert.equal(flags.locked,false);if(flags.quotaThrows)throw Error('private quota error');return flags.quota;},
    send(mail){assert.equal(flags.locked,false);mails.push({...mail});flags.onSend?.();if(flags.mailThrows)throw Error('private possibly-accepted mail error');},
    formatIst(timestamp){return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true}).format(new Date(timestamp))+' IST';}
  };
  const locked=fn=>{const lock=services.lock();assert.ok(lock.tryLock());try{return fn();}finally{lock.releaseLock();}};
  const enqueue=(row=saved())=>{sources.push(row.slice());return locked(()=>c.ncEnsureNotifications_(store,[row],services));};
  function customer(extra={}) {
    const f={submission_id:uuid(1),enquiry_type:'purchase',full_name:'Synthetic Customer',email:'synthetic@example.invalid',mobile:'9000000000',delivery_pin:'560001',message:'Synthetic message',consent:'yes',consent_version:'enquiry-test-v1',configuration_id:'backup',displayed_price:'81900',...extra};
    const body=new URLSearchParams(f).toString();const event={contentLength:body.length,postData:{type:'application/x-www-form-urlencoded'},parameters:Object.fromEntries(Object.entries(f).map(([k,v])=>[k,[v]]))};
    const customerServices={...services,hash:value=>createHash('sha256').update(value).digest('hex'),
      sheets:()=>({metadata:()=>sources.map(row=>row.slice(0,5)),append(tab,values){assert.ok(flags.locked);sources.push(Array.from(values));flags.onEnquiryAppend?.();}}),
      flush(){if(flags.enquiryFlushFail)throw Error('ambiguous enquiry flush');flags.enquiryFlushed=true;},
      queueNotification(id,values){assert.ok(flags.locked);assert.ok(flags.enquiryFlushed);if(flags.queueThrows)throw Error('outbox unavailable');c.ncEnsureNotifications_(store,[values],services);}
    };
    return c.ncProcess_(event,customerServices);
  }
  c.ncNotificationServices_=()=>services;
  return {c,settings,properties,rows,sources,mails,flags,clock,store,services,locked,enqueue,customer,run:()=>c.ncProcessNotifications_(services)};
}

for(const [type,label] of [['purchase','Purchase Enquiry'],['general','General Enquiry'],['support','Technical Support Request']])test(`notification subject, plain text and escaped HTML: ${type}`,()=>{
  const h=harness();h.enqueue(saved(1,type));assert.equal(h.run().accepted,1);assert.equal(h.rows[0].status,'Sent');
  const mail=h.mails[0];assert.equal(mail.to,'nestcloud@bharatvyb.com');assert.equal(mail.subject,`[NestCloud] New ${label} — NC-${uuid(1)}`);
  for(const value of ['Synthetic Customer','synthetic@example.invalid','+919000000000','Synthetic message',uuid(1),'IST']){assert.ok(mail.body.includes(value));assert.ok(mail.htmlBody.includes(value));}
  assert.ok(mail.body.includes(h.services.formatIst(saved()[2])));assert.doesNotMatch(JSON.stringify(mail),/synthetic-private-sheet-reference|Payload SHA256|SPREADSHEET_ID|1111111111111111111111111111111111111111111111111111111111111111/);
  if(type==='purchase'){for(const value of ['INR 81,900','1 TB','560001','Separate 1 TB backup SSD'])assert.ok(mail.body.includes(value));}
  else assert.doesNotMatch(mail.body,/Delivery PIN|Product price|Usable personal storage/);
  if(type==='support'){for(const value of ['TEST-ORDER-001','TEST-SERIAL-001','Issue category: backup'])assert.ok(mail.body.includes(value));}
  h.run();assert.equal(h.mails.length,1);
});
test('all purchase configurations use saved catalogue values, not a new catalogue lookup',()=>{
  for(const [name,price,storage,backup] of [['512 GB',49900,'512 GB',''],['1 TB',59900,'1 TB',''],['1 TB + Backup Plus',81900,'1 TB','1 TB']]){
    const h=harness(),row=saved();row[14]=name;row[15]=price;row[17]=storage;row[18]=backup;h.enqueue(row);h.c.NC_CATALOGUE_={};h.run();
    assert.ok(h.mails[0].body.includes(name));assert.ok(h.mails[0].body.includes('INR '+price.toLocaleString('en-IN')));assert.ok(h.mails[0].body.includes(backup?'Separate 1 TB backup SSD':'Not selected'));
  }
});
test('customer HTML is escaped in every dynamic email cell, and literal in plain text',()=>{
  const h=harness(),row=saved(1,'support');row[6]='<img src=x onerror="bad">';row[7]="&customer@example.invalid";row[10]='<script>alert(1)</script>\nnext';row[19]='<order>';row[20]="'serial";row[21]='<topic>';
  h.enqueue(row);h.run();const mail=h.mails[0];assert.doesNotMatch(mail.htmlBody,/<img|<script>|<order>|<topic>/);assert.match(mail.htmlBody,/&lt;img/);assert.match(mail.htmlBody,/&amp;customer/);assert.match(mail.htmlBody,/&#39;serial/);assert.ok(mail.body.includes(row[10]));
});
test('configured staff recipient changes without code changes; Sent entries never resend',()=>{
  const h=harness({NOTIFICATION_EMAIL:'test-staff@example.invalid'});h.enqueue();h.run();assert.equal(h.mails[0].to,'test-staff@example.invalid');assert.equal(h.rows[0].recipient,'test-staff@example.invalid');
  h.settings.NOTIFICATION_EMAIL='other-staff@example.invalid';h.enqueue(saved(2));h.run();assert.equal(h.mails.length,2);assert.equal(h.mails[1].to,'other-staff@example.invalid');assert.equal(h.rows[0].recipient,'test-staff@example.invalid');
});
for(const enabled of [null,'false','TRUE','invalid'])test(`disabled by default / literal true required: ${enabled}`,()=>{
  const h=harness({NOTIFICATIONS_ENABLED:enabled});h.enqueue();assert.equal(h.run().status,'disabled');assert.equal(h.rows[0].status,'Pending');assert.equal(h.rows[0].attempts,0);assert.equal(h.mails.length,0);h.settings.NOTIFICATIONS_ENABLED='true';assert.equal(h.run().accepted,1);
});
for(const recipient of ['', 'bad','a@example.invalid,b@example.invalid','Name <a@example.invalid>','a@example.invalid\r\nBcc: bad@example.invalid','a@example.invalid\n','a@-bad.invalid','.a@example.invalid','a..b@example.invalid'])test(`invalid recipient fails closed without losing accepted enquiry: ${JSON.stringify(recipient)}`,()=>{
  const h=harness({NOTIFICATION_EMAIL:recipient});const result=h.customer();assert.equal(result.code,'success');assert.equal(h.sources.length,1);assert.equal(h.rows.length,1);assert.equal(h.run().status,'invalid_configuration');assert.equal(h.mails.length,0);assert.equal(h.customer().receipt,result.receipt);
});
test('durable queue is created after enquiry flush under the same lock; duplicate receipts do not add notifications',()=>{
  const h=harness(),result=h.customer();assert.equal(result.code,'success');assert.equal(h.rows.length,1);assert.equal(h.mails.length,0);assert.equal(h.customer().receipt,result.receipt);assert.equal(h.rows.length,1);assert.equal(h.flags.locked,false);h.run();assert.equal(h.mails.length,1);
});
test('concurrent customer requests cannot append while the existing script lock is held',()=>{
  const h=harness();let overlapping;h.flags.onEnquiryAppend=()=>{overlapping=h.customer();};const first=h.customer();assert.equal(first.code,'success');assert.equal(overlapping.code,'unavailable');assert.equal(h.sources.length,1);assert.equal(h.rows.length,1);assert.equal(h.customer().receipt,first.receipt);
});
test('failed outbox creation does not invalidate a persisted receipt; reconciliation repairs exactly once',()=>{
  const h=harness();h.flags.queueThrows=true;const result=h.customer();assert.equal(result.code,'success');assert.equal(h.rows.length,0);assert.equal(h.sources.length,1);h.flags.queueThrows=false;assert.equal(h.customer().receipt,result.receipt);h.run();assert.equal(h.rows.length,1);assert.equal(h.mails.length,1);h.run();assert.equal(h.mails.length,1);
});
test('persisted outbox append followed by lost acknowledgement does not duplicate on reconciliation',()=>{
  const h=harness();h.flags.persistAppendFail=true;assert.equal(h.customer().code,'success');assert.equal(h.rows.length,1);h.flags.persistAppendFail=false;h.run();assert.equal(h.rows.length,1);assert.equal(h.mails.length,1);
});
test('outbox flush failure does not turn a saved enquiry into an unavailable confirmation',()=>{
  const h=harness();h.flags.flushFail=true;assert.equal(h.customer().code,'success');assert.equal(h.rows.length,1);h.flags.flushFail=false;h.run();assert.equal(h.mails.length,1);
});
test('ambiguous enquiry persistence retains the existing unavailable response and receipt retry behavior',()=>{
  const h=harness();h.flags.enquiryFlushFail=true;assert.equal(h.customer().code,'unavailable');assert.equal(h.sources.length,1);assert.equal(h.rows.length,0);h.flags.enquiryFlushFail=false;h.run();assert.equal(h.rows.length,1);const receipt=h.sources[0][1];assert.equal(h.customer().receipt,receipt);assert.equal(h.mails.length,1);
});
test('parallel workers cannot claim the same entry; MailApp runs without the script lock',()=>{
  const h=harness();h.enqueue();let second;h.flags.onSend=()=>{second=h.run();};h.run();assert.equal(second.accepted,0);assert.equal(h.mails.length,1);assert.equal(h.rows[0].status,'Sent');
});
test('a worker overlapping customer persistence respects the same lock',()=>{
  const h=harness();let worker;h.flags.onEnquiryAppend=()=>{worker=h.run();};h.customer();assert.equal(worker.accepted,0);assert.equal(h.mails.length,0);h.run();assert.equal(h.mails.length,1);
});
test('quota exhaustion backs off exponentially and stops after five attempts, without calling MailApp',()=>{
  const h=harness();h.enqueue();h.flags.quota=0;
  for(let attempt=1;attempt<=5;attempt++){
    h.run();const entry=h.rows[0];assert.equal(entry.attempts,attempt);assert.equal(entry.totalAttempts,attempt);assert.equal(entry.error,'quota_exhausted');assert.equal(h.mails.length,0);
    if(attempt<5){assert.equal(Date.parse(entry.nextRetry)-h.clock.now,60000*2**(attempt-1));assert.equal(entry.status,'Pending');h.run();assert.equal(h.rows[0].attempts,attempt);h.clock.now=Date.parse(entry.nextRetry);}
    else assert.equal(entry.status,'Failed');
  }
  h.flags.quota=100;h.clock.now+=86400000;h.run();assert.equal(h.mails.length,0);
});
test('quota lookup exceptions are safe pre-send retries, not possible duplicate sends',()=>{
  const h=harness();h.enqueue();h.flags.quotaThrows=true;h.run();assert.equal(h.rows[0].status,'Pending');assert.equal(h.rows[0].error,'pre_send_failure');assert.equal(h.mails.length,0);h.flags.quotaThrows=false;h.clock.now=Date.parse(h.rows[0].nextRetry);h.run();assert.equal(h.mails.length,1);
});
test('transient source failure after claim retries safely; current enquiries are never modified',()=>{
  const h=harness();h.enqueue();const before=JSON.stringify(h.sources);h.flags.failSourceRead=2;h.run();assert.equal(h.rows[0].status,'Pending');assert.equal(h.rows[0].error,'source_unavailable');assert.equal(h.mails.length,0);h.clock.now=Date.parse(h.rows[0].nextRetry);h.run();assert.equal(h.rows[0].status,'Sent');assert.equal(JSON.stringify(h.sources),before);
});
test('generic MailApp exceptions are Uncertain, including acceptance followed by exception',()=>{
  const h=harness();h.enqueue();h.flags.mailThrows=true;h.run();assert.equal(h.mails.length,1);assert.equal(h.rows[0].status,'Uncertain');assert.equal(h.rows[0].error,'mail_exception');assert.doesNotMatch(JSON.stringify(h.rows),/private possibly-accepted/);h.flags.mailThrows=false;h.clock.now+=86400000;h.run();assert.equal(h.mails.length,1);
});
for(const fault of ['writeFail','persistWriteFail'])test(`MailApp success with ${fault} on Sent never blindly resends`,()=>{
  const h=harness();h.enqueue();h.flags[fault]='Sent';assert.equal(h.run().status,'outcome_unrecorded');assert.equal(h.mails.length,1);h.flags[fault]=null;h.clock.now+=h.c.NC_NOTIFICATION_LEASE_MS_+1;h.run();assert.ok(['Uncertain','Sent'].includes(h.rows[0].status));assert.equal(h.mails.length,1);
});
test('failure to record a claim prevents MailApp from being called',()=>{
  const h=harness();h.enqueue();h.flags.writeFail='Sending';assert.equal(h.run().status,'storage_unavailable');assert.equal(h.mails.length,0);assert.equal(h.rows[0].status,'Pending');
});
test('interrupted workers expire to Uncertain, not an automatic retry',()=>{
  const h=harness();h.enqueue();const config=h.c.ncNotificationConfig_(h.properties),claim=h.c.ncClaimNotification_(h.services,config);assert.equal(claim.status,'Sending');assert.equal(h.c.ncNotificationCanSend_(h.services,config,claim),true);h.run();assert.equal(h.mails.length,0);h.clock.now+=h.c.NC_NOTIFICATION_LEASE_MS_+1;h.run();assert.equal(h.rows[0].status,'Uncertain');assert.equal(h.rows[0].error,'worker_interrupted');assert.equal(h.mails.length,0);
});
test('expired / superseded claims are fenced before MailApp and before status writes',()=>{
  const h=harness();h.enqueue();const claim=h.c.ncClaimNotification_(h.services,h.c.ncNotificationConfig_(h.properties));h.clock.now+=h.c.NC_NOTIFICATION_LEASE_MS_+1;assert.equal(h.c.ncNotificationCanSend_(h.services,h.c.ncNotificationConfig_(h.properties),claim),false);
  h.rows[0].claim=uuid(999);assert.equal(h.c.ncFinishNotification_(h.services,h.c.ncNotificationConfig_(h.properties),claim,'Sent',''),false);assert.equal(h.rows[0].status,'Sending');
});
test('kill switch checked again before MailApp; recipient snapshot remains auditable',()=>{
  const h=harness();h.enqueue();h.services.quota=()=>{h.settings.NOTIFICATIONS_ENABLED='false';return 100;};h.run();assert.equal(h.mails.length,0);assert.equal(h.rows[0].status,'Pending');assert.equal(h.rows[0].error,'disabled_before_send');
});
test('missing / duplicate / conflicting outbox history fails closed',()=>{
  for(const corrupt of ['duplicate','reference','status','attempts']){
    const h=harness();h.enqueue();if(corrupt==='duplicate')h.rows.push({...h.rows[0],row:3});if(corrupt==='reference')h.rows[0].reference='NC-'+uuid(99);if(corrupt==='status')h.rows[0].status='Unknown';if(corrupt==='attempts')h.rows[0].attempts=-1;
    assert.equal(h.run().status,corrupt==='reference'?'source_corrupt':'storage_unavailable');assert.equal(h.mails.length,0);
  }
});
test('reconciliation cutover skips historical rows, preserves records, and repairs at most 100 gaps per pass',()=>{
  const h=harness();h.sources.push(saved(999,'general','2026-11-02T12:00:00.000Z'));
  for(let n=1;n<=250;n++)h.sources.push(saved(n,'general'));
  const before=JSON.stringify(h.sources);for(const expected of [100,100,50,0])assert.equal(h.locked(()=>h.c.ncReconcileNotifications_(h.store,h.services,Date.parse(h.settings.NOTIFICATION_START_UTC))),expected);
  assert.equal(h.rows.length,250);assert.equal(JSON.stringify(h.sources),before);
});
test('worker batch and runtime budget are bounded',()=>{
  const h=harness();for(let n=1;n<=10;n++)h.enqueue(saved(n));assert.equal(h.run().accepted,5);assert.equal(h.mails.length,5);
  const limited=harness();limited.enqueue(saved(1));limited.enqueue(saved(2));limited.flags.onSend=()=>{limited.clock.now+=45000;};assert.equal(limited.run().accepted,1);
});
test('operator recovery requires disabled sending and evidence; preserves lifetime attempts',()=>{
  const h=harness();h.enqueue();h.flags.mailThrows=true;h.run();assert.throws(()=>h.c.resolveNotification_(uuid(1),'retry','CONFIRMED_NOT_SENT'));
  h.settings.NOTIFICATIONS_ENABLED='false';assert.throws(()=>h.c.resolveNotification_(uuid(1),'retry','guess'));
  h.c.resolveNotification_(uuid(1),'retry','CONFIRMED_NOT_SENT');assert.equal(h.rows[0].status,'Pending');assert.equal(h.rows[0].attempts,0);assert.equal(h.rows[0].totalAttempts,1);
  h.settings.NOTIFICATIONS_ENABLED='true';h.flags.mailThrows=false;h.run();assert.equal(h.rows[0].status,'Sent');assert.equal(h.rows[0].totalAttempts,2);
  h.settings.NOTIFICATIONS_ENABLED='false';assert.throws(()=>h.c.resolveNotification_(uuid(1),'retry','CONFIRMED_NOT_SENT'));
});
test('operator can mark confirmed acceptance without sending another email; active lease cannot be overridden',()=>{
  const h=harness();h.enqueue();h.c.ncClaimNotification_(h.services,h.c.ncNotificationConfig_(h.properties));h.settings.NOTIFICATIONS_ENABLED='false';assert.throws(()=>h.c.resolveNotification_(uuid(1),'mark_sent','CONFIRMED_SENT'));
  h.clock.now+=h.c.NC_NOTIFICATION_LEASE_MS_+1;h.c.resolveNotification_(uuid(1),'mark_sent','CONFIRMED_SENT');assert.equal(h.rows[0].status,'Sent');assert.equal(h.rows[0].error,'operator_confirmed_sent');assert.equal(h.mails.length,0);
});

function googleSheets(h) {
  const makeSheet=(rows=[])=>({rows:rows.map(r=>Array.from(r)),frozen:0,getLastRow(){return this.rows.length;},getLastColumn(){return Math.max(0,...this.rows.map(r=>r.length));},getMaxRows(){return 1000;},setFrozenRows(n){this.frozen=n;},
    getRange(row,col,height,width){const sheet=this;return {getValues(){return Array.from({length:height},(_,r)=>Array.from({length:width},(_,c)=>sheet.rows[row+r-1]?.[col+c-1]??''));},setNumberFormat(){return this;},setValues(values){for(let r=0;r<height;r++){sheet.rows[row+r-1]??=[];for(let c=0;c<width;c++)sheet.rows[row+r-1][col+c-1]=values[r][c];}return this;}};}
  });
  const tabs=Object.fromEntries(Array.from(h.c.NC_TABS_).map(name=>[name,makeSheet([h.c.NC_HEADERS_])]));
  const book={getSheetByName:name=>tabs[name]??null,insertSheet(name){return tabs[name]=makeSheet();}};
  h.c.PropertiesService={getScriptProperties:()=>h.properties};h.c.LockService={getScriptLock:h.services.lock};h.c.SpreadsheetApp={openById:()=>book,flush:h.services.flush};
  return {tabs,book,makeSheet};
}
test('setup adds only outbox schema, preserves existing 23-column enquiry records, never enables sending',()=>{
  const h=harness({NOTIFICATIONS_ENABLED:'false',NOTIFICATION_START_UTC:null}),g=googleSheets(h);g.tabs['Purchase Enquiries'].rows.push(saved());const before=JSON.stringify(g.tabs['Purchase Enquiries'].rows);
  h.c.setupNotificationOutbox_('2026-11-03T12:00:00.000Z');assert.equal(h.settings.NOTIFICATIONS_ENABLED,'false');assert.equal(JSON.stringify(g.tabs['Purchase Enquiries'].rows),before);assert.deepEqual(g.tabs['Notification Outbox'].rows[0],Array.from(h.c.NC_OUTBOX_HEADERS_));assert.equal(g.tabs['Notification Outbox'].frozen,1);
  h.c.setupNotificationOutbox_('2020-01-01T00:00:00Z');assert.equal(h.settings.NOTIFICATION_START_UTC,'2026-11-03T12:00:00.000Z');delete g.tabs['Notification Outbox'];assert.throws(()=>h.c.setupNotificationOutbox_());assert.ok(!g.tabs['Notification Outbox']);
});
test('actual Sheet adapter preserves schemas and round-trips typed outbox metadata',()=>{
  const h=harness({NOTIFICATION_START_UTC:null}),g=googleSheets(h);g.tabs['General Contact'].rows.push(saved(1,'general'));h.c.setupNotificationOutbox_('2026-11-03T12:00:00Z');
  const store=h.c.ncNotificationStore_('synthetic');h.locked(()=>h.c.ncEnsureNotifications_(store,store.sources(),h.services));assert.equal(store.entries()[0].status,'Pending');assert.equal(store.entries()[0].attempts,0);assert.equal(store.sources()[0].length,23);
  const entry=store.entries()[0];entry.status='Failed';h.locked(()=>store.write(entry));assert.equal(store.entries()[0].status,'Failed');
  g.tabs['General Contact'].rows[0].pop();assert.throws(()=>store.sources());g.tabs['Notification Outbox'].rows[0][0]='wrong';assert.throws(()=>h.c.ncNotificationStore_('synthetic'));
});
test('trigger installation is idempotent, authorizes without sending and removes only owned notification handlers',()=>{
  const h=harness();let created=0,quotaCalls=0;const triggers=[{getHandlerFunction:()=> 'unrelatedHandler'}];h.c.MailApp={getRemainingDailyQuota(){quotaCalls++;return 100;},sendEmail(){assert.fail('installer must not send');}};
  h.c.ScriptApp={getProjectTriggers:()=>triggers,newTrigger(handler){assert.equal(handler,'processNotificationOutbox_');return {timeBased(){return this;},everyMinutes(n){assert.equal(n,1);return this;},create(){created++;triggers.push({getHandlerFunction:()=>handler});}};},deleteTrigger(trigger){triggers.splice(triggers.indexOf(trigger),1);}};
  h.c.installNotificationWorker_();h.c.installNotificationWorker_();assert.equal(created,1);assert.equal(quotaCalls,2);h.c.removeNotificationWorker_();assert.equal(triggers.length,1);assert.equal(triggers[0].getHandlerFunction(),'unrelatedHandler');
});
test('outbox metadata uses the existing formula-safe cell writer for unusual valid staff mailboxes',()=>{
  const h=harness({NOTIFICATION_START_UTC:null}),g=googleSheets(h);h.c.setupNotificationOutbox_('2026-11-03T12:00:00Z');const store=h.c.ncNotificationStore_('synthetic');h.locked(()=>h.c.ncEnsureNotifications_(store,[saved()],h.services));const entry=store.entries()[0];entry.recipient='=staff@example.invalid';h.locked(()=>store.write(entry));assert.equal(g.tabs['Notification Outbox'].rows[1][12],"'=staff@example.invalid");
});
test('only doGet/doPost are public; worker, reconciliation, setup and operator tools remain private',()=>{
  const functions=[...source.matchAll(/^function (\w+)\(/gm)].map(m=>m[1]);assert.deepEqual(functions.filter(name=>!name.endsWith('_')),['doGet','doPost']);
});
test('actual customer service adapter queues only eligible saved rows and shares the existing lock',()=>{
  const h=harness();googleSheets(h);h.locked(()=>h.c.ncServices_().queueNotification('synthetic',saved()));assert.equal(h.rows.length,1);
  h.locked(()=>h.c.ncServices_().queueNotification('synthetic',saved(2,'general','2026-11-02T12:00:00Z')));assert.equal(h.rows.length,1);
});
test('busy completion after MailApp acceptance holds the claim instead of resending',()=>{
  const h=harness();h.enqueue();h.flags.onSend=()=>{h.flags.busy=true;};assert.equal(h.run().status,'outcome_unrecorded');assert.equal(h.rows[0].status,'Sending');h.flags.busy=false;h.clock.now+=h.c.NC_NOTIFICATION_LEASE_MS_+1;h.run();assert.equal(h.rows[0].status,'Uncertain');assert.equal(h.mails.length,1);
});
test('completion waits through a normal concurrent customer write and records acceptance once',()=>{
  const h=harness();h.enqueue();const original=h.services.lock;h.flags.onSend=()=>{h.flags.busy=true;};let waited=false;
  h.services.lock=()=>{const lock=original();return {...lock,tryLock(ms){if(h.flags.busy && ms===10000){waited=true;h.clock.now+=3000;h.flags.busy=false;}return lock.tryLock();}};};
  assert.equal(h.run().accepted,1);assert.ok(waited);assert.equal(h.rows[0].status,'Sent');assert.equal(h.mails.length,1);h.run();assert.equal(h.mails.length,1);
});
test('pre-send contention can record its safe Pending state after the customer lock releases',()=>{
  const h=harness();h.enqueue();const original=h.services.lock;h.services.quota=()=>{h.flags.busy=true;return 100;};
  h.services.lock=()=>{const lock=original();return {...lock,tryLock(ms){if(h.flags.busy && ms===10000){h.clock.now+=3000;h.flags.busy=false;}return lock.tryLock();}};};
  h.run();assert.equal(h.rows[0].status,'Pending');assert.equal(h.rows[0].error,'pre_send_busy');assert.equal(h.mails.length,0);h.services.quota=()=>100;h.clock.now=Date.parse(h.rows[0].nextRetry);assert.equal(h.run().accepted,1);assert.equal(h.mails.length,1);
});
test('worker fences a lease that expires during preflight, before calling MailApp',()=>{
  const h=harness();h.enqueue();h.services.quota=()=>{h.clock.now+=h.c.NC_NOTIFICATION_LEASE_MS_+1;return 100;};assert.equal(h.run().status,'claim_not_current');assert.equal(h.mails.length,0);h.services.quota=()=>100;h.run();assert.equal(h.rows[0].status,'Sent');assert.equal(h.rows[0].attempts,2);assert.equal(h.mails.length,1);
});
test('quota recovery sends exactly once after the recorded delay',()=>{
  const h=harness();h.enqueue();h.flags.quota=0;h.run();h.flags.quota=1;h.run();assert.equal(h.mails.length,0);h.clock.now=Date.parse(h.rows[0].nextRetry);h.run();h.run();assert.equal(h.rows[0].status,'Sent');assert.equal(h.mails.length,1);
});
test('stored receipt header injection is rejected before MailApp',()=>{
  const h=harness(),row=saved();row[1]+='\n';h.sources.push(row);assert.equal(h.run().status,'source_corrupt');assert.equal(h.mails.length,0);
});
test('missing saved enquiry is held Failed, never automatically reconstructed or resent',()=>{
  const h=harness();h.enqueue();h.sources.length=0;assert.equal(h.run().status,'source_missing');assert.equal(h.rows[0].status,'Failed');assert.equal(h.rows[0].error,'source_missing');assert.equal(h.rows[0].attempts,1);
  h.sources.push(saved());h.clock.now+=86400000;h.run();assert.equal(h.rows[0].status,'Failed');assert.equal(h.mails.length,0);
  h.settings.NOTIFICATIONS_ENABLED='false';h.c.resolveNotification_(uuid(1),'retry','CONFIRMED_NOT_SENT');h.settings.NOTIFICATIONS_ENABLED='true';h.run();assert.equal(h.rows[0].status,'Sent');assert.equal(h.mails.length,1);assert.equal(h.rows[0].totalAttempts,2);
});
for(const price of ['', ' ', null, false, 'not a price', -1, 1.5])test(`corrupt saved purchase price requires repair, not delivery retry: ${JSON.stringify(price)}`,()=>{
  const h=harness();h.enqueue();h.sources[0][15]=price;const before=JSON.stringify(h.sources);assert.equal(h.run().status,'source_corrupt');assert.equal(h.rows[0].status,'Failed');assert.equal(h.rows[0].error,'source_corrupt');h.clock.now+=86400000;h.run();assert.equal(h.mails.length,0);assert.equal(JSON.stringify(h.sources),before);
});
for(const index of [6,7,8,9,14,16,17])test(`missing saved notification field ${index} fails closed`,()=>{
  const h=harness();h.enqueue();h.sources[0][index]='';assert.equal(h.run().status,'source_corrupt');assert.equal(h.rows[0].status,'Failed');assert.equal(h.mails.length,0);
});
test('duplicate or conflicting source introduced after claim is not an email delivery failure',()=>{
  for(const conflict of [false,true]){
    const h=harness();h.enqueue();h.services.quota=()=>{if(conflict)h.sources[0][1]='NC-'+uuid(99);else h.sources.push(saved());return 100;};assert.equal(h.run().status,'source_corrupt');assert.equal(h.rows[0].status,'Failed');assert.equal(h.rows[0].error,'source_corrupt');assert.equal(h.mails.length,0);
  }
});
test('source scan failure is reported separately before claim, without consuming delivery attempts',()=>{
  const h=harness();h.enqueue();h.flags.sourceFail=true;assert.equal(h.run().status,'source_unavailable');assert.equal(h.rows[0].status,'Pending');assert.equal(h.rows[0].attempts,0);assert.equal(h.mails.length,0);h.flags.sourceFail=false;assert.equal(h.run().accepted,1);
});
test('repeated post-claim source read failures exhaust the existing bounded retry cycle',()=>{
  const h=harness();h.enqueue();for(let attempt=1;attempt<=5;attempt++){
    h.flags.failSourceRead=h.flags.sourceReads+2;h.run();assert.equal(h.rows[0].attempts,attempt);assert.equal(h.rows[0].error,'source_unavailable');if(attempt<5)h.clock.now=Date.parse(h.rows[0].nextRetry);
  }
  assert.equal(h.rows[0].status,'Failed');h.flags.failSourceRead=0;h.clock.now+=86400000;h.run();assert.equal(h.mails.length,0);
});
test('expired Sending becomes Uncertain even when source reconciliation fails',()=>{
  const h=harness();h.enqueue();const config=h.c.ncNotificationConfig_(h.properties),claim=h.c.ncClaimNotification_(h.services,config);h.c.ncNotificationCanSend_(h.services,config,claim);h.clock.now+=h.c.NC_NOTIFICATION_LEASE_MS_+1;h.sources[0][1]='bad receipt';assert.equal(h.run().status,'source_corrupt');assert.equal(h.rows[0].status,'Uncertain');assert.equal(h.rows[0].error,'worker_interrupted');h.sources[0]=saved();h.run();assert.equal(h.mails.length,0);assert.equal(h.rows[0].status,'Uncertain');
});
test('source failure with busy completion reports unrecorded outcome, not a completed retry',()=>{
  const h=harness();h.enqueue();h.services.quota=()=>{h.sources.length=0;h.flags.busy=true;return 100;};assert.equal(h.run().status,'outcome_unrecorded');assert.equal(h.rows[0].status,'Sending');assert.equal(h.mails.length,0);h.flags.busy=false;h.services.quota=()=>100;h.clock.now+=h.c.NC_NOTIFICATION_LEASE_MS_+1;h.run();assert.equal(h.rows[0].status,'Failed');assert.equal(h.rows[0].error,'source_missing');assert.equal(h.mails.length,0);
});
test('source failure with failed status persistence holds the lease without sending',()=>{
  const h=harness();h.enqueue();h.sources.length=0;h.flags.writeFail='Failed';assert.equal(h.run().status,'storage_unavailable');assert.equal(h.rows[0].status,'Sending');assert.equal(h.mails.length,0);h.flags.writeFail=null;h.clock.now+=h.c.NC_NOTIFICATION_LEASE_MS_+1;h.run();assert.equal(h.rows[0].status,'Failed');assert.equal(h.rows[0].error,'source_missing');assert.equal(h.mails.length,0);
});
test('busy pre-send lock defers safely and an expired pre-send lease recovers once',()=>{
  const h=harness();h.enqueue();const config=h.c.ncNotificationConfig_(h.properties);h.services.quota=()=>{h.flags.busy=true;return 100;};assert.equal(h.run().status,'pre_send_deferred');assert.equal(h.rows[0].error,'pre_send');assert.equal(h.mails.length,0);h.flags.busy=false;h.services.quota=()=>100;h.run();assert.equal(h.mails.length,0);h.clock.now+=h.c.NC_NOTIFICATION_LEASE_MS_+1;h.run();assert.equal(h.rows[0].status,'Sent');assert.equal(h.rows[0].attempts,2);h.run();assert.equal(h.mails.length,1);
  assert.equal(h.c.ncNotificationCanSend_(h.services,config,{id:uuid(1),claim:'obsolete'}),false);
});
test('transient pre-send contention returns Pending with the existing backoff',()=>{
  const h=harness();h.enqueue();const original=h.services.lock;let calls=0;h.services.lock=()=>{const lock=original();return {...lock,tryLock(){if(++calls===2)return false;return lock.tryLock();}};};h.run();assert.equal(h.rows[0].status,'Pending');assert.equal(h.rows[0].error,'pre_send_busy');assert.equal(Date.parse(h.rows[0].nextRetry)-h.clock.now,60000);assert.equal(h.mails.length,0);h.clock.now=Date.parse(h.rows[0].nextRetry);h.run();assert.equal(h.rows[0].status,'Sent');assert.equal(h.mails.length,1);
});
test('MailApp can only be entered after a durable send_started boundary',()=>{
  const h=harness();h.enqueue();h.flags.onSend=()=>{assert.equal(h.rows[0].error,'send_started');assert.ok(h.rows[0].claim);};assert.equal(h.run().accepted,1);assert.equal(h.mails.length,1);
});
for(const flag of ['writeFailError','persistWriteFailError'])test(`send-boundary ${flag} never calls MailApp or guesses acceptance`,()=>{
  const h=harness();h.enqueue();h.flags[flag]='send_started';assert.equal(h.run().status,'storage_unavailable');assert.equal(h.mails.length,0);h.flags[flag]=null;h.clock.now+=h.c.NC_NOTIFICATION_LEASE_MS_+1;h.run();assert.equal(h.rows[0].status,flag==='persistWriteFailError'?'Uncertain':'Sent');assert.equal(h.mails.length,flag==='persistWriteFailError'?0:1);
});
test('legacy Sending claims with no phase remain Uncertain and never auto-retry',()=>{
  const h=harness();h.enqueue();h.c.ncClaimNotification_(h.services,h.c.ncNotificationConfig_(h.properties));h.rows[0].error='';h.clock.now+=h.c.NC_NOTIFICATION_LEASE_MS_+1;h.run();assert.equal(h.rows[0].status,'Uncertain');assert.equal(h.mails.length,0);
});
test('expired pre-send recovery preserves five-attempt limit and fences the old token',()=>{
  const h=harness();h.enqueue();const config=h.c.ncNotificationConfig_(h.properties);let first;for(let i=0;i<5;i++){const claim=h.c.ncClaimNotification_(h.services,config);first??=claim;assert.ok(claim);h.clock.now+=h.c.NC_NOTIFICATION_LEASE_MS_+1;}assert.equal(h.c.ncClaimNotification_(h.services,config),null);assert.equal(h.rows[0].status,'Failed');assert.equal(h.rows[0].attempts,5);assert.equal(h.c.ncNotificationCanSend_(h.services,config,first),false);assert.equal(h.mails.length,0);
});
test('reclaimed pre-send lease fences the old worker and permits only one send boundary',()=>{
  const h=harness();h.enqueue();const config=h.c.ncNotificationConfig_(h.properties),old=h.c.ncClaimNotification_(h.services,config);h.clock.now+=h.c.NC_NOTIFICATION_LEASE_MS_+1;const current=h.c.ncClaimNotification_(h.services,config);assert.notEqual(current.claim,old.claim);assert.equal(h.c.ncNotificationCanSend_(h.services,config,old),false);assert.equal(h.c.ncFinishNotification_(h.services,config,old,'Sent',''),false);assert.equal(h.c.ncNotificationCanSend_(h.services,config,current),true);assert.equal(h.c.ncNotificationCanSend_(h.services,config,current),false);assert.equal(h.mails.length,0);
});
test('actual Sheet adapter distinguishes missing/corrupt tabs from transient read errors',()=>{
  for(const fault of ['missing','schema','read']){
    const h=harness({NOTIFICATION_START_UTC:null}),g=googleSheets(h);h.c.setupNotificationOutbox_('2026-11-03T12:00:00Z');h.services.store=h.c.ncNotificationStore_;
    if(fault==='missing')delete g.tabs['General Contact'];if(fault==='schema')g.tabs['General Contact'].rows[0][0]='wrong';if(fault==='read')g.tabs['General Contact'].getRange=()=>{throw Error('private Google read error');};
    assert.equal(h.run().status,{missing:'source_missing',schema:'source_corrupt',read:'source_unavailable'}[fault]);assert.equal(h.mails.length,0);
  }
});
test('full reconciliation happens once per batch; fresh source preflight remains bounded to five claims',()=>{
  const h=harness();for(let n=1;n<=10;n++)h.enqueue(saved(n));assert.equal(h.run().accepted,5);assert.equal(h.flags.sourceReads,6);assert.equal(h.rows.filter(r=>r.status==='Pending').length,5);
});
test('trigger monitoring emits only safe status/counts, not recipient or error details',()=>{
  const h=harness({NOTIFICATION_EMAIL:'private-invalid-recipient'}),logs=[];h.c.console={log:message=>logs.push(message)};const result=h.c.processNotificationOutbox_();assert.equal(result.status,'invalid_configuration');assert.match(logs[0],/invalid_configuration/);assert.doesNotMatch(logs[0],/private-invalid-recipient|synthetic@example|synthetic-private-sheet/);
  h.c.ncNotificationServices_=()=>{throw Error('private failure');};assert.equal(h.c.processNotificationOutbox_().status,'worker_unavailable');assert.doesNotMatch(logs.join('\n'),/private failure/);
});
test('missing cutover prevents automatic worker activation, without invalidating saved enquiries',()=>{
  const h=harness({NOTIFICATION_START_UTC:null});assert.equal(h.customer().code,'success');assert.equal(h.run().status,'invalid_configuration');assert.equal(h.mails.length,0);
});
test('manifest adds only MailApp and trigger management scopes to existing spreadsheet authorization',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../apps-script/appsscript.json',import.meta.url),'utf8'));
  assert.deepEqual(manifest.oauthScopes,['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/script.send_mail','https://www.googleapis.com/auth/script.scriptapp']);assert.equal(manifest.exceptionLogging,'NONE');
});
