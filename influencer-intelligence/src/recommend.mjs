const decisionRank = { green: 3, yellow: 2, red: 0 };

export function recommend(evaluations, discoveries = []) {
  const discoveryByKey = new Map(discoveries.map((item) => [`${item.platform}:${item.handle}`, item]));
  return evaluations
    .filter((item) => item.decision !== 'red')
    .map((item) => {
      const discovery = discoveryByKey.get(`${item.platform}:${item.handle}`) ?? {};
      const routes = discovery.routes ?? (discovery.route ? [discovery.route] : []);
      const score = Number(item.score ?? item.total_score ?? 0) + Number(discovery.score ?? 0);
      return {
        platform: item.platform,
        handle: item.handle,
        profile_url: item.profile_url ?? discovery.profile_url ?? '',
        decision: item.decision,
        routes,
        priority_score: score,
        recommendation: item.decision === 'green'
          ? '进入联系名单；先做可追踪的小额样品或佣金测试，再按转化升级。'
          : '仅做低成本、可追踪测试；补齐受众与履约证据后再升级。',
        evidence: [...(discovery.reasons ?? []), ...(item.evidence ?? []).map((entry) => entry.summary ?? entry)].slice(0, 8)
      };
    })
    .sort((a, b) => decisionRank[b.decision] - decisionRank[a.decision] || b.priority_score - a.priority_score);
}
