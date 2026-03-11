import Database from 'better-sqlite3';

/**
 * 创建内存数据库用于测试
 * @returns {Database} SQLite 数据库实例
 */
export function createInMemoryDb() {
  const db = new Database(':memory:');

  // 创建完整的表结构
  db.exec(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      insight TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      product_score INTEGER,
      dev_score INTEGER,
      marketing_score INTEGER,
      ops_score INTEGER,
      optimist_score INTEGER,
      pessimist_score INTEGER,
      final_score INTEGER,
      product_brief TEXT,
      dev_brief TEXT,
      marketing_brief TEXT,
      ops_brief TEXT,
      optimist_brief TEXT,
      pessimist_brief TEXT,
      scored_at TEXT,
      UNIQUE(name, description)
    );

    CREATE INDEX IF NOT EXISTS idx_name ON opportunities(name);
    CREATE INDEX IF NOT EXISTS idx_created_at ON opportunities(created_at);
  `);

  return db;
}

/**
 * 填充测试数据
 * @param {Database} db 数据库实例
 * @param {Array} opportunities 机会列表
 */
export function seedOpportunities(db, opportunities) {
  const stmt = db.prepare(`
    INSERT INTO opportunities (name, description, insight)
    VALUES (@name, @description, @insight)
  `);

  const insert = db.transaction((opps) => {
    for (const opp of opps) {
      stmt.run({
        name: opp.name,
        description: opp.description,
        insight: opp.insight || ''
      });
    }
  });

  insert(opportunities);
}

/**
 * 填充带评分的测试数据
 * @param {Database} db 数据库实例
 * @param {Array} opportunities 机会列表（含评分）
 */
export function seedScoredOpportunities(db, opportunities) {
  const stmt = db.prepare(`
    INSERT INTO opportunities (
      name, description, insight,
      product_score, dev_score, marketing_score, ops_score,
      optimist_score, pessimist_score, final_score,
      product_brief, dev_brief, marketing_brief, ops_brief,
      optimist_brief, pessimist_brief, scored_at
    )
    VALUES (
      @name, @description, @insight,
      @product_score, @dev_score, @marketing_score, @ops_score,
      @optimist_score, @pessimist_score, @final_score,
      @product_brief, @dev_brief, @marketing_brief, @ops_brief,
      @optimist_brief, @pessimist_brief, datetime('now', 'localtime')
    )
  `);

  const insert = db.transaction((opps) => {
    for (const opp of opps) {
      stmt.run({
        name: opp.name,
        description: opp.description,
        insight: opp.insight || '',
        product_score: opp.product_score || null,
        dev_score: opp.dev_score || null,
        marketing_score: opp.marketing_score || null,
        ops_score: opp.ops_score || null,
        optimist_score: opp.optimist_score || null,
        pessimist_score: opp.pessimist_score || null,
        final_score: opp.final_score || null,
        product_brief: opp.product_brief || null,
        dev_brief: opp.dev_brief || null,
        marketing_brief: opp.marketing_brief || null,
        ops_brief: opp.ops_brief || null,
        optimist_brief: opp.optimist_brief || null,
        pessimist_brief: opp.pessimist_brief || null
      });
    }
  });

  insert(opportunities);
}

/**
 * 获取数据库统计信息
 * @param {Database} db 数据库实例
 * @returns {Object} 统计信息
 */
export function getDbStats(db) {
  const total = db.prepare('SELECT COUNT(*) as count FROM opportunities').get();
  const scored = db.prepare('SELECT COUNT(*) as count FROM opportunities WHERE final_score IS NOT NULL').get();
  const unscored = db.prepare('SELECT COUNT(*) as count FROM opportunities WHERE final_score IS NULL').get();

  return {
    total: total.count,
    scored: scored.count,
    unscored: unscored.count
  };
}

/**
 * 评分列定义
 */
const SCORE_COLUMNS = [
  { name: 'product_score', type: 'INTEGER' },
  { name: 'dev_score', type: 'INTEGER' },
  { name: 'marketing_score', type: 'INTEGER' },
  { name: 'ops_score', type: 'INTEGER' },
  { name: 'optimist_score', type: 'INTEGER' },
  { name: 'pessimist_score', type: 'INTEGER' },
  { name: 'final_score', type: 'INTEGER' },
  { name: 'product_brief', type: 'TEXT' },
  { name: 'dev_brief', type: 'TEXT' },
  { name: 'marketing_brief', type: 'TEXT' },
  { name: 'ops_brief', type: 'TEXT' },
  { name: 'optimist_brief', type: 'TEXT' },
  { name: 'pessimist_brief', type: 'TEXT' },
  { name: 'scored_at', type: 'TEXT' }
];

/**
 * 添加评分列到数据库表
 * @param {Database} db 数据库实例
 */
export function addScoreColumns(db) {
  const columns = db.prepare('PRAGMA table_info(opportunities)').all();
  const columnNames = columns.map(c => c.name);

  for (const col of SCORE_COLUMNS) {
    if (!columnNames.includes(col.name)) {
      db.exec(`ALTER TABLE opportunities ADD COLUMN ${col.name} ${col.type}`);
    }
  }
}