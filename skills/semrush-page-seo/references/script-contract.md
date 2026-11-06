# 脚本与数据契约

运行要求：Python 3.9+、Node.js 18+；运行时均为标准库。脚本不要求PyYAML，系统的skill格式校验器另有PyYAML依赖。本机可用 `py -3.13 -X utf8` 运行该校验器，避免为了校验在项目里执行会自动发现父项目的 `uv run`。

## 证据CLI

以下PowerShell命令在业务工作区运行，`$seoRun`须为新运行目录。所有子命令的`--out`均不能已存在；不覆盖原始证据。

```powershell
$seoSkill = Join-Path $env:USERPROFILE '.codex/skills/semrush-page-seo'
$seoRun = 'evidence/my-new-run'
python "$seoSkill/scripts/workflow.py" init --target-url 'https://example.com/a-real-product' --country us --language en --out $seoRun
```

然后在CUA中执行[采集步骤](live-workflow.md)，将ui目录中的原始行与context导入：

```powershell
python "$seoSkill/scripts/workflow.py" import-semrush --raw "$seoRun/ui/semrush-dom-rows.json" --context "$seoRun/ui/context.json" --out "$seoRun/import"
python "$seoSkill/scripts/workflow.py" evaluate --keywords "$seoRun/import/normalized-keywords.json" --context "$seoRun/import/context.json" --primary '实际查到的主词' --serp-review "$seoRun/serp-review.json" --gsc "$seoRun/gsc.json" --change-plan "$seoRun/change-plan.json" --out "$seoRun/decision"
```

`evaluate`不执行查询，只审查输入证据，mode=`EVIDENCE_REVIEW`。缺SERP/GSC/修改稿可省略对应参数并得到明确HOLD。`normalized-keywords.json`和CSV是规范词表；`decision.json`与`REPORT.md`记录每阶段状态。

context字段：

```json
{
  "schema_version": 1,
  "source": "Semrush UI",
  "target_url": "https://example.com/a-real-product",
  "country": "us",
  "language": "en",
  "device": "desktop",
  "observed_at": "2026-11-01",
  "report_date": null,
  "metrics_updated": "1 month",
  "capture_mode": "LIVE_UI",
  "evidence_path": "semrush-dom-rows.json",
  "screenshot_path": "semrush-keywords.jpg"
}
```

示例只说明字段，不能当真实查询证据。时间精度按实际来源保留，不把仅知日期伪造成精确秒。采集helper自动记录新采集的时间。context中的相对证据路径相对于context文件目录；建议使用绝对路径。原始词表支持本轮 `{h1,rows:["DOM行..."]}`，或 `{rows:[{keyword,volume,kd,intent,cpc_usd}]}`。DOM解析按表头判断是否含“相关性”，不按某个演示行的固定偏移猜列。

SERP评审结构：

```json
{
  "keyword": "实际查到的主词",
  "target_url": "https://example.com/a-real-product",
  "country": "us", "device": "desktop",
  "observed_at": "2026-11-01", "snapshot_date": "2026-10-31",
  "manual_observation": true,
  "product_match": true, "page_type_match": true,
  "rationale": "记录实际看到的页面类型和与商品的匹配理由",
  "evidence_path": "C:/absolute/serp-observation.txt",
  "results": []
}
```

`results`必须填入实际前十（position 1至10、url、page_type），示例空数组会得到HOLD。匹配布尔值是操作者基于实际观察的判断，脚本不能独立证明真实性。缺任一范围、截图或真实文件引用时，结果只保留候选。

## 历史回放

```powershell
python "$seoSkill/scripts/workflow.py" replay --evidence-dir 'evidence/semrush-live-20261101' --out 'evidence/my-new-replay'
```

此子命令是本轮历史文件布局的适配器，读取既有cluster、字段稿和GSC JSON；通用核心逻辑不依赖该域名或词。mode=`LOCAL_REPLAY`，source_observed_at仍为历史采集日期。默认未提供机器可读SERP评审，因此保留候选，不凭存在一份自然语言报告自动补出意图判断。要复核已人工观察的历史评审，可显式传 `--context`、`--serp-review`；仍不成为实时查询。

## 官方 GSC

```powershell
node "$seoSkill/scripts/official_gsc.mjs" --url 'https://example.com/a-real-product' --site 'sc-domain:example.com' --out "$seoRun/gsc.json" --days 28
```

环境存在HTTP CONNECT代理时显式加`--proxy http://127.0.0.1:实际端口`，不硬编码历史端口。可选国家`--country usa`（GSC三字母代码，不同于Semrush的us），设备`--device DESKTOP`。未提供过滤时为全部国家/设备。

凭据优先顺序：`--credentials` → `GOOGLE_APPLICATION_CREDENTIALS` → 标准gcloud ADC路径（Windows为APPDATA/gcloud/application_default_credentials.json）。只支持已有 `authorized_user` ADC；服务账户/外部账号不在当前脚本范围，返回HOLD，不创建新授权或扩大scope。quota project按`--quota-project` → `GOOGLE_CLOUD_QUOTA_PROJECT` → ADC中的quota_project_id选择。

凭据仅发往固定官方Google OAuth/API host；不跟任意重定向、不关闭TLS证书校验、不读浏览器登录态，不把token写入结果或控制台。脚本读取URL Inspection、数据可用期和精确page过滤的total/query/date表现；若metadata缺失，再读final日期以确定可用末日，无法确定就HOLD。

结果保留实际请求过滤条件、HTTP状态、日期、原始响应和summary。`COMPLETE`仅表示采集完整，不表示页面已收录或有流量；空total行返回null，不填0。query达到25000行上限标PARTIAL_HOLD。退出码：0为采集完整或help；2为HOLD/PARTIAL_HOLD。旧脚本与本通用脚本的两个实时采集时点可能有不同完整日期边界，不能覆盖旧文件以隐藏差异。

## 发布记录验收

`record-publication`仅核验记录，不执行CMS写入。只有实际权限及发布范围已满足、备份/保存回读/线上验证/截图均存在时才可记录完成：

```powershell
python "$seoSkill/scripts/workflow.py" record-publication --decision "$seoRun/decision/decision.json" --evidence "$seoRun/publication.json" --out "$seoRun/publication-review"
```

publication.json包含：`target_url`、`permission:"ALLOWED"`、`authorized_for_publish:true`、`blocked:false`、`saved_at`、`verified_at`，及`authorization_evidence_path`、`backup_path`、`save_readback_path`、`live_verification_path`、`screenshot_path`。路径相对publication.json目录。权限记录JSON须含同一target_url与granted=true；Cookie文件不构成权限记录。线上验证JSON须含同一target_url，以及checks.fields/canonical/robots/conversion_path均为true。文件只证明记录存在，操作者仍要核对其实际内容与执行事实；这些值不能用拟改内容伪造。

`LOCAL_REPLAY`的decision禁止升级发布状态。其余模式即使通过记录验收，也只表示证据支持，不会授予浏览器权限或执行后台操作。CLI正常生成HOLD报告仍可能退出0；自动化消费者必须读decision状态，不能拿进程退出码当“网站已修改”。

## 验证

```powershell
python "$seoSkill/tests/test_workflow.py" -v
node --test "$seoSkill/tests/test_gsc.mjs" "$seoSkill/tests/test_capture.mjs"
```

测试夹具只验证分支与不变量，不是实际业务数据。真实案例应另跑历史回放；新的API传输实现应进行一次已授权的只读查询，再分别报告测试、回放和实时结果。没有运行的新环境保持HOLD。
