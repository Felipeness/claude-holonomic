import type { TaskType } from "@holon/shared"
import { TASK_TYPE } from "@holon/shared"
import { match } from "ts-pattern"

export const COMPLEXITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const

export type Complexity = (typeof COMPLEXITY)[keyof typeof COMPLEXITY]

export const RISK = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const

export type Risk = (typeof RISK)[keyof typeof RISK]

export interface TaskClassification {
  readonly type: TaskType
  readonly complexity: Complexity
  readonly risk: Risk
  readonly confidence: number
}

interface KeywordRule {
  readonly keywords: readonly string[]
  readonly type: TaskType
}

const KEYWORD_RULES: readonly KeywordRule[] = [
  { keywords: ["fix", "bug", "broken", "crash", "error", "issue", "patch", "hotfix"], type: TASK_TYPE.BUG },
  { keywords: ["refactor", "restructure", "reorganize", "clean up", "cleanup", "simplify"], type: TASK_TYPE.REFACTOR },
  { keywords: ["review", "pr", "pull request", "code review"], type: TASK_TYPE.REVIEW },
  { keywords: ["doc", "readme", "documentation", "jsdoc", "comment"], type: TASK_TYPE.DOCS },
  { keywords: ["test", "spec", "coverage", "unit test", "integration test", "e2e"], type: TASK_TYPE.TEST },
  { keywords: ["perf", "optimiz", "benchmark", "slow", "fast", "speed", "latency", "cache", "caching"], type: TASK_TYPE.PERF },
  { keywords: ["migrat", "upgrade", "downgrade", "schema change", "data migration"], type: TASK_TYPE.MIGRATION },
  { keywords: ["add", "create", "implement", "build", "feature", "new", "introduce", "support"], type: TASK_TYPE.FEATURE },
] as const

const COMPLEXITY_KEYWORDS: Record<Complexity, readonly string[]> = {
  [COMPLEXITY.HIGH]: [
    "architect", "redesign", "migration", "rewrite", "system", "infrastructure",
    "database", "schema", "distributed", "concurrent", "async", "parallel",
  ],
  [COMPLEXITY.MEDIUM]: [
    "refactor", "integrate", "api", "endpoint", "service", "module",
    "component", "workflow", "pipeline", "auth",
  ],
  [COMPLEXITY.LOW]: [
    "typo", "rename", "config", "env", "flag", "toggle", "lint",
    "format", "style", "comment", "readme", "doc",
  ],
} as const

const RISK_BY_TYPE: Record<TaskType, Risk> = {
  [TASK_TYPE.FEATURE]: RISK.MEDIUM,
  [TASK_TYPE.BUG]: RISK.MEDIUM,
  [TASK_TYPE.REFACTOR]: RISK.MEDIUM,
  [TASK_TYPE.REVIEW]: RISK.LOW,
  [TASK_TYPE.DOCS]: RISK.LOW,
  [TASK_TYPE.TEST]: RISK.LOW,
  [TASK_TYPE.PERF]: RISK.MEDIUM,
  [TASK_TYPE.MIGRATION]: RISK.HIGH,
} as const

function countKeywordMatches(text: string, keywords: readonly string[]): number {
  return keywords.reduce((count, kw) => count + (text.includes(kw) ? 1 : 0), 0)
}

function classifyType(description: string): { type: TaskType; confidence: number } {
  const lower = description.toLowerCase()

  const scores = KEYWORD_RULES.map((rule) => ({
    type: rule.type,
    score: countKeywordMatches(lower, rule.keywords),
  }))

  const best = scores.reduce((a, b) => (b.score > a.score ? b : a))

  if (best.score === 0) {
    return { type: TASK_TYPE.FEATURE, confidence: 0.3 }
  }

  const totalMatches = scores.reduce((sum, s) => sum + s.score, 0)
  const confidence = Math.min(best.score / totalMatches, 1)

  return { type: best.type, confidence: Math.round(confidence * 100) / 100 }
}

function classifyComplexity(description: string): Complexity {
  const lower = description.toLowerCase()
  const wordCount = description.split(/\s+/).length

  const highMatches = countKeywordMatches(lower, COMPLEXITY_KEYWORDS[COMPLEXITY.HIGH])
  const lowMatches = countKeywordMatches(lower, COMPLEXITY_KEYWORDS[COMPLEXITY.LOW])

  if (highMatches > 0 || wordCount > 30) return COMPLEXITY.HIGH
  if (lowMatches > 0 && wordCount <= 10) return COMPLEXITY.LOW
  return COMPLEXITY.MEDIUM
}

function assessRisk(type: TaskType, complexity: Complexity): Risk {
  const baseRisk = RISK_BY_TYPE[type]

  return match(complexity)
    .with(COMPLEXITY.HIGH, () => RISK.HIGH)
    .with(COMPLEXITY.LOW, () => (baseRisk === RISK.HIGH ? RISK.MEDIUM : baseRisk))
    .otherwise(() => baseRisk)
}

export function classifyTask(description: string): TaskClassification {
  const { type, confidence } = classifyType(description)
  const complexity = classifyComplexity(description)
  const risk = assessRisk(type, complexity)

  return { type, complexity, risk, confidence }
}
