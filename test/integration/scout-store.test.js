import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { parseOpportunities, storeOpportunities, getAllOpportunities, getStats } from '../../src/lib/store.js';
import { createOpportunity, createOpportunities, TEST_INPUTS } from '../helpers/fixtures.js';

describe('scout-store (integration)', () => {
  let db;

  beforeEach(() => {
    // 每个测试使用独立的内存数据库
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
      CREATE INDEX IF NOT EXISTS idx_name ON opportunities(name);
      CREATE INDEX IF NOT EXISTS idx_created_at ON opportunities(created_at);
    `);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  describe('storeOpportunities', () => {
    it('should store new opportunities successfully', () => {
      const opps = createOpportunities(3);
      const result = storeOpportunities(opps, db);

      expect(result.added).toBe(3);
      expect(result.duplicates).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should deduplicate identical opportunities', () => {
      const opp = createOpportunity();

      // 第一次存储
      const result1 = storeOpportunities([opp], db);
      expect(result1.added).toBe(1);

      // 第二次存储相同数据
      const result2 = storeOpportunities([opp], db);
      expect(result2.added).toBe(0);
      expect(result2.duplicates).toBe(1);
    });

    it('should handle mixed valid and invalid opportunities', () => {
      const opps = [
        createOpportunity({ name: 'Valid1' }),
        { name: 'Missing description' }, // 无效
        { description: 'Missing name' }, // 无效
        createOpportunity({ name: 'Valid2' })
      ];

      const result = storeOpportunities(opps, db);

      expect(result.added).toBe(2);
      expect(result.errors.length).toBe(2);
    });

    it('should handle empty opportunities array', () => {
      const result = storeOpportunities([], db);

      expect(result.added).toBe(0);
      expect(result.duplicates).toBe(0);
    });
  });

  describe('getAllOpportunities', () => {
    it('should return stored opportunities in reverse chronological order', () => {
      const opps = createOpportunities(5);
      storeOpportunities(opps, db);

      const results = getAllOpportunities(10, db);

      expect(results).toHaveLength(5);
      // 最新添加的在前面
      expect(results[0].name).toContain('Opportunity 5');
    });

    it('should respect limit parameter', () => {
      const opps = createOpportunities(10);
      storeOpportunities(opps, db);

      const results = getAllOpportunities(3, db);

      expect(results).toHaveLength(3);
    });

    it('should return empty array when no opportunities', () => {
      const results = getAllOpportunities(10, db);

      expect(results).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const opps = createOpportunities(5);
      storeOpportunities(opps, db);

      const stats = getStats(db);

      expect(stats.total).toBe(5);
      expect(stats.latestAt).toBeDefined();
    });

    it('should return zero for empty database', () => {
      const stats = getStats(db);

      expect(stats.total).toBe(0);
      expect(stats.latestAt).toBeNull();
    });
  });

  describe('parseOpportunities (with store)', () => {
    it('should parse and store valid JSON input', () => {
      const opps = parseOpportunities(TEST_INPUTS.validJson);
      const result = storeOpportunities(opps, db);

      expect(result.added).toBe(1);
    });

    it('should handle malformed JSON gracefully', () => {
      const opps = parseOpportunities(TEST_INPUTS.malformedJson);
      expect(opps).toEqual([]);

      const result = storeOpportunities(opps, db);
      expect(result.added).toBe(0);
    });
  });
});