#!/usr/bin/env node
/**
 * Scout 智能分析模块
 * 基于历史记录分析，自动推荐本次搜索领域
 * 
 * 功能：
 * 1. 分析已覆盖领域 - 避免重复搜索
 * 2. 提取趋势关键词 - 发现热点方向
 * 3. 推荐空白领域 - 相关但未搜索的方向
 * 4. 生成智能搜索策略
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'opportunities.db');

// 领域映射表 - 关键词 -> 领域分类
const DOMAIN_KEYWORDS = {
  '游戏': ['游戏', 'game', 'gaming', '玩家', '开发者', '变现', '休闲', 'HTML5', '小游戏'],
  'AI': ['AI', '人工智能', '机器学习', 'GPT', 'LLM', '生成式', '自动化', '智能'],
  '电商': ['电商', '购物', '零售', '供应链', '物流', '跨境', 'DTC'],
  'SaaS': ['SaaS', '订阅', 'B2B', '企业服务', '工具', '效率', '协作'],
  '内容': ['内容', '创作者', '视频', '播客', '写作', '媒体', '自媒体'],
  '教育': ['教育', '学习', '培训', '课程', '技能', '在线教育'],
  '金融': ['金融', '支付', '信贷', '投资', '理财', '保险', 'fintech'],
  '健康': ['健康', '医疗', '健身', '养生', '心理健康', '远程医疗'],
  '社交': ['社交', '社区', '通讯', '聊天', '社群', '交友'],
  '移动': ['移动', 'App', 'iOS', 'Android', '移动端', '手机'],
  '本地生活': ['本地', 'O2O', '外卖', '到店', '生活服务'],
  '出海': ['出海', '海外', '全球化', '国际', '跨境', '本地化']
};

// 相关领域推荐矩阵
const RELATED_DOMAINS = {
  '游戏': ['AI', '社交', '内容', '移动', '出海'],
  'AI': ['SaaS', '教育', '游戏', '内容', '健康'],
  '电商': ['物流', '金融', '内容', '本地生活', '出海'],
  'SaaS': ['AI', '教育', '效率', '企业服务'],
  '内容': ['社交', '游戏', '教育', 'AI'],
  '教育': ['AI', '内容', 'SaaS', '游戏'],
  '金融': ['电商', 'AI', 'SaaS', '健康'],
  '健康': ['AI', '移动', '内容', '教育'],
  '社交': ['游戏', '内容', '移动', 'AI'],
  '移动': ['游戏', '社交', 'AI', '本地生活'],
  '本地生活': ['电商', '移动', '社交', '内容'],
  '出海': ['游戏', '电商', '内容', 'SaaS']
};

// 新兴领域/趋势（可定期更新）
const TRENDING_DOMAINS = [
  { domain: 'AI Agent', keywords: ['AI Agent', '智能代理', '自主AI', 'agent', '多模态'], priority: 10 },
  { domain: 'Web3', keywords: ['Web3', '区块链', 'NFT', 'DeFi', '加密'], priority: 7 },
  { domain: '低代码/无代码', keywords: ['低代码', '无代码', 'no-code', 'low-code', '自动化'], priority: 8 },
  { domain: 'RPA', keywords: ['RPA', '自动化流程', '机器人流程', '自动化办公'], priority: 7 },
  { domain: '远程办公', keywords: ['远程办公', '远程协作', '混合办公', '数字游民'], priority: 6 },
  { domain: '隐私安全', keywords: ['隐私', '数据安全', '合规', 'GDPR', '信息安全'], priority: 7 },
  { domain: '绿色科技', keywords: ['碳中和', 'ESG', '可持续发展', '绿色能源', '环保'], priority: 6 },
  { domain: '元宇宙', keywords: ['元宇宙', 'VR', 'AR', '虚拟现实', 'XR', '空间计算'], priority: 5 },
  { domain: '银发经济', keywords: ['养老', '老年', '适老化', '银发', '老年护理'], priority: 8 },
  { domain: '宠物经济', keywords: ['宠物', '猫狗', '宠物医疗', '宠物食品', '智能宠物'], priority: 7 },
  { domain: '心理健康', keywords: ['心理健康', '心理咨询', '冥想', '焦虑', '抑郁', '疗愈'], priority: 9 },
  { domain: '知识付费', keywords: ['知识付费', '付费课程', '知识变现', '知识社区'], priority: 6 },
  { domain: '短视频直播', keywords: ['短视频', '直播', 'TikTok', '抖音', '带货'], priority: 7 },
  { domain: '智能家居', keywords: ['智能家居', 'IoT', '智能硬件', '家庭自动化'], priority: 6 },
  { domain: '电动汽车', keywords: ['电动汽车', '充电桩', '新能源车', 'EV', '电池'], priority: 7 }
];

function initDb() {
  const Database = require('better-sqlite3');
  return new Database(DB_PATH);
}

// 分析已覆盖的领域
function analyzeCoveredDomains(opportunities) {
  const domainCounts = {};
  const keywordHits = {};
  
  for (const opp of opportunities) {
    const text = `${opp.name} ${opp.description} ${opp.insight}`.toLowerCase();
    
    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      const hits = keywords.filter(kw => text.includes(kw.toLowerCase()));
      if (hits.length > 0) {
        domainCounts[domain] = (domainCounts[domain] || 0) + hits.length;
        keywordHits[domain] = keywordHits[domain] || [];
        keywordHits[domain].push(...hits);
      }
    }
  }
  
  // 去重关键词
  for (const domain of Object.keys(keywordHits)) {
    keywordHits[domain] = [...new Set(keywordHits[domain])];
  }
  
  return { domainCounts, keywordHits };
}

// 提取关键词频率
function extractKeywords(opportunities) {
  const keywordFreq = {};
  const stopWords = new Set(['的', '和', '与', '或', '在', '是', '有', '为', '对', '能', '可', '这', '那', '但', '而', '了', '在', '到', '从', '等', '及', '如', '该', '其', '中', '以', '上', '下', '不', '也', '都', '就', '会', '要', '可以', '需要', '通过', '包括', '以及', '提供', '进行', '实现', '使用', '一个', '这种', '这个', '这些', '那些', '市场', '用户', '服务', '平台', '功能', '系统']);
  
  for (const opp of opportunities) {
    const text = `${opp.name} ${opp.description} ${opp.insight}`;
    // 简单分词（中文按字符，英文按单词）
    const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
    
    for (const word of words) {
      if (word.length < 2 || stopWords.has(word)) continue;
      keywordFreq[word] = (keywordFreq[word] || 0) + 1;
    }
  }
  
  // 排序返回前 20 个
  return Object.entries(keywordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));
}

// 推荐空白领域
function recommendBlankDomains(coveredDomains) {
  const recommendations = [];
  const coveredSet = new Set(Object.keys(coveredDomains));
  
  // 从相关领域矩阵中找空白
  for (const domain of Object.keys(coveredDomains)) {
    const related = RELATED_DOMAINS[domain] || [];
    for (const r of related) {
      if (!coveredSet.has(r)) {
        recommendations.push({
          domain: r,
          reason: `与已探索的"${domain}"领域相关`,
          priority: coveredDomains[domain]
        });
      }
    }
  }
  
  // 添加新兴领域
  for (const trending of TRENDING_DOMAINS) {
    if (!coveredSet.has(trending.domain)) {
      recommendations.push({
        domain: trending.domain,
        reason: '新兴趋势领域',
        priority: trending.priority,
        trending: true
      });
    }
  }
  
  // 按优先级排序，去重
  const seen = new Set();
  const unique = recommendations
    .sort((a, b) => b.priority - a.priority)
    .filter(r => {
      if (seen.has(r.domain)) return false;
      seen.add(r.domain);
      return true;
    })
    .slice(0, 10);
  
  return unique;
}

// 生成搜索策略
function generateSearchStrategy(opportunities, focusDomain = null) {
  const { domainCounts, keywordHits } = analyzeCoveredDomains(opportunities);
  const topKeywords = extractKeywords(opportunities);
  const blankDomains = recommendBlankDomains(domainCounts);
  
  // 如果指定了焦点领域，优先返回
  if (focusDomain) {
    return {
      mode: 'focused',
      targetDomain: focusDomain,
      relatedKeywords: DOMAIN_KEYWORDS[focusDomain] || [],
      suggestedSearches: [
        `${focusDomain} 商业机会 2025`,
        `${focusDomain} 市场趋势`,
        `${focusDomain} 创业方向`,
        `${focusDomain} 用户痛点`
      ]
    };
  }
  
  // 智能推荐模式
  const coveredList = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([domain, count]) => ({ domain, count, keywords: keywordHits[domain] }));
  
  // 生成推荐搜索
  const suggestedSearches = [];
  
  // 1. 从空白领域推荐
  for (const blank of blankDomains.slice(0, 3)) {
    suggestedSearches.push({
      domain: blank.domain,
      query: `${blank.domain} 商业机会 市场分析`,
      reason: blank.reason,
      priority: blank.priority
    });
  }
  
  // 2. 从热门关键词延伸
  for (const kw of topKeywords.slice(0, 3)) {
    suggestedSearches.push({
      keyword: kw.word,
      query: `${kw.word} 新机会 创业方向`,
      reason: `基于已发现机会中的高频关键词`,
      priority: 5
    });
  }
  
  return {
    mode: 'intelligent',
    summary: {
      totalOpportunities: opportunities.length,
      coveredDomains: coveredList,
      topKeywords: topKeywords.slice(0, 10),
      blankDomains: blankDomains.slice(0, 5)
    },
    recommendedSearches: suggestedSearches.sort((a, b) => b.priority - a.priority).slice(0, 5),
    nextBestAction: blankDomains[0] ? {
      domain: blankDomains[0].domain,
      reason: blankDomains[0].reason,
      suggestedQuery: `${blankDomains[0].domain} 商业机会 新兴趋势`
    } : null
  };
}

// 主函数
function analyze(options = {}) {
  const db = initDb();
  const opportunities = db.prepare('SELECT * FROM opportunities ORDER BY created_at DESC').all();
  db.close();
  
  if (opportunities.length === 0) {
    return {
      mode: 'empty',
      message: '暂无历史记录，建议从以下热门领域开始搜索',
      suggestedDomains: TRENDING_DOMAINS.slice(0, 5).map(t => ({
        domain: t.domain,
        priority: t.priority
      }))
    };
  }
  
  return generateSearchStrategy(opportunities, options.focus);
}

// CLI
if (require.main === module) {
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
  node scout-analyze.js           - 完整分析报告
  node scout-analyze.js analyze   - 同上
  node scout-analyze.js domains   - 显示已覆盖领域
  node scout-analyze.js keywords  - 显示高频关键词
  node scout-analyze.js recommend - 推荐空白领域

输出说明:
  - coveredDomains: 已探索的领域及覆盖深度
  - topKeywords: 高频关键词
  - blankDomains: 建议探索的空白领域
  - recommendedSearches: 推荐的搜索查询
  - nextBestAction: 下一步最佳行动`);
  }
}

module.exports = {
  analyze,
  analyzeCoveredDomains,
  extractKeywords,
  recommendBlankDomains,
  generateSearchStrategy,
  DOMAIN_KEYWORDS,
  TRENDING_DOMAINS
};