# -*- coding: utf-8 -*-
"""
Layer 4: PDP Generator

仅在 entity.status == PASS 时生成 SEO payload。
输入：Entity State（PASS 状态）
输出：Machine-Readable SEO Payload JSON
"""

import json
import os
from typing import Dict, Any, List

OUT = os.environ.get("OUT_DIR", r"C:\Users\Administrator\Pictures\dripsneakers\analysis\v5")

BRAND_LINKS = {
    "Louis Vuitton": "https://www.dripsneakers.org/Louis-Vuitton/",
    "Balenciaga": "https://www.dripsneakers.org/Balenciaga/",
    "Dior": "https://www.dripsneakers.org/Dior/",
    "Nike": "https://www.dripsneakers.org/Nike/",
    "Jordan": "https://www.dripsneakers.org/Jordan/",
}


def generate_seo_payload(entity_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    生成 SEO Payload（仅在 PASS 状态下调用）
    """
    if entity_state["entity"]["status"] != "PASS":
        raise PermissionError(f"Cannot generate SEO: entity status is {entity_state['entity']['status']}, not PASS")

    entity = entity_state["entity"]
    visual = entity_state["visual_observation"]

    # 构建基础字段
    brand = entity.get("brand", "Louis Vuitton")
    product_type = entity.get("product_type", "T-Shirt")
    colorway = entity.get("colorway", "Black")
    model = entity.get("model", "Embroidery T-Shirt")

    # 生成产品名（使用官方颜色名，不是视觉描述）
    product_name = f"{brand} {model} {colorway}"

    # 生成 slug
    slug = product_name.lower().replace(" ", "-")
    slug = __import__("re").sub(r'[^a-z0-9\-]', '', slug)

    # 生成 SEO Title
    seo_title = f"{product_name} Reps | Drip Sneakers"

    # 生成 Meta Description
    meta = f"Shop {product_name} reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping."

    # 生成 Keywords
    keywords = [
        f"{brand} {model} {colorway}",
        f"{brand} {model}",
        f"{colorway} {brand} {product_type}",
        f"{brand} {model.replace(' ', '')}",
    ]

    # 生成 Key Description（1 句 + 恰好 5 项）
    key_description = f"This {brand.lower()} {product_type.lower()} comes in a {colorway.lower()} colorway finished with an embroidered {brand} logo."

    # 生成 Schema
    schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product_name,
        "brand": {"@type": "Brand", "name": brand},
        "offers": {
            "@type": "Offer",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
        }
    }

    payload = {
        "product_id": entity_state["product_id"],
        "generated_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "product_name": product_name,
        "slug": slug,
        "seo_title": seo_title,
        "meta_description": meta,
        "keywords": keywords,
        "key_description": key_description,
        "schema": schema,
        "model_type": "V5-PDP-Generator",
        "entity_status_at_generation": "PASS"
    }

    return payload


def generate_img_html(images: List[Dict[str, str]], brand: str) -> str:
    """
    生成详情图片 HTML（images: 每个元素含 url 和 alt 字段）
    """
    if not images:
        return "<p>No images available.</p>"

    imgs = []
    for i, img in enumerate(images[:12], 1):
        url = img.get("url", "")
        alt = img.get("alt", f"{brand} {i}/12")
        imgs.append(f'<img src="{url}" alt="{alt}" loading="lazy">')

    return "\n".join(imgs)


def generate_kd_html(key_description: str, brand: str) -> str:
    """
    生成关键描述 HTML（1 句 + 恰好 5 项）
    """
    brand_link = BRAND_LINKS.get(brand, f"https://www.dripsneakers.org/{brand.replace(' ', '-')}/")

    html = f"""
<p>{key_description}</p>
<ul>
  <li><strong>Brand:</strong> <a href="{brand_link}"><strong>{brand}</strong></a></li>
  <li><strong>Material:</strong> Premium Cotton</li>
  <li><strong>Fit:</strong> Regular</li>
  <li><strong>Origin:</strong> China</li>
  <li><strong>Shipping:</strong> 7–20 days worldwide</li>
</ul>
"""
    return html.strip()


def save_seo_payload(payload: Dict[str, Any], product_id: str) -> str:
    """
    保存 SEO Payload 到 JSON 文件
    """
    path = os.path.join(OUT, f"seo_payload_{product_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return path


if __name__ == "__main__":
    # 测试
    test_state = {
        "product_id": "123456",
        "entity": {
            "status": "PASS",
            "brand": "Louis Vuitton",
            "product_name": "Louis Vuitton Embroidery T-Shirt Black",
            "product_type": "T-Shirt",
            "colorway": "Black",
            "model": "Embroidery T-Shirt",
            "sku": "1AHW84"
        },
        "visual_observation": {
            "status": "PASS",
            "base_color_visual": "black",
            "garment_type": "T-Shirt",
            "logo_type": "embroidery"
        }
    }

    payload = generate_seo_payload(test_state)
    print(json.dumps(payload, indent=2, ensure_ascii=False))

    html = generate_img_html(["https://example.com/img1.jpg", "https://example.com/img2.jpg"], "Louis Vuitton")
    print("\nIMG HTML:\n", html[:200])
