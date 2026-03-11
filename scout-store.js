#!/usr/bin/env node
/**
 * Scout Opportunity Storage
 * 存储和去重 scout 发现的机会
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'opportunities.db');

// 支持测试时注入数据库路径
function getDbPath() {
  return process.env.TEST_DB_PATH || DB_PATH;
}

// 初始化数据库
function initDb(dbPath = null) {
  const db = new Database(dbPath || getDbPath());

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

  return db;
}

// 解析 scout 返回的 JSON 结果
function parseOpportunities(text) {
  // 确保 text 是字符串
  if (typeof text !== 'string') {
    text = String(text || '');
  }
  
  try {
    // 尝试直接解析
    const json = JSON.parse(text);
    if (json.opportunities && Array.isArray(json.opportunities)) {
      return json.opportunities;
    }
    return [];
  } catch (e) {
    // 尝试提取 JSON 块
    const jsonMatch = text.match(/\{[\s\S]*"opportunities"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const json = JSON.parse(jsonMatch[0]);
        return json.opportunities || [];
      } catch (e2) {
        console.error('Failed to parse JSON from text:', e2.message);
        return [];
      }
    }
    console.error('No valid JSON found in text');
    return [];
  }
}

// 存储机会（去重）
// db 参数用于测试时注入外部数据库实例
function storeOpportunities(opportunities, externalDb = null) {
  const shouldClose = !externalDb;
  const db = externalDb || initDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO opportunities (name, description, insight)
    VALUES (@name, @description, @insight)
  `);

  const results = {
    added: 0,
    duplicates: 0,
    errors: []
  };

  for (const opp of opportunities) {
    if (!opp.name || !opp.description) {
      results.errors.push(`Missing required fields: ${JSON.stringify(opp)}`);
      continue;
    }

    try {
      const info = stmt.run({
        name: opp.name,
        description: opp.description,
        insight: opp.insight || ''
      });

      if (info.changes > 0) {
        results.added++;
      } else {
        results.duplicates++;
      }
    } catch (e) {
      results.errors.push(`Error storing "${opp.name}": ${e.message}`);
    }
  }

  if (shouldClose) {
    db.close();
  }
  return results;
}

// 获取所有机会
// db 参数用于测试时注入外部数据库实例
function getAllOpportunities(limit = 100, externalDb = null) {
  const shouldClose = !externalDb;
  const db = externalDb || initDb();
  const stmt = db.prepare(`SELECT * FROM opportunities ORDER BY created_at DESC LIMIT ?`);
  const results = stmt.all(limit);
  if (shouldClose) {
    db.close();
  }
  return results;
}

// 统计
// db 参数用于测试时注入外部数据库实例
function getStats(externalDb = null) {
  const shouldClose = !externalDb;
  const db = externalDb || initDb();
  const count = db.prepare(`SELECT COUNT(*) as total FROM opportunities`).get();
  const latest = db.prepare(`SELECT created_at FROM opportunities ORDER BY created_at DESC LIMIT 1`).get();
  if (shouldClose) {
    db.close();
  }
  return {
    total: count?.total || 0,
    latestAt: latest?.created_at || null
  };
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'store': {
      const input = args[1] || process.stdin;
      if (input === '-') {
        let data = '';
        process.stdin.on('data', chunk => data += chunk);
        process.stdin.on('end', () => {
          const opps = parseOpportunities(data);
          const result = storeOpportunities(opps);
          console.log(JSON.stringify(result, null, 2));
        });
      } else {
        const opps = parseOpportunities(input);
        const result = storeOpportunities(opps);
        console.log(JSON.stringify(result, null, 2));
      }
      break;
    }
    case 'list': {
      const limit = parseInt(args[1]) || 100;
      const opps = getAllOpportunities(limit);
      console.log(JSON.stringify(opps, null, 2));
      break;
    }
    case 'stats': {
      const stats = getStats();
      console.log(JSON.stringify(stats, null, 2));
      break;
    }
    default:
      console.log(`Usage:
  node scout-store.js store '<json>'    - 存储机会（去重）
  cat result.json | node scout-store.js store -   - 从 stdin 读取
  node scout-store.js list [limit]      - 列出所有机会
  node scout-store.js stats             - 显示统计`);
  }
}

module.exports = {
  initDb,
  parseOpportunities,
  storeOpportunities,
  getAllOpportunities,
  getStats
};