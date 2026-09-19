---
id: seo-core.tests.readme
kind: index
version: 1.0.0
status: ACTIVE
schema: agent-readable-v1
suite: seo-core-conformance-v1
cases: 10
checks: 93
---

# Core 一致性测试集

## 为什么需要它

未来会有多个 Agent 读这套 Core：ChatGPT、Trae、Claude、Qwen、MCP Agent。
如果每个 Agent 各自理解规则，Core 就等于不存在。

**同一套测试 = 同一套语义。**

```text
不是"读过这份文档"
而是"通过这套测试"
```

## 运行

```bash
node seo-core/tests/run-core-tests.mjs
```

```text
退出码 0 = 全部通过（期望 93 项检查）
退出码 1 = 有断言不匹配，或结构违规
```

无依赖、不需要网络、不需要后台。

## 两个文件

```text
test-cases-v1.json     10 个案例，机器可读（输入是证据事实，不是期望值）
run-core-tests.mjs     参考实现 + 断言
```

关键设计：**案例输入描述"有哪些证据"，不由案例直接写死结论。**
结论由参考实现按规则推导。这样测试才是在验证规则，而不是在验证我的预期。

## 10 个案例各自在防什么

| 案例 | 场景 | 期望终态 | 防的是什么 |
|---|---|---|---|
| TC-001 | Prada America's Cup，Tier 1 官方码 | PASS / VERIFIED_SKU | 正常路径必须真的能过 |
| TC-002 | 实体清楚但全无官方码 | PASS / SKU_OMIT；strict 下 HOLD | 策略分叉必须显式可见 |
| TC-003 | 只有供应商批次后缀 `-DC2` | HOLD / SKU_OMIT | 供应商噪声不得进入生成 |
| TC-004 | 视觉色被当成官方配色 | HOLD | 视觉色 ≠ 官方配色 |
| TC-005 | 内部目录码 `DS-PRA-010` 当 SKU | PASS / SKU_OMIT | Prada 的头号教训 |
| TC-006 | 平台商品 ID 被谎报成官方码 | PASS / SKU_OMIT | 结构防线（第二道） |
| TC-007 | 一个货号挂两个实体 | HOLD / SKU-CONFLICT | 同码两货 = 两货皆不可用 |
| TC-008 | 两个商品生成同一 slug | HOLD / DUP-SAME-SLUG | 最强重复信号 |
| TC-009 | 历史"已验证"未重新取证 | HOLD / EVD-* | 旧 PASS 不可继承 |
| TC-010 | Core 通过但前台验证失败 | ROLLBACK | 保存成功 ≠ 完成 |

## 三条元规则（也在被测试）

```text
META standard-hash-complete     标准哈希必须是完整 64 位十六进制（截断的哈希不可复核）
META standard-hash-matches-core 测试集与参考实现对标准哈希的认定必须一致
META case-count                 案例数必须是 10
```

再加上一条跨全案例的不变式：

```text
final_status != PASS  →  outputs 必须为 null
```

即：**不通过就不许生成**。这条在 6 个非 PASS 案例上逐一被断言。

## 如何新增案例

```text
1  在 test-cases-v1.json 的 cases 里追加一项
2  必填 id / title / source / why / sku_policy / input / expect
3  input 只描述证据事实，不写结论
4  expect 至少含 final_status / sku_verdict / hold_codes / action_permission
5  运行 runner，全绿后才可提交
6  若新增了原因码，必须同步更新 04-hold-decision.md §4 的枚举
```

```text
RULE-ID: TEST-01
IF 新增了 hold_code 但未登记进 04-hold-decision.md §4
THEN 该原因码不可被机器消费
OUTPUT HOLD

RULE-ID: TEST-02
IF 为了让测试通过而放宽规则
THEN 违反 Core 的定义（Core 的存在就是为了拦住东西）
OUTPUT HOLD
```

## 已知的实现取舍（如实记录）

```text
1  案例输入未提供 official_product_name 时，参考实现按
   "{brand} {model} {colorway}" 组合。契约本身优先使用显式的官方商品名，
   测试数据为了简洁省略了它，因此个别案例打印出的示例名不是线上真实名称。
   这不影响任何断言（断言只检查结构与一致性）。

2  参考实现的 slug 规则会删除撇号而非转成连字符
   （Prada Americas Cup，不是 prada-america-s-cup）。
   这是运行测试时发现并修掉的真实缺陷，保留记录。

3  TC-002 同时断言两种 policy，因此本套件不对 policy 选择表态 ——
   它只保证"选哪个都必须一致"。
```
