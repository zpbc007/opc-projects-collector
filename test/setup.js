import { beforeAll, afterAll } from 'vitest';

// 设置测试数据库路径环境变量为内存数据库
beforeAll(() => {
  process.env.TEST_DB_PATH = ':memory:';
});

// 测试结束后无需清理（内存数据库自动释放）
afterAll(() => {
  // 内存数据库无需清理
});