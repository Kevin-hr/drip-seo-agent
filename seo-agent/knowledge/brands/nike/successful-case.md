---
id: knowledge.brands.nike.successful-case
kind: case-record
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
applies_to: [brand:nike, brand:jordan, category:sneakers]
evidence_status: VERIFIED_CASE_AVAILABLE
evidence_basis:
  - PROGRESS.md (air-jordan-1-106-2026-09-18)
  - FINAL-REPORT.md (同名 run)
  - BLOCKED.md (同名 run)
  - air-jordan-1-baseline.json / .csv
---

# Nike / Jordan 成功案例（knowledge/brands/nike/successful-case.md）

```text
Case Name:
  Air Jordan 1 / 106 款 SEO-PDP V4.4 批量执行
  （目前唯一在真实后台 + 真实前台 + 批量规模下完整跑通 V4.4 的案例）

Input:
  Run ID        : air-jordan-1-106-2026-09-18
  店铺          : luckdog
  范围来源      : 后台"已下架"Tab + 搜索词 "Air Jordan 1" → 共 106 条
  冻结名单      : 106 个 Product ID（air-jordan-1-baseline.json / .csv）
  首个商品      : 536027439914260（Air Jordan 11 Retro Rare Air）
  标准文件      : inputs/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
                  sha256 965314CDB899BFDDAAFD25D6E083BFF6861663C38A7860F553BE7E4B34D3E5B7

Problem:
  1. 搜索词 "Air Jordan 1" 的结果里混入 AJ11 / AJ14 等非 AJ1 商品 → 范围如何界定？
  2. 后台列表 DOM 15 条/页 = 8 页，逐页翻找易漏 → 如何保证 106/106 无遗漏？
  3. 后台登录会话曾在 2026-09-17 失效 → 单点故障
  4. 商品名含供应商噪声（(DM Batch)、引号标语、多余额色词、缺 OG）→ 必须清洗
  5. 94/106 无可用官方货号 → 如何处理 SKU 空格？
  6. 存在疑似重复商品（同名同配色同 slug）

Verification:
  1. 名单冻结：以搜索结果 106 条为全集，不自行删减
  2. 分页取数：改用 POST /biz/DTB_proProduct/queryList，50 + 50 + 6 = 106，无遗漏
  3. 视觉指纹：每款先下载主图 + 拼版判读，再锁定 Exact Entity
  4. SKU：仅 7 款使用经 Tier 4 来源确认的官方货号；其余按 V4.4 §5 完全省略
  5. 三层验收：V4.4 PASS → 后台 readback PASS → 前台 storefront 200
  6. 会话恢复：2026-09-18 恢复登录并导出 storage state 备份

Solution:
  1. 按 Batch 分批（1-30 / 31-60 / 61-90 / 91-106），逐款串行
  2. 名称清洗规则固化：剥离 (DM Batch)、去引号、删多余额色词、按需补 "OG"
  3. SKU 只写 7 款，其余 94 款走 SKU_OMIT 全链路（Title / Meta / 5th field / Schema / slug 全部无 SKU）
  4. HOLD 只用于 4 类原因：确证重复 / 无法确认 Exact Entity / 关键证据冲突 / 后台技术故障
  5. 疑重复商品（slug 冲突）转 HOLD，不上架，避免产生重复 PDP
  6. 结束后随机抽 24 款做前台逐项核验

Final Result:
  冻结            106
  PUBLISHED       101   （V4.4 PASS + readback PASS + storefront 200）
  HOLD              4   （ordinals 31 / 67 / 68 / 102）
  BLOCKED           1   （ordinal 60）
  UNPROCESSED       0
  恒等式          101 + 4 + 1 = 106  ✓

  Batch 明细      : 30/28/28/15 PUBLISHED，对应 HOLD 0/1/2/1，BLOCKED 0/1/0/0

  前台抽查         : 随机 24 款，逐条校验 HTTP 200 / title = V4.4 SEO Title /
                     canonical = 最终 URL / H1 = Product Name /
                     Product Details 恰好 5 个 li / Brand 内链可访问
                     → 24 PASS / 0 FAIL

  最终 URL 样例    :
    https://www.dripsneakers.org/air-jordan-1-retro-high-og-taxi-555088-711   （有 SKU）
    https://www.dripsneakers.org/air-jordan-1-low-dark-concord                （无 SKU）
    https://www.dripsneakers.org/travis-scott-x-air-jordan-1-low-olive        （联名无 SKU）

Reusable Rule:
  R1  范围 = 搜索结果全集。不因为"看起来不匹配"而自行剔除，也不自行扩容。
  R2  列表取数走 API 分页，不走 DOM 翻页。
  R3  SKU 使用率低是正常的（本例 7/106）；SKU_OMIT 是主路径而非退路。
  R4  名称清洗必须"减噪 + 补全"双向：剥离供应商噪声，同时补齐 OG 等规范要素。
  R5  HOLD 的判定标准只有四类原因；后台技术故障归 BLOCKED，不与身份问题混用。
  R6  疑重复商品的强信号是"生成 slug 相同"，此时优先 HOLD 而不是硬写。
  R7  完成的口径是三层（V4.4 PASS + readback PASS + storefront 200），
      任何一层缺失都不算完成。
  R8  必须随机抽查并逐项记录（本例 24/24），不接受"批量通过"的整体声称。
```

---

## 强制披露（2 件未消解 + 1 项已消解）

```text
1  【已消解】标准身份一致性
   2026-09-19 复核结论：本 run 使用的标准文件与活动标准是同一份。
   used   : inputs/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
            sha256 965314CDB899BFDDAAFD25D6E083BFF6861663C38A7860F553BE7E4B34D3E5B7
   active : standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
            sha256 965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
   依据   : docs/architecture/DECISION_LOG.md #008（2026-09-19）
   更正   : v1.0 第一版报"不是同一份"，是拿它对照了已被 #008 取代的
            _CLEAN_CONSOLIDATED（5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8）。该结论错误，已更正。

2  Description（Content）字段未修改
   任务"只允许修改"清单未包含该字段，其内仍含旧 dripsneakers.net 链接与供应商文案，
   属 V4.4 §16 的遗留偏差，未修。

3  该 run 未使用本仓库的 MCP / Bridge 通道
   它是通过后台浏览器直连执行完成的，不经过 prepare_product_v44 → execute_product_v44。
   因此它**不能作为 Bridge 写路径已验证的证据**（STATUS.md 仍记录 Write path = Not verified）。
```

## 关联文件

```text
品牌规则   : knowledge/brands/nike/brand-rules.md
SKU 模式   : knowledge/brands/nike/sku-pattern.md
类目规则   : knowledge/categories/sneakers/category-rules.md
HOLD 规则  : core/hold-policy.md
```
