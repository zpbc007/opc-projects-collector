#!/usr/bin/env node
/**
 * Scout Store CLI
 * 存储和去重 scout 发现的机会
 */

const { parseOpportunities, storeOpportunities, getAllOpportunities, getStats } = require('../src/lib/store');

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'store': {
    const input = args[1] || process.stdin;
    if (input === '-') {
      let data = '';
      process.stdin.on('data', chunk => data += chunk);
      process.stdin.on('end', () => {
        const opps = parseOpportunities(data);
        const result = storeOpportunities(opps);
        console.log(JSON.stringify(result, null, 2));
      });
    } else {
      const opps = parseOpportunities(input);
      const result = storeOpportunities(opps);
      console.log(JSON.stringify(result, null, 2));
    }
    break;
  }
  case 'list': {
    const limit = parseInt(args[1]) || 100;
    const opps = getAllOpportunities(limit);
    console.log(JSON.stringify(opps, null, 2));
    break;
  }
  case 'stats': {
    const stats = getStats();
    console.log(JSON.stringify(stats, null, 2));
    break;
  }
  default:
    console.log(`用法:
  node cli/store.js store '<json>'    - 存储机会（去重）
  cat result.json | node cli/store.js store -   - 从 stdin 读取
  node cli/store.js list [limit]      - 列出所有机会
  node cli/store.js stats             - 显示统计`);
}