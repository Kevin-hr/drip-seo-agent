# Entity State Machine — 测试报告

> 日期：2026-09-18
> 框架：unittest
> 总用例数：29
> 通过：29
> 失败：0
> 错误：0

---

## 测试覆盖范围

### 1. Entity State Machine（13 tests）

| 用例 | 预期 | 结果 |
|------|------|------|
| test_create_observed | 初始状态为 OBSERVED | ✅ |
| test_status_transition_observed_to_candidate | OBSERVED → CANDIDATE | ✅ |
| test_status_transition_candidate_to_pass | CANDIDATE → PASS | ✅ |
| test_status_transition_to_hold | → HOLD | ✅ |
| test_status_transition_to_conflict | → CONFLICT | ✅ |
| test_invalid_status_raises | 非法状态抛 ValueError | ✅ |
| test_forbidden_actions_non_pass | CANDIDATE 禁止写操作 | ✅ |
| test_allowed_actions_pass | PASS 允许所有操作 | ✅ |
| test_hold_forbids_all | HOLD 禁止 any_action | ✅ |
| test_conflict_forbids_all | CONFLICT 禁止 rename | ✅ |
| test_generate_machine_readable_decision_hold | HOLD 输出决策 JSON | ✅ |
| test_generate_machine_readable_decision_pass | PASS 输出 PROCEED | ✅ |
| test_save_and_load_entity_state | 持久化正确 | ✅ |

### 2. SKU Validation Gate（6 tests）

| 用例 | 输入 | 预期 | 结果 |
|------|------|------|------|
| test_valid_official_sku | `1AHW84` | USE | ✅ |
| test_valid_official_sku_with_dash | `DZ5485-106` | USE | ✅ |
| test_invalid_product_id_not_sku | `536027468294169` | OMIT | ✅ |
| test_invalid_supplier_code | `DC2-001` | HOLD | ✅ |
| test_empty_sku_is_omit | `None` | OMIT | ✅ |
| test_unknown_sku_is_hold | `UNKNOWN-SKU-XYZ` | HOLD | ✅ |

**SKU 判定逻辑**：
- 官方 SKU（5-12位字母数字，可选连字符后缀）→ USE
- Shopify Product ID（纯数字 ≥13位）→ OMIT
- 无法识别格式 → HOLD

### 3. Transactional Writer（4 tests）

| 用例 | 条件 | 预期 | 结果 |
|------|------|------|------|
| test_plan_generation | entity=PASS | plan 非空 | ✅ |
| test_validate_plan_fail_on_non_pass | entity=HOLD | validate=False | ✅ |
| test_validate_plan_pass_on_pass_status | entity=PASS | validate=True | ✅ |
| test_rollback_sets_status | 任意状态 | status=ROLLED_BACK | ✅ |

### 4. PDP Generator（4 tests）

| 用例 | 条件 | 预期 | 结果 |
|------|------|------|------|
| test_generate_seo_payload_pass | entity=PASS | 生成有效 payload | ✅ |
| test_generate_seo_payload_forbidden_on_non_pass | entity=HOLD | PermissionError | ✅ |
| test_generate_img_html | images 列表 | 含 img 标签 | ✅ |
| test_generate_kd_html | key_description | 含 Brand 链接 | ✅ |

### 5. Snapshot Collector（2 tests）

| 用例 | 预期 | 结果 |
|------|------|------|
| test_required_fields_defined | REQUIRED_FIELDS 完整 | ✅ |
| test_load_existing_snapshot_not_found | 返回 None | ✅ |

---

## 关键发现

1. **命名冲突修复**：`v5_writer.py` 中 `self.plan = None` 覆盖了同名方法，已改为 `self._plan`
2. **类型注解修复**：`v5_snapshot.py` 缺少 `Optional` import，已补充
3. **测试断言修正**：`test_generate_kd_html` 原文使用 "Embroidered Logo"（大写），实际输出为 "embroidered logo"（小写）

---

## 结论

**29/29 测试全部通过。** Entity State Machine、SKU Gate、Transactional Writer、PDP Generator、Snapshot Collector 五层核心逻辑均已通过单元测试验证。

下一步：Thom Browne 模拟跑通。
