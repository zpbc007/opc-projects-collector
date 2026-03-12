#!/usr/bin/env node
/**
 * Project Scorer CLI
 * 多角色评分系统的命令行接口
 */

const { migrate, update, list, unscored } = require('../src/lib/scorer');

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'migrate': {
    const result = migrate();
    console.log(JSON.stringify(result, null, 2));
    break;
  }
  case 'update':
    if (!args[0] || !args[1]) {
      console.log(JSON.stringify({ error: '用法: node cli/scorer.js update <id> "<JSON评分结果>"' }));
      process.exit(1);
    }
    const result = update(parseInt(args[0]), args.slice(1).join(' '));
    console.log(JSON.stringify(result, null, 2));
    break;
  case 'list': {
    const rows = list();
    console.log(JSON.stringify(rows, null, 2));
    break;
  }
  case 'unscored': {
    const data = unscored();
    console.log(JSON.stringify(data, null, 2));
    break;
  }
  default:
    console.log(JSON.stringify({
      usage: 'node cli/scorer.js <command>',
      commands: ['migrate', 'update <id> <json>', 'list', 'unscored']
    }));
}