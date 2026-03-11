# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OPC Projects Collector is a commercial opportunity discovery and management system. It uses AI-powered agents to discover business opportunities, stores them in SQLite with deduplication, and provides multi-dimensional scoring for evaluation based on the OPC methodology (a framework for zero marginal cost product-based businesses).

## Development Commands

```bash
# Storage operations
node scout-store.js store '<json>'      # Store opportunities from JSON string
node scout-store.js list [limit]       # List stored opportunities (default: 20)
node scout-store.js stats              # Show database statistics

# Domain analysis
node scout-analyze.js                  # Full analysis report
node scout-analyze.js domains          # Show covered domains
node scout-analyze.js keywords         # Show trending keywords
node scout-analyze.js recommend        # Recommend blank domains to explore

# Opportunity scoring
node scorer-workflow.js migrate        # Add scoring fields to database
node scorer-workflow.js update <id> '<json>'  # Update opportunity scores
node scorer-workflow.js list           # List all scored projects
node scorer-workflow.js unscored       # List items without scores

# Pipeline orchestration
node scout-pipeline.js analyze         # Run analysis and recommendations
node scout-pipeline.js stats           # Show pipeline statistics
```

## Architecture

### Core Modules

- **scout-store.js** - Database layer with SQLite storage, handles opportunity parsing and deduplication via unique constraint on `(name, description)`
- **scout-workflow.js** - Orchestrates Scout Agent discovery sessions via `sessions_spawn`
- **scout-analyze.js** - Domain coverage analysis and search strategy generation
- **scorer-workflow.js** - Multi-role scoring system (Product, Dev, Marketing, Ops, Optimist, Pessimist perspectives)
- **scout-pipeline.js** - Pipeline automation that orchestrates the full workflow

### Database Schema

Single `opportunities` table with:
- Core fields: `id`, `name`, `description`, `insight`, `created_at`
- Scoring fields: `product_score`, `dev_score`, `marketing_score`, `ops_score`, `optimist_score`, `pessimist_score`, `final_score`, plus corresponding `_brief` text fields

### Key Patterns

1. **Dual-purpose modules**: Each file exports functions AND provides CLI interface when run directly
2. **Smart JSON parsing**: `parseOpportunities()` handles malformed AI responses with regex fallbacks
3. **Domain classification**: Pre-defined matrix with 12+ categories and keyword-based classification
4. **Trending domains**: 15 emerging domains tracked (AI Agent, Web3, Low-code, etc.)

### Domain Matrix

The system tracks coverage across domains: Game, AI, SaaS, E-commerce, Content, Tools, Platform, Social, Finance, Health, Education, and 15+ trending domains. Each domain has associated keywords and related domains for recommendation logic.

## Dependencies

- `better-sqlite3` v12.6.2 - Synchronous SQLite bindings (only dependency)

## Notes

- Code comments and UI text are primarily in Chinese
- No test suite configured - `npm test` exits with error
- Database file `opportunities.db` is created at runtime