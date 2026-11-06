#!/usr/bin/env python3
"""Local evidence processing only: no browser, credentials, network or CMS writes."""
import argparse
import csv
import hashlib
import json
import math
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

SECRET_KEYS = {'cookie', 'cookies', 'authorization', 'access_token', 'refresh_token', 'id_token', 'client_secret', 'password', '__gmitm', 'token', 'session', 'session_id', 'sessionid', 'api_key', 'apikey', 'auth', 'auth_token'}

def public_url(value):
    u = urlsplit(value)
    if u.scheme not in ('https', 'http') or not u.netloc or u.username or u.password:
        raise ValueError('Expected public HTTP(S) URL without embedded credentials')
    return urlunsplit((u.scheme, u.netloc, u.path, urlencode([(k,v) for k,v in parse_qsl(u.query) if k.lower() not in SECRET_KEYS]), ''))

def clean(value):
    if isinstance(value, dict):
        return {k: clean(v) for k,v in value.items() if k.lower() not in SECRET_KEYS}
    if isinstance(value, list): return [clean(v) for v in value]
    if isinstance(value, str) and value.startswith(('http://','https://')): return public_url(value)
    return value

def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))

def save(path, obj):
    Path(path).write_text(json.dumps(clean(obj), ensure_ascii=False, indent=2), encoding='utf-8')

def new_dir(value):
    out = Path(value).resolve()
    out.mkdir(parents=True, exist_ok=False)
    return out

def ref_path(value, base):
    if not value: return None
    p = Path(value)
    return p if p.is_absolute() else Path(base)/p

def exists(value, base):
    p = ref_path(value, base)
    return bool(p and p.is_file() and p.stat().st_size)

def fingerprint(value):
    p = Path(value).resolve()
    return {'path': str(p), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}

def number(value, kind):
    if value is None or str(value).strip().lower() in ('', 'n/a', '不可用', '-', 'hold', 'none'): return None
    text = str(value).strip().replace(',','').rstrip('%')
    factor = {'k':1000,'m':1000000}.get(text[-1:].lower(), 1)
    n = float(text[:-1] if factor != 1 else text)*factor
    if not math.isfinite(n) or n < 0 or (kind == 'kd' and n > 100): raise ValueError(f'Invalid {kind}: {value}')
    return int(n) if kind in ('volume','kd') and n.is_integer() else n

def parse_rows(raw):
    source = raw.get('keywords', raw.get('rows', [])) if isinstance(raw, dict) else raw
    if not source: raise ValueError('No keyword rows')
    if isinstance(source[0], dict):
        result = []
        for r in source:
            key = r.get('keyword', '').strip()
            if not key: raise ValueError('Empty keyword')
            result.append({'keyword':key, 'volume':number(r.get('volume',r.get('volume_us_monthly_estimate')),'volume'),
                'kd':number(r.get('kd',r.get('kd_percent')),'kd'), 'intent':r.get('intent'),
                'cpc_usd':number(r.get('cpc_usd'),'cpc')})
        if len({r['keyword'] for r in result}) != len(result): raise ValueError('Duplicate keyword rows')
        return result
    header = source[0]
    if not any(x in header.lower() for x in ('搜索量','volume')): raise ValueError('Missing table header; do not guess column positions')
    relevance = '相关性' in header or 'relevance' in header.lower()
    result = []
    for row in source[1:]:
        c = [x.strip().strip('\u200b\ufeff') for x in row.splitlines() if x.strip()]
        if len(c) < 5: raise ValueError('Incomplete DOM row')
        key = c.pop(0)
        if c and c[0] == key: c.pop(0)
        intents = []
        while c and c[0] in ('I','T','C','N'): intents.append(c.pop(0))
        if c and c[0] in ('不可用','N/A'): c.pop(0)
        if relevance: c.pop(0)
        if len(c) < 3: raise ValueError('Missing volume/KD/CPC cells')
        result.append({'keyword':key, 'volume':number(c[0],'volume'), 'kd':number(c[1],'kd'),
            'intent':'/'.join(intents) or None, 'cpc_usd':number(c[2],'cpc')})
    if len({r['keyword'] for r in result}) != len(result): raise ValueError('Duplicate keyword rows; resolve source scope before combining')
    return result

def write_keywords(out, rows, context):
    save(out/'normalized-keywords.json', {'schema_version':1,'context':context,'keywords':rows})
    with (out/'keywords.csv').open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f,fieldnames=['keyword','volume','kd','intent','cpc_usd'])
        writer.writeheader(); writer.writerows(rows)

