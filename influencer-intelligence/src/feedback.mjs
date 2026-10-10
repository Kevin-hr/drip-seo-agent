const keyOf = (row) => `${String(row.platform ?? '').toLowerCase()}:${String(row.handle ?? '').replace(/^@/, '').toLowerCase()}`;
const value = (input) => Number.isFinite(Number(input)) ? Number(input) : 0;

export function summarizeOutcomes(rows = []) {
  const summaries = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    if (key === ':') continue;
    const current = summaries.get(key) ?? { campaigns: 0, spend: 0, revenue: 0, orders: 0, clicks: 0 };
    current.campaigns += 1;
    current.spend += value(row.spend ?? row.cost);
    current.revenue += value(row.revenue);
    current.orders += value(row.orders ?? row.conversions);
    current.clicks += value(row.clicks);
    summaries.set(key, current);
  }
  return new Map([...summaries].map(([key, summary]) => [key, {
    ...summary,
    roas: summary.spend > 0 ? Math.round((summary.revenue / summary.spend) * 100) / 100 : null,
    conversion_rate: summary.clicks > 0 ? Math.round((summary.orders / summary.clicks) * 10000) / 10000 : null
  }]));
}

export function applyOutcomeFeedback(recommendations, outcomes) {
  return recommendations.map((item) => {
    const prior = outcomes.get(`${item.platform}:${item.handle}`);
    if (!prior) return { ...item, prior_performance: null };
    const performanceBoost = Math.max(-15, Math.min(15, ((prior.roas ?? 1) - 1) * 5 + Math.min(prior.orders, 10)));
    return {
      ...item,
      priority_score: Math.round((item.priority_score + performanceBoost) * 10) / 10,
      prior_performance: prior
    };
  }).sort((a, b) => b.priority_score - a.priority_score);
}
