# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OPC Projects Collector is a commercial opportunity discovery and management system. It uses AI-powered agents to discover business opportunities, stores them in SQLite with deduplication, and provides multi-dimensional scoring for evaluation based on the OPC methodology (a framework for zero marginal cost product-based businesses).

## Directory Structure

```
opc-projects-collector/
├── src/
│   ├── lib/              # Core library modules
│   │   ├── store.js      # Database storage layer
│   │   ├── analyze.js    # Domain analysis engine
│   │   ├── workflow.js   # Scout workflow orchestration
│   │   ├── scorer.js     # Multi-role scoring system
│   │   └── pipeline.js   # Pipeline automation
│   ├── config/           # Configuration modules
│   │   ├── domains.js    # Domain keywords and trending domains
│   │   └── database.js   # Database path configuration
│   └── index.js          # Unified exports
├── cli/                  # CLI entry scripts
│   ├── store.js
│   ├── analyze.js
│   ├── workflow.js
│   ├── scorer.js
│   └── pipeline.js
├── data/                 # Data files
│   └── opportunities.db  # SQLite database
├── test/                 # Test files
│   ├── unit/
│   ├── integration/
│   ├── helpers/
│   └── fixtures/
└── coverage/             # Coverage reports
```

## Development Commands

```bash
# Run tests
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report

# Storage operations
node cli/store.js store '<json>'      # Store opportunities from JSON string
node cli/store.js list [limit]        # List stored opportunities (default: 100)
node cli/store.js stats               # Show database statistics

# Domain analysis
node cli/analyze.js                   # Full analysis report
node cli/analyze.js domains           # Show covered domains
node cli/analyze.js keywords          # Show trending keywords
node cli/analyze.js recommend         # Recommend blank domains to explore

# Opportunity scoring
node cli/scorer.js migrate            # Add scoring fields to database
node cli/scorer.js update <id> '<json>'  # Update opportunity scores
node cli/scorer.js list               # List all scored projects
node cli/scorer.js unscored           # List items without scores

# Pipeline orchestration
node cli/pipeline.js analyze          # Run analysis and recommendations
node cli/pipeline.js stats            # Show pipeline statistics

# Using npm scripts (alternative)
npm run cli:store -- stats
npm run cli:analyze -- recommend
npm run cli:pipeline -- stats
```

## Architecture

### Core Modules (src/lib/)

- **store.js** - Database layer with SQLite storage, handles opportunity parsing and deduplication via unique constraint on `(name, description)`
- **workflow.js** - Orchestrates Scout Agent discovery sessions via `sessions_spawn`
- **analyze.js** - Domain coverage analysis and search strategy generation
- **scorer.js** - Multi-role scoring system (Product, Dev, Marketing, Ops, Optimist, Pessimist perspectives)
- **pipeline.js** - Pipeline automation that orchestrates the full workflow

### Configuration (src/config/)

- **domains.js** - Contains `DOMAIN_KEYWORDS`, `RELATED_DOMAINS`, and `TRENDING_DOMAINS` constants
- **database.js** - Database path configuration with test support via `TEST_DB_PATH` environment variable

### Database Schema

Single `opportunities` table with:
- Core fields: `id`, `name`, `description`, `insight`, `created_at`
- Scoring fields: `product_score`, `dev_score`, `marketing_score`, `ops_score`, `optimist_score`, `pessimist_score`, `final_score`, plus corresponding `_brief` text fields

### Key Patterns

1. **Separation of concerns**: Library functions in `src/lib/`, CLI interfaces in `cli/`
2. **Smart JSON parsing**: `parseOpportunities()` handles malformed AI responses with regex fallbacks
3. **Domain classification**: Pre-defined matrix with 12+ categories and keyword-based classification
4. **Trending domains**: 15 emerging domains tracked (AI Agent, Web3, Low-code, etc.)
5. **Test-friendly design**: Database operations support external DB instance injection

### Domain Matrix

The system tracks coverage across domains: Game, AI, SaaS, E-commerce, Content, Tools, Platform, Social, Finance, Health, Education, and 15+ trending domains. Each domain has associated keywords and related domains for recommendation logic.

## Dependencies

- `better-sqlite3` v12.6.2 - Synchronous SQLite bindings (only production dependency)
- `vitest` v2.0.0 - Test framework (dev dependency)
- `@vitest/coverage-v8` v2.0.0 - Coverage reporter (dev dependency)

## Notes

- Code comments and UI text are primarily in Chinese
- Database file stored in `data/opportunities.db`
- Test suite available via `npm test`