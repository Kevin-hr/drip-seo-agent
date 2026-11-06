#!/usr/bin/env node
// Read-only official Google APIs using existing authorized_user ADC credentials.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';
import {pathToFileURL} from 'node:url';

const HOSTS = new Set(['oauth2.googleapis.com','searchconsole.googleapis.com','www.googleapis.com']);
export function shiftDate(value, n) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) throw new Error('Invalid date');
  const d = new Date(value+'T12:00:00Z');
  if (Number.isNaN(d.valueOf()) || d.toISOString().slice(0,10)!==value) throw new Error('Invalid calendar date');
  d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);
}
export function ptToday(now = new Date()) {
  const p = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-');
}
export function choosePeriod(metadata, latestCompleted, days=28, latestFinalDate=null) {
  const incomplete=metadata?.firstIncompleteDate || metadata?.first_incomplete_date || null;
  let endDate, derivedFrom;
  if (incomplete && incomplete<=latestCompleted) {
    endDate=shiftDate(incomplete,-1);derivedFrom='day before firstIncompleteDate';
  } else if (incomplete && incomplete>latestCompleted) {
    shiftDate(incomplete,0);endDate=latestCompleted;derivedFrom='completed day precedes firstIncompleteDate';
  } else if (latestFinalDate && latestFinalDate<=latestCompleted) {
    shiftDate(latestFinalDate,0);endDate=latestFinalDate;derivedFrom='latest returned final-data date';
  } else throw new Error('HOLD: final date not established; metadata/final-date probe required');
  return {startDate:shiftDate(endDate,-days+1),endDate,days,timeZone:'America/Los_Angeles',dataState:'final',firstIncompleteDate:incomplete,derivedFrom};
}
export function totalSummary(response) {
  const rows=response?.rows;
  if (!rows || rows.length!==1) return {impressions:null,clicks:null,position:null,status:'NO_TOTAL_ROW'};
  const r=rows[0];return {impressions:r.impressions??null,clicks:r.clicks??null,
    position:r.impressions>0?r.position??null:null,status:'REPORTED'};
}