def gsc_summary(g, target):
    errors = []
    if not g: return {'status':'HOLD','reasons':['No GSC evidence']}
    if g.get('target') != target: errors.append('GSC target URL mismatch')
    p = g.get('period', {})
    try:
        days = (date.fromisoformat(p['endDate'])-date.fromisoformat(p['startDate'])).days+1
        if days != p.get('days',28) or days < 1: errors.append('Invalid inclusive date window')
        meta = g.get('dataAvailability',{}).get('response',{}).get('metadata',{})
        incomplete = meta.get('firstIncompleteDate') or meta.get('first_incomplete_date') or p.get('firstIncompleteDate')
        if incomplete and p['endDate'] >= incomplete: errors.append('Window includes incomplete date')
        if p.get('dataState') != 'final': errors.append('Baseline is not final-only data')
    except (KeyError, ValueError, TypeError): errors.append('Missing/invalid GSC period')
    for key in ('dataAvailability','pageTotal','pageQueries','pageDates'):
        if g.get(key,{}).get('httpStatus') != 200: errors.append(f'{key} did not return HTTP 200')
    inspection = g.get('inspection',{})
    if inspection.get('error') or not inspection.get('coverageState'): errors.append('URL Inspection missing or failed')
    if g.get('status') != 'COMPLETE': errors.append('GSC collection is incomplete')
    # Page totals must be for the exact requested URL; property totals are not a page baseline.
    request = g.get('pageTotal',{}).get('request',{})
    filters = [v for group in request.get('dimensionFilterGroups',[]) for v in group.get('filters',[])]
    if not any(f.get('dimension')=='page' and f.get('operator')=='equals' and f.get('expression')==target for f in filters):
        errors.append('Missing exact page filter')
    rows = g.get('pageTotal',{}).get('response',{}).get('rows',[])
    total = rows[0] if len(rows)==1 else None
    impressions = total.get('impressions') if total else None
    return {'status':'HOLD' if errors else 'PASS','reasons':errors,'coverage_state':inspection.get('coverageState'),
        'last_crawl':inspection.get('lastCrawlTime'),'period':p,
        'impressions':impressions,'clicks':total.get('clicks') if total else None,
        'position':total.get('position') if total and impressions and impressions>0 else None,
        'scope':'Read actual request filters; do not equate all-country/device totals with Semrush market data',
        'inspection_kind':'Saved Google inspection state; not a live test'}

def evaluate(rows, context, primary, review=None, gsc=None, plan=None, base='.', mode='EVIDENCE_REVIEW'):
    c = context
    missing = [k for k in ('target_url','country','language','device','observed_at','metrics_updated') if not c.get(k)]
    reasons = [f'Missing context.{k}' for k in missing]
    if not exists(c.get('evidence_path'),base): reasons.append('Source evidence file missing')
    if not exists(c.get('screenshot_path'),base): reasons.append('Screenshot evidence missing')
    matches = [r for r in rows if r['keyword']==primary]
    if len(matches)!=1: raise ValueError('Primary keyword must occur exactly once in source rows')
    chosen = matches[0]
    if chosen['volume'] is None: reasons.append('Primary search volume unavailable')
    if chosen['kd'] is None: reasons.append('Primary KD unavailable; cannot claim low competition')
    serp_reasons = []
    if not review: serp_reasons.append('No structured observed SERP review')
    else:
        for k,v in (('keyword',primary),('country',c.get('country')),('device',c.get('device')),('target_url',c.get('target_url'))):
            if review.get(k)!=v: serp_reasons.append(f'SERP {k} mismatch')
        for k in ('manual_observation','product_match','page_type_match'):
            if review.get(k) is not True: serp_reasons.append(f'SERP {k} is not confirmed')
        for k in ('observed_at','snapshot_date','rationale'):
            if not review.get(k): serp_reasons.append(f'SERP {k} missing')
        if not exists(review.get('evidence_path'),base): serp_reasons.append('SERP evidence file missing')
        results = review.get('results',[])
        if {r.get('position') for r in results} != set(range(1,11)) or len(results)!=10:
            serp_reasons.append('Observed SERP top ten incomplete')
        if any(not r.get('url') or not r.get('page_type') for r in results): serp_reasons.append('SERP result URL/type missing')
    return {'schema_version':1,'mode':mode,'processed_at':datetime.now(timezone.utc).isoformat(),
        'source_observed_at':c.get('observed_at'),'target_url':c.get('target_url'),'context':c,
        'selected_primary':chosen,'keyword_count':len(rows),
        'keyword_data':{'status':'HOLD' if reasons else 'PASS','reasons':reasons},
        'serp_review':{'status':'HOLD' if serp_reasons else 'PASS','reasons':serp_reasons,'review':review},
        'selection_status':'EVIDENCE_SUPPORTED_TRIAL' if not reasons and not serp_reasons else 'CANDIDATE_ONLY',
        'gsc':gsc_summary(gsc,c.get('target_url')),
        'change_plan_status':'PREPARED_NOT_PUBLISHED' if plan else 'HOLD',
        'publication':{'status':'HOLD','reasons':['No verified publication evidence; a change plan is not a CMS save']},
        'business_outcome':'HOLD - no post-change observation window or verified conversions',
        'limits':['Volume is estimated demand, not site traffic','Generic KD is not domain-specific PKD or a ranking probability',
            'Do not sum synonyms, or global and country volumes','Advertising competition is separate from organic KD',
            'LOCAL_REPLAY does not perform fresh queries, authentication, publication or live verification']}

