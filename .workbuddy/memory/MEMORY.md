# drip-seo-agent 项目长期约定

## 标准
- **唯一生效标准**：`standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md`，SHA-256 `965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7`
- `standards/_superseded/` 下的 3.2 与旧 V4.4 修订版**禁止作为决策依据**（存在 §5 SKU 硬规则冲突）
- 输出顺序固定为 §25 十项：Product Name → H1 → SEO Title → SEO Keywords → Meta Description → URL Slug → Canonical → Key Description → Description/ALT → Schema

## 后台写入通道（MrShopPlus）
- **保存**：`POST /biz/DTB_proProduct/saveModify`，body `{"args":[[6 blocks]],"additions":{}}`，必须整包回传
- block 顺序：`dtb_proProduct` · `dtb_proProductCates` · `DTB_proSKU_ref` · `dtb_proProductTag` · `dtb_proPriceRange` · `dtb_proProductAttr`
- **读取**：`POST /biz/DTB_proProduct/modify`，body `{"args":[[<PID>]],"additions":{}}`
- **分类成员**：`POST /biz/DTB_proCategory/GetCatesOfProductsPage`，pageIndex 从 0 开始，pageSize≤24
- **回滚**：写入前必抓原始 saveModify 载荷存盘，回滚即原样 POST 回去
- 写前铁律：先抓载荷 → 只改目标字段 → dry-run 打印 diff → 才 `--live`
- **字段映射（反直觉）**：「关键描述」TinyMCE editor[1] 绑定的是 **`Summary`**；「商品副标题」是 `SubTitle`；「商品描述」是 `Content`；图片 ALT 是 `ImgList[].a`；上架开关是 `IsShow`
- 商品表单页不暴露 SEO 控件，SEO 走「编辑SEO」抽屉（el-drawer.rtl）或直接 API

## 浏览器 / 环境
- Chrome profile（后台登录态）：`C:\Users\Administrator\Pictures\dripsneakers\DripOps\chrome-profile\dripops`
- Chromium：`C:\Users\Administrator\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe`
- **base python 3.13.12 有 playwright 无 PIL**；**envs/default 有 pillow 无 playwright** —— 不可互换
- Bash 需前缀 `export PATH="/c/Program Files/Git/usr/bin:$PATH"`；路径传给 exe 用 `C:/...`
- 判断连通性一律用 Python `urllib`，禁用 curl 结论

## 铁律
1. **图片文件名 100% 不可信**，判定图片内容必须读图
2. **禁止用供应商编号（如 GD001 / czt4082 / 777）当 SKU**；内标成分也不可信（reps 标签常错）
3. **Exact Entity PASS 之前禁止生成 SEO 字段**
4. 破损模式一致时走批量替换，不做逐款手工修
5. 发现新字段映射必须先 marker 注入验证，不靠猜

## 状态
- **Canary #1 已 PASS（2026-09-23，Dior Oblique Swim Shorts Sky Blue，PID 536027503505948）** → `STATUS.md` 的批次门禁已解锁
- `/Shorts/` 分类（CategoryId `536025126720018`，自动分类，匹配规则 `Name lk "Shorts"`）：113 款 = 44 已上架 + 69 未上架
- 未上架 69 款分级：READY 46 · HOLD（无官方标识）22 · EXCLUDE（赠品）1
- **平台级 P1 问题**：Product schema 的 `sku` 用了 Drip Product ID；全站 FAQPage schema 含死域名 `dripsneakers.net`；页面 2 个 h1
