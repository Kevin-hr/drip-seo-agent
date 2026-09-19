# LIVE EXECUTION READINESS CHECK

**Date:** 2026-09-18
**Scope:** P0-3 — verify the browser-driven execution path without performing any
save. **No write, no publish, no mutation** was attempted.

---

## 1. Method

The chain was exercised **read-only** by calling the bridge with an explicit live
request on the real target product:

```http
POST /api/chatgpt-mcp/products/read
{ "product_id": "536027551768089", "live": true }
```

This path enters `ChromeController` → `CdpClient` → `MrshopplusClient` and reads
the MrShopPlus admin form through the same CDP session the write path uses. It
touches no write method.

## 2. Result

```text
live read status = 200

name         = Thom Browne 4 Bar Stripe Jersey Stitch Tee Grown
slug         = Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown
is_published = false
captured_at  = 2026-09-18T11:31:00.7459172+08:00
image_count  = 11
seo_title    = ""            (empty in the backend)
```

**Chrome + CDP + admin login + read selectors all working.**

## 3. Checklist

| # | Item | Method | Result |
|---|---|---|---|
| 1 | Chrome available | `ChromeController.EnsureChromeAsync` launched/attached successfully | **PASS** |
| 2 | CDP connection works | `CdpClient` navigated and evaluated against a live page | **PASS** |
| 3 | Admin login available | the backend returned real product data rather than a login page | **PASS** |
| 4 | Read selectors verified | `ReadProductAsync` returned name, slug, published flag, image list and SEO fields from the live form | **PASS** |
| 5 | Read-back selectors mapped | `ReadSeoAsync` — present in code, used for post-write read-back | **MAPPED, NOT EXERCISED** (requires a save to be meaningful) |
| 6 | Write selectors mapped | `WriteAndSaveAsync` — present in code | **MAPPED, NOT VERIFIED** (cannot be verified without saving) |
| 7 | No save performed | no write method was invoked; the bridge was in `--mode simulate` | **CONFIRMED** |

## 4. Write-path selectors — status

These are the DOM contracts the first live write will depend on. All are
unverified against the current admin UI, because verifying them requires
executing the write.

| Selector / mechanism | Used for |
|---|---|
| `main` container present | page-context guard |
| `input[placeholder="请输入商品名称"]` | product name field |
| `window.tinymce.editors` in `main`, longest content first | description editor (carries Key Description + images) |
| native `value` setter + `input`/`change` events | framework-agnostic field writes |
| button whose text contains `编辑SEO` | opens the SEO dialog |
| dialog containing `SEO标题` with an `input`/`textarea` | SEO dialog resolution |
| `textarea.el-textarea__inner` × 3, positional | SEO title, meta description, slug |
| `.el-select__tags .el-tag` + `.el-tag__close` | clears existing keyword tags |
| `input.el-select__input` + Enter key events | adds each keyword tag |
| button matching `/确定\|保存/` inside the dialog | confirms the SEO dialog |
| `SetPublishedAndSaveAsync` flow | publish |

Each of these fails closed: a missing selector throws and the operation stops
rather than clicking something unintended. That is the correct behaviour, but it
means the first live run is also the first test of these selectors.

## 5. What this check proved and what it did not

**Proved:**
- The browser session layer works end to end against the live MrShopPlus admin.
- The admin login is currently valid.
- The read half of the client contract works against the real UI today.

**Did not prove:**
- That the write selectors still match the current admin UI.
- That the publish flow works.
- That the post-write read-back (`ReadSeoAsync`) returns what the writer expects.

## 6. Incidental finding worth recording

The live backend reports `is_published = false` for a product whose storefront
page returns HTTP 200, is indexable and has a self-canonical.

This is a genuine backend/storefront disagreement, not a stale-snapshot artifact.
It is the reason the P0-1 fix was mandatory: a fresh live snapshot still reports
`false`, so any rule that keyed URL stability off that flag would still have
silently replaced the URL. See `P0-1_URL_STABILITY_REPORT.md` §2.

## 7. Recommendation

The read path is confirmed working. The write path is mapped but untested by
construction.

The first live execution should therefore be treated as a **joint first test of
the write selectors and the write itself**, and scheduled accordingly:

- run it supervised, single product, with the review gate completed first;
- expect that a selector mismatch is the most likely failure mode;
- pre-verify the pre-write state (current name, slug, SEO fields) so that a
  partial write, if it occurs, is detectable;
- have the rollback position ready — the pre-write values are recorded in the
  plan and in `data/runs/`.

This check does not clear the write path. It removes the "is the browser session
even alive" unknown, which was the cheapest question to answer first.