def publication_status(evidence, target, base):
    reasons = []
    if evidence.get('target_url') != target: reasons.append('Publication target mismatch')
    if evidence.get('permission') != 'ALLOWED' or evidence.get('authorized_for_publish') is not True:
        reasons.append('No current authorized publication permission')
    if evidence.get('blocked'): reasons.append('Publication remains blocked')
    for k in ('authorization_evidence_path','backup_path','save_readback_path','live_verification_path','screenshot_path'):
        if not exists(evidence.get(k),base): reasons.append(f'{k} missing')
    if exists(evidence.get('authorization_evidence_path'),base):
        try:
            authority=read_json(ref_path(evidence['authorization_evidence_path'],base))
            if not isinstance(authority,dict) or authority.get('granted') is not True or authority.get('target_url')!=target:
                reasons.append('Authorization evidence does not record granted access to this target')
        except (ValueError,OSError): reasons.append('Authorization evidence is not a valid permission record')
    for k in ('saved_at','verified_at'):
        if not evidence.get(k): reasons.append(f'{k} missing')
    try:
        if evidence.get('saved_at') and evidence.get('verified_at'):
            saved=datetime.fromisoformat(evidence['saved_at'].replace('Z','+00:00'))
            verified=datetime.fromisoformat(evidence['verified_at'].replace('Z','+00:00'))
            if verified<saved: reasons.append('Verification precedes save')
    except (ValueError,TypeError): reasons.append('Invalid save/verification timestamp')
    if exists(evidence.get('live_verification_path'),base):
        try:
            check = read_json(ref_path(evidence['live_verification_path'],base))
            if check.get('target_url') != target: reasons.append('Live verification target mismatch')
            if any(check.get('checks',{}).get(k) is not True for k in ('fields','canonical','robots','conversion_path')):
                reasons.append('Live field/technical/conversion checks not all passed')
        except (ValueError, OSError): reasons.append('Live verification is not valid JSON')
    return {'status':'VERIFIED_PUBLISHED' if not reasons else 'HOLD','reasons':reasons,'evidence':clean(evidence),
        'note':'Evidence evaluation only; this command did not publish to a CMS'}

