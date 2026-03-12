#!/usr/bin/env node
/**
 * Scout Analyze CLI
 * 智能分析模块 - 基于历史记录分析推荐搜索领域
 */

const { analyze, analyzeCoveredDomains, extractKeywords, recommendBlankDomains } = require('../src/lib/analyze');
const { initDb } = require('../src/config/database');

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'analyze':
  case undefined: {
    const result = analyze();
    console.log(JSON.stringify(result, null, 2));
    break;
  }
  case 'domains': {
    const db = initDb();
    const opportunities = db.prepare('SELECT * FROM opportunities').all();
    db.close();
    const { domainCounts } = analyzeCoveredDomains(opportunities);
    console.log(JSON.stringify(domainCounts, null, 2));
    break;
  }
  case 'keywords': {
    const db = initDb();
    const opportunities = db.prepare('SELECT * FROM opportunities').all();
    db.close();
    const keywords = extractKeywords(opportunities);
    console.log(JSON.stringify(keywords, null, 2));
    break;
  }
  case 'recommend': {
    const db = initDb();
    const opportunities = db.prepare('SELECT * FROM opportunities').all();
    db.close();
    const { domainCounts } = analyzeCoveredDomains(opportunities);
    const blank = recommendBlankDomains(domainCounts);
    console.log(JSON.stringify(blank, null, 2));
    break;
  }
  default:
    console.log(`Scout 智能分析

用法:
  node cli/analyze.js           - 完整分析报告
  node cli/analyze.js analyze   - 同上
  node cli/analyze.js domains   - 显示已覆盖领域
  node cli/analyze.js keywords  - 显示高频关键词
  node cli/analyze.js recommend - 推荐空白领域

输出说明:
  - coveredDomains: 已探索的领域及覆盖深度
  - topKeywords: 高频关键词
  - blankDomains: 建议探索的空白领域
  - recommendedSearches: 推荐的搜索查询
  - nextBestAction: 下一步最佳行动`);
}