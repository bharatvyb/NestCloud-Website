/** NestCloud enquiries. Public entry points are doGet/doPost only. */
var NC_CATALOGUE_ = Object.freeze({
  '512gb': { name: '512 GB', price: 49900, personal: '512 GB', backup: '' },
  '1tb': { name: '1 TB', price: 59900, personal: '1 TB', backup: '' },
  'backup': { name: '1 TB + Backup Plus', price: 81900, personal: '1 TB', backup: '1 TB' }
});
var NC_TABS_ = ['Purchase Enquiries', 'General Contact', 'Technical Support'];
var NC_HEADERS_ = ['Submission ID', 'Enquiry reference', 'Received UTC', 'Payload SHA256', 'Email SHA256', 'Type', 'Full name', 'Email', 'Mobile', 'Delivery PIN', 'Message', 'Consent version', 'Consent received UTC', 'Configuration ID', 'Configuration', 'Product price INR', 'Currency', 'Personal storage', 'Backup SSD', 'Order reference', 'Device serial', 'Issue category', 'Status'];

// Only the spreadsheet bootstrap remains in Script Properties at runtime.
var NC_SETTING_SPECS_ = [
  ['ALLOW_SUBMISSIONS','Enquiry intake switch','TRUE/FALSE','false','All forms','Public'],
  ['CONSENT_VERSION','Approved consent version','1–40 letters/digits/._- ',null,'All forms','Public'],
  ['RETURN_URL','Confirmation return destination','Approved NestCloud URL','https://nestcloud.in/','Confirmation','Public'],
  ['NOTIFICATION_EMAIL','Single staff recipient','One valid email','nestcloud@bharatvyb.com','Notification worker','Private'],
  ['NOTIFICATIONS_ENABLED','Notification dispatch kill switch','TRUE/FALSE','false','Notification worker','Private'],
  ['NOTIFICATION_START_UTC','Preserved notification eligibility cutover','UTC ISO timestamp',null,'Outbox reconciliation','Private'],
  ['EMAIL_COOLDOWN_SECONDS','Per-email submission cooldown','Integer 0–86400','60','Submission validation','Private'],
  ['GLOBAL_WINDOW_SECONDS','Global submission window','Integer 60–86400','600','Submission validation','Private'],
  ['GLOBAL_MAX_SUBMISSIONS','Accepted submissions per window','Integer 1–1000','30','Submission validation','Private'],
  ['MAX_TOTAL_ROWS','Enquiry capacity safety cap','Integer 1–50000','10000','Submission validation','Private'],
  ['STOCK_512GB','512 GB purchase availability','TRUE/FALSE','false','Purchase form/backend','Public'],
  ['STOCK_1TB','1 TB purchase availability','TRUE/FALSE','false','Purchase form/backend','Public'],
  ['STOCK_BACKUP_PLUS','Backup Plus purchase availability','TRUE/FALSE','false','Purchase form/backend','Public']
];
var ncSettingsCache_ = null;
function ncStockKey_(id) { return {'512gb':'STOCK_512GB','1tb':'STOCK_1TB',backup:'STOCK_BACKUP_PLUS'}[id]; }
function ncSettingsSheet_() {
  var id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if(!id || !/^[a-zA-Z0-9_-]{20,200}$/.test(id))throw new Error('Settings bootstrap');
  return SpreadsheetApp.openById(id).getSheetByName('MasterSettings');
}
function ncReadSettings_(sheet) {
  if(!sheet || sheet.getLastColumn()!==2 || sheet.getLastRow()<1)throw new Error('Settings schema');
  var rows=sheet.getRange(1,1,sheet.getLastRow(),2).getValues();
  if(JSON.stringify(rows.shift())!==JSON.stringify(['Key','Value']))throw new Error('Settings schema');
  var settings=Object.create(null);
  rows.forEach(function(row){
    if(row[0]==='' && row[1]==='')return;
    var key=row[0];
    if(!NC_SETTING_SPECS_.some(function(spec){return spec[0]===key;}) || Object.prototype.hasOwnProperty.call(settings,key))throw new Error('Settings key');
    settings[key]=row[1];
  });
  return settings;
}
function ncSettingValue_(key,value) {
  var raw=String(value);
  if(['ALLOW_SUBMISSIONS','NOTIFICATIONS_ENABLED','STOCK_512GB','STOCK_1TB','STOCK_BACKUP_PLUS'].indexOf(key)>=0) {
    if(!/^(true|false)$/i.test(raw))throw new Error('Settings boolean');
    return raw.toLowerCase();
  }
  if(key==='CONSENT_VERSION' && !/^[a-zA-Z0-9._-]{1,40}$/.test(raw))throw new Error('Settings consent');
  if(key==='RETURN_URL' && raw!==ncSafeReturn_(raw))throw new Error('Settings return URL');
  if(key==='NOTIFICATION_START_UTC')ncNotificationStart_({getProperty:function(){return raw;}});
  if(key==='NOTIFICATION_EMAIL')ncNotificationConfig_({getProperty:function(k){return k==='SPREADSHEET_ID'?'validation-only-sheet-id':k==='NOTIFICATION_START_UTC'?'2000-01-01T00:00:00Z':raw;}});
  var bounds={EMAIL_COOLDOWN_SECONDS:[0,86400],GLOBAL_WINDOW_SECONDS:[60,86400],GLOBAL_MAX_SUBMISSIONS:[1,1000],MAX_TOTAL_ROWS:[1,50000]}[key];
  if(bounds && (!/^\d+$/.test(raw) || Number(raw)<bounds[0] || Number(raw)>bounds[1]))throw new Error('Settings integer');
  return raw;
}
/** Private shared reader. Cache only within this execution; kill switch reads stay fresh. */
function getSetting_(key,defaultValue) {
  if(!NC_SETTING_SPECS_.some(function(spec){return spec[0]===key;}))throw new Error('Unknown setting');
  if(key==='NOTIFICATIONS_ENABLED') {
    // A disabled/malformed/unreadable switch must never authorize MailApp.
    try { var fresh=ncReadSettings_(ncSettingsSheet_());return fresh[key]===undefined ? 'false' : ncSettingValue_(key,fresh[key]); }
    catch(error){return 'false';}
  }
  if(ncSettingsCache_===null)ncSettingsCache_=ncReadSettings_(ncSettingsSheet_());
  return Object.prototype.hasOwnProperty.call(ncSettingsCache_,key)?ncSettingValue_(key,ncSettingsCache_[key]):defaultValue;
}
function ncSettingsProperties_() {
  return {getProperty:function(key){
    return key==='SPREADSHEET_ID'?PropertiesService.getScriptProperties().getProperty(key):getSetting_(key,null);
  },setProperty:function(key,value){
    // Only initial outbox setup may initialize an absent cutover. Never replace history.
    if(key!=='NOTIFICATION_START_UTC')throw new Error('Unsupported settings write');
    var sheet=ncSettingsSheet_(),settings=ncReadSettings_(sheet);
    if(settings[key]!==undefined)throw new Error('Cutover already configured');
    sheet.getRange(sheet.getLastRow()+1,1,1,2).setNumberFormat('@').setValues([[key,ncSettingValue_(key,value)]]);
    SpreadsheetApp.flush();ncSettingsCache_=null;
  }};
}
function ncPublicSettings_(properties) {
  var consent=properties.getProperty('CONSENT_VERSION');
  if(!consent || !/^[a-zA-Z0-9._-]{1,40}$/.test(consent))throw new Error('Settings consent');
  return {available:properties.getProperty('ALLOW_SUBMISSIONS')==='true',consentVersion:consent,
    returnUrl:ncSafeReturn_(properties.getProperty('RETURN_URL')),
    stock:{'512gb':properties.getProperty('STOCK_512GB')==='true','1tb':properties.getProperty('STOCK_1TB')==='true',backup:properties.getProperty('STOCK_BACKUP_PLUS')==='true'}};
}
/** Editor-only migration: retains every legacy property and never touches enquiry/outbox rows. */
function migrateMasterSettings_() {
  var properties=PropertiesService.getScriptProperties();
  if(properties.getProperty('NOTIFICATIONS_ENABLED')==='true')throw new Error('Disable notifications before migration');
  var lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    var book=SpreadsheetApp.openById(properties.getProperty('SPREADSHEET_ID'));
    var sheet=book.getSheetByName('MasterSettings');
    var existing=sheet?ncReadSettings_(sheet):Object.create(null),rows=[];
    NC_SETTING_SPECS_.forEach(function(spec){
      if(Object.prototype.hasOwnProperty.call(existing,spec[0])){existing[spec[0]]=ncSettingValue_(spec[0],existing[spec[0]]);return;} // Reruns preserve operator edits.
      var value=properties.getProperty(spec[0]);
      if(value===null)value=spec[0].indexOf('STOCK_')===0?'true':spec[3];
      if(value===null)throw new Error('Required legacy setting missing: '+spec[0]);
      rows.push([spec[0],ncSettingValue_(spec[0],value)]);
    });
    if(existing.NOTIFICATIONS_ENABLED==='true')throw new Error('Disable notifications before migration');
    // Validate every candidate before creating/writing anything.
    var wiki=book.getSheetByName('SettingsWiki'),header=['Key','Description','Allowed values','Default value','Used In','Public or private','Requires redeployment'];
    if(wiki && (wiki.getLastColumn()!==7 || JSON.stringify(wiki.getRange(1,1,1,7).getValues()[0])!==JSON.stringify(header)))throw new Error('SettingsWiki schema');
    if(!sheet){sheet=book.insertSheet('MasterSettings');sheet.getRange(1,1,1,2).setValues([['Key','Value']]);sheet.setFrozenRows(1);}
    if(rows.length)sheet.getRange(sheet.getLastRow()+1,1,rows.length,2).setNumberFormat('@').setValues(rows);
    SpreadsheetApp.flush();ncSettingsCache_=null;ncReadSettings_(sheet);
    if(!wiki){wiki=book.insertSheet('SettingsWiki');wiki.getRange(1,1,1,7).setValues([header]);wiki.setFrozenRows(1);}
    // Reference content only; no customer data or actual private configuration values.
    var reference=NC_SETTING_SPECS_.map(function(spec){return [spec[0],spec[1],spec[2],spec[3]===null?'Required; preserve existing value':spec[3],spec[4],spec[5],'No (after initial code deployment)'];});
    reference.push(['SPREADSHEET_ID','Only necessary bootstrap Script Property','Existing private spreadsheet ID','Required; no default','Settings/bootstrap','Private','No; retargeting requires separate approval']);
    wiki.getRange(2,1,reference.length,7).setNumberFormat('@').setValues(reference);
    SpreadsheetApp.flush();
    return {status:'migrated',added:rows.length,legacyPropertiesRetained:true};
  }finally{lock.releaseLock();}
}

