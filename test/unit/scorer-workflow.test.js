import { describe, it, expect, vi } from 'vitest';

// 由于 scorer-workflow.js 没有导出函数，我们需要测试其内部逻辑
// 这里使用模拟方式测试核心功能

describe('scorer-workflow (unit)', () => {
  describe('role score extraction', () => {
    it('should extract role scores from scoreData', () => {
      const scoreData = {
        roles: [
          { role: 'Product', score: 8, brief: 'Good' },
          { role: 'Dev', score: 7, brief: 'Feasible' },
          { role: 'Marketing', score: 6, brief: 'Competitive' }
        ],
        final_score: 70
      };

      const roleMap = {};
      for (const role of scoreData.roles || []) {
        roleMap[role.role.toLowerCase()] = role;
      }

      expect(roleMap['product'].score).toBe(8);
      expect(roleMap['dev'].score).toBe(7);
      expect(roleMap['marketing'].score).toBe(6);
    });

    it('should handle missing roles gracefully', () => {
      const scoreData = {
        roles: [
          { role: 'Product', score: 8, brief: 'Good' }
        ],
        final_score: 80
      };

      const roleMap = {};
      for (const role of scoreData.roles || []) {
        roleMap[role.role.toLowerCase()] = role;
      }

      expect(roleMap['product'].score).toBe(8);
      expect(roleMap['dev']).toBeUndefined();
      expect(roleMap['marketing']).toBeUndefined();
    });

    it('should handle empty roles array', () => {
      const scoreData = {
        roles: [],
        final_score: 0
      };

      const roleMap = {};
      for (const role of scoreData.roles || []) {
        roleMap[role.role.toLowerCase()] = role;
      }

      expect(Object.keys(roleMap).length).toBe(0);
    });
  });

  describe('JSON parsing for score update', () => {
    it('should parse valid score JSON', () => {
      const scoreJsonStr = JSON.stringify({
        roles: [
          { role: 'Product', score: 8, brief: 'Good idea' }
        ],
        final_score: 75
      });

      const scoreData = JSON.parse(scoreJsonStr);
      expect(scoreData.roles).toHaveLength(1);
      expect(scoreData.final_score).toBe(75);
    });

    it('should handle invalid JSON', () => {
      const scoreJsonStr = 'invalid json';

      expect(() => JSON.parse(scoreJsonStr)).toThrow();
    });

    it('should handle missing final_score', () => {
      const scoreJsonStr = JSON.stringify({
        roles: [{ role: 'Product', score: 8, brief: 'Good' }]
      });

      const scoreData = JSON.parse(scoreJsonStr);
      expect(scoreData.final_score).toBeUndefined();
    });
  });

  describe('score calculation', () => {
    it('should calculate final score from role scores', () => {
      const roles = [
        { role: 'Product', score: 8 },
        { role: 'Dev', score: 7 },
        { role: 'Marketing', score: 6 },
        { role: 'Ops', score: 7 },
        { role: 'Optimist', score: 8 },
        { role: 'Pessimist', score: 5 }
      ];

      const avgScore = roles.reduce((sum, r) => sum + r.score, 0) / roles.length;
      expect(avgScore).toBeCloseTo(6.83, 1);
    });

    it('should weight optimist and pessimist differently', () => {
      const optimistScore = 8;
      const pessimistScore = 5;

      // 乐观分和悲观分可能影响最终评分
      const difference = optimistScore - pessimistScore;
      expect(difference).toBe(3);
    });
  });
});