#!/usr/bin/env node
/**
 * Scout Workflow - 主 Agent 调用 Scout 子 Agent 的完整工作流
 * 
 * 使用方法：
 * node scout-workflow.js "搜索主题" [options]
 * 
 * Options:
 * --cleanup    执行完成后自动删除子 agent 会话
 * --store      自动存储结果到数据库（去重）
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const STORE_SCRIPT = path.join(__dirname, 'scout-store.js');

async function runScout(topic, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 启动 Scout 搜索: "${topic}"`);
    
    // 这里通过 sessions_spawn 工具调用子 agent
    // 实际调用由主 agent 通过 sessions_spawn 工具完成
    // 此脚本用于处理返回结果
    
    resolve({
      topic,
      message: '请使用 sessions_spawn 工具调用 scout agent',
      prompt: `搜索并发现关于"${topic}"的商业机会。按照 SKILL.md 定义的格式输出 JSON 结果，包含最多 10 个机会，每个机会包含：name（机会名称）、description（详细描述）、insight（核心洞察）。`
    });
  });
}

// 处理 scout 返回的结果
function processResult(resultText) {
  const { parseOpportunities, storeOpportunities } = require(STORE_SCRIPT);
  const opportunities = parseOpportunities(resultText);
  
  if (opportunities.length === 0) {
    return { success: false, message: '未找到有效机会' };
  }
  
  const storeResult = storeOpportunities(opportunities);
  
  return {
    success: true,
    found: opportunities.length,
    ...storeResult
  };
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Scout 工作流脚本

用法:
  node scout-workflow.js process '<json结果>'  - 处理并存储结果
  node scout-workflow.js stats                 - 查看统计
  node scout-workflow.js list [limit]          - 列出已存储的机会

主 Agent 调用流程:
1. 使用 sessions_spawn(agentId="scout", task="...") 启动子 agent
2. 等待子 agent 返回 JSON 结果
3. 使用本脚本处理结果: node scout-workflow.js process '<结果>'
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
      const { getStats } = require(STORE_SCRIPT);
      console.log(JSON.stringify(getStats(), null, 2));
      break;
    }
    case 'list': {
      const { getAllOpportunities } = require(STORE_SCRIPT);
      const limit = parseInt(args[1]) || 100;
      console.log(JSON.stringify(getAllOpportunities(limit), null, 2));
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

module.exports = { runScout, processResult };