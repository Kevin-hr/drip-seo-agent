#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson } from './io.mjs';
import { loadCreatorFiles, runDaily, discoveryConfig } from './pipeline.mjs';
import { discoverInfluencers } from './discovery.mjs';
import { evaluateInfluencers } from './evaluator.mjs';
import { writeMarkdownReport } from './report.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const command = process.argv[2] ?? 'daily';
const rawArgs = process.argv.slice(3);
const args = {};
for (let i = 0; i < rawArgs.length; i += 1) {
  if (!rawArgs[i].startsWith('--')) continue;
  const name = rawArgs[i].slice(2);
  args[name] = rawArgs[i + 1] && !rawArgs[i + 1].startsWith('--') ? rawArgs[++i] : true;
}
const resolve = (value, fallback) => path.resolve(root, String(value ?? fallback));
const runDate = String(args.date ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date()));

async function main() {
  const inputPath = resolve(args.input, 'data/inbox');
  const configPath = resolve(args.config, 'config/default.json');
  const evaluationConfigPath = resolve(args['evaluation-config'], 'config/evaluation.json');
  if (command === 'discover') {
    const [loaded, config] = await Promise.all([loadCreatorFiles(inputPath), readJson(configPath)]);
    if (loaded.errors.length) process.stderr.write(`${JSON.stringify({ input_errors: loaded.errors }, null, 2)}\n`);
    const effectiveConfig = { ...config, competitors: [...(config.competitors ?? []), ...(loaded.metadata.competitors ?? [])] };
    process.stdout.write(`${JSON.stringify(discoverInfluencers(loaded.creators, discoveryConfig(effectiveConfig)), null, 2)}\n`);
    return;
  }
  if (command === 'evaluate') {
    const [loaded, evaluationConfig] = await Promise.all([loadCreatorFiles(inputPath), readJson(evaluationConfigPath)]);
    const legitimacy = args['offer-context'] === 'unverified' ? 'unknown' : (args['offer-context'] ?? 'unknown');
    const result = evaluateInfluencers(loaded.creators.map((creator) => ({ ...creator, recent_posts: creator.posts })), {
      evaluationConfig,
      offerContext: { product_legitimacy: legitimacy },
      evaluatedAt: `${runDate}T23:59:59.000Z`
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (command !== 'daily') throw new Error(`Unknown command: ${command}`);
  const outputDir = resolve(args.output, 'output');
  const report = await runDaily({
    inputPath,
    outputDir,
    statePath: resolve(args.state, 'data/state/history.json'),
    outcomesPath: resolve(args.outcomes, 'data/outcomes.json'),
    configPath,
    evaluationConfigPath,
    runDate
  });
  await writeMarkdownReport(outputDir, runDate, report);
  process.stdout.write(`${JSON.stringify({
    run_date: runDate,
    status: report.status,
    emerging: report.discovery.emerging.length,
    competitor: report.discovery.competitor.length,
    recommended: report.recommendations.length,
    rejected: report.rejected.length,
    output: outputDir
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`[influencer-intelligence] ${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
