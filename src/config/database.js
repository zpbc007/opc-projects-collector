/**
 * 数据库配置
 * 统一管理数据库路径
 */

const path = require('path');

/**
 * 获取数据库路径
 * 支持通过环境变量 TEST_DB_PATH 覆盖（用于测试）
 */
function getDbPath() {
  return process.env.TEST_DB_PATH || path.resolve(__dirname, '../../data/opportunities.db');
}

/**
 * 初始化数据库连接
 * @param {string|null} dbPath - 可选的数据库路径（用于测试）
 * @returns {Database} better-sqlite3 数据库实例
 */
function initDb(dbPath = null) {
  const Database = require('better-sqlite3');
  return new Database(dbPath || getDbPath());
}

module.exports = {
  getDbPath,
  initDb
};