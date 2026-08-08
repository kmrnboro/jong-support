import type { ScoringRuleReference } from "./archive";

export type ScoringRule = {
  ruleId: string;
  ruleVersion: string;
  validateParameters: (parameters: unknown) => boolean;
  calculate: (
    storedPoint: number,
    parameters: Readonly<Record<string, unknown>>,
  ) => number;
};

export class ScoringRuleError extends Error {}

const storedFinalPointsRule: ScoringRule = {
  ruleId: "stored-final-points",
  ruleVersion: "1.0.0",
  validateParameters: (parameters) =>
    typeof parameters === "object" &&
    parameters !== null &&
    !Array.isArray(parameters) &&
    Object.keys(parameters).length === 0,
  calculate: (storedPoint) => storedPoint,
};

const rules: readonly ScoringRule[] = [storedFinalPointsRule];

export function resolveScoringRule(
  reference: ScoringRuleReference,
): ScoringRule {
  const rule = rules.find(
    (item) =>
      item.ruleId === reference.ruleId &&
      item.ruleVersion === reference.ruleVersion,
  );
  if (rule === undefined) {
    throw new ScoringRuleError(
      `Unsupported scoring rule: ${reference.ruleId}@${reference.ruleVersion}`,
    );
  }
  if (!rule.validateParameters(reference.parameters)) {
    throw new ScoringRuleError(
      `Invalid parameters for scoring rule: ${reference.ruleId}`,
    );
  }
  return rule;
}
