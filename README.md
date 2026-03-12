# OPC Projects Collector

OPC 商业机会发现和管理系统 - 使用 AI 驱动的 Agent 发现商业机会，存储到 SQLite 数据库并进行多维度评分。

## 功能特性

- **智能发现**: 通过 Scout Agent 自动发现商业机会
- **数据存储**: SQLite 持久化存储，支持自动去重
- **领域分析**: 覆盖 12+ 行业领域的分类与追踪
- **多维度评分**: 从产品、开发、市场、运营、乐观、悲观六个视角评估机会
- **趋势追踪**: 内置 15 个新兴领域的趋势关键词

## 安装

```bash
# 克隆仓库
git clone <repository-url>
cd opc-projects-collector

# 安装依赖
npm install
```

## 快速开始

### 存储机会

```bash
# 从 JSON 字符串存储机会
node cli/store.js store '[{"name":"项目名","description":"项目描述","insight":"洞察"}]'

# 列出已存储的机会
node cli/store.js list [limit]

# 查看数据库统计
node cli/store.js stats
```

### 领域分析

```bash
# 完整分析报告
node cli/analyze.js

# 查看已覆盖领域
node cli/analyze.js domains

# 查看趋势关键词
node cli/analyze.js keywords

# 推荐待探索领域
node cli/analyze.js recommend
```

### 机会评分

```bash
# 数据库迁移（添加评分字段）
node cli/scorer.js migrate

# 更新评分
node cli/scorer.js update <id> '{"product_score":8,"dev_score":7}'

# 列出已评分项目
node cli/scorer.js list

# 列出未评分项目
node cli/scorer.js unscored
```

### 管道自动化

```bash
# 运行分析和推荐
node cli/pipeline.js analyze

# 查看管道统计
node cli/pipeline.js stats
```

## NPM 脚本

```bash
npm test                 # 运行所有测试
npm run test:watch       # 测试监视模式
npm run test:coverage    # 生成覆盖率报告

npm run cli:store -- stats
npm run cli:analyze -- recommend
npm run cli:pipeline -- stats
```

## 项目结构

```
opc-projects-collector/
├── src/
│   ├── lib/              # 核心库模块
│   │   ├── store.js      # 数据库存储层
│   │   ├── analyze.js    # 领域分析引擎
│   │   ├── workflow.js   # Scout 工作流编排
│   │   ├── scorer.js     # 多角色评分系统
│   │   └── pipeline.js   # 管道自动化
│   ├── config/           # 配置模块
│   │   ├── domains.js    # 领域关键词和趋势领域
│   │   └── database.js   # 数据库路径配置
│   └── index.js          # 统一导出入口
├── cli/                  # CLI 入口脚本
├── data/                 # 数据文件
│   └── opportunities.db  # SQLite 数据库
├── test/                 # 测试文件
│   ├── unit/             # 单元测试
│   ├── integration/      # 集成测试
│   ├── helpers/          # 测试辅助工具
│   └── fixtures/         # 测试数据
└── coverage/             # 覆盖率报告
```

## API 使用

```javascript
const opc = require('opc-projects-collector');

// 存储机会
const opportunities = opc.parseOpportunities(jsonString);
opc.storeOpportunities(opportunities);

// 获取所有机会
const all = opc.getAllOpportunities();

// 分析机会
const analysis = opc.analyzeOpportunities(opportunities);

// 获取统计信息
const stats = opc.getStats();
```

### 模块导出

项目支持细粒度的模块导入：

```javascript
// 导入单个模块
const store = require('opc-projects-collector/store');
const analyze = require('opc-projects-collector/analyze');
const workflow = require('opc-projects-collector/workflow');
const scorer = require('opc-projects-collector/scorer');
const pipeline = require('opc-projects-collector/pipeline');
const domains = require('opc-projects-collector/domains');
```

## 数据库结构

### opportunities 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 项目名称 |
| description | TEXT | 项目描述 |
| insight | TEXT | 洞察 |
| created_at | TEXT | 创建时间 |

### 评分字段

| 字段 | 类型 | 说明 |
|------|------|------|
| product_score | INTEGER | 产品评分 (1-10) |
| dev_score | INTEGER | 开发评分 (1-10) |
| marketing_score | INTEGER | 市场评分 (1-10) |
| ops_score | INTEGER | 运营评分 (1-10) |
| optimist_score | INTEGER | 乐观评分 (1-10) |
| pessimist_score | INTEGER | 悲观评分 (1-10) |
| final_score | REAL | 综合评分 |

## 领域矩阵

系统追踪以下领域的覆盖情况：

**核心领域**: 游戏、AI、电商、SaaS、内容、教育、金融、健康、社交、移动、本地生活、出海

**趋势领域**: AI Agent、Web3、低代码/无代码、RPA、远程办公、隐私安全、绿色科技、元宇宙、银发经济、宠物经济、心理健康、知识付费、短视频直播、智能家居、电动汽车

## 开发

### 运行测试

```bash
npm test
npm run test:coverage  # 生成覆盖率报告
```

### 测试环境

测试时可通过环境变量指定数据库路径：

```bash
TEST_DB_PATH=/tmp/test.db npm test
```

## 依赖

- **better-sqlite3** v12.6.2 - 同步 SQLite 绑定（唯一生产依赖）
- **vitest** v2.0.0 - 测试框架（开发依赖）
- **@vitest/coverage-v8** v2.0.0 - 覆盖率报告（开发依赖）

## 许可证

ISC