function doGet(e) {
  if (e && e.parameter && e.parameter.resource === 'settings') {
    var settings;
    try { settings = ncPublicSettings_(ncSettingsProperties_()); }
    catch (error) { settings = {available:false}; }
    return ContentService.createTextOutput(JSON.stringify(settings)).setMimeType(ContentService.MimeType.JSON);
  }
  // Never look up receipts or echo query parameters, even if given an ID.
  return ncRender_({ code: 'information', title: 'Your enquiry starts at NestCloud', message: 'Please use the enquiry form on the NestCloud website. No enquiry information is available through this page.' }, ncReturnUrl_());
}
function doPost(e) {
  var result;
  try { result = ncProcess_(e, ncServices_()); }
  catch (error) { result = ncError_('unavailable'); }
  return ncRender_(result, ncReturnUrl_());
}
function ncError_(code) {
  var messages = {
    invalid: ['Check your enquiry', 'Please return to the form and check the required fields, contact details and consent. Your enquiry was not saved.'],
    blocked: ['Unable to accept this enquiry', 'Please return to NestCloud and try again. Your enquiry was not saved.'],
    conflict: ['Please start a new enquiry', 'This submission reference was already used for different details. Return to the form and start a new enquiry with a new submission ID.'],
    rate: ['Please try again later', 'The enquiry service has reached a submission limit. Please wait before trying again with the same submission ID.'],
    unavailable: ['We could not confirm your enquiry', 'The service could not confirm whether your enquiry was saved. Please retry the same details with the same submission ID to avoid a duplicate.']
  };
  return {code: code, title: messages[code][0], message: messages[code][1]};
}
function ncReturnUrl_() {
  try { return ncSafeReturn_(getSetting_('RETURN_URL', null)); }
  catch (error) { return 'https://nestcloud.in/'; }
}
function ncSafeReturn_(value) {
  // No client-controlled redirect or arbitrary URL from properties.
  return value === 'https://bharatvyb.github.io/NestCloud-Website/' ? value : 'https://nestcloud.in/';
}
function ncConfig_(properties) {
  if (properties.getProperty('ALLOW_SUBMISSIONS') !== 'true') throw new Error('Disabled');
  var id = properties.getProperty('SPREADSHEET_ID');
  if (!id || !/^[a-zA-Z0-9_-]{20,200}$/.test(id)) throw new Error('Configuration');
  function integer(key, fallback, min, max) {
    var raw = properties.getProperty(key);
    if (raw === null) return fallback;
    if (!/^\d+$/.test(raw) || Number(raw) < min || Number(raw) > max) throw new Error('Configuration');
    return Number(raw);
  }
  var consent = properties.getProperty('CONSENT_VERSION');
  if (!consent || !/^[a-zA-Z0-9._-]{1,40}$/.test(consent)) throw new Error('Consent configuration');
  return { spreadsheetId: id, consentVersion: consent,
    cooldownSeconds: integer('EMAIL_COOLDOWN_SECONDS', 60, 0, 86400),
    windowSeconds: integer('GLOBAL_WINDOW_SECONDS', 600, 60, 86400),
    maxSubmissions: integer('GLOBAL_MAX_SUBMISSIONS', 30, 1, 1000),
    maxRows: integer('MAX_TOTAL_ROWS', 10000, 1, 50000) };
}
function ncValidate_(e, config) {
  if (!e || !e.postData || e.postData.type.split(';')[0].trim().toLowerCase() !== 'application/x-www-form-urlencoded' || !Number.isFinite(e.contentLength) || e.contentLength < 1 || e.contentLength > 20000) return null;
  var fields = ['submission_id','enquiry_type','full_name','email','mobile','delivery_pin','message','consent','consent_version','configuration_id','displayed_price','order_reference','device_serial','issue_category','website'];
  var input = {}, params = e.parameters || {};
  // Reject unknown fields and parameter pollution. Never use reserved c or sid.
  if (Object.keys(params).some(function(k) { return fields.indexOf(k) < 0; })) return null;
  for (var i = 0; i < fields.length; i++) {
    var key = fields[i], values = params[key];
    if (values && (!Array.isArray(values) || values.length !== 1 || typeof values[0] !== 'string')) return null;
    var value = values ? values[0] : '';
    var limits = {submission_id:36,enquiry_type:10,full_name:100,email:254,mobile:32,delivery_pin:6,message:3000,consent:3,consent_version:40,configuration_id:32,displayed_price:7,order_reference:80,device_serial:80,issue_category:32,website:254};
    if (value.length > limits[key] || /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value)) return null;
    if (key !== 'message' && /[\r\n]/.test(value)) return null;
    input[key] = value.trim();
  }
  if (input.website) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.submission_id)) return null;
  input.submission_id = input.submission_id.toLowerCase();
  if (['purchase','general','support'].indexOf(input.enquiry_type) < 0 || input.full_name.length < 2 || input.full_name.length > 100) return null;
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(input.email) || input.email.length > 254) return null;
  input.email = input.email.toLowerCase();
  // India mobile: 10 digits beginning 6–9, optionally prefixed +91/91.
  if (!/^[+\d ()-]+$/.test(input.mobile)) return null;
  var mobile = input.mobile.replace(/[ ()-]/g, '');
  if (/^(?:\+91|91)[6-9]\d{9}$/.test(mobile)) mobile = mobile.replace(/^(?:\+91|91)/, '');
  if (!/^[6-9]\d{9}$/.test(mobile)) return null;
  input.mobile = '+91' + mobile;
  if (input.consent !== 'yes' || !/^[a-zA-Z0-9._-]{1,40}$/.test(input.consent_version)) return null;
  if (input.order_reference.length > 80 || input.device_serial.length > 80) return null;
  if (input.enquiry_type === 'purchase') {
    if (!/^[1-9]\d{5}$/.test(input.delivery_pin) || !Object.prototype.hasOwnProperty.call(NC_CATALOGUE_, input.configuration_id) || !/^\d{1,7}$/.test(input.displayed_price)) return null;
    if (input.order_reference || input.device_serial || input.issue_category) return null;
  } else {
    if (!input.message || input.configuration_id || input.displayed_price || input.delivery_pin) return null;
    if (input.enquiry_type === 'general' && (input.order_reference || input.device_serial || input.issue_category)) return null;
  }
  if (input.issue_category && ['setup','photos','files','remote-access','backup','hardware','other'].indexOf(input.issue_category) < 0) return null;
  return input;
}
function ncProcess_(event, services) {
  var config = ncConfig_(services.properties), input = ncValidate_(event, config);
  if (!input) return ncError_('invalid');
  var digest = services.hash(JSON.stringify(input)), emailDigest = services.hash(input.email);
  var lock = services.lock();
  if (!lock.tryLock(10000)) return ncError_('unavailable');
  try {
    var sheets = services.sheets(config.spreadsheetId);
    var metadata = sheets.metadata(); // Validate exact schemas and read all three tabs.
    if (metadata.some(function(row) { return row.length !== 5 || !/^[0-9a-f-]{36}$/.test(row[0]) || !/^NC-[0-9a-f-]{36}$/i.test(row[1]) || !Number.isFinite(Date.parse(row[2])) || !/^[0-9a-f]{64}$/.test(row[3]) || !/^[0-9a-f]{64}$/.test(row[4]); })) throw new Error('Invalid metadata');
    var matches = metadata.filter(function(row) { return row[0] === input.submission_id; });
    if (matches.length) {
      if (matches.length !== 1 || matches[0][3] !== digest) return ncError_('conflict');
      // Existing success precedes current pricing, cooldown and capacity checks.
      return ncSuccess_(matches[0][1], true);
    }
    if (input.consent_version !== config.consentVersion) return ncError_('invalid');
    var product = input.enquiry_type === 'purchase' ? NC_CATALOGUE_[input.configuration_id] : null;
    if (product && services.properties.getProperty(ncStockKey_(input.configuration_id)) !== 'true') {
      return {code:'stock',title:'This configuration is currently unavailable',message:'No new purchase enquiry was saved. Return to NestCloud and choose an available configuration, or contact us for help.'};
    }
    if (product && Number(input.displayed_price) !== product.price) {
      return {code:'price',title:'Please review the current product price',message:'The price shown on your form does not match the current NestCloud catalogue. No purchase enquiry was saved. Return to NestCloud, review the current price and explicitly resubmit.', price:'Current product price: ₹' + product.price.toLocaleString('en-IN') + ' · ' + product.name};
    }
    var now = services.now(), recent = 0, cooling = false;
    if (metadata.length >= config.maxRows) return ncError_('rate');
    metadata.forEach(function(row) {
      var received = Date.parse(row[2]);
      if (!Number.isFinite(received)) throw new Error('Invalid metadata');
      if (received > now - config.windowSeconds * 1000) recent++;
      if (row[4] === emailDigest && received > now - config.cooldownSeconds * 1000) cooling = true;
    });
    if (cooling || recent >= config.maxSubmissions) return ncError_('rate');
    var receipt = 'NC-' + services.uuid(), timestamp = new Date(now).toISOString();
    var values = [input.submission_id,receipt,timestamp,digest,emailDigest,input.enquiry_type,input.full_name,input.email,input.mobile,input.delivery_pin,input.message,input.consent_version,timestamp,product ? input.configuration_id : '',product ? product.name : '',product ? product.price : '',product ? 'INR' : '',product ? product.personal : '',product ? product.backup : '',input.order_reference,input.device_serial,input.issue_category,'New'];
    var tab = NC_TABS_[['purchase','general','support'].indexOf(input.enquiry_type)];
    // One row is the enquiry AND the durable idempotency/rate record. No second ledger write.
    sheets.append(tab, values.map(ncCell_));
    services.flush();
    // The enquiry is authoritative. Outbox failures are repaired by the worker;
    // email and notification configuration must never undo a saved receipt.
    try { if (services.queueNotification) services.queueNotification(config.spreadsheetId, values.map(ncCell_)); }
    catch (notificationError) { /* No payload/error details in public responses or logs. */ }
    return ncSuccess_(receipt, false);
  } catch (error) {
    // A write/flush exception can be ambiguous. Same-ID retry checks the row first.
    return ncError_('unavailable');
  } finally { lock.releaseLock(); }
}
function ncSuccess_(receipt, duplicate) {
  return {code:'success',title:duplicate ? 'Your enquiry is already received' : 'Thank you. Your enquiry is received.',message:'Our team will review your enquiry and contact you using the details you provided. This is not an order confirmation or a payment receipt.',receipt:receipt};
}
function ncCell_(value) {
  // Plain-text cell formatting plus escaping also protects later CSV exports.
  return typeof value === 'string' && /^[\s]*[=+\-@\t\r]/.test(value) ? "'" + value : value;
}
function ncServices_() {
  return {properties:ncSettingsProperties_(), lock:function(){return LockService.getScriptLock();}, now:Date.now,
    queueNotification:function(id,values){
      var services=ncNotificationServices_(), start=ncNotificationStart_(services.properties);
      if(Date.parse(values[2])>=start)ncEnsureNotifications_(services.store(id),[values],services);
    },
    uuid:function(){return Utilities.getUuid();},
    hash:function(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8).map(function(b){return ('0'+(b & 255).toString(16)).slice(-2);}).join('');},
    flush:function(){SpreadsheetApp.flush();}, sheets:function(id){
      var book = SpreadsheetApp.openById(id), tabs = {};
      NC_TABS_.forEach(function(name){
        var sheet = book.getSheetByName(name);
        if (!sheet || sheet.getLastColumn() !== NC_HEADERS_.length || JSON.stringify(sheet.getRange(1,1,1,NC_HEADERS_.length).getValues()[0]) !== JSON.stringify(NC_HEADERS_)) throw new Error('Sheet schema');
        tabs[name] = sheet;
      });
      return {metadata:function(){var rows=[];NC_TABS_.forEach(function(name){var s=tabs[name],count=s.getLastRow()-1;if(count>0)rows=rows.concat(s.getRange(2,1,count,5).getValues());});return rows;},
        append:function(name,values){var s=tabs[name],row=s.getLastRow()+1;
          if(row>s.getMaxRows())s.insertRowsAfter(s.getMaxRows(),1);
          var range=s.getRange(row,1,1,NC_HEADERS_.length);
          range.setNumberFormat('@');
          range.setValues([values]);
        }};
    }};
}
function ncEscape_(value) {
  return String(value || '').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
}
function ncRender_(result, returnUrl) {
  var template = HtmlService.createTemplateFromFile('Confirmation');
  // Every dynamic value is escaped before entering the force-print template slots.
  template.title = ncEscape_(result.title); template.message = ncEscape_(result.message);
  template.receipt = ncEscape_(result.receipt); template.price = ncEscape_(result.price);
  template.returnUrl = ncEscape_(ncSafeReturn_(returnUrl));
  template.state = result.code === 'success' ? 'ENQUIRY RECEIVED' : result.code === 'information' ? 'NESTCLOUD ENQUIRIES' : 'PLEASE CHECK YOUR ENQUIRY';
  return template.evaluate().setTitle('NestCloud — ' + result.title).addMetaTag('viewport','width=device-width, initial-scale=1');
}
/** Editor-only setup helper. Trailing underscore prevents google.script.run access. */
function setupEnquirySheets_() {
  var properties = PropertiesService.getScriptProperties(), id = properties.getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Set SPREADSHEET_ID first');
  var lock=LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var book=SpreadsheetApp.openById(id);
    NC_TABS_.forEach(function(name){
      var sheet=book.getSheetByName(name) || book.insertSheet(name);
      if(sheet.getLastRow()===0){sheet.getRange(1,1,1,NC_HEADERS_.length).setValues([NC_HEADERS_]);sheet.setFrozenRows(1);}
      else if(sheet.getLastColumn()!==NC_HEADERS_.length || JSON.stringify(sheet.getRange(1,1,1,NC_HEADERS_.length).getValues()[0])!==JSON.stringify(NC_HEADERS_))throw new Error('Existing sheet has a different schema: '+name);
    });
    SpreadsheetApp.flush();
  } finally {lock.releaseLock();}
}

