import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const esc = (value) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
const routes = (item) => (item.routes ?? [item.route]).join(', ');

export function reportMarkdown(report) {
  const lines = [
    `# 网红情报日报 · ${report.run_date}`,
    '',
    `状态：${report.status}；有效账号 ${report.source.valid_creators}；新晋路线 ${report.discovery.emerging.length}；竞品路线 ${report.discovery.competitor.length}；推荐/测试 ${report.recommendations.length}；红灯 ${report.rejected.length}。`,
    '',
    '## 今日优先合作池',
    '',
    '| 优先级 | 账号 | 平台 | 路线 | 决策 | 动作 |',
    '|---:|---|---|---|---|---|'
  ];
  report.recommendations.forEach((item, index) => lines.push(
    `| ${index + 1} | @${esc(item.handle)} | ${esc(item.platform)} | ${esc(routes(item))} | ${esc(item.decision)} | ${esc(item.recommendation)} |`
  ));
  if (report.recommendations.length === 0) lines.push('| - | - | - | - | - | 今日没有通过审核的候选 |');

  lines.push('', '## 路线 1：新晋 / 低粉爆款', '', '| 账号 | 平台 | 粉丝 | 分数 | 发现理由 |', '|---|---|---:|---:|---|');
  report.discovery.emerging.forEach((item) => lines.push(
    `| @${esc(item.handle)} | ${esc(item.platform)} | ${item.followerCount} | ${item.score} | ${esc(item.reasons.join('；'))} |`
  ));
  if (report.discovery.emerging.length === 0) lines.push('| - | - | - | - | 今日无新增 |');

  lines.push('', '## 路线 2：已与竞品合作 / 高相关', '', '| 账号 | 平台 | 粉丝 | 分数 | 证据摘要 |', '|---|---|---:|---:|---|');
  report.discovery.competitor.forEach((item) => lines.push(
    `| @${esc(item.handle)} | ${esc(item.platform)} | ${item.followerCount} | ${item.score} | ${esc(item.reasons.join('；'))} |`
  ));
  if (report.discovery.competitor.length === 0) lines.push('| - | - | - | - | 今日无新增 |');

  lines.push('', '## 红灯淘汰', '', '| 账号 | 命中规则 | 原因 |', '|---|---|---|');
  report.rejected.forEach((item) => lines.push(
    `| @${esc(item.handle)} | ${esc(item.triggered_rules.map((rule) => rule.id).join(', '))} | ${esc(item.recommendation.rationale)} |`
  ));
  if (report.rejected.length === 0) lines.push('| - | - | 今日无红灯候选 |');

  if (report.source.errors.length || report.source.stale_creators.length) {
    lines.push('', '## 数据健康', '');
    report.source.errors.forEach((item) => lines.push(`- 输入失败：${item.file} — ${item.error}`));
    report.source.stale_creators.forEach((item) => lines.push(`- 过期数据：${item}`));
  }
  lines.push('', '> 发现分数只用于排队；最终合作必须服从红灯否决和证据完整性。', '');
  return lines.join('\n');
}

export async function writeMarkdownReport(outputDir, runDate, report) {
  await mkdir(outputDir, { recursive: true });
  const markdown = reportMarkdown(report);
  await Promise.all([
    writeFile(path.join(outputDir, `${runDate}.md`), markdown, 'utf8'),
    writeFile(path.join(outputDir, 'latest.md'), markdown, 'utf8')
  ]);
}