def report(out, decision):
    d=decision; k=d['selected_primary']
    text = [f"# Single-page SEO evidence report\n\nMode: **{d['mode']}**",f"Source observed: {d['source_observed_at']}",
        f"Target: {d['target_url']}",f"Primary: `{k['keyword']}`; monthly demand estimate={k['volume']}; generic KD={k['kd']}; intent={k['intent']}",
        f"Selection: **{d['selection_status']}**. This is not actual traffic or a ranking guarantee."]
    table=['|Stage|Result|Reasons|','|---|---|---|']
    for key in ('keyword_data','serp_review','gsc','publication'):
        value=d[key];table.append(f"|{key}|{value['status']}|{' / '.join(value.get('reasons',[]))}|")
    text.append('\n'.join(table))
    text += [f"\nChange plan: {d['change_plan_status']}",f"GSC coverage: {d['gsc'].get('coverage_state','HOLD')}",
        f"GSC impressions/clicks/position: {d['gsc'].get('impressions')} / {d['gsc'].get('clicks')} / {d['gsc'].get('position')}",
        f"Business outcome: {d['business_outcome']}", '\n'+'\n'.join('- '+v for v in d['limits'])]
    (out/'REPORT.md').write_text('\n\n'.join(text)+'\n',encoding='utf-8')
    save(out/'decision.json',d)

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    commands=parser.add_subparsers(dest='command',required=True)
    init=commands.add_parser('init');init.add_argument('--target-url',required=True);init.add_argument('--country',required=True);init.add_argument('--language',required=True);init.add_argument('--out',required=True)
    imp=commands.add_parser('import-semrush');imp.add_argument('--raw',required=True);imp.add_argument('--context',required=True);imp.add_argument('--out',required=True)
    ev=commands.add_parser('evaluate');ev.add_argument('--keywords',required=True);ev.add_argument('--context',required=True);ev.add_argument('--primary',required=True);ev.add_argument('--serp-review');ev.add_argument('--gsc');ev.add_argument('--change-plan');ev.add_argument('--out',required=True)
    pub=commands.add_parser('record-publication');pub.add_argument('--decision',required=True);pub.add_argument('--evidence',required=True);pub.add_argument('--out',required=True)
    replay=commands.add_parser('replay',help='Replay the legacy 2026-11-01 evidence layout without live actions');replay.add_argument('--evidence-dir',required=True);replay.add_argument('--out',required=True);replay.add_argument('--context');replay.add_argument('--serp-review')
    a=parser.parse_args(argv)
    if a.command=='init':
        out=new_dir(a.out);save(out/'run.json',{'schema_version':1,'target_url':public_url(a.target_url),'country':a.country,'language':a.language,'status':'PREPARED','publication':'HOLD'});return
    if a.command=='import-semrush':
        context=read_json(a.context); rows=parse_rows(read_json(a.raw));out=new_dir(a.out)
        # Resolve source paths before moving context to a new output directory.
        for key in ('evidence_path','screenshot_path'):
            if context.get(key):context[key]=str(ref_path(context[key],Path(a.context).resolve().parent).resolve())
        save(out/'context.json',context);write_keywords(out,rows,context);save(out/'source-manifest.json',[fingerprint(a.raw),fingerprint(a.context)]);return
    if a.command=='record-publication':
        d=read_json(a.decision)
        if d.get('mode')=='LOCAL_REPLAY': raise ValueError('Historical replay cannot be promoted to a live publication record')
        d['publication']=publication_status(read_json(a.evidence),d['target_url'],Path(a.evidence).resolve().parent)
        out=new_dir(a.out);report(out,d);return
    if a.command=='replay':
        source=Path(a.evidence_dir).resolve();plan=read_json(source/'olivia-page-change.json')
        raw_path=source/'barcelona-olivia-cluster.json';rows=parse_rows(read_json(raw_path))
        context=read_json(a.context) if a.context else {'schema_version':1,'source':'Historical Semrush UI evidence','target_url':plan['target_url'],
            'country':plan['keyword_evidence']['database'],'language':'en','device':plan['keyword_evidence']['device'],
            'observed_at':plan['keyword_evidence']['overview_report_date'],'metrics_updated':plan['keyword_evidence']['metrics_last_updated_ui'],
            'capture_mode':'HISTORICAL_LIVE_UI','evidence_path':str(raw_path),'screenshot_path':str(source/'barcelona-olivia-keywords-us.jpg')}
        review=read_json(a.serp_review) if a.serp_review else None
        gsc=read_json(source/'gsc-page-baseline.json');primary=plan['primary_keyword'];base=Path(a.context).resolve().parent if a.context else source
        decision=evaluate(rows,context,primary,review,gsc,plan,base,'LOCAL_REPLAY')
        out=new_dir(a.out);write_keywords(out,rows,context);report(out,decision)
        save(out/'source-manifest.json',[fingerprint(raw_path),fingerprint(source/'olivia-page-change.json'),fingerprint(source/'gsc-page-baseline.json')])
    else:
        context=read_json(a.context);rows=parse_rows(read_json(a.keywords));base=Path(a.context).resolve().parent
        review=read_json(a.serp_review) if a.serp_review else None
        decision=evaluate(rows,context,a.primary,review,read_json(a.gsc) if a.gsc else None,read_json(a.change_plan) if a.change_plan else None,base)
        out=new_dir(a.out);write_keywords(out,rows,context);report(out,decision)
    print(json.dumps({'mode':decision['mode'],'selection':decision['selection_status'],'publication':decision['publication']['status'],'out':str(out)},ensure_ascii=False))

if __name__=='__main__':
    try: main()
    except (ValueError,OSError,KeyError,IndexError) as error:
        raise SystemExit(f'ERROR: {error}')
