/**
 * Scout Workflow - 主 Agent 调用 Scout 子 Agent 的完整工作流
 */

const { parseOpportunities, storeOpportunities } = require('./store');

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

module.exports = { runScout, processResult };