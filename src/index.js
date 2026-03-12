/**
 * OPC Projects Collector
 * 统一导出入口
 */

const store = require('./lib/store');
const analyze = require('./lib/analyze');
const workflow = require('./lib/workflow');
const scorer = require('./lib/scorer');
const pipeline = require('./lib/pipeline');
const domains = require('./config/domains');

module.exports = {
  // 核心模块
  store,
  analyze,
  workflow,
  scorer,
  pipeline,

  // 配置
  domains,

  // 便捷导出 - 存储模块
  initDb: store.initDb,
  parseOpportunities: store.parseOpportunities,
  storeOpportunities: store.storeOpportunities,
  getAllOpportunities: store.getAllOpportunities,
  getStats: store.getStats,

  // 便捷导出 - 分析模块
  analyzeOpportunities: analyze.analyze,
  analyzeCoveredDomains: analyze.analyzeCoveredDomains,
  extractKeywords: analyze.extractKeywords,
  recommendBlankDomains: analyze.recommendBlankDomains,
  generateSearchStrategy: analyze.generateSearchStrategy,

  // 便捷导出 - 工作流模块
  runScout: workflow.runScout,
  processResult: workflow.processResult,

  // 便捷导出 - 评分模块
  getScorerDb: scorer.getDb,
  migrateScorer: scorer.migrate,
  updateScore: scorer.update,
  listScored: scorer.list,
  getUnscored: scorer.unscored,

  // 便捷导出 - 管道模块
  runPipelineAnalyze: pipeline.runAnalyze,
  runPipelineStats: pipeline.runStats
};