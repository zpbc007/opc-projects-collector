import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { createOpportunity, createScoredOpportunity, createScoreData } from '../helpers/fixtures.js';
import { seedOpportunities, seedScoredOpportunities, getDbStats, addScoreColumns } from '../helpers/db.js';

// 由于 scorer-workflow.js 没有导出，我们测试其核心逻辑
// 通过模拟方式验证功能

describe('scorer-workflow (integration)', () => {
  let db;

  beforeEach(() => {
    db = new Database(':memory:');
    // 创建基础表（不含评分列）
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

  describe('migrate', () => {
    it('should add scoring columns to opportunities table', () => {
      // 添加评分列
      addScoreColumns(db);

      // 验证新列已添加
      const columns = db.prepare('PRAGMA table_info(opportunities)').all();
      const columnNames = columns.map(c => c.name);

      expect(columnNames).toContain('product_score');
      expect(columnNames).toContain('dev_score');
      expect(columnNames).toContain('final_score');
      expect(columnNames).toContain('scored_at');
    });

    it('should be idempotent - running twice should not fail', () => {
      // 第一次添加
      addScoreColumns(db);

      // 第二次添加 - 不应该抛出错误
      expect(() => addScoreColumns(db)).not.toThrow();

      // 验证列存在
      const columns = db.prepare('PRAGMA table_info(opportunities)').all();
      const columnNames = columns.map(c => c.name);
      expect(columnNames).toContain('product_score');
      expect(columnNames).toContain('final_score');
    });
  });

  describe('update scores', () => {
    beforeEach(() => {
      addScoreColumns(db);
    });

    it('should update opportunity scores', () => {
      // 插入测试数据
      const opp = createOpportunity();
      const insertResult = db.prepare(`
        INSERT INTO opportunities (name, description, insight)
        VALUES (?, ?, ?)
      `).run(opp.name, opp.description, opp.insight);

      const id = insertResult.lastInsertRowid;

      // 更新评分
      const scoreData = createScoreData();
      const roleMap = {};
      for (const role of scoreData.roles) {
        roleMap[role.role.toLowerCase()] = role;
      }

      db.prepare(`
        UPDATE opportunities SET
          product_score = ?, product_brief = ?,
          dev_score = ?, dev_brief = ?,
          marketing_score = ?, marketing_brief = ?,
          ops_score = ?, ops_brief = ?,
          optimist_score = ?, optimist_brief = ?,
          pessimist_score = ?, pessimist_brief = ?,
          final_score = ?,
          scored_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(
        roleMap['product']?.score || null,
        roleMap['product']?.brief || null,
        roleMap['dev']?.score || null,
        roleMap['dev']?.brief || null,
        roleMap['marketing']?.score || null,
        roleMap['marketing']?.brief || null,
        roleMap['ops']?.score || null,
        roleMap['ops']?.brief || null,
        roleMap['optimist']?.score || null,
        roleMap['optimist']?.brief || null,
        roleMap['pessimist']?.score || null,
        roleMap['pessimist']?.brief || null,
        scoreData.final_score,
        id
      );

      // 验证更新
      const updated = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id);

      expect(updated.product_score).toBe(7);
      expect(updated.dev_score).toBe(7);
      expect(updated.final_score).toBe(67);
      expect(updated.scored_at).toBeDefined();
    });

    it('should handle non-existent id', () => {
      const result = db.prepare(`
        UPDATE opportunities SET final_score = ? WHERE id = ?
      `).run(100, 999);

      expect(result.changes).toBe(0);
    });

    it('should handle partial score data', () => {
      // 插入测试数据
      const opp = createOpportunity();
      const insertResult = db.prepare(`
        INSERT INTO opportunities (name, description, insight)
        VALUES (?, ?, ?)
      `).run(opp.name, opp.description, opp.insight);

      const id = insertResult.lastInsertRowid;

      // 只更新部分评分
      db.prepare(`
        UPDATE opportunities SET
          product_score = ?,
          final_score = ?
        WHERE id = ?
      `).run(8, 80, id);

      const updated = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id);

      expect(updated.product_score).toBe(8);
      expect(updated.dev_score).toBeNull();
      expect(updated.final_score).toBe(80);
    });
  });

  describe('list operations', () => {
    beforeEach(() => {
      addScoreColumns(db);
    });

    it('should list all opportunities with scoring status', () => {
      seedOpportunities(db, [createOpportunity({ name: 'Unscored' })]);
      seedScoredOpportunities(db, [createScoredOpportunity({ name: 'Scored' })]);

      const rows = db.prepare(`
        SELECT id, name, final_score,
               CASE WHEN final_score IS NULL THEN '未评分' ELSE '已评分' END as status,
               created_at, scored_at
        FROM opportunities
        ORDER BY id DESC
      `).all();

      expect(rows).toHaveLength(2);
      expect(rows.find(r => r.name === 'Unscored').status).toBe('未评分');
      expect(rows.find(r => r.name === 'Scored').status).toBe('已评分');
    });

    it('should list only unscored opportunities', () => {
      seedOpportunities(db, [createOpportunity({ name: 'Unscored1' })]);
      seedScoredOpportunities(db, [createScoredOpportunity({ name: 'Scored1' })]);

      const rows = db.prepare(`
        SELECT id, name, description, insight, created_at
        FROM opportunities
        WHERE final_score IS NULL
        ORDER BY id DESC
      `).all();

      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('Unscored1');
    });
  });

  describe('database stats', () => {
    beforeEach(() => {
      addScoreColumns(db);
    });

    it('should return correct stats', () => {
      seedOpportunities(db, [
        createOpportunity({ name: 'Unscored Opp 1' }),
        createOpportunity({ name: 'Unscored Opp 2' })
      ]);
      seedScoredOpportunities(db, [createScoredOpportunity({ name: 'Scored Opp' })]);

      const stats = getDbStats(db);

      expect(stats.total).toBe(3);
      expect(stats.scored).toBe(1);
      expect(stats.unscored).toBe(2);
    });
  });
});