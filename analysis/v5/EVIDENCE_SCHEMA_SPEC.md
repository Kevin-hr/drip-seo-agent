# Evidence Schema Specification — V5.1

> 日期：2026-09-18
> 版本：V5.1-DRAFT
> 状态：**待审批**（不修改任何现有代码）

---

## 一、设计原则

### 1.1 不改变现有 Schema

- `entity_state.json` 的现有字段保持完全不变
- 新增字段以 `v5_evidence` 命名空间隔离，不污染现有结构
- 所有新字段都是可选的，未填充时不影响现有逻辑

### 1.2 证据分层

```
Visual Evidence     → 来自图片观察（Vision Provider）
Identity Evidence   → 来自外部验证（Entity Resolver）
Source Evidence     → 来自来源验证（Source Validator）
```

### 1.3 置信度驱动

每个证据字段都包含 `confidence`（0.0-1.0），PASS 判定基于阈值而非硬编码。

---

## 二、Visual Evidence Schema

### 2.1 完整结构

```json
{
  "vision_model": "openai-gpt4o",
  "images_analyzed": 12,
  "timestamp": "2026-09-18T10:00:00Z",
  "processing_time_ms": 3500,

  "base_color_visual": {
    "observed": "light blue",
    "confidence": 0.92,
    "evidence": "7/12 images show dominant light blue hue (rgb ~180,200,220)",
    "color_histogram": {
      "dominant_hue": 210,
      "saturation_range": [0.15, 0.35],
      "brightness_range": [0.7, 0.9]
    }
  },
  "silhouette": {
    "observed": "shorts",
    "confidence": 0.97,
    "evidence": "leg length < 50% of total garment height in all views"
  },
  "logo": {
    "present": true,
    "type": "embroidery",
    "color_visual": "blue",
    "position": "left thigh",
    "confidence": 0.88,
    "evidence": "raised texture visible in image 03, 07, 11",
    "size_estimate": "approximately 8cm x 5cm"
  },
  "pattern": {
    "observed": "solid",
    "confidence": 0.95,
    "evidence": "no repeating motif detected across 12 images"
  },
  "material_visual": {
    "observed": "cotton",
    "confidence": 0.75,
    "evidence": "fabric texture consistent with cotton jersey",
    "uncertain": true
  },
  "uncertain_features": [
    "exact shade name unverifiable without brand reference",
    "material composition cannot be determined from images alone"
  ],
  "raw_vision_output": {
    "model": "gpt-4o",
    "prompt_used": "build_visual_prompt(...)",
    "response_text": "...",
    "parsed_json": {
      "garment_type": "shorts",
      "base_color_visual": "light blue",
      ...
    }
  }
}
```

### 2.2 字段约束

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `vision_model` | string | ✅ | 使用哪个模型 |
| `images_analyzed` | int | ✅ | 分析了多少张图片 |
| `base_color_visual` | object | ✅ | 主色观察 |
| `silhouette` | object | ✅ | 版型观察 |
| `logo` | object | ❌ | logo 观察（可能无 logo） |
| `pattern` | object | ✅ | 图案观察 |
| `uncertain_features` | array | ✅ | 不确定的特征列表 |
| `raw_vision_output` | object | ❌ | 原始输出（调试用） |

### 2.3 子字段规范

#### base_color_visual

```json
{
  "observed": "string",        // 视觉描述，如 "black", "light blue", "navy"
  "confidence": 0.0-1.0,       // 置信度
  "evidence": "string"         // 支持证据
}
```

**规则**：
- 禁止使用品牌官方颜色名（如 "Bleu Glacier"）
- 必须使用视觉描述（如 "light blue"）
- confidence < 0.7 时，observed 字段标记为 "unclear"

#### silhouette

```json
{
  "observed": "string",        // "T-Shirt", "Shorts", "Hoodie", "Jeans" 等
  "confidence": 0.0-1.0,
  "evidence": "string"
}
```

#### logo

```json
{
  "present": boolean,
  "type": "string",            // "embroidery", "print", "patch", "embossed"
  "color_visual": "string",    // 视觉颜色描述
  "position": "string",        // "front center", "left chest", "back" 等
  "confidence": 0.0-1.0,
  "evidence": "string"
}
```

