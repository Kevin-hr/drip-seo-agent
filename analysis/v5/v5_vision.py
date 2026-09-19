# -*- coding: utf-8 -*-
"""
Layer 2: Vision Observer — 只负责"看"，不决定颜色名

输出 Visual Observation，不是 Official Colorway。
"""

import os
import json
from typing import List, Dict, Any

OUT = os.environ.get("OUT_DIR", r"C:\Users\Administrator\Pictures\dripsneakers\analysis\v5")


def observe_images(image_urls: List[str]) -> Dict[str, Any]:
    """
    输入：图片 URL 列表
    输出：视觉指纹（Visual Fingerprint）

    只输出观察结果，不输出推断结论。
    """
    fingerprint = {
        "image_count": len(image_urls),
        "urls": image_urls,
        "observations": [],
        "uncertain_features": [],
    }

    # 这里预留多模态模型的调用接口
    # 当前阶段：仅记录 URL，等待接入 ChatGPT Vision 或本地 CLIP
    # 实际调用时在下方填充

    # 占位符：等待多模态模型输入
    fingerprint["vision_model"] = None  # 待配置：openai/gpt-4o / claude-3-opus / ...
    fingerprint["raw_vision_output"] = None

    path = os.path.join(OUT, "vision_fingerprint.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(fingerprint, f, ensure_ascii=False, indent=2)

    return fingerprint


def build_visual_prompt(product_name: str, image_count: int) -> str:
    """
    构建给 Vision 模型的提示词。
    严格约束输出格式，禁止 AI 猜测官方颜色名。
    """
    prompt = f"""
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
    return prompt.strip()


if __name__ == "__main__":
    # 测试
    test_urls = [
        "https://example.com/img1.jpg",
        "https://example.com/img2.jpg",
    ]
    fp = observe_images(test_urls)
    print(json.dumps(fp, indent=2))
