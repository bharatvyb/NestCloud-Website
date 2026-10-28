/** NestCloud enquiries. Public entry points are doGet/doPost only. */
var NC_CATALOGUE_ = Object.freeze({
  '512gb': { name: '512 GB', price: 49900, personal: '512 GB', backup: '' },
  '1tb': { name: '1 TB', price: 59900, personal: '1 TB', backup: '' },
  'backup': { name: '1 TB + Backup Plus', price: 81900, personal: '1 TB', backup: '1 TB' }
});
var NC_TABS_ = ['Purchase Enquiries', 'General Contact', 'Technical Support'];
var NC_HEADERS_ = ['Submission ID', 'Enquiry reference', 'Received UTC', 'Payload SHA256', 'Email SHA256', 'Type', 'Full name', 'Email', 'Mobile', 'Delivery PIN', 'Message', 'Consent version', 'Consent received UTC', 'Configuration ID', 'Configuration', 'Product price INR', 'Currency', 'Personal storage', 'Backup SSD', 'Order reference', 'Device serial', 'Issue category', 'Status'];

function doGet() {
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
  try { return ncSafeReturn_(PropertiesService.getScriptProperties().getProperty('RETURN_URL')); }
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
  return {properties:PropertiesService.getScriptProperties(), lock:function(){return LockService.getScriptLock();}, now:Date.now,
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