#### pattern

```json
{
  "observed": "string",        // "solid", "striped", "monogram", "camouflage" 等
  "confidence": 0.0-1.0,
  "evidence": "string"
}
```

---

## 三、Identity Evidence Schema

### 3.1 完整结构

```json
{
  "brand": {
    "observed": "Louis Vuitton",
    "verified": true,
    "confidence": 0.95,
    "sources": [
      {
        "url": "https://www.stockx.com/louis-vuitton-embroidery-t-shirt",
        "match_type": "name_similarity",
        "match_score": 0.95,
        "trusted": true
      },
      {
        "url": "https://www.dripsneakers.org/Louis-Vuitton/",
        "match_type": "internal_brand_page",
        "trusted": true
      }
    ]
  },
  "model": {
    "observed": "Embroidery T-Shirt",
    "verified": true,
    "confidence": 0.90,
    "sources": [
      {
        "url": "https://www.stockx.com/...",
        "match_type": "name_similarity",
        "match_score": 0.90
      }
    ]
  },
  "sku": {
    "observed": null,
    "verified": false,
    "confidence": 0.0,
    "decision": "OMIT",
    "reason": "No official SKU found across StockX/GOAT/brand site",
    "alternative_id": {
      "type": "shopify_product_id",
      "value": "536027468294169",
      "confidence": 1.0,
      "note": "Platform-internal ID, not a product SKU"
    },
    "sources": []
  },
  "colorway_official": {
    "observed": null,
    "verified": false,
    "confidence": 0.0,
    "decision": "USE_VISUAL_DESCRIPTION",
    "reason": "Official color name not found; using visual description 'Light Blue'",
    "visual_alternative": "Light Blue",
    "sources": []
  },
  "cross_reference": {
    "stockx_match": null,
    "goat_match": null,
    "brand_site_match": null,
    "notes": "No external match found"
  },
  "product_type": {
    "observed": "T-Shirt",
    "verified": true,
    "confidence": 0.97,
    "sources": [
      {
        "url": "https://www.stockx.com/...",
        "match_type": "category_match"
      }
    ]
  }
}
```

### 3.2 字段约束

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `brand` | object | ✅ | 品牌识别 |
| `model` | object | ✅ | 型号识别 |
| `sku` | object | ✅ | SKU 处理 |
| `colorway_official` | object | ✅ | 官方颜色名 |
| `cross_reference` | object | ✅ | 交叉引用结果 |
| `product_type` | object | ✅ | 产品类型 |

### 3.3 SKU 决策逻辑

```python
# evidence_schema.py
SKU_DECISION_RULES = {
    "official_sku_format": r'^[A-Z0-9]{5,12}(-[A-Z0-9]+)?$',
    "shopify_product_id_length": 13,
    "decisions": {
        "USE": "Official SKU format matched",
        "OMIT": "No official SKU found; using platform internal ID",
        "HOLD": "Unverifiable SKU format; requires human review"
    }
}
```

**决策流程**：
1. 如果 LLM 返回的 SKU 匹配官方格式 → `decision: "USE"`
2. 如果 LLM 无法找到官方 SKU → `decision: "OMIT"`（不阻塞 PASS）
3. 如果 SKU 格式无法识别 → `decision: "HOLD"`（阻塞 PASS）

### 3.4 颜色决策逻辑

```python
COLORWAY_DECISION_RULES = {
    "official_name_found": "USE_OFFICIAL",     # 找到官方颜色名
    "visual_only": "USE_VISUAL_DESCRIPTION",    # 仅用视觉描述
    "unverified": "HOLD"                        # 无法验证
}
```

**规则**：
- 优先使用官方颜色名（如 "Bleu Glacier"）
- 如果找不到官方名称，使用视觉描述（如 "Light Blue"）
- 不允许 AI 猜测官方颜色名

---

## 四、Source Validator Schema

### 4.1 完整结构

```json
{
  "url": "https://www.stockx.com/...",
  "source_type": "stockx",
  "trusted": true,
  "confidence": 1.0,
  "validation": {
    "domain_verified": true,
    "ssl_valid": true,
    "content_check": "product_page_detected"
  },
  "last_checked": "2026-09-18T10:00:00Z"
}
```

