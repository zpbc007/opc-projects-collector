#!/usr/bin/env node
/**
 * Scout Pipeline CLI
 * 完整工作流 - 自动执行：分析 → 搜索 → 存储 → 评分
 */

const { runAnalyze, runStats } = require('../src/lib/pipeline');

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'analyze': {
    const result = runAnalyze();
    console.log(JSON.stringify(result, null, 2));
    break;
  }
  case 'stats': {
    const result = runStats();
    console.log(JSON.stringify(result, null, 2));
    break;
  }
  default:
    console.log(`用法：
  node cli/pipeline.js analyze  - 分析并输出推荐领域
  node cli/pipeline.js stats    - 显示统计信息`);
}