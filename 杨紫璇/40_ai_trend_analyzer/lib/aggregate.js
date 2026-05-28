// 把 NCR 原始记录聚合成各种统计，供图表和 AI 分析复用

function countBy(records, field) {
  const map = {};
  for (const r of records) {
    const key = r[field] || '未填';
    map[key] = (map[key] || 0) + 1;
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function lossBy(records, field) {
  const map = {};
  for (const r of records) {
    const key = r[field] || '未填';
    map[key] = (map[key] || 0) + Number(r.economic_loss || 0);
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function byMonth(records) {
  const map = {};
  for (const r of records) {
    if (!r.occur_date) continue;
    const month = r.occur_date.slice(0, 7); // YYYY-MM
    map[month] = (map[month] || 0) + 1;
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function aggregate(records) {
  const totalLoss = records.reduce(
    (sum, r) => sum + Number(r.economic_loss || 0),
    0
  );
  return {
    total: records.length,
    totalLoss,
    byType: countBy(records, 'abnormal_type'),
    byLine: countBy(records, 'shipping_line'),
    byParty: countBy(records, 'responsible_party'),
    byMonth: byMonth(records),
    lossByType: lossBy(records, 'abnormal_type'),
  };
}
