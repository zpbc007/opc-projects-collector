import { describe, it, expect } from 'vitest';
import { parseOpportunities } from '../../scout-store.js';

describe('parseOpportunities', () => {
  describe('valid input', () => {
    it('should parse valid JSON with opportunities array', () => {
      const input = JSON.stringify({
        opportunities: [
          { name: 'Test', description: 'Desc', insight: 'Insight' }
        ]
      });
      const result = parseOpportunities(input);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test');
      expect(result[0].description).toBe('Desc');
      expect(result[0].insight).toBe('Insight');
    });

    it('should parse multiple opportunities', () => {
      const input = JSON.stringify({
        opportunities: [
          { name: 'Opp1', description: 'Desc1', insight: 'Ins1' },
          { name: 'Opp2', description: 'Desc2', insight: 'Ins2' },
          { name: 'Opp3', description: 'Desc3', insight: 'Ins3' }
        ]
      });
      const result = parseOpportunities(input);
      expect(result).toHaveLength(3);
    });
  });

  describe('invalid input', () => {
    it('should return empty array for invalid JSON', () => {
      expect(parseOpportunities('not json')).toEqual([]);
    });

    it('should return empty array for null input', () => {
      expect(parseOpportunities(null)).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      expect(parseOpportunities(undefined)).toEqual([]);
    });

    it('should return empty array for non-string input', () => {
      expect(parseOpportunities(123)).toEqual([]);
      expect(parseOpportunities({})).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should return empty array when opportunities key missing', () => {
      expect(parseOpportunities('{"other": []}')).toEqual([]);
    });

    it('should return empty array when opportunities is not an array', () => {
      expect(parseOpportunities('{"opportunities": "not array"}')).toEqual([]);
    });

    it('should extract JSON from markdown-wrapped content', () => {
      const input = 'Some text ```json {"opportunities": [{"name":"A","description":"B","insight":"C"}]} ``` more';
      const result = parseOpportunities(input);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('A');
    });

    it('should extract JSON from text with surrounding content', () => {
      const input = 'Before {"opportunities": [{"name":"Test","description":"Desc"}]} After';
      const result = parseOpportunities(input);
      expect(result).toHaveLength(1);
    });
  });
});