/**
 * Scout 完整工作流
 * 自动执行：分析 → 搜索 → 存储 → 评分
 */

const { analyze } = require('./analyze');
const { getStats } = require('./store');
const { unscored } = require('./scorer');

function runAnalyze() {
  const data = analyze();

  return {
    domain: data.nextBestAction?.domain || '效率工具',
    suggestedQuery: data.nextBestAction?.suggestedQuery || '效率工具 商业机会',
    summary: data.summary
  };
}

function runStats() {
  try {
    const scoutStats = getStats();
    const unscoredData = unscored();

    return {
      totalOpportunities: scoutStats.total,
      unscoredCount: unscoredData.count || 0,
      latestAt: scoutStats.latestAt
    };
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = {
  runAnalyze,
  runStats
};