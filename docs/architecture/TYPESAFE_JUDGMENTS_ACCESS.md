# TypeSafe System One 接入说明

> 代码掌控流程、规则与写入行为；TypeSafe 只提供结构化窄判断。

本文记录 DripOps 如何按 [TypeSafe](https://docs.typesafe.ai) 的 System One 思路接入真实云端 API。TypeSafe 是托管服务：我们对 `POST https://api.typesafe.ai/v1/systemone` 发出 `{state, model, questions}`，收到每个问题一个**类型化答案**（概率 + 置信度），随后由**确定性代码**组合这些答案做决策。

## 与现有架构的关系

| 项目环节 | TypeSafe 原语 | 落地 |
|---|---|---|
| 搜到的资料是否对应同一款、同一配色 | **Choice**：`match` / `conflict` / `insufficient_evidence` | `DripSneakersJudgmentSession`, `entity_match` |
| 某段来源是否明确支持指定 SKU | **Noul**：0↔1 概率 | `evidence_{i}_supports_sku` |
| 多个来源优先阅读哪个 | **Score**：相关性打分 | `evidence_{i}_relevance` |
| 关键词数量、禁用词、哈希、模板 | 保留现有确定性代码 | 未改动 `V44Composer` / `V44Validator` / `V44Standard` |
| 图片观察、文案生成、后台写入 | 保留现有组件 | 未改动 Browser 层 & MCP |

关键的对抗性边界：**TypeSafe 的运行是 non-blocking（fail-closed）**。未配置 key 或 `enabled=false` 时，新增的 `typesafe-judge` 命令返回 `UNAVAILABLE`，绝不假装判断成功；SKU 最终裁决仍由权威的 `V44SkuGate` 把关，TypeSafe 只提供给研究工作层的 verdict 提示。

## 新增文件

- `dripops/src/DripOps/TypeSafe/TypeSafeOptions.cs` — 配置（endpoint/model/key 环境变量/阈值）。
- `dripops/src/DripOps/TypeSafe/SystemOneModels.cs` — `SystemOneQuestion` / `SystemOneRequest` / `SystemOneAnswer` / `SystemOneResponse`，逐字段配对官方 HTTP API。
- `dripops/src/DripOps/TypeSafe/TypeSafeSystemOneClient.cs` — 无第三方依赖的 `HttpClient` 客户端，Bearer 认证，无 key 拒绝发送。
- `dripops/src/DripOps/TypeSafe/DripSneakersJudgmentSession.cs` — 四个判断环节的问题构造 + 确定性组合。
- `dripops/config/dripops.example.json` — 新增 `typeSafe` 配置节。
- `dripops/scripts/typesafe-judge-input.example.json` — 示例输入（Yeezy Boost 350 V2 Antlia Reflective）。

## 使用

### 1. 提供凭据（可选，云调用必需）

```powershell
$env:TYPESAFE_API_KEY = "<your key>"   # 或按 config.typeSafe.apiKeyEnvironmentVariable 指定变量名
```

并把 `dripops/config/dripops.json` 里的 `typeSafe.enabled` 置为 `true`。

### 2. 离线自检（无需 key，验证结构与组合逻辑）

```powershell
cd dripops
.\dist\DripOps.exe self-test                 # 已在 self-test 中覆盖 TypeSafe
.\dist\DripOps.exe typesafe-judge --input scripts/typesafe-judge-input.example.json --mock
```

`--mock` 用内置样例响应演示三种原语（Choice 0.91 → match、Noul 0.96/0.2、Score 1.0/0.5）组合成 `VERIFIED_SKU` 的完整过程，无网络。

### 3. 真实云调用（需 key + `enabled=true`）

```powershell
.\dist\DripOps.exe typesafe-judge --input scripts/typesafe-judge-input.example.json
```

成功返回 `driver: typesafe:jev-latest` 与结构化 `result`（每个来源的 `skuSupport`/`relevance`、`entityMatch`、组合出的 `status`）。

## 组成逻辑（确定性，程序中）

`DripSneakersJudgmentSession.Compose`（internal static，可离线测）：

- 实体判 `conflict` → `HOLD`。
- 实体 `match` 且 ≥1 个来源 `noul ≥ noulSupportThreshold` → `VERIFIED_SKU`。
- 未达阈值、且证据不足以判定 → `SKU_OMIT` 或 `HOLD`（按组合分支）。

阈值在 `typeSafe` 配置中可调，无需改代码；`StrongEvidence` 按 `relevance` 降序，标记高优先级来源。

## 后续接线（未在本分支改动）

目前 `typesafe-judge` 是独立命令，尚未替换任何研究路径。后续把 `DripSneakersJudgmentSession` 接入 BridgeServer 的 `prepare-v44` 时，应保持 fail-closed：TypeSafe 结果仅在 `HasCredentials` 时作为研究工作层的输入，SKU 判定仍过 `V44SkuGate`。