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

const { initDb } = require('../config/database');
const { DOMAIN_KEYWORDS, RELATED_DOMAINS, TRENDING_DOMAINS } = require('../config/domains');

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
// options.db 用于测试时注入外部数据库实例
function analyze(options = {}) {
  const shouldClose = !options.db;
  const db = options.db || initDb();
  const opportunities = db.prepare('SELECT * FROM opportunities ORDER BY created_at DESC').all();
  if (shouldClose) {
    db.close();
  }

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

module.exports = {
  analyze,
  analyzeCoveredDomains,
  extractKeywords,
  recommendBlankDomains,
  generateSearchStrategy
};