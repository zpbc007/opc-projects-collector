import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processResult } from '../../src/lib/workflow.js';

// Mock store 模块
vi.mock('../../src/lib/store.js', () => ({
  parseOpportunities: vi.fn((text) => {
    try {
      const json = JSON.parse(text);
      return json.opportunities || [];
    } catch {
      return [];
    }
  }),
  storeOpportunities: vi.fn((opps) => {
    if (opps.length === 0) return { added: 0, duplicates: 0, errors: [] };
    return {
      added: opps.filter(o => o.name && o.description).length,
      duplicates: 0,
      errors: opps.filter(o => !o.name || !o.description).map(o => `Missing fields: ${JSON.stringify(o)}`)
    };
  })
}));

describe('processResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('valid input', () => {
    it('should process valid JSON result and store opportunities', () => {
      const input = JSON.stringify({
        opportunities: [
          { name: 'Test Opportunity', description: 'Test Description', insight: 'Test Insight' }
        ]
      });

      const result = processResult(input);

      expect(result.success).toBe(true);
      expect(result.found).toBe(1);
      expect(result.added).toBe(1);
    });

    it('should process multiple opportunities', () => {
      const input = JSON.stringify({
        opportunities: [
          { name: 'Opp1', description: 'Desc1', insight: 'Ins1' },
          { name: 'Opp2', description: 'Desc2', insight: 'Ins2' },
          { name: 'Opp3', description: 'Desc3', insight: 'Ins3' }
        ]
      });

      const result = processResult(input);

      expect(result.success).toBe(true);
      expect(result.found).toBe(3);
    });
  });

  describe('invalid input', () => {
    it('should return failure for empty opportunities array', () => {
      const input = JSON.stringify({ opportunities: [] });
      const result = processResult(input);

      expect(result.success).toBe(false);
      expect(result.message).toBe('未找到有效机会');
    });

    it('should return failure for invalid JSON', () => {
      const result = processResult('not valid json');

      expect(result.success).toBe(false);
      expect(result.message).toBe('未找到有效机会');
    });

    it('should return failure for null input', () => {
      const result = processResult(null);

      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle opportunities missing required fields', () => {
      const input = JSON.stringify({
        opportunities: [
          { name: 'Valid', description: 'Has desc', insight: 'Insight' },
          { name: 'Invalid' } // 缺少 description
        ]
      });

      const result = processResult(input);

      expect(result.success).toBe(true);
      expect(result.found).toBe(2);
      expect(result.errors).toBeDefined();
    });

    it('should include store results in response', () => {
      const input = JSON.stringify({
        opportunities: [
          { name: 'Test', description: 'Desc', insight: 'Insight' }
        ]
      });

      const result = processResult(input);

      expect(result).toHaveProperty('added');
      expect(result).toHaveProperty('duplicates');
      expect(result).toHaveProperty('errors');
    });
  });
});