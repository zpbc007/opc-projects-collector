import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import {
  analyzeCoveredDomains,
  extractKeywords,
  recommendBlankDomains,
  generateSearchStrategy,
  analyze
} from '../../src/lib/analyze.js';
import { SCOPED_OPPORTUNITIES, createOpportunities } from '../helpers/fixtures.js';
import { seedOpportunities } from '../helpers/db.js';

describe('scout-analyze (integration)', () => {
  let db;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        insight TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, description)
      );
    `);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  describe('analyzeCoveredDomains with real data', () => {
    it('should correctly identify multiple domains', () => {
      const allOpps = [
        ...SCOPED_OPPORTUNITIES.gaming,
        ...SCOPED_OPPORTUNITIES.ai,
        ...SCOPED_OPPORTUNITIES.saas
      ];

      const result = analyzeCoveredDomains(allOpps);

      expect(result.domainCounts['游戏']).toBeDefined();
      expect(result.domainCounts['AI']).toBeDefined();
      expect(result.domainCounts['SaaS']).toBeDefined();
    });

    it('should count keyword hits accurately', () => {
      const opps = [
        { name: 'AI Tool', description: 'AI powered AI assistant', insight: 'AI is trending' }
      ];

      const result = analyzeCoveredDomains(opps);

      // AI 关键词至少出现一次
      expect(result.domainCounts['AI']).toBeGreaterThanOrEqual(1);
    });
  });

  describe('extractKeywords with real data', () => {
    it('should extract meaningful keywords from mixed content', () => {
      const opps = [
        { name: '游戏开发平台', description: '独立游戏开发者工具', insight: '游戏市场持续增长' },
        { name: 'AI 内容生成', description: 'AI 驱动的内容创作工具', insight: 'AI 技术突破' }
      ];

      const keywords = extractKeywords(opps);

      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.some(k => k.word === '游戏' || k.word === 'AI')).toBe(true);
    });

    it('should rank keywords by frequency', () => {
      const opps = Array.from({ length: 10 }, (_, i) => ({
        name: `测试产品${i}`,
        description: i < 5 ? '高频关键词A' : '低频关键词B',
        insight: '测试洞察'
      }));

      const keywords = extractKeywords(opps);

      // 高频词应该排在前面
      const keywordA = keywords.find(k => k.word === '高频');
      const keywordB = keywords.find(k => k.word === '低频');

      if (keywordA && keywordB) {
        expect(keywordA.count).toBeGreaterThan(keywordB.count);
      }
    });
  });

  describe('recommendBlankDomains with real data', () => {
    it('should recommend related but uncovered domains', () => {
      const covered = { '游戏': 10, 'AI': 5 };
      const recommendations = recommendBlankDomains(covered);

      // 游戏相关领域：AI, 社交, 内容, 移动, 出海
      // AI相关领域：SaaS, 教育, 游戏, 内容, 健康
      // 所以推荐中应该包含这些相关但未覆盖的领域
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.every(r => r.domain !== '游戏' && r.domain !== 'AI')).toBe(true);
    });

    it('should prioritize trending domains', () => {
      const covered = { '游戏': 1 };
      const recommendations = recommendBlankDomains(covered);

      // 趋势领域应该优先级较高
      const trending = recommendations.filter(r => r.trending);
      expect(trending.length).toBeGreaterThan(0);
    });
  });

  describe('generateSearchStrategy with real data', () => {
    it('should generate comprehensive strategy', () => {
      const opps = [
        ...SCOPED_OPPORTUNITIES.gaming,
        ...SCOPED_OPPORTUNITIES.ai
      ];

      const strategy = generateSearchStrategy(opps);

      expect(strategy.mode).toBe('intelligent');
      expect(strategy.summary.totalOpportunities).toBe(6);
      expect(strategy.summary.coveredDomains.length).toBeGreaterThan(0);
      expect(strategy.recommendedSearches.length).toBeGreaterThan(0);
    });

    it('should provide focused strategy for specific domain', () => {
      const opps = SCOPED_OPPORTUNITIES.gaming;
      const strategy = generateSearchStrategy(opps, '游戏');

      expect(strategy.mode).toBe('focused');
      expect(strategy.targetDomain).toBe('游戏');
      expect(strategy.relatedKeywords.length).toBeGreaterThan(0);
      expect(strategy.suggestedSearches.length).toBeGreaterThan(0);
    });

    it('should handle empty opportunities', () => {
      const strategy = generateSearchStrategy([]);

      expect(strategy.summary.totalOpportunities).toBe(0);
      expect(strategy.summary.coveredDomains).toEqual([]);
    });
  });

  describe('analyze with database', () => {
    it('should return empty mode for empty database', () => {
      const result = analyze({ db });

      expect(result.mode).toBe('empty');
      expect(result.suggestedDomains).toBeDefined();
      expect(result.suggestedDomains.length).toBeGreaterThan(0);
    });

    it('should return intelligent mode with data', () => {
      seedOpportunities(db, SCOPED_OPPORTUNITIES.gaming);

      const result = analyze({ db });

      expect(result.mode).toBe('intelligent');
      expect(result.summary).toBeDefined();
    });
  });
});