### 4.2 可信来源白名单

| source_type | URL 模式 | trusted |
|-------------|----------|---------|
| `stockx` | `stockx.com/*` | ✅ |
| `goat` | `goat.com/*` | ✅ |
| `brand` | `louisvuitton.com/*`, `balenciaga.com/*`, `dior.com/*` | ✅ |
| `dripsneakers` | `dripsneakers.org/*` | ✅ |
| `yupoo` | `yupoo.com/*` | ⚠️ 需人工确认 |
| `unknown` | 其他 | ❌ |

---

## 五、PASS 判定逻辑详细规范

### 5.1 判定函数

```python
def evaluate_evidence_pass(entity_state: dict) -> dict:
    """
    评估证据是否满足 PASS 条件

    返回:
    {
        "pass": bool,
        "gaps": List[str],           # 缺失的证据项
        "details": dict,             # 各字段置信度
        "sku_decision": str          # SKU 决策：USE/OMIT/HOLD
    }
    """
```

### 5.2 判定条件表

| 检查项 | 条件 | 置信度阈值 | 失败后果 |
|--------|------|-----------|----------|
| brand_verified | identity.brand.verified == true | >= 0.90 | gaps.append("brand_not_verified") |
| model_verified | identity.model.verified == true | >= 0.80 | gaps.append("model_not_verified") |
| product_type_confirmed | visual.silhouette.observed != null | >= 0.85 | gaps.append("product_type_not_confirmed") |
| colorway_confirmed | visual.base_color_visual.observed != null | >= 0.80 | gaps.append("colorway_not_confirmed") |
| sku_decision | identity.sku.decision in ["USE", "OMIT"] | - | gaps.append("sku_hold") 如果 HOLD |

### 5.3 PASS 判定表

| brand | model | product_type | colorway | sku | 结果 |
|-------|-------|--------------|----------|-----|------|
| ✅ | ✅ | ✅ | ✅ | USE | **PASS** |
| ✅ | ✅ | ✅ | ✅ | OMIT | **PASS** |
| ✅ | ✅ | ✅ | ✅ | HOLD | HOLD |
| ✅ | ✅ | ✅ | ❌ | - | CANDIDATE |
| ✅ | ❌ | - | - | - | CANDIDATE |
| ❌ | - | - | - | - | HOLD |

### 5.4 状态转换规则

```python
def determine_next_status(evaluation: dict, current_status: str) -> str:
    """
    根据评估结果确定下一步状态

    规则：
    - pass=True → PASS
    - pass=False, gaps=["sku_hold"] → HOLD（等待人工裁决）
    - pass=False, gaps 有其他项 → CANDIDATE（需要更多证据）
    - 当前已是 PASS → 保持 PASS
    """
```

---

## 六、Vision Provider Prompt 规范

### 6.1 标准 Prompt 模板

```python
VISION_PROMPT_TEMPLATE = """
你是一名商品视觉分析师。你的任务是对以下 {image_count} 张商品图片进行**纯观察**，不做推断。

商品名称（供应商原始）：{product_name}

请输出以下字段（JSON 格式）：

{{
  "garment_type": "观察到的服装类型（T-Shirt / Shorts / Hoodie / etc.）",
  "base_color_visual": "裤身/衣身主色（用英文描述，如：black / white / light blue / navy）",
  "logo_presence": "是否有 logo（yes / no）",
  "logo_type": "logo 类型（embroidery / print / patch / etc.）",
  "logo_color_visual": "logo 颜色（用英文描述）",
  "logo_position": "logo 位置（front center / left chest / back / etc.）",
  "pattern": "图案描述（solid / striped / monogram / etc.）",
  "uncertain_features": ["不确定的视觉特征列表"],
  "confidence_notes": "你对哪些观察不确定（简要说明）"
}}

规则：
1. 只输出你**亲眼看到**的内容，不要猜测官方产品名或颜色名。
2. 如果某字段看不清，输出 "unclear" 并放入 uncertain_features。
3. 禁止使用品牌官方颜色名（如 "Bleu Glacier"），只用视觉描述。
4. 输出纯 JSON，不要有其他文字。
"""
```

### 6.2 响应解析规范

