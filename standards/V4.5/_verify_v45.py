# -*- coding: utf-8 -*-
"""Verify the V4.5 merged revision loses nothing from V4.4."""
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
V44 = os.path.join(HERE, "..", "V4.4", "Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md")
V45 = os.path.join(HERE, "Drip_Sneakers_SEO-PDP_V4.5_CLEAN_CONSOLIDATED_2026-09-21.md")


def read(p):
    with io.open(p, encoding="utf-8") as fh:
        return fh.read()


a44 = read(V44)
a45 = read(V45)

fails = []

# --- 1. every V4.4 heading survives -----------------------------------------
h44 = re.findall(r"^#{1,3} .+$", a44, flags=re.M)
h45set = set(re.findall(r"^#{1,3} .+$", a45, flags=re.M))

missing_headings = []
for h in h44:
    if h in h45set:
        continue
    # allowed retitles
    if h == "# Drip Sneakers\uff5cSEO-PDP V4.4 STANDARD \u2014 FINAL" and \
            "# Drip Sneakers\uff5cSEO-PDP V4.5 STANDARD \u2014 FINAL" in h45set:
        continue
    if h == "# 1. V4.4 Upgrade from V4.3" and "# 1. V4.5 Upgrade from V4.4" in h45set:
        continue
    if h == "# 2. Mandatory Execution Order" and "# 2. Mandatory Execution Order V4.5" in h45set:
        continue
    if h == "# 26. V4.4 Final Gate" and "# 26. V4.5 Final Gate" in h45set:
        continue
    if h == "# 27. V4.4 Final Rules" and "# 27. V4.5 Final Rules" in h45set:
        continue
    missing_headings.append(h)

print("V4.4 headings: %d" % len(h44))
print("retitled/absorbed: %d" % (len(h44) - len(missing_headings)))
if missing_headings:
    for h in missing_headings:
        fails.append("HEADING MISSING: " + h)
        print("  !! MISSING %s" % h)
else:
    print("  ok  all V4.4 headings accounted for")

# --- 2. new V4.5 sections present -------------------------------------------
required_new = [
    "# 3A. Image Fingerprint Hard Gate",
    "# 4A. Entity Confidence Status",
    "# 5B. SKU Field Isolation",
    "# 15A. Brand Architecture Layer",
    "# 17A. Batch Agent Execution Mode",
    "# 23A. Machine-Executable vs Human-Attested Validation",
]
print("\nV4.5 new sections:")
for h in required_new:
    if h in a45:
        print("  ok  %s" % h)
    else:
        fails.append("NEW SECTION MISSING: " + h)
        print("  !! MISSING %s" % h)

# --- 3. load-bearing V4.4 clauses still present ------------------------------
clauses = {
    "source priority T1": "Tier 1 \u2014 Brand Official / Authorized Retailer",
    "source priority T8": "Tier 8 \u2014 Image Recognition Only",
    "5a pass without sku": "A verified product entity does not require a public retail SKU in order to be publishable.",
    "gender ban list": "Women / Women's / WMNS",
    "keywords comma rule": "Use commas.",
    "meta info priority": "## Information priority",
    "meta identity exception": "## Identity-critical exception",
    "meta unsupported guard": "## Unsupported-claim guard",
    "meta reference impl": "1ABMHV",
    "url stability rule": "## Existing live PDP \u2014 stability rule",
    "backend placement layer": "# 11. V4.4 Backend Placement Layer",
    "key desc html template": "<li><strong>SKU or Product-Specific Fact:</strong> [Verified Value]</li>",
    "no redundant repeat": "# 13. No Redundant Product-Name Repetition",
    "crawlability gate": "# 17. Crawlability Hard Gate",
    "pdp vs backend desc": "# 19. PDP Description vs Backend \"Description\"",
    "user decision layer": "# 22. User Decision Layer",
    "three-pass audit": "# 23. V4.4 Three-Pass Audit",
    "hellstar reference": "# 24. Current Hellstar Reference Implementation",
    "output order": "# 25. Standard Final SEO-PDP Output Order",
    "hellstar key desc": "https://www.dripsneakers.org/Hellstar-T-Shirts/",
    "sku forbidden values": "SKU: Not verified",
    "sample hard rules": "Do not infer a sample SKU from a released sibling model",
}
print("\nV4.4 load-bearing clauses:")
for label, needle in clauses.items():
    if needle in a45:
        print("  ok  %s" % label)
    else:
        fails.append("CLAUSE MISSING: %s" % label)
        print("  !! MISSING %s" % label)

# --- 4. gate items preserved in the new gate --------------------------------
gate_items = [
    "Image Fingerprint PASS",
    "Exact Entity PASS",
    "Entity Confidence PASS",
    "Source Priority PASS",
    "SKU Governance PASS",
    "User Decision PASS",
    "SERP Decision PASS",
    "Meta Description Assurance PASS",
    "Key Description Placement PASS",
    "5-Field Product Details PASS",
    "Brand Architecture PASS",
    "Description Image-Only PASS",
    "Crawlability PASS",
    "Machine Validation PASS",
    "Human Attestation PASS",
    "Three-Pass Audit PASS",
]
print("\nFinal gate items:")
for needle in gate_items:
    if needle in a45:
        print("  ok  %s" % needle)
    else:
        fails.append("GATE ITEM MISSING: " + needle)
        print("  !! MISSING %s" % needle)

# --- 5. markdown fence balance ----------------------------------------------
fences = a45.count("```")
print("\nfence count: %d (%s)" % (fences, "even" if fences % 2 == 0 else "ODD -> broken"))
if fences % 2:
    fails.append("UNBALANCED MARKDOWN FENCES")

print("\nlines  %d" % len(a45.splitlines()))
print("bytes  %d" % len(a45.encode("utf-8")))

if fails:
    print("\nRESULT: FAIL (%d issue(s))" % len(fails))
    sys.exit(1)
print("\nRESULT: PASS - no V4.4 clause lost")
