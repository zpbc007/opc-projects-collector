#!/usr/bin/env node
/**
 * Scout Workflow CLI
 * 主 Agent 调用 Scout 子 Agent 的完整工作流
 */

const { runScout, processResult } = require('../src/lib/workflow');
const { getStats, getAllOpportunities } = require('../src/lib/store');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Scout 工作流脚本

用法:
  node cli/workflow.js process '<json结果>'  - 处理并存储结果
  node cli/workflow.js stats                 - 查看统计
  node cli/workflow.js list [limit]          - 列出已存储的机会

主 Agent 调用流程:
1. 使用 sessions_spawn(agentId="scout", task="...") 启动子 agent
2. 等待子 agent 返回 JSON 结果
3. 使用本脚本处理结果: node cli/workflow.js process '<结果>'
4. (可选) 删除子 agent 会话
`);
  process.exit(0);
}

const command = args[0];

switch (command) {
  case 'process': {
    const resultText = args.slice(1).join(' ');
    const result = processResult(resultText);
    console.log(JSON.stringify(result, null, 2));
    break;
  }
  case 'stats': {
    console.log(JSON.stringify(getStats(), null, 2));
    break;
  }
  case 'list': {
    const limit = parseInt(args[1]) || 100;
    console.log(JSON.stringify(getAllOpportunities(limit), null, 2));
    break;
  }
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}