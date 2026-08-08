import { describe, expect, it } from "vitest";

import { resolveScoringRule, ScoringRuleError } from "./scoring";

describe("scoring rule registry contract", () => {
  it("ruleIdとversionから純粋な保存済みptルールを選択する", () => {
    const rule = resolveScoringRule({
      ruleId: "stored-final-points",
      ruleVersion: "1.0.0",
      parameters: {},
    });

    expect(rule.calculate(12.5, {})).toBe(12.5);
    expect(rule.calculate(12.5, {})).toBe(12.5);
  });

  it("未知ruleId、未対応version、余分なparametersを拒否する", () => {
    expect(() =>
      resolveScoringRule({
        ruleId: "unknown",
        ruleVersion: "1.0.0",
        parameters: {},
      }),
    ).toThrow(ScoringRuleError);
    expect(() =>
      resolveScoringRule({
        ruleId: "stored-final-points",
        ruleVersion: "2.0.0",
        parameters: {},
      }),
    ).toThrow(ScoringRuleError);
    expect(() =>
      resolveScoringRule({
        ruleId: "stored-final-points",
        ruleVersion: "1.0.0",
        parameters: { formula: "eval(input)" },
      }),
    ).toThrow(ScoringRuleError);
  });
});
