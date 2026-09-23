"""Live re-verification of every V4.5-published product on dripsneakers.org.

Reads reports/V4.5_PUBLISHED_MANIFEST.json and, for each entry, fetches the
canonical URL and checks:
  - HTTP 200
  - <h1> text equals the planned product name
  - <link rel="canonical"> equals the target URL
  - <title> equals the planned SEO title
  - <meta name="description"> equals the planned meta description
  - product schema JSON-LD present

Outputs reports/V4.5_LIVE_VERIFICATION.json + a console summary.

Usage: python tests/v45-verify-live-published.py [manifest.json]
"""
from __future__ import annotations

import concurrent.futures
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "reports", "V4.5_PUBLISHED_MANIFEST.json")
PLANS = os.path.join(ROOT, "data", "runs")
OUT = os.path.join(ROOT, "reports", "V4.5_LIVE_VERIFICATION.json")

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"
HEADERS = {"User-Agent": UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9"}

RE_H1 = re.compile(r"<h1[^>]*>(.*?)</h1>", re.I | re.S)
RE_CANON = re.compile(r'<link[^>]+rel=["\']canonical["\'][^>]*>', re.I)
RE_HREF = re.compile(r'href=["\']([^"\']+)["\']', re.I)
RE_TITLE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)
RE_METADESC = re.compile(r'<meta[^>]+name=["\']description["\'][^>]*>', re.I)
RE_CONTENT = re.compile(r'content=["\']([^"\']*)["\']', re.I)
RE_LD = re.compile(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', re.I | re.S)


def strip_tags(value: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", value or "")).strip()


def norm(value: str) -> str:
    """Normalise for comparison: collapse whitespace, unify dashes/quotes."""
    value = html.unescape(value or "")
    value = value.replace("\u2013", "-").replace("\u2014", "-").replace("\u2019", "'")
    return re.sub(r"\s+", " ", value).strip()


def fetch(url: str, timeout: int = 30):
    request = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8", errors="replace")
            return response.status, body, None
    except urllib.error.HTTPError as exc:
        return exc.code, "", f"HTTP {exc.code}"
    except Exception as exc:  # noqa: BLE001
        return 0, "", f"{type(exc).__name__}: {exc}"


def check(entry: dict) -> dict:
    url = entry["target_url"]
    status, body, error = fetch(url)
    result = {
        "product_id": entry["product_id"],
        "product_name": entry["product_name"],
        "url": url,
        "http_status": status,
        "network_error": error,
        "h1": None,
        "h1_match": False,
        "canonical": None,
        "canonical_match": False,
        "title": None,
        "title_match": False,
        "meta_description_match": False,
        "schema_types": [],
        "schema_sku": None,
        "schema_sku_is_pid": False,
        "h1_count": 0,
        "pass": False,
    }
    if status != 200:
        return result

    h1 = norm(strip_tags((RE_H1.search(body) or [None, ""])[1]))
    result["h1"] = h1
    result["h1_match"] = h1 == norm(entry["product_name"])

    canon_tag = RE_CANON.search(body)
    canonical = None
    if canon_tag:
        href = RE_HREF.search(canon_tag.group(0))
        canonical = href.group(1) if href else None
    result["canonical"] = canonical
    result["canonical_match"] = bool(canonical) and canonical.rstrip("/") == url.rstrip("/")

    title = norm(strip_tags((RE_TITLE.search(body) or [None, ""])[1]))
    result["title"] = title
    expected_title = norm(entry.get("seo_title") or "")
    result["title_match"] = bool(expected_title) and title == expected_title

    meta_tag = RE_METADESC.search(body)
    meta = norm((RE_CONTENT.search(meta_tag.group(0)) or [None, ""])[1]) if meta_tag else ""
    result["meta_description_match"] = bool(entry.get("meta_description")) and meta == norm(entry["meta_description"])

    types = []
    for block in RE_LD.findall(body):
        try:
            data = json.loads(block.strip())
        except Exception:  # noqa: BLE001
            continue
        nodes = data.get("@graph", [data]) if isinstance(data, dict) else data
        stack = nodes if isinstance(nodes, list) else [nodes]
        while stack:
            node = stack.pop()
            if isinstance(node, dict):
                node_type = node.get("@type")
                if node_type:
                    types.extend(node_type if isinstance(node_type, list) else [node_type])
                if node_type == "Product" or (isinstance(node_type, list) and "Product" in node_type):
                    result["schema_sku"] = str(node.get("sku")) if node.get("sku") is not None else None
                stack.extend(node.values())
            elif isinstance(node, list):
                stack.extend(node)
    result["schema_types"] = sorted({str(t) for t in types})
    result["schema_sku_is_pid"] = result["schema_sku"] == entry["product_id"]
    result["h1_count"] = len(re.findall(r"<h1\b", body, re.I))

    result["pass"] = all([
        result["h1_match"],
        result["canonical_match"],
        result["title_match"],
    ])
    return result


def main() -> int:
    with open(MANIFEST, encoding="utf-8") as handle:
        manifest = json.load(handle)
    global pid_example
    pid_example = manifest[0]["product_id"] if manifest else "n/a"
    print(f"manifest entries: {len(manifest)}")

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(check, manifest))

    passed = [r for r in results if r["pass"]]
    failed = [r for r in results if not r["pass"]]

    print(f"PASS: {len(passed)}   FAIL: {len(failed)}")
    if failed:
        print("\n--- FAILURES ---")
        for r in failed:
            print(f"  {r['product_id']} {r['url']}")
            print(f"    status={r['http_status']} err={r['network_error']}")
            print(f"    h1_match={r['h1_match']} canon_match={r['canonical_match']} title_match={r['title_match']}")
            if r["h1"]:
                expected = next(e["product_name"] for e in manifest if e["product_id"] == r["product_id"])
                print(f"    h1 live='{r['h1']}' expected='{expected}'")

    total = len(results)
    meta_ok = sum(1 for r in results if r["meta_description_match"])
    schema_ok = sum(1 for r in results if "Product" in r["schema_types"])
    sku_is_pid = sum(1 for r in results if r["schema_sku_is_pid"])
    multi_h1 = sum(1 for r in results if r["h1_count"] > 1)
    print(f"meta_description match : {meta_ok}/{total}")
    print(f"Product schema present : {schema_ok}/{total}")
    print(f"P1 schema.sku == PID   : {sku_is_pid}/{total}")
    print(f"P1 pages with >1 <h1>  : {multi_h1}/{total}")

    with open(OUT, "w", encoding="utf-8") as handle:
        json.dump(results, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(f"wrote: {os.path.relpath(OUT, ROOT)}")

    md = [
        "# V4.5 Live Verification - published products",
        "",
        f"**Generated:** {__import__('datetime').datetime.now().isoformat(timespec='seconds')}",
        f"**Target site:** https://www.dripsneakers.org/",
        f"**Products checked:** {total}",
        "",
        "## Result",
        "",
        "| Check | Pass |",
        "|---|---|",
        f"| HTTP 200 | {sum(1 for r in results if r['http_status'] == 200)}/{total} |",
        f"| H1 == planned product name | {sum(1 for r in results if r['h1_match'])}/{total} |",
        f"| canonical == planned slug | {sum(1 for r in results if r['canonical_match'])}/{total} |",
        f"| title == planned SEO title | {sum(1 for r in results if r['title_match'])}/{total} |",
        f"| meta description == planned | {meta_ok}/{total} |",
        f"| Product schema present | {schema_ok}/{total} |",
        f"| **Overall PASS** | **{len(passed)}/{total}** |",
        "",
        "## Platform-level issues observed on these pages (not per-product defects)",
        "",
        "| Issue | Count | Impact |",
        "|---|---|---|",
        f"| `Product.sku` emits the Drip Product ID instead of the real SKU | {sku_is_pid}/{total} | Google Merchant / schema consumers read `{pid_example}` as the SKU, not the real style code |",
        f"| Product page renders more than one `<h1>` | {multi_h1}/{total} | Dilutes the page's primary heading signal |",
        "",
        "These are template/serializer defects, so they affect every product on the site and cannot be fixed by the PDP write pipeline.",
        "",
        "## Per-product detail",
        "",
        "| # | Product | URL | status | h1 | canonical | title | meta | schema.sku | h1# |",
        "|---|---|---|---|---|---|---|---|---|---|",
    ]
    for index, r in enumerate(results, 1):
        tick = lambda flag: "OK" if flag else "FAIL"  # noqa: E731
        md.append(
            f"| {index} | {r['product_name']} | {r['url']} | {r['http_status']} | "
            f"{tick(r['h1_match'])} | {tick(r['canonical_match'])} | {tick(r['title_match'])} | "
            f"{tick(r['meta_description_match'])} | {r['schema_sku'] or '-'} | {r['h1_count']} |"
        )
    md_path = os.path.join(ROOT, "reports", "V4.5_LIVE_VERIFICATION.md")
    with open(md_path, "w", encoding="utf-8") as handle:
        handle.write("\n".join(md) + "\n")
    print(f"wrote: {os.path.relpath(md_path, ROOT)}")
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
