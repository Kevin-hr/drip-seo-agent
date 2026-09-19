> **历史文件，禁止继续执行。** 本 handoff 未完成 30/30，且其中“使用
> SEO/PDP 3.2（猜的）”已被 V4.4 STANDARD_FINAL 取代。当前事实与可复用
> 经验见 `docs/operations/T_SHIRTS_V3_LESSONS_TO_V4.4.md`。

你是执行者，这份文档是唯一任务来源；中途没人可问，拿不准就写入同目录 `BLOCKED.md`，跳过并继续可独立完成的商品。断线或换 AI 后先读 `PROGRESS.md`，每完成一个商品立刻更新，禁止重做。目标是在 Drip Sneakers 的 T-Shirts 分类交付 30 个有证据、已回读、已发布、前台可访问的统一标准商品。冲突时按“事实准确 > 可复验证据 > 完整数量 > 速度”让步。“必须/不许”违反即失败；“建议”可调整，但要在 `PROGRESS.md` 写原因。

## 我替领导拍的板

- 版本冲突 → 统一使用仓库唯一活动标准 SEO/PDP 3.2（猜的）｜若领导坚持旧版，9 个升级会成为多做。
- 建立单一最终运行 `t-shirts-30-final-2026-09-07`（猜的）｜避免跨 run 重复计数。
- 9 个旧 3.1.1 商品升级后才能计入；2 个现有 3.2 商品重新纳入最终 run 验证；另选 19 个证据最强的候选。
- 候选查不到官方 SKU 或图片无法确认就 HOLD，换下一个；绝不为凑 30 猜事实。

## 界限

只允许写 `dripops/dist/data/runs/**`、本目录两个状态文件，以及 Mrshopplus 中最终 run 选中的 T-Shirts 商品。需要修程序时只允许改 `dripops/src/DripOps/**` 和两份 README，先在 `BLOCKED.md` 记录原因并保持 self-test 全绿。禁止处理 Air Jordan 5 Retro Medium Soft Pink；禁止删除、下架商品、改权限、安装依赖或操作非 T-Shirts 商品。以下判卷文件不可改：`dripops/standards/SEO-PDP-3.2.json` 与 dist 副本 SHA256 均为 `016ACCB820B86650C47EFF827255AD75893DCAE2225062C490A6A09DEB699462`；`dripops/schemas/product-facts.schema.json` 为 `E53B01185D28411D895DBD68911A664276E10D68CB0C4B65238CC06A88FF4AA9`；`SeoPdpValidator.cs` 为 `196E1A03AB400B0786BC16D5C875B0611B8BAC722D4668F62BEB4EBF5F5F31AB`。

## 现状与任务 0

2026-09-07 实测：EXE self-test 通过；候选快照 200 个；共 11 个 `FrontendVerified/Verified`，其中 9 个 PDP 3.1.1、2 个 PDP 3.2。已完成 3.2：`536027547297304/HZ3831`、`536027547266582/HZ3830`。旧快照的 published=10 已过期，不得当实时数字。

在 `dripops/dist` 执行 `./DripOps.exe self-test`；读取 `README.md`、活动标准、两个旧 run 与本目录状态文件；重新 scan T-Shirts 建立最终 run，再 snapshot 选中 ID（含已发布商品）。若登录失效，仅执行 `./DripOps.exe login` 等人工登录完成，不保存密码。数字不符就把原始输出写在 `BLOCKED.md` 顶部，只做不受影响部分。核对后先在 `PROGRESS.md` 用不超过 10 行写目标、顺序、最大风险。

## 任务 1—3

1. 把旧 9 个与现有 2 个纳入最终 run。复用已验证证据，但重新检查来源、当前图片和 SKU；为旧 9 个补事实型 `productIntro` 并按 3.2 重生成。再从 200 个候选中选 19 个；优先官方品牌页，供应商标题和 DC 后缀都不能当 SKU。
2. 每件都保存字段级 evidence：brand、model、colorway、SKU、材质/设计、官方来源、核验时间、后台图片匹配。站内分类路径必须来自当前 sitemap。运行 `compose`；旧 Slug 不合法时加 `--migrate-url`。只有 `validation.isValid=true` 且 `Ready` 才运行 `apply --publish`；程序必须依次通过保存回读、发布回读和前台验证。失败商品 HOLD，不写假值；同一验收连败 3 次换候选。
3. 30 件完成后运行 `./DripOps.exe verify-frontend --run t-shirts-30-final-2026-09-07`。生成 `reports/final-30-audit.json`，逐件记录 HTTP 200、Title、Meta 120–160、Canonical、Product Name/H1/PDP H2 一致、SKU、`data-version="3.2"`、PDP 内恰好 1 个 H2 和 1 个 Style 内链、图片存在；同时重新 scan 分类，证明 30 个目标仍在 T-Shirts。

## 规矩

不许改标准/Schema/验证器、放宽判断、跳过检查、删证据、mock 后台、用 `|| true`、把已发布当完成或手改 JSON 状态。第一次新候选先用 `skuVerified=false` 的临时 facts 运行 compose，必须非零退出并 HOLD；换回真实已验证 facts 后必须变为 READY，贴出红→绿输出。不得把密码、Cookie、Token 写入文件。结果比开工差就回滚该商品并如实记录；静默失败算失败。

## 完成条件

1. 最终 run 恰好 30 个不同商品同时满足 `FrontendVerified + Verified + validation.isValid=true`，且 `final-30-audit.json` 30/30 全通过。
2. 三个判卷哈希不变、误改/删除/下架为 0；每项在对话贴实际命令输出，只说完成不算。`BLOCKED.md` 必须随交付，空也写“无”；或 200 个候选已穷尽仍不足 30，则停止并列明每个缺口及证据。