```python
def parse_vision_response(raw_response: str) -> dict:
    """
    解析 Vision API 响应，提取结构化观察结果

    如果解析失败，返回空观察结果并记录错误
    """
```

---

## 七、Entity Resolver Prompt 规范

### 7.1 标准 Prompt 模板

```python
ENTITY_PROMPT_TEMPLATE = """
你是一名商品实体识别专家。你的任务是根据提供的信息，识别商品的 exact entity。

【供应商信息】
- 产品名称：{product_name}
- 产品 ID：{product_id}
- 价格：{price}

【视觉观察】
- 服装类型：{garment_type}
- 主色（视觉描述）：{base_color_visual}
- Logo 类型：{logo_type}
- Logo 位置：{logo_position}

【任务】
请搜索并验证以下信息（输出 JSON）：

{{
  "brand": {{
    "observed": "品牌名",
    "verified": true/false,
    "confidence": 0.0-1.0,
    "sources": [{{"url": "...", "match_type": "..."}}]
  }},
  "model": {{
    "observed": "型号名",
    "verified": true/false,
    "confidence": 0.0-1.0,
    "sources": [{{"url": "...", "match_type": "..."}}]
  }},
  "sku": {{
    "observed": "SKU 或 null",
    "verified": true/false,
    "confidence": 0.0-1.0,
    "decision": "USE/OMIT/HOLD",
    "reason": "决策原因"
  }},
  "colorway_official": {{
    "observed": "官方颜色名或 null",
    "verified": true/false,
    "decision": "USE_OFFICIAL/USE_VISUAL_DESCRIPTION/HOLD",
    "visual_alternative": "视觉描述颜色"
  }},
  "cross_reference": {{
    "stockx_match": null or {{...}},
    "goat_match": null or {{...}},
    "brand_site_match": null or {{...}}
  }}
}}

规则：
1. 必须提供证据来源 URL
2. 如果无法验证，decision 设为 HOLD 或 OMIT
3. 不要猜测官方 SKU 或颜色名
4. 输出纯 JSON
"""
```

---

## 八、Mock 数据规范（用于测试）

### 8.1 Mock Vision Response

```json
{
  "vision_model": "mock",
  "images_analyzed": 3,
  "base_color_visual": {
    "observed": "black",
    "confidence": 0.95,
    "evidence": "Mock: dominant dark pixels in all images"
  },
  "silhouette": {
    "observed": "T-Shirt",
    "confidence": 0.97,
    "evidence": "Mock: short sleeves, crew neck detected"
  },
  "logo": {
    "present": true,
    "type": "embroidery",
    "color_visual": "white",
    "position": "left chest",
    "confidence": 0.88,
    "evidence": "Mock: raised texture visible"
  },
  "pattern": {
    "observed": "solid",
    "confidence": 0.95,
    "evidence": "Mock: no repeating motif"
  },
  "uncertain_features": ["exact fabric composition unverifiable"],
  "raw_vision_output": {
    "model": "mock",
    "response_text": "Mock response for testing"
  }
}
```

### 8.2 Mock Identity Response

```json
{
  "brand": {
    "observed": "Louis Vuitton",
    "verified": true,
    "confidence": 0.95,
    "sources": [
      {"url": "https://www.stockx.com/...", "match_type": "name_similarity", "trusted": true}
    ]
  },
  "model": {
    "observed": "Embroidery T-Shirt",
    "verified": true,
    "confidence": 0.90,
    "sources": [
      {"url": "https://www.stockx.com/...", "match_type": "name_similarity", "trusted": true}
    ]
  },
  "sku": {
    "observed": null,
    "verified": false,
    "decision": "OMIT",
    "reason": "No official SKU found"
  },
  "colorway_official": {
    "observed": null,
    "decision": "USE_VISUAL_DESCRIPTION",
    "visual_alternative": "Black"
  },
  "cross_reference": {
    "stockx_match": null,
    "goat_match": null,
    "brand_site_match": null,
    "notes": "Mock: no external match"
  },
  "product_type": {
    "observed": "T-Shirt",
    "verified": true,
    "confidence": 0.97
  }
}
```

---

## 九、版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| V5.1-DRAFT | 2026-09-18 | 初始版本 |
