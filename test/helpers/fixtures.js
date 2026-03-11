/**
 * 测试数据工厂函数
 */

/**
 * 创建单个测试机会
 * @param {Object} overrides 覆盖默认值
 * @returns {Object} 机会对象
 */
export function createOpportunity(overrides = {}) {
  const timestamp = Date.now();
  return {
    name: `Test Opportunity ${timestamp}`,
    description: 'A test opportunity description for testing purposes',
    insight: 'Key insight about this test opportunity',
    ...overrides
  };
}

/**
 * 创建多个测试机会
 * @param {number} count 数量
 * @param {string} domain 领域前缀
 * @returns {Array} 机会数组
 */
export function createOpportunities(count, domain = 'Test') {
  return Array.from({ length: count }, (_, i) => ({
    name: `${domain} Opportunity ${i + 1}`,
    description: `Description for ${domain} opportunity #${i + 1}`,
    insight: `Core insight about ${domain} market #${i + 1}`
  }));
}

/**
 * 按领域创建测试机会
 */
export const SCOPED_OPPORTUNITIES = {
  gaming: createOpportunities(3, '游戏').map(o => ({
    ...o,
    description: `${o.description} - 游戏开发相关`,
    insight: `${o.insight} - 游戏市场增长`
  })),

  ai: createOpportunities(3, 'AI').map(o => ({
    ...o,
    description: `${o.description} - 人工智能驱动`,
    insight: `${o.insight} - AI技术突破`
  })),

  saas: createOpportunities(2, 'SaaS').map(o => ({
    ...o,
    description: `${o.description} - 企业订阅服务`,
    insight: `${o.insight} - B2B市场机会`
  })),

  ecommerce: createOpportunities(2, '电商').map(o => ({
    ...o,
    description: `${o.description} - 跨境电商平台`,
    insight: `${o.insight} - 跨境贸易趋势`
  }))
};

/**
 * 创建评分数据
 * @param {Object} overrides 覆盖默认值
 * @returns {Object} 评分对象
 */
export function createScoreData(overrides = {}) {
  return {
    roles: [
      { role: 'Product', score: 7, brief: '产品方向可行' },
      { role: 'Dev', score: 7, brief: '技术实现可行' },
      { role: 'Marketing', score: 6, brief: '市场竞争一般' },
      { role: 'Ops', score: 7, brief: '运营模式清晰' },
      { role: 'Optimist', score: 8, brief: '看好市场前景' },
      { role: 'Pessimist', score: 5, brief: '存在一定风险' }
    ],
    final_score: 67,
    ...overrides
  };
}

/**
 * 创建带评分的机会
 * @param {Object} overrides 覆盖默认值
 * @returns {Object} 带评分的机会对象
 */
export function createScoredOpportunity(overrides = {}) {
  return {
    ...createOpportunity(),
    product_score: 7,
    dev_score: 7,
    marketing_score: 6,
    ops_score: 7,
    optimist_score: 8,
    pessimist_score: 5,
    final_score: 67,
    product_brief: '产品方向可行',
    dev_brief: '技术实现可行',
    marketing_brief: '市场竞争一般',
    ops_brief: '运营模式清晰',
    optimist_brief: '看好市场前景',
    pessimist_brief: '存在一定风险',
    ...overrides
  };
}

/**
 * 各种格式的测试输入
 */
export const TEST_INPUTS = {
  validJson: JSON.stringify({
    opportunities: [
      { name: 'Valid Test', description: 'Valid Description', insight: 'Valid Insight' }
    ]
  }),

  emptyOpportunities: JSON.stringify({ opportunities: [] }),

  malformedJson: '{ invalid json',

  markdownWrapped: `
Here are the opportunities:
\`\`\`json
{"opportunities": [{"name": "Test", "description": "Desc", "insight": "Ins"}]}
\`\`\`
End of response.
`,

  missingFields: JSON.stringify({
    opportunities: [
      { name: 'Only Name' },
      { description: 'Only Description' },
      { name: 'Valid', description: 'Has both', insight: 'And insight' }
    ]
  }),

  plaintext: 'This is just plain text without any JSON structure.'
};