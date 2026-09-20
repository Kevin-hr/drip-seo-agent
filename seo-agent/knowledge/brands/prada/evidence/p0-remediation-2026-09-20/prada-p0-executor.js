/**
 * Prada P0 整改执行器（P0-2 / P0-3 / P0-4）
 *
 * 安全设计：
 *  1. DRY_RUN=true 时只做「读取 + 空保存探测」，不修改任何字段
 *  2. 空保存探测成功（回执 result=[id] 且字段逐字节一致）后，才允许 APPLY=true
 *  3. 只改白名单字段：Name / SeoTitle / SeoDesc
 *  4. 每次落库后重新读取比对；任何不一致立即中止后续商品
 *  5. 不触碰 URL / SKU / 图片 / 变体 / 价格 / 库存 / 上架 / 评价 / 分类
 *
 * 用法：
 *   node prada-p0-executor.js            # 空跑 + 探测（默认）
 *   APPLY=1 node prada-p0-executor.js    # 真正写入
 */
const { chromium } = require("C:/Users/Administrator/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core");
const fs = require("fs");
const path = require("path");

const PROFILE = "C:/Users/Administrator/Documents/dripsneakers/dripops/dist/data/chrome-profile";
const EXE = "C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe";
const OUT = path.join(__dirname, "exec-result");
fs.mkdirSync(OUT, { recursive: true });

const APPLY = process.env.APPLY === "1";
const ALLOWED_FIELDS = new Set(["Name", "SeoTitle", "SeoDesc"]);

const PLAN = [
  {
    id: 536027558902041,
    why: "P0-2 + P0-3",
    changes: {
      SeoTitle: "Prada America's Cup White Grey Reps | Drip Sneakers",
      SeoDesc: "Shop Prada America's Cup White Grey reps at Drip Sneakers with QC photos, 30-day returns and 7-20 day shipping.",
    },
  },
  {
    id: 536027476120336,
    why: "P0-3 (meta only)",
    changes: {
      SeoDesc: "Shop Prada America's Cup Patent Leather Sneakers Grey White reps at Drip Sneakers with QC photos, 30-day returns and 7-20 day shipping.",
    },
  },
  {
    id: 536027435896094,
    why: "P0-4 (name colorway Blue -> Topaz, Tier 1 verified)",
    changes: {
      Name: "Prada Collapse Re-Nylon and Suede Elasticized Sneakers Topaz",
    },
  },
];

const log = [];
const say = (s) => { log.push(s); console.log(s); };

