/**
 * Project Scorer 数据库操作
 * 多角色评分系统的数据层
 */

const Database = require('better-sqlite3');
const { getDbPath } = require('../config/database');

function getDb() {
  return new Database(getDbPath());
}

function migrate() {
  const db = getDb();

  // 检查字段是否已存在
  const columns = db.prepare('PRAGMA table_info(opportunities)').all();
  const columnNames = columns.map(c => c.name);

  const newColumns = [
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

  let added = 0;
  for (const col of newColumns) {
    if (!columnNames.includes(col.name)) {
      db.prepare(`ALTER TABLE opportunities ADD COLUMN ${col.name} ${col.type}`).run();
      added++;
    }
  }

  db.close();

  return { success: true, added, message: added > 0 ? `已添加 ${added} 个评分字段` : '评分字段已存在，无需迁移' };
}

function update(id, scoreJsonStr) {
  const db = getDb();

  let scoreData;
  try {
    scoreData = JSON.parse(scoreJsonStr);
  } catch (e) {
    db.close();
    return { success: false, error: '无效的 JSON 格式' };
  }

  // 提取各角色评分
  const roleMap = {};
  for (const role of scoreData.roles || []) {
    roleMap[role.role.toLowerCase()] = role;
  }

  const stmt = db.prepare(`
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
  `);

  const result = stmt.run(
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
    scoreData.final_score || null,
    id
  );

  db.close();

  if (result.changes > 0) {
    return {
      success: true,
      message: `项目 #${id} 评分已更新`,
      final_score: scoreData.final_score
    };
  } else {
    return { success: false, error: `未找到项目 #${id}` };
  }
}

function list() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, name, final_score,
           CASE WHEN final_score IS NULL THEN '未评分' ELSE '已评分' END as status,
           created_at, scored_at
    FROM opportunities
    ORDER BY id DESC
  `).all();
  db.close();
  return rows;
}

function unscored() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, name, description, insight, created_at
    FROM opportunities
    WHERE final_score IS NULL
    ORDER BY id DESC
  `).all();
  db.close();
  return { count: rows.length, items: rows };
}

module.exports = {
  migrate,
  update,
  list,
  unscored
};