#!/usr/bin/env node
/**
 * Scout 完整工作流
 * 自动执行：分析 → 搜索 → 存储 → 评分
 * 
 * 用法：
 *   node scout-pipeline.js analyze    - 分析并输出推荐领域
 *   node scout-pipeline.js stats      - 显示统计信息
 */

const { execSync } = require('child_process');
const path = require('path');

const DATA_DIR = path.join(__dirname);

function runAnalyze() {
  const script = path.join(DATA_DIR, 'scout-analyze.js');
  try {
    const result = execSync(`node ${script} analyze`, { encoding: 'utf-8' });
    const data = JSON.parse(result);
    
    console.log(JSON.stringify({
      domain: data.nextBestAction?.domain || '效率工具',
      suggestedQuery: data.nextBestAction?.suggestedQuery || '效率工具 商业机会',
      summary: data.summary
    }, null, 2));
  } catch (e) {
    // 默认推荐
    console.log(JSON.stringify({
      domain: '效率工具',
      suggestedQuery: '效率工具 商业机会 新兴趋势',
      summary: { note: '使用默认推荐' }
    }, null, 2));
  }
}

function runStats() {
  // 机会统计
  const scoutScript = path.join(DATA_DIR, 'scout-workflow.js');
  const scorerScript = path.join(DATA_DIR, 'scorer-workflow.js');
  
  try {
    const scoutStats = JSON.parse(execSync(`node ${scoutScript} stats`, { encoding: 'utf-8' }));
    const unscored = JSON.parse(execSync(`node ${scorerScript} unscored`, { encoding: 'utf-8' }));
    
    console.log(JSON.stringify({
      totalOpportunities: scoutStats.total,
      unscoredCount: unscored.count || 0,
      latestAt: scoutStats.latestAt
    }, null, 2));
  } catch (e) {
    console.log(JSON.stringify({ error: e.message }, null, 2));
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'analyze':
    runAnalyze();
    break;
  case 'stats':
    runStats();
    break;
  default:
    console.log(`用法：
  node scout-pipeline.js analyze  - 分析并输出推荐领域
  node scout-pipeline.js stats    - 显示统计信息`);
}