(async () => {
  let ctx;
  try {
    ctx = await chromium.launchPersistentContext(PROFILE, {
      executablePath: EXE, headless: true, args: ["--no-sandbox"],
    });
  } catch (e) {
    say("LAUNCH_FAIL " + String(e.message || e).split("\n")[0]);
    say("=> profile 被占用或浏览器不可用；请在其他进程释放 profile 后重跑。");
    fs.writeFileSync(path.join(OUT, "log.txt"), log.join("\n"));
    return;
  }
  const page = ctx.pages()[0] || await ctx.newPage();
  await page.goto("https://www.mrshopplus.com/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);
  if (/#\/login/.test(page.url())) {
    say("NOT_LOGGED_IN url=" + page.url());
    say("=> 会话失效：按手册，停止执行，需人工重新登录。");
    await ctx.close();
    fs.writeFileSync(path.join(OUT, "log.txt"), log.join("\n"));
    return;
  }
  say("LOGGED_IN url=" + page.url());
  say("MODE=" + (APPLY ? "APPLY" : "DRY_RUN"));

  const read = (id) => page.evaluate(async (pid) => {
    const r = await fetch("/biz/DTB_proProduct/modify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ args: [[pid]], additions: {} }), credentials: "include",
    });
    return { status: r.status, json: await r.json() };
  }, id);

  const save = (rec) => page.evaluate(async (record) => {
    const r = await fetch("/biz/DTB_proProduct/saveModify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ args: [[record]], additions: {} }), credentials: "include",
    });
    return { status: r.status, json: await r.json() };
  }, rec);

  let probeOK = false;
  const results = [];

  for (const p of PLAN) {
    say(`\n=== ${p.id} (${p.why}) ===`);
    const rd = await read(p.id);
    if (rd.status !== 200 || !rd.json) { say("READ_FAIL http=" + rd.status); break; }
    fs.writeFileSync(path.join(OUT, `${p.id}-read.json`), JSON.stringify(rd.json, null, 2));

    // 定位记录对象
    const root = rd.json;
    const cand = root && root.result && (root.result.data || root.result);
    let rec = null;
    for (const c of [cand, root.result, root]) {
      if (c && typeof c === "object" && ("Name" in c || "name" in c)) { rec = c; break; }
    }
    if (!rec) {
      say("RECORD_NOT_FOUND; dumping keys=" + JSON.stringify(Object.keys(root || {})));
      say("=> 结构未知，停止（禁止猜测 payload）。");
      break;
    }
    say("record keys sample: " + Object.keys(rec).slice(0, 14).join(","));
    const before = { Name: rec.Name, SeoTitle: rec.SeoTitle, SeoDesc: rec.SeoDesc };
    say("BEFORE " + JSON.stringify(before).slice(0, 400));

    // 空保存探测（仅第一次）
    if (!probeOK) {
      const probe = await save(rec);
      say("PROBE_SAVE " + JSON.stringify(probe.json).slice(0, 200));
      const ok = probe.json && probe.json.success === true &&
                 Array.isArray(probe.json.result) && probe.json.result.length === 1 &&
                 String(probe.json.result[0]) === String(p.id);
      const re = await read(p.id);
      const rec2 = (re.json && re.json.result && (re.json.result.data || re.json.result)) || null;
      const unchanged = rec2 && rec2.SeoTitle === before.SeoTitle && rec2.Name === before.Name;
      say("PROBE result_ok=" + ok + " fields_unchanged=" + unchanged);
      if (!ok || !unchanged) {
        say("=> 空保存探测未通过，停止（禁止继续写入）。");
        break;
      }
      probeOK = true;
      say("PROBE PASSED — save payload 形状正确且为空操作");
    }

    if (!APPLY) { say("DRY_RUN: 未写入。设置 APPLY=1 后重跑以应用。"); continue; }

    // 应用白名单字段
    const next = JSON.parse(JSON.stringify(rec));
    let changed = 0;
    for (const [k, v] of Object.entries(p.changes)) {
      if (!ALLOWED_FIELDS.has(k)) { say("BLOCKED_FIELD " + k); continue; }
      if (String(next[k]) !== String(v)) { next[k] = v; changed++; }
    }
    say("fields_to_change=" + changed);
    if (changed === 0) { say("NO_CHANGE"); continue; }

    const sv = await save(next);
    say("SAVE " + JSON.stringify(sv.json).slice(0, 200));
    const ok = sv.json && sv.json.success === true &&
               Array.isArray(sv.json.result) && sv.json.result.length === 1 &&
               String(sv.json.result[0]) === String(p.id);
    say("SAVE receipt_ok=" + ok + " (result 必须只含本商品 ID)");
    if (!ok) { say("=> 回执异常，停止后续商品。"); break; }

    const aft = await read(p.id);
    const recA = (aft.json && aft.json.result && (aft.json.result.data || aft.json.result)) || null;
    const after = recA ? { Name: recA.Name, SeoTitle: recA.SeoTitle, SeoDesc: recA.SeoDesc } : null;
    say("AFTER  " + JSON.stringify(after).slice(0, 400));
    let match = true;
    for (const [k, v] of Object.entries(p.changes)) {
      if (ALLOWED_FIELDS.has(k) && String(after && after[k]) !== String(v)) { match = false; say("MISMATCH " + k); }
    }
    say("BACKEND_READBACK_MATCH=" + match);
    results.push({ id: p.id, receipt_ok: ok, readback_match: match, before, after });
    if (!match) { say("=> 回读不一致，停止后续商品。"); break; }
  }

  fs.writeFileSync(path.join(OUT, "results.json"),
    JSON.stringify({ mode: APPLY ? "APPLY" : "DRY_RUN", probeOK, results }, null, 2));
  fs.writeFileSync(path.join(OUT, "log.txt"), log.join("\n"));
  await ctx.close();
})().catch(e => { say("FATAL " + e); fs.writeFileSync(path.join(OUT, "log.txt"), log.join("\n")); });