function proxyAgent(proxy, targetHost) {
  if (!proxy) return undefined;
  const p=new URL(proxy);
  if (p.protocol!=='http:' || p.username || p.password) throw new Error('Only HTTP CONNECT proxy URLs without embedded credentials are supported');
  const agent=new https.Agent({keepAlive:false});
  agent.createConnection=(_options,callback)=>{
    const req=http.request({hostname:p.hostname,port:p.port||80,method:'CONNECT',path:targetHost+':443',headers:{Host:targetHost+':443'}});
    req.setTimeout(30000,()=>req.destroy(new Error('Proxy timeout')));
    let finished=false;
    const done=(error,socket)=>{if(!finished){finished=true;callback(error,socket);}};
    req.on('error',error=>done(error));
    req.on('connect',(response,socket,head)=>{
      if(response.statusCode!==200){socket.destroy();done(new Error('Proxy CONNECT HTTP '+response.statusCode));return;}
      if(head.length)socket.unshift(head);
      const secure=tls.connect({socket,servername:targetHost,rejectUnauthorized:true});
      secure.setTimeout(30000,()=>secure.destroy(new Error('TLS timeout')));
      secure.once('error',error=>done(error));secure.once('secureConnect',()=>done(null,secure));
    });
    req.end();
  };
  return agent;
}
function request(host, route, headers, body, proxy) {
  if(!HOSTS.has(host))throw new Error('Credentials may only be sent to allowlisted official Google hosts');
  const bytes=Buffer.from(body);
  return new Promise((resolve,reject)=>{
    const req=https.request({hostname:host,port:443,path:route,method:'POST',agent:proxyAgent(proxy,host),
      headers:{...headers,'Content-Length':bytes.length,'Accept':'application/json','Accept-Encoding':'identity'}},res=>{
      const chunks=[];let size=0;
      res.on('data',chunk=>{size+=chunk.length;if(size>16*1024*1024)res.destroy(new Error('Response exceeds 16 MB'));else chunks.push(chunk);});
      res.on('error',reject);
      res.on('end',()=>{
        let response;try{response=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{response={error:{message:'Non-JSON API response'}};}
        resolve({httpStatus:res.statusCode,response});
      });
    });
    req.setTimeout(30000,()=>req.destroy(new Error('Google request timeout')));req.on('error',reject);req.end(bytes);
  });
}
function options(argv) {
  const result={days:28};
  const allowed=new Set(['url','site','out','days','proxy','credentials','quota-project','country','device']);
  for(let i=0;i<argv.length;i++){
    const k=argv[i].replace(/^--/,'');
    if(k==='help'){result.help=true;continue;}
    if(!argv[i].startsWith('--')||!allowed.has(k)||!argv[i+1]||argv[i+1].startsWith('--'))throw new Error('Unknown or incomplete argument; see --help');
    result[k]=argv[++i];
  }
  return result;
}
async function accessToken(credentials, proxy) {
  if(credentials.type!=='authorized_user')throw new Error('Only existing authorized_user ADC is supported; no login or scope expansion is performed');
  for(const key of ['client_id','client_secret','refresh_token'])if(!credentials[key])throw new Error('Existing ADC credentials are incomplete');
  const form=new URLSearchParams({grant_type:'refresh_token',client_id:credentials.client_id,client_secret:credentials.client_secret,refresh_token:credentials.refresh_token}).toString();
  const r=await request('oauth2.googleapis.com','/token',{'Content-Type':'application/x-www-form-urlencoded'},form,proxy);
  if(r.httpStatus!==200||!r.response.access_token)throw new Error('Existing Google authorization refresh failed; HTTP '+r.httpStatus);
  return r.response.access_token;
}
function validateTarget(a) {
  const u=new URL(a.url);
  if(u.protocol!=='https:'||u.username||u.password)throw new Error('Target must be a public HTTPS URL without embedded credentials');
  if([...u.searchParams.keys()].some(k=>/token|cookie|secret|password|authorization|session|__gmitm|api.?key/i.test(k)))throw new Error('Target URL contains credential-like query parameters');
  if(a.site.startsWith('sc-domain:')){
    const domain=a.site.slice(10).toLowerCase();
    if(!domain||!(u.hostname===domain||u.hostname.endsWith('.'+domain)))throw new Error('Target is outside the domain property');
  }else{
    const property=new URL(a.site);
    if(property.origin!==u.origin||!u.pathname.startsWith(property.pathname))throw new Error('Target is outside the URL-prefix property');
  }
  if(a.country&&!/^[a-z]{3}$/i.test(a.country))throw new Error('GSC country uses a three-letter code such as usa, not Semrush us');
  if(a.device&&!['DESKTOP','MOBILE','TABLET'].includes(a.device.toUpperCase()))throw new Error('Invalid GSC device');
}

export async function main(argv=process.argv.slice(2)) {
  const a=options(argv);
  if(a.help){console.log(`Official Google Search Console read-only baseline\nnode official_gsc.mjs --url HTTPS_URL --site PROPERTY --out NEW_JSON [--days 28] [--proxy http://127.0.0.1:PORT] [--credentials ADC_PATH] [--quota-project PROJECT] [--country usa] [--device DESKTOP]\nCredentials: --credentials, GOOGLE_APPLICATION_CREDENTIALS, then standard gcloud ADC location. Only existing authorized_user ADC is supported. No login, permission changes, browser reads, CMS writes or indexing submission. Output must not exist. A COMPLETE collection can still report a page not indexed. Exit 2 means HOLD/PARTIAL_HOLD.`);return;}
  for(const key of ['url','site','out'])if(!a[key])throw new Error('--'+key+' is required');
  a.days=Number(a.days);if(!Number.isInteger(a.days)||a.days<1||a.days>365)throw new Error('--days must be 1 through 365');
  validateTarget(a);
  if(fs.existsSync(a.out))throw new Error('Output exists; choose a new file');
  const credentialsPath=a.credentials||process.env.GOOGLE_APPLICATION_CREDENTIALS||(process.env.APPDATA?path.join(process.env.APPDATA,'gcloud','application_default_credentials.json'):path.join(os.homedir(),'.config','gcloud','application_default_credentials.json'));
  const evidence={schema_version:1,checkedAt:new Date().toISOString(),source:'Official Google Search Console API; existing ADC credentials',
    mode:'LIVE_API',site:a.site,target:a.url,status:'HOLD',limits:['URL Inspection reports saved Google status, not a live test','No generic product-page request-indexing API is used','Missing query/date rows do not prove zero activity','Only finalized complete-day data is used']};
  try{
    const credentials=JSON.parse(fs.readFileSync(credentialsPath,'utf8'));
    const quota=a['quota-project']||process.env.GOOGLE_CLOUD_QUOTA_PROJECT||credentials.quota_project_id;
    const token=await accessToken(credentials,a.proxy);
    const headers={'Authorization':'Bearer '+token,'Content-Type':'application/json',...(quota?{'x-goog-user-project':quota}:{})};
    const inspectRequest={inspectionUrl:a.url,siteUrl:a.site,languageCode:'en'};
    const inspection=await request('searchconsole.googleapis.com','/v1/urlInspection/index:inspect',headers,JSON.stringify(inspectRequest),a.proxy);
    const index=inspection.response?.inspectionResult?.indexStatusResult;
    evidence.inspection={url:a.url,httpStatus:inspection.httpStatus,request:inspectRequest,...(index||{}),
      ...(inspection.httpStatus!==200||!index?{error:'URL Inspection did not return an index status'}:{}),apiResult:inspection.response?.inspectionResult};
    const analytics=async body=>({request:body,...await request('www.googleapis.com','/webmasters/v3/sites/'+encodeURIComponent(a.site)+'/searchAnalytics/query',headers,JSON.stringify(body),a.proxy)});
    const yesterday=shiftDate(ptToday(),-1);
    evidence.dataAvailability=await analytics({startDate:shiftDate(yesterday,-Math.max(a.days+7,35)),endDate:yesterday,dimensions:['date'],type:'web',dataState:'all',rowLimit:25000});
    if(evidence.dataAvailability.httpStatus!==200)throw new Error('Search Analytics availability HTTP '+evidence.dataAvailability.httpStatus);
    const metadata=evidence.dataAvailability.response.metadata;
    let latestFinal=null;
    if(!(metadata?.firstIncompleteDate||metadata?.first_incomplete_date)){
      evidence.finalAvailability=await analytics({...evidence.dataAvailability.request,dataState:'final'});
      if(evidence.finalAvailability.httpStatus!==200)throw new Error('Final data probe failed');
      latestFinal=(evidence.finalAvailability.response.rows||[]).map(r=>r.keys?.[0]).filter(x=>x&&x<=yesterday).sort().at(-1);
    }
    evidence.period=choosePeriod(metadata,yesterday,a.days,latestFinal);
    const filters=[{dimension:'page',operator:'equals',expression:a.url}];
    if(a.country)filters.push({dimension:'country',operator:'equals',expression:a.country.toLowerCase()});
    if(a.device)filters.push({dimension:'device',operator:'equals',expression:a.device.toUpperCase()});
    const base={startDate:evidence.period.startDate,endDate:evidence.period.endDate,type:'web',dataState:'final',
      dimensionFilterGroups:[{groupType:'and',filters}],aggregationType:'auto',rowLimit:25000};
    evidence.pageTotal=await analytics(base);
    evidence.pageQueries=await analytics({...base,dimensions:['query']});
    evidence.pageDates=await analytics({...base,dimensions:['date']});
    evidence.summary=totalSummary(evidence.pageTotal.response);
    evidence.status=[evidence.pageTotal,evidence.pageQueries,evidence.pageDates].every(x=>x.httpStatus===200)&&!evidence.inspection.error?'COMPLETE':'PARTIAL_HOLD';
    if((evidence.pageQueries.response.rows||[]).length===25000){evidence.queryRowsMayBeTruncated=true;evidence.status='PARTIAL_HOLD';}
  }catch(error){evidence.error=String(error.message);evidence.status=evidence.inspection||evidence.dataAvailability?'PARTIAL_HOLD':'HOLD';}
  fs.mkdirSync(path.dirname(path.resolve(a.out)),{recursive:true});
  fs.writeFileSync(a.out,JSON.stringify(evidence,null,2),{flag:'wx'});
  console.log(JSON.stringify({status:evidence.status,coverageState:evidence.inspection?.coverageState,period:evidence.period,summary:evidence.summary,out:path.resolve(a.out)}));
  if(evidence.status!=='COMPLETE')process.exitCode=2;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  main().catch(error=>{console.error('HOLD: '+error.message);process.exitCode=2;});
}
