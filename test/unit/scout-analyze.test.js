import { describe, it, expect } from 'vitest';
import {
  analyzeCoveredDomains,
  extractKeywords,
  recommendBlankDomains,
  generateSearchStrategy
} from '../../src/lib/analyze.js';
import { DOMAIN_KEYWORDS, TRENDING_DOMAINS } from '../../src/config/domains.js';

describe('analyzeCoveredDomains', () => {
  it('should identify domains from opportunity text', () => {
    const opportunities = [
      { name: 'AI游戏工具', description: 'AI驱动的游戏开发工具', insight: '游戏市场增长' },
      { name: 'SaaS平台', description: '企业级SaaS解决方案', insight: 'B2B订阅模式' }
    ];
    const result = analyzeCoveredDomains(opportunities);

    expect(result.domainCounts['AI']).toBeGreaterThan(0);
    expect(result.domainCounts['游戏']).toBeGreaterThan(0);
    expect(result.domainCounts['SaaS']).toBeGreaterThan(0);
  });

  it('should track keyword hits for each domain', () => {
    const opportunities = [
      { name: 'AI工具', description: '人工智能驱动', insight: '机器学习应用' }
    ];
    const result = analyzeCoveredDomains(opportunities);

    expect(result.keywordHits['AI']).toBeDefined();
    expect(result.keywordHits['AI'].length).toBeGreaterThan(0);
  });

  it('should return empty counts for empty input', () => {
    const result = analyzeCoveredDomains([]);
    expect(result).toEqual({
      domainCounts: {},
      keywordHits: {}
    });
  });

  it('should handle opportunities without matching domains', () => {
    const opportunities = [
      { name: '未知产品', description: '没有关键词匹配', insight: '测试用例' }
    ];
    const result = analyzeCoveredDomains(opportunities);
    expect(Object.keys(result.domainCounts).length).toBe(0);
  });

  it('should be case-insensitive for keyword matching', () => {
    const opportunities = [
      { name: 'AI TOOL', description: 'GAME platform', insight: 'SAAS solution' }
    ];
    const result = analyzeCoveredDomains(opportunities);
    expect(result.domainCounts['AI']).toBeDefined();
  });
});

describe('extractKeywords', () => {
  it('should extract and rank keywords by frequency', () => {
    const opportunities = [
      { name: 'AI工具', description: 'AI驱动的解决方案', insight: 'AI市场前景' },
      { name: '测试产品', description: '普通描述', insight: '内容' }
    ];
    const result = extractKeywords(opportunities);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('word');
    expect(result[0]).toHaveProperty('count');
  });

  it('should filter out stop words', () => {
    const opportunities = [
      { name: '这个产品的功能', description: '用户的服务平台', insight: '市场的内容' }
    ];
    const result = extractKeywords(opportunities);
    const words = result.map(k => k.word);

    // 过滤常用停用词
    expect(words).not.toContain('的');
    expect(words).not.toContain('和');
    expect(words).not.toContain('是');
  });

  it('should return top 20 keywords', () => {
    const opportunities = Array.from({ length: 50 }, (_, i) => ({
      name: `产品${i}`,
      description: `描述${i} 测试`,
      insight: `洞察${i} 测试`
    }));
    const result = extractKeywords(opportunities);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it('should handle empty input', () => {
    const result = extractKeywords([]);
    expect(result).toEqual([]);
  });

  it('should filter words shorter than 2 characters', () => {
    const opportunities = [
      { name: 'A B C', description: 'X Y Z', insight: '测试' }
    ];
    const result = extractKeywords(opportunities);
    const words = result.map(k => k.word);

    expect(words.every(w => w.length >= 2)).toBe(true);
  });
});

describe('recommendBlankDomains', () => {
  it('should recommend domains not in covered set', () => {
    const covered = { '游戏': 5, 'AI': 3 };
    const result = recommendBlankDomains(covered);

    expect(result.every(r => !covered[r.domain])).toBe(true);
  });

  it('should include trending domains not covered', () => {
    const covered = { '游戏': 1 };
    const result = recommendBlankDomains(covered);

    expect(result.some(r => r.trending === true)).toBe(true);
  });

  it('should sort recommendations by priority', () => {
    const covered = { '游戏': 1 };
    const result = recommendBlankDomains(covered);

    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].priority).toBeGreaterThanOrEqual(result[i + 1].priority);
    }
  });

  it('should include reason for each recommendation', () => {
    const covered = { '游戏': 5 };
    const result = recommendBlankDomains(covered);

    expect(result.every(r => typeof r.reason === 'string')).toBe(true);
  });

  it('should limit recommendations to 10', () => {
    const covered = { '游戏': 1, 'AI': 1, 'SaaS': 1 };
    const result = recommendBlankDomains(covered);

    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('should return empty array when no covered domains', () => {
    const result = recommendBlankDomains({});
    // 当没有已覆盖领域时，只能推荐趋势领域
    expect(result.every(r => r.trending === true)).toBe(true);
  });
});

describe('generateSearchStrategy', () => {
  it('should generate focused strategy when domain specified', () => {
    const opportunities = [
      { name: 'Test', description: '游戏相关', insight: '游戏市场' }
    ];
    const result = generateSearchStrategy(opportunities, '游戏');

    expect(result.mode).toBe('focused');
    expect(result.targetDomain).toBe('游戏');
    expect(result.relatedKeywords).toBeDefined();
    expect(result.suggestedSearches).toBeDefined();
  });

  it('should generate intelligent strategy without specific domain', () => {
    const opportunities = [
      { name: 'AI工具', description: 'AI驱动', insight: 'AI市场' },
      { name: '游戏平台', description: '游戏开发', insight: '游戏增长' }
    ];
    const result = generateSearchStrategy(opportunities);

    expect(result.mode).toBe('intelligent');
    expect(result.summary).toBeDefined();
    expect(result.summary.totalOpportunities).toBe(2);
    expect(result.recommendedSearches).toBeDefined();
  });

  it('should include nextBestAction when blank domains exist', () => {
    const opportunities = [
      { name: 'AI工具', description: 'AI驱动', insight: 'AI市场' }
    ];
    const result = generateSearchStrategy(opportunities);

    if (result.summary.blankDomains.length > 0) {
      expect(result.nextBestAction).toBeDefined();
      expect(result.nextBestAction.domain).toBeDefined();
      expect(result.nextBestAction.suggestedQuery).toBeDefined();
    }
  });

  it('should handle empty opportunities', () => {
    const result = generateSearchStrategy([]);

    expect(result.summary.totalOpportunities).toBe(0);
    expect(result.summary.coveredDomains).toEqual([]);
  });
});

describe('constants', () => {
  it('DOMAIN_KEYWORDS should have expected domains', () => {
    expect(DOMAIN_KEYWORDS).toHaveProperty('AI');
    expect(DOMAIN_KEYWORDS).toHaveProperty('游戏');
    expect(DOMAIN_KEYWORDS).toHaveProperty('SaaS');
    expect(DOMAIN_KEYWORDS).toHaveProperty('电商');
  });

  it('TRENDING_DOMAINS should have priority property', () => {
    expect(TRENDING_DOMAINS.length).toBeGreaterThan(0);
    expect(TRENDING_DOMAINS[0]).toHaveProperty('domain');
    expect(TRENDING_DOMAINS[0]).toHaveProperty('keywords');
    expect(TRENDING_DOMAINS[0]).toHaveProperty('priority');
  });
});