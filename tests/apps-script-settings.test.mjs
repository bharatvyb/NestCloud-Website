import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
function harness(extra={}) {
 const legacy={SPREADSHEET_ID:'synthetic-only-spreadsheet-id',ALLOW_SUBMISSIONS:'true',CONSENT_VERSION:'enquiry-v1',RETURN_URL:'https://bharatvyb.github.io/NestCloud-Website/',NOTIFICATIONS_ENABLED:'false',NOTIFICATION_START_UTC:'2026-11-03T09:48:40.009Z',NOTIFICATION_EMAIL:'staff@example.invalid',...extra};
 const tabs={},calls={reads:0,flush:0,release:0};
 function make(rows=[]) {return {rows:rows.map(r=>Array.from(r)),getLastColumn(){return Math.max(0,...this.rows.map(r=>r.length))},getLastRow(){return this.rows.length},setFrozenRows(){},setColumnWidth(){},autoResizeRows(){},getRange(row,col,height,width){const sheet=this;return {getValues(){calls.reads++;return Array.from({length:height},(_,r)=>Array.from({length:width},(_,c)=>sheet.rows[row+r-1]?.[col+c-1]??''))},setNumberFormat(){return this},setWrap(){return this},setValues(values){for(let r=0;r<height;r++){sheet.rows[row+r-1]??=[];for(let c=0;c<width;c++)sheet.rows[row+r-1][col+c-1]=values[r][c]}return this}}}}}
 const book={getSheetByName:name=>tabs[name]??null,insertSheet(name){return tabs[name]=make()}};
 const c=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:k=>legacy[k]??null})},SpreadsheetApp:{openById:()=>book,flush(){calls.flush++}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){calls.release++}})}});vm.runInContext(code,c);
 const migrate=()=>c.migrateMasterSettings_();
 function set(key,value){const rows=tabs.MasterSettings.rows,row=rows.find(r=>r[0]===key);if(row)row[1]=value;else rows.push([key,value])}
 return {c,tabs,legacy,calls,make,migrate,set};
}
test('migration copies exact legacy values/defaults, adds approved stock switches and both-column schema',()=>{
 const h=harness(),before=JSON.stringify(h.legacy);h.tabs['Purchase Enquiries']=h.make([['untouched']]);h.tabs['Notification Outbox']=h.make([['Sent history']]);
 const result=h.migrate();assert.equal(result.added,26);assert.equal(JSON.stringify(h.legacy),before);assert.equal(h.c.getSetting_('NOTIFICATION_START_UTC',null),h.legacy.NOTIFICATION_START_UTC);
 assert.deepEqual(h.tabs.MasterSettings.rows[0],['Key','Value']);assert.equal(h.tabs.SettingsWiki.rows.length,28);assert.equal(h.c.getSetting_('NOTIFICATIONS_ENABLED',null),'false');
 for(const key of ['STOCK_512GB','STOCK_1TB','STOCK_BACKUP_PLUS'])assert.equal(h.c.getSetting_(key,null),'true');
 assert.deepEqual(h.tabs['Purchase Enquiries'].rows,[['untouched']]);assert.deepEqual(h.tabs['Notification Outbox'].rows,[['Sent history']]);
 h.set('STOCK_1TB',false);assert.equal(h.migrate().added,0);assert.equal(h.c.getSetting_('STOCK_1TB',null),'false');assert.equal(JSON.stringify(h.legacy),before);
});
test('runtime ignores retained properties, caches within execution, observes edits in the next execution',()=>{
 const h=harness();h.migrate();h.calls.reads=0;assert.equal(h.c.getSetting_('CONSENT_VERSION',null),'enquiry-v1');h.c.getSetting_('ALLOW_SUBMISSIONS',null);assert.equal(h.calls.reads,1);
 h.legacy.CONSENT_VERSION='legacy-obsolete';h.set('CONSENT_VERSION','enquiry-v2');assert.equal(h.c.getSetting_('CONSENT_VERSION',null),'enquiry-v1');h.c.ncSettingsCache_=null;assert.equal(h.c.getSetting_('CONSENT_VERSION',null),'enquiry-v2');
 delete h.tabs.MasterSettings;h.c.ncSettingsCache_=null;assert.throws(()=>h.c.getSetting_('CONSENT_VERSION',null));assert.equal(h.c.getSetting_('NOTIFICATIONS_ENABLED',null),'false');
});
test('kill switch bypasses execution cache, preserves false/zero and fails closed on malformed data',()=>{
 const h=harness();h.migrate();h.set('NOTIFICATIONS_ENABLED',true);assert.equal(h.c.getSetting_('NOTIFICATIONS_ENABLED',null),'true');h.set('NOTIFICATIONS_ENABLED',false);assert.equal(h.c.getSetting_('NOTIFICATIONS_ENABLED',null),'false');h.set('NOTIFICATIONS_ENABLED','yes');assert.equal(h.c.getSetting_('NOTIFICATIONS_ENABLED',null),'false');
 h.set('EMAIL_COOLDOWN_SECONDS',0);assert.equal(h.c.getSetting_('EMAIL_COOLDOWN_SECONDS',60),'0');h.set('STOCK_512GB',false);h.c.ncSettingsCache_=null;assert.equal(h.c.getSetting_('STOCK_512GB',true),'false');
});
test('missing optional switches default disabled; invalid notification config does not disable enquiry intake',()=>{
 const h=harness();h.migrate();h.set('NOTIFICATION_EMAIL','invalid mailbox');h.tabs.MasterSettings.rows=h.tabs.MasterSettings.rows.filter(r=>!['NOTIFICATIONS_ENABLED','STOCK_1TB'].includes(r[0]));
 assert.equal(h.c.ncConfig_(h.c.ncSettingsProperties_()).consentVersion,'enquiry-v1');assert.equal(h.c.ncPublicSettings_(h.c.ncSettingsProperties_()).stock['1tb'],false);assert.notEqual(h.c.getSetting_('NOTIFICATIONS_ENABLED',null),'true');assert.throws(()=>h.c.ncNotificationConfig_(h.c.ncSettingsProperties_()));
});
test('migration validates all candidates before writing, preserves cutover, rejects schema conflicts',()=>{
 for(const extra of [{CONSENT_VERSION:null},{NOTIFICATION_START_UTC:null},{NOTIFICATIONS_ENABLED:'true'},{NOTIFICATIONS_ENABLED:'TRUE'},{NOTIFICATIONS_ENABLED:'yes'},{ALLOW_SUBMISSIONS:'TRUE'},{EMAIL_COOLDOWN_SECONDS:'-1'},{RETURN_URL:'https://evil.invalid/'}]){const h=harness(extra);assert.throws(h.migrate);assert.equal(h.tabs.MasterSettings,undefined)}
 const h=harness();h.tabs.SettingsWiki=h.make([['Existing unrelated data']]);assert.throws(h.migrate);assert.equal(h.tabs.MasterSettings,undefined);
});
test('reader rejects duplicate/unknown keys, invalid types and ranges without falling back to legacy',()=>{
 for(const [key,value] of [['CONSENT_VERSION','bad consent'],['ALLOW_SUBMISSIONS','yes'],['STOCK_1TB','1'],['MAX_TOTAL_ROWS',50001],['EMAIL_COOLDOWN_SECONDS',''],['RETURN_URL','https://evil.invalid/']]){const h=harness();h.migrate();h.set(key,value);assert.throws(()=>h.c.getSetting_(key,null))}
 for(const row of [['CONSENT_VERSION','duplicate'],['SPREADSHEET_ID','private'],['__proto__','bad']]){const h=harness();h.migrate();h.tabs.MasterSettings.rows.push(row);assert.throws(()=>h.c.getSetting_('CONSENT_VERSION',null))}
});
test('public JSON is an exact allowlist, never accepts a caller-selected private key',()=>{
 const h=harness();h.migrate();h.c.ContentService={MimeType:{JSON:'json'},createTextOutput(text){return {text,setMimeType(){return this}}}};
 const output=h.c.doGet({parameter:{resource:'settings',key:'NOTIFICATION_EMAIL'}}),data=JSON.parse(output.text);
 assert.deepEqual(Object.keys(data).sort(),['available','banner','checkout','consentVersion','forms','maintenance','returnUrl','stock']);assert.equal(data.available,true);assert.deepEqual(data.stock,{'512gb':true,'1tb':true,backup:true});assert.deepEqual(data.forms,{purchase:true,general:true,support:true});assert.deepEqual(data.banner,{enabled:false,message:'Welcome to NestCloud!',link:''});assert.deepEqual(data.maintenance,{enabled:false,message:'Website temporarily unavailable.'});assert.doesNotMatch(output.text,/staff@|SPREADSHEET|NOTIFICATION|COOLDOWN|2026-11/);
 delete h.tabs.MasterSettings;h.c.ncSettingsCache_=null;assert.deepEqual(JSON.parse(h.c.doGet({parameter:{resource:'settings'}}).text),{available:false});
});
for(const [type,key] of [['purchase','PURCHASE_FORM_ENABLED'],['general','CONTACT_FORM_ENABLED'],['support','SUPPORT_FORM_ENABLED']])test(`public ${key} requires an explicit valid true value`,()=>{
 const h=harness();h.migrate();h.tabs.MasterSettings.rows=h.tabs.MasterSettings.rows.filter(r=>r[0]!==key);
 assert.equal(h.c.ncPublicSettings_(h.c.ncSettingsProperties_()).forms[type],false,'missing key is disabled');
 for(const value of ['', 'yes', '1', 1, null]){h.set(key,value);h.c.ncSettingsCache_=null;h.c.ContentService={MimeType:{JSON:'json'},createTextOutput(text){return {text,setMimeType(){return this}}}};assert.deepEqual(JSON.parse(h.c.doGet({parameter:{resource:'settings'}}).text),{available:false},'malformed configuration fails closed');}
 for(const value of [true,'TRUE','true']){h.set(key,value);h.c.ncSettingsCache_=null;assert.equal(h.c.ncPublicSettings_(h.c.ncSettingsProperties_()).forms[type],true)}
 h.set(key,false);h.c.ncSettingsCache_=null;assert.equal(h.c.ncPublicSettings_(h.c.ncSettingsProperties_()).forms[type],false);
});
test('existing 13-key migration gains V1 and disabled checkout defaults, preserves edits and refreshes Sheet wiki',()=>{
 const h=harness();h.migrate();const oldKeys=Array.from(h.c.NC_SETTING_SPECS_).slice(0,13).map(s=>s[0]);h.tabs.MasterSettings.rows=h.tabs.MasterSettings.rows.filter(r=>r[0]==='Key'||oldKeys.includes(r[0]));h.set('STOCK_1TB',false);const original=JSON.stringify(h.tabs.MasterSettings.rows),legacy=JSON.stringify(h.legacy);
 assert.equal(h.migrate().added,13);assert.equal(JSON.stringify(h.tabs.MasterSettings.rows.slice(0,14)),original);assert.equal(JSON.stringify(h.legacy),legacy);assert.equal(h.c.getSetting_('PURCHASE_FORM_ENABLED',null),'true');assert.equal(h.c.getSetting_('BANNER_LINK',null),'');assert.equal(h.tabs.SettingsWiki.rows.length,28);assert.equal(h.migrate().added,0);
});
test('V1 switches/messages and HTTPS links validate without exposing private settings',()=>{
 for(const [key,value] of [['PURCHASE_FORM_ENABLED','yes'],['CONTACT_FORM_ENABLED',1],['SUPPORT_FORM_ENABLED',''],['SITE_MAINTENANCE','maybe'],['BANNER_ENABLED','on'],['BANNER_MESSAGE','x'.repeat(501)],['MAINTENANCE_MESSAGE','bad\u0000'],['BANNER_LINK','javascript:alert(1)'],['BANNER_LINK','http://example.invalid'],['BANNER_LINK','https://user:pass@example.invalid/'],['BANNER_LINK','https://example.invalid\\@evil.invalid/'],['BANNER_LINK','https://example.invalid:99999/']]){const h=harness();h.migrate();h.set(key,value);assert.throws(()=>h.c.getSetting_(key,null),`${key}: ${value}`)}
 const h=harness();h.migrate();h.set('BANNER_LINK','https://example.invalid/help?q=1#info');h.set('BANNER_MESSAGE','<b>Plain text</b>');assert.equal(h.c.getSetting_('BANNER_MESSAGE',null),'<b>Plain text</b>');assert.equal(h.c.getSetting_('BANNER_LINK',null),'https://example.invalid/help?q=1#info');
});
test('checkout migration adds only five disabled public settings to V1; rejects arbitrary provider URLs',()=>{
 const h=harness();h.migrate();h.tabs.MasterSettings.rows=h.tabs.MasterSettings.rows.filter(r=>!r[0].startsWith('CHECKOUT_'));const before=JSON.stringify(h.tabs.MasterSettings.rows),legacy=JSON.stringify(h.legacy);assert.equal(h.migrate().added,5);assert.equal(JSON.stringify(h.tabs.MasterSettings.rows.slice(0,22)),before);assert.equal(JSON.stringify(h.legacy),legacy);assert.equal(h.c.ncPublicSettings_(h.c.ncSettingsProperties_()).checkout.enabled,false);
 for(const [key,value] of [['CHECKOUT_MODE','invalid'],['CHECKOUT_ENABLED','yes'],['CHECKOUT_512GB_URL','https://evil.invalid/'],['CHECKOUT_1TB_URL','https://pages.razorpay.com/stores/st_A/product/li_B?amount=1'],['CHECKOUT_BACKUP_PLUS_URL','http://pages.razorpay.com/stores/st_A/product/li_B']])assert.throws(()=>h.c.ncSettingValue_(key,value));
 assert.equal(h.c.ncSettingValue_('CHECKOUT_512GB_URL','https://pages.razorpay.com/stores/st_Test/product/li_Valid'),'https://pages.razorpay.com/stores/st_Test/product/li_Valid');
});