// Notification metadata only: customer details remain in the existing enquiry tabs.
var NC_OUTBOX_TAB_ = 'Notification Outbox';
var NC_OUTBOX_HEADERS_ = ['Submission ID','Enquiry reference','Created UTC','Status','Attempts','Total attempts','Last attempt UTC','Next retry UTC','Sent UTC','Error category','Claim ID','Claim expires UTC','Recipient'];
var NC_OUTBOX_KEYS_ = ['id','reference','created','status','attempts','totalAttempts','lastAttempt','nextRetry','sent','error','claim','expires','recipient'];
var NC_NOTIFICATION_MAX_ATTEMPTS_ = 5;
var NC_NOTIFICATION_LEASE_MS_ = 10 * 60 * 1000;

function ncNotificationStart_(properties) {
  var start=properties.getProperty('NOTIFICATION_START_UTC');
  if(!start || !/^\d{4}-\d\d-\d\dT.*Z$/.test(start) || !Number.isFinite(Date.parse(start)))throw new Error('Notification setup required');
  return Date.parse(start);
}
function ncNotificationConfig_(properties) {
  var id=properties.getProperty('SPREADSHEET_ID');
  if(!id || !/^[a-zA-Z0-9_-]{20,200}$/.test(id))throw new Error('Notification configuration');
  var recipient=properties.getProperty('NOTIFICATION_EMAIL');
  if(recipient===null)recipient='nestcloud@bharatvyb.com';
  if(typeof recipient!=='string' || recipient.length>254 || /[\s\x00-\x1f\x7f]/.test(recipient) || !/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(recipient) || /^\.|\.\.|\.@/.test(recipient))throw new Error('Notification recipient configuration');
  return {id:id,recipient:recipient,start:ncNotificationStart_(properties)};
}
function ncNotificationServices_() {
  return {properties:ncSettingsProperties_(), now:Date.now,
    uuid:function(){return Utilities.getUuid();}, lock:function(){return LockService.getScriptLock();},
    store:ncNotificationStore_, flush:function(){SpreadsheetApp.flush();},
    quota:function(){return MailApp.getRemainingDailyQuota();}, send:function(mail){MailApp.sendEmail(mail);},
    formatIst:function(timestamp){return Utilities.formatDate(new Date(timestamp),'Asia/Kolkata',"dd MMM yyyy, hh:mm:ss a 'IST'");}
  };
}
function ncNotificationStore_(id) {
  var book=SpreadsheetApp.openById(id), sheet=book.getSheetByName(NC_OUTBOX_TAB_);
  if(!sheet || sheet.getLastColumn()!==NC_OUTBOX_HEADERS_.length || JSON.stringify(sheet.getRange(1,1,1,NC_OUTBOX_HEADERS_.length).getValues()[0])!==JSON.stringify(NC_OUTBOX_HEADERS_))throw new Error('Outbox schema');
  function write(record,row) {
    if(row>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),1);
    sheet.getRange(row,1,1,NC_OUTBOX_HEADERS_.length).setNumberFormat('@').setValues([NC_OUTBOX_KEYS_.map(function(key){return ncCell_(record[key]);})]);
    record.row=row;
  }
  return {
    entries:function(){
      if(sheet.getLastRow()<2)return [];
      return sheet.getRange(2,1,sheet.getLastRow()-1,NC_OUTBOX_HEADERS_.length).getValues().map(function(values,index){
        var record={row:index+2};NC_OUTBOX_KEYS_.forEach(function(key,column){record[key]=values[column];});
        record.attempts=Number(record.attempts);record.totalAttempts=Number(record.totalAttempts);
        return record;
      });
    },
    append:function(record){write(record,sheet.getLastRow()+1);},
    write:function(record){write(record,record.row);},
    sources:function(){
      var rows=[];
      NC_TABS_.forEach(function(name){
        var source=book.getSheetByName(name);
        if(!source)throw ncNotificationSourceError_('source_missing');
        if(source.getLastColumn()!==NC_HEADERS_.length || JSON.stringify(source.getRange(1,1,1,NC_HEADERS_.length).getValues()[0])!==JSON.stringify(NC_HEADERS_))throw ncNotificationSourceError_('source_corrupt');
        if(source.getLastRow()>1)rows=rows.concat(source.getRange(2,1,source.getLastRow()-1,NC_HEADERS_.length).getValues());
      });
      return rows;
    }
  };
}
function ncCheckNotificationEntries_(entries) {
  var seen={};
  entries.forEach(function(entry){
    if(typeof entry.id!=='string' || entry.id.length!==36 || !/^[0-9a-f-]{36}$/i.test(entry.id) || typeof entry.reference!=='string' || entry.reference.length!==39 || !/^NC-[0-9a-f-]{36}$/i.test(entry.reference) || seen[entry.id] ||
      ['Pending','Sending','Sent','Failed','Uncertain'].indexOf(entry.status)<0 ||
      !Number.isInteger(entry.attempts) || entry.attempts<0 || !Number.isInteger(entry.totalAttempts) || entry.totalAttempts<entry.attempts ||
      !Number.isFinite(Date.parse(entry.created)) || (entry.status==='Pending' && !Number.isFinite(Date.parse(entry.nextRetry))) ||
      (entry.status==='Sending' && (!entry.claim || !Number.isFinite(Date.parse(entry.expires)))) ||
      (entry.status==='Sent' && !Number.isFinite(Date.parse(entry.sent))))throw new Error('Outbox data');
    seen[entry.id]=entry;
  });
  return seen;
}
function ncNotificationSourceError_(category) {
  var error=new Error('Notification source requires attention');error.notificationSource=category;return error;
}
function ncNotificationSourceCategory_(error) {
  return error && ['source_missing','source_corrupt','source_unavailable'].indexOf(error.notificationSource)>=0 ? error.notificationSource : '';
}
function ncReadNotificationSources_(store) {
  try {return store.sources();}
  catch(error){throw ncNotificationSourceError_(ncNotificationSourceCategory_(error) || 'source_unavailable');}
}
function ncCheckNotificationSource_(values) {
  if(values.length!==NC_HEADERS_.length || typeof values[0]!=='string' || values[0].length!==36 || !/^[0-9a-f-]{36}$/i.test(values[0]) || typeof values[1]!=='string' || values[1].length!==39 || !/^NC-[0-9a-f-]{36}$/i.test(values[1]) ||
    !Number.isFinite(Date.parse(values[2])) || ['purchase','general','support'].indexOf(values[5])<0)throw ncNotificationSourceError_('source_corrupt');
}
// Called only while owning the shared script lock. A persisted append followed
// by a failed flush is found on reconciliation instead of appended again.
function ncEnsureNotifications_(store,sources,services) {
  var entries=ncCheckNotificationEntries_(store.entries()), sourceIds={}, added=0;
  sources.forEach(function(values){
    ncCheckNotificationSource_(values);
    if(sourceIds[values[0]])throw ncNotificationSourceError_('source_corrupt');
    sourceIds[values[0]]=true;
  });
  sources.forEach(function(values){
    var existing=entries[values[0]];
    if(existing && existing.reference!==values[1])throw ncNotificationSourceError_('source_corrupt');
    if(!existing && added<100){
      var record={id:values[0],reference:values[1],created:values[2],status:'Pending',attempts:0,totalAttempts:0,lastAttempt:'',nextRetry:new Date(services.now()).toISOString(),sent:'',error:'',claim:'',expires:'',recipient:''};
      store.append(record);services.flush();entries[record.id]=record;added++;
    }
  });
  return added;
}
function ncReconcileNotifications_(store,services,start) {
  var sources=ncReadNotificationSources_(store);sources.forEach(ncCheckNotificationSource_);
  return ncEnsureNotifications_(store,sources.filter(function(row){return Date.parse(row[2])>=start;}),services);
}
function ncNotificationMail_(values,recipient,services) {
  ncCheckNotificationSource_(values);
  if([6,7,8].some(function(index){return typeof values[index]!=='string' || !values[index].trim();}))throw ncNotificationSourceError_('source_corrupt');
  var type=values[5], labels={purchase:'Purchase Enquiry',general:'General Enquiry',support:'Technical Support Request'};
  var details=[['Enquiry reference',values[1]],['Received',services.formatIst(values[2])],['Enquiry type',labels[type]],['Customer name',values[6]],['Customer email',values[7]],['Mobile / WhatsApp',String(values[8]).replace(/^'(?=\+91)/,'')]];
  if(type==='purchase'){
    if(['string','number'].indexOf(typeof values[15])<0 || !String(values[15]).trim() || !Number.isInteger(Number(values[15])) || Number(values[15])<0 || values[16]!=='INR' || [14,17,9].some(function(index){return typeof values[index]!=='string' || !values[index].trim();}))throw ncNotificationSourceError_('source_corrupt');
    details=details.concat([['Configuration',values[14]],['Usable personal storage',values[17]],['Backup Plus',values[18] ? 'Separate '+values[18]+' backup SSD' : 'Not selected'],['Product price','INR '+Number(values[15]).toLocaleString('en-IN')],['Delivery PIN',values[9]]]);
  }
  if(type==='support')[[19,'Order reference'],[20,'Device serial'],[21,'Issue category']].forEach(function(pair){if(values[pair[0]])details.push([pair[1],values[pair[0]]]);});
  if(values[10])details.push(['Message',values[10]]);
  var body='NestCloud — New enquiry\n\n'+details.map(function(pair){return pair[0]+': '+pair[1];}).join('\n')+'\n\nThis is an enquiry, not an order confirmation or payment receipt.';
  var html='<div style="font:16px/1.6 Arial,sans-serif;color:#162d4d;max-width:680px;margin:auto"><h1 style="color:#0864e9">NestCloud</h1><h2>New '+ncEscape_(labels[type])+'</h2><table style="width:100%;border-collapse:collapse">'+details.map(function(pair){return '<tr><th style="text-align:left;vertical-align:top;padding:10px;border-bottom:1px solid #dce6f4">'+ncEscape_(pair[0])+'</th><td style="padding:10px;border-bottom:1px solid #dce6f4;overflow-wrap:anywhere;white-space:pre-wrap">'+ncEscape_(pair[1])+'</td></tr>';}).join('')+'</table><p style="color:#526780">This is an enquiry, not an order confirmation or payment receipt.</p></div>';
  return {to:recipient,subject:'[NestCloud] New '+labels[type]+' — '+values[1],body:body,htmlBody:html,name:'NestCloud Enquiries'};
}
function ncClaimNotification_(services,config,reconcile) {
  var lock=services.lock();if(!lock.tryLock(1000))return null;
  try {
    var store=services.store(config.id);
    var entries=store.entries();ncCheckNotificationEntries_(entries);
    var now=services.now();
    entries.forEach(function(entry){
      if(entry.status==='Sending' && Date.parse(entry.expires)<=now){
        // Only the new durable pre_send phase proves MailApp was never entered.
        // Legacy claims and send_started outcomes remain conservative.
        if(entry.error==='pre_send'){
          entry.status=entry.attempts>=NC_NOTIFICATION_MAX_ATTEMPTS_?'Failed':'Pending';
          entry.error='pre_send_interrupted';entry.nextRetry=entry.status==='Pending'?new Date(now).toISOString():'';
          entry.claim='';entry.expires='';
        }else{entry.status='Uncertain';entry.error='worker_interrupted';}
        store.write(entry);services.flush();
      }
    });
    // Resolve expired claims even when a subsequent source scan fails closed.
    if(reconcile!==false){ncReconcileNotifications_(store,services,config.start);entries=store.entries();ncCheckNotificationEntries_(entries);}
    if(services.properties.getProperty('NOTIFICATIONS_ENABLED')!=='true')return null;
    now=services.now();
    var entry=entries.find(function(item){return item.status==='Pending' && Date.parse(item.nextRetry)<=now;});
    if(!entry)return null;
    if(entry.attempts>=NC_NOTIFICATION_MAX_ATTEMPTS_){entry.status='Failed';entry.error='retry_limit';store.write(entry);services.flush();return null;}
    entry.status='Sending';entry.claim=services.uuid();entry.expires=new Date(now+NC_NOTIFICATION_LEASE_MS_).toISOString();
    entry.attempts++;entry.totalAttempts++;entry.lastAttempt=new Date(now).toISOString();entry.nextRetry='';entry.error='pre_send';entry.recipient=config.recipient;
    store.write(entry);services.flush();
    return entry;
  } finally {lock.releaseLock();}
}
function ncFinishNotification_(services,config,claim,status,error) {
  // Match the customer writer's bounded wait: routine Sheet writes often take
  // several seconds. Waiting here holds no lock and never invokes MailApp again.
  var lock=services.lock();if(!lock.tryLock(10000))return false;
  try {
    var store=services.store(config.id),entries=store.entries();ncCheckNotificationEntries_(entries);
    var entry=entries.find(function(item){return item.id===claim.id;});
    if(!entry || entry.status!=='Sending' || entry.claim!==claim.claim)return false;
    entry.status=status;entry.error=error || '';entry.nextRetry='';
    if(status==='Pending'){
      if(entry.attempts>=NC_NOTIFICATION_MAX_ATTEMPTS_)entry.status='Failed';
      else entry.nextRetry=new Date(services.now()+Math.min(3600000,60000*Math.pow(2,entry.attempts-1))).toISOString();
    }
    if(status==='Sent')entry.sent=new Date(services.now()).toISOString();
    entry.claim='';entry.expires='';store.write(entry);services.flush();return true;
  } finally {lock.releaseLock();}
}
function ncNotificationCanSend_(services,config,claim) {
  // null means contention, not a stale claim. Persist the send boundary while
  // locked, then call MailApp outside the lock only after its flush succeeds.
  var lock=services.lock();if(!lock.tryLock(1000))return null;
  try {
    var store=services.store(config.id),entries=store.entries();ncCheckNotificationEntries_(entries);
    var entry=entries.find(function(item){return item.id===claim.id;});
    if(services.properties.getProperty('NOTIFICATIONS_ENABLED')!=='true' || !entry || entry.status!=='Sending' || entry.error!=='pre_send' || entry.claim!==claim.claim || Date.parse(entry.expires)<=services.now())return false;
    entry.error='send_started';store.write(entry);services.flush();return true;
  }finally{lock.releaseLock();}
}
function ncProcessNotifications_(services) {
  if(services.properties.getProperty('NOTIFICATIONS_ENABLED')!=='true')return {status:'disabled',accepted:0};
  var config;try {config=ncNotificationConfig_(services.properties);}catch(error){return {status:'invalid_configuration',accepted:0};}
  var accepted=0,started=services.now();
  for(var count=0;count<5 && services.now()-started<45000;count++){
    var claim;
    try {claim=ncClaimNotification_(services,config,count===0);}catch(error){return {status:ncNotificationSourceCategory_(error) || 'storage_unavailable',accepted:accepted};}
    if(!claim)break;
    var mail;
    try {
      var quota=services.quota();
      if(!Number.isFinite(quota) || quota<1){ncFinishNotification_(services,config,claim,'Pending','quota_exhausted');continue;}
      var matches=ncReadNotificationSources_(services.store(config.id)).filter(function(row){return row[0]===claim.id;});
      if(!matches.length)throw ncNotificationSourceError_('source_missing');
      if(matches.length!==1 || matches[0][1]!==claim.reference)throw ncNotificationSourceError_('source_corrupt');
      mail=ncNotificationMail_(matches[0],claim.recipient,services);
    } catch(error){
      var category=ncNotificationSourceCategory_(error);
      try {
        if(!ncFinishNotification_(services,config,claim,category==='source_missing' || category==='source_corrupt' ? 'Failed' : 'Pending',category || 'pre_send_failure'))return {status:'outcome_unrecorded',accepted:accepted};
      }catch(writeError){return {status:'storage_unavailable',accepted:accepted};}
      if(category==='source_missing' || category==='source_corrupt')return {status:category,accepted:accepted};
      continue;
    }
    // Recheck the kill switch before calling MailApp. An already in-flight send
    // cannot be recalled. The durable lease prevents a second worker claiming it.
    if(services.properties.getProperty('NOTIFICATIONS_ENABLED')!=='true'){
      try {ncFinishNotification_(services,config,claim,'Pending','disabled_before_send');}catch(writeError){}
      break;
    }
    try {
      var canSend=ncNotificationCanSend_(services,config,claim);
      if(canSend===null){
        if(!ncFinishNotification_(services,config,claim,'Pending','pre_send_busy'))return {status:'pre_send_deferred',accepted:accepted};
        continue;
      }
      if(!canSend)return {status:'claim_not_current',accepted:accepted};
    }
    catch(error){return {status:'storage_unavailable',accepted:accepted};}
    try {services.send(mail);}
    catch(error){
      // A generic MailApp exception can happen after acceptance. Do not guess
      // from error strings that it is safe to resend.
      try {ncFinishNotification_(services,config,claim,'Uncertain','mail_exception');}catch(writeError){}
      continue;
    }
    try {
      if(!ncFinishNotification_(services,config,claim,'Sent',''))return {status:'outcome_unrecorded',accepted:accepted};
      accepted++;
    }catch(error){return {status:'outcome_unrecorded',accepted:accepted};}
  }
  return {status:'processed',accepted:accepted};
}
// Private trigger/editor functions: never callable through google.script.run.
function processNotificationOutbox_() {
  var result;
  try {result=ncProcessNotifications_(ncNotificationServices_());}
  catch(error){result={status:'worker_unavailable',accepted:0};}
  // Operational categories/counts only, never MailApp errors or customer data.
  console.log('NestCloud notifications: '+JSON.stringify(result));
  return result;
}
function reconcileNotificationOutbox_() {
  var services=ncNotificationServices_(), id=services.properties.getProperty('SPREADSHEET_ID'),lock=services.lock();lock.waitLock(10000);
  try {return ncReconcileNotifications_(services.store(id),services,ncNotificationStart_(services.properties));}finally{lock.releaseLock();}
}
function setupNotificationOutbox_(startUtc) {
  var properties=ncSettingsProperties_(),id=properties.getProperty('SPREADSHEET_ID'),lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    var book=SpreadsheetApp.openById(id),sheet=book.getSheetByName(NC_OUTBOX_TAB_);
    if(!sheet && properties.getProperty('NOTIFICATION_START_UTC')!==null)throw new Error('Outbox missing; restore its history instead of recreating it');
    if(!sheet)sheet=book.insertSheet(NC_OUTBOX_TAB_);
    if(sheet.getLastRow()===0){sheet.getRange(1,1,1,NC_OUTBOX_HEADERS_.length).setValues([NC_OUTBOX_HEADERS_]);sheet.setFrozenRows(1);}
    else if(sheet.getLastColumn()!==NC_OUTBOX_HEADERS_.length || JSON.stringify(sheet.getRange(1,1,1,NC_OUTBOX_HEADERS_.length).getValues()[0])!==JSON.stringify(NC_OUTBOX_HEADERS_))throw new Error('Existing outbox schema differs');
    if(properties.getProperty('NOTIFICATION_START_UTC')===null){
      var start=startUtc===undefined ? new Date().toISOString() : startUtc;
      if(typeof start!=='string' || !/^\d{4}-\d\d-\d\dT.*Z$/.test(start) || !Number.isFinite(Date.parse(start)))throw new Error('Invalid notification start');
      properties.setProperty('NOTIFICATION_START_UTC',start);
    }
    ncNotificationStart_(properties);SpreadsheetApp.flush();
  }finally{lock.releaseLock();}
}
function installNotificationWorker_() {
  var services=ncNotificationServices_(),lock=services.lock();lock.waitLock(10000);
  try {
    services.store(services.properties.getProperty('SPREADSHEET_ID'));ncNotificationStart_(services.properties);
    MailApp.getRemainingDailyQuota(); // Authorize sending, but never send here.
    var triggers=ScriptApp.getProjectTriggers().filter(function(trigger){return trigger.getHandlerFunction()==='processNotificationOutbox_';});
    if(triggers.length>1)throw new Error('Multiple notification triggers; remove and reinstall using the owner');
    if(!triggers.length)ScriptApp.newTrigger('processNotificationOutbox_').timeBased().everyMinutes(1).create();
  }finally{lock.releaseLock();}
}
function removeNotificationWorker_() {
  ScriptApp.getProjectTriggers().forEach(function(trigger){if(trigger.getHandlerFunction()==='processNotificationOutbox_')ScriptApp.deleteTrigger(trigger);});
}
function resolveNotification_(submissionId,resolution,confirmation) {
  var services=ncNotificationServices_();
  if(services.properties.getProperty('NOTIFICATIONS_ENABLED')==='true')throw new Error('Disable notifications before recovery');
  if(!((resolution==='retry' && confirmation==='CONFIRMED_NOT_SENT') || (resolution==='mark_sent' && confirmation==='CONFIRMED_SENT')))throw new Error('External evidence required');
  var lock=services.lock();lock.waitLock(10000);
  try {
    var store=services.store(services.properties.getProperty('SPREADSHEET_ID')), entries=store.entries();ncCheckNotificationEntries_(entries);
    var entry=entries.find(function(item){return item.id===submissionId;});
    if(!entry || ['Failed','Uncertain','Sending'].indexOf(entry.status)<0 || (entry.status==='Sending' && Date.parse(entry.expires)>services.now()))throw new Error('Notification not recoverable');
    entry.status=resolution==='retry' ? 'Pending' : 'Sent';entry.error=resolution==='retry' ? 'operator_retry' : 'operator_confirmed_sent';
    entry.claim='';entry.expires='';entry.nextRetry=resolution==='retry' ? new Date(services.now()).toISOString() : '';
    if(resolution==='retry')entry.attempts=0;else entry.sent=new Date(services.now()).toISOString();
    store.write(entry);services.flush();
  }finally{lock.releaseLock();}
}
