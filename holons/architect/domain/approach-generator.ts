import type { TaskType } from "@holon/shared"

export const RISK_LEVEL = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const

export type RiskLevel = (typeof RISK_LEVEL)[keyof typeof RISK_LEVEL]

export const EFFORT_LEVEL = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
} as const

export type EffortLevel = (typeof EFFORT_LEVEL)[keyof typeof EFFORT_LEVEL]

export interface Approach {
  readonly name: string
  readonly description: string
  readonly pros: readonly string[]
  readonly cons: readonly string[]
  readonly risk: RiskLevel
  readonly effort: EffortLevel
}

export interface ApproachRecommendation {
  readonly approaches: readonly Approach[]
  readonly recommended: number
  readonly reasoning: string
}

export interface TaskContext {
  readonly description: string
  readonly taskType: TaskType
  readonly relevantFiles: readonly string[]
  readonly codebasePatterns: readonly string[]
}

function generateFeatureApproaches(context: TaskContext): readonly Approach[] {
  const fileCount = context.relevantFiles.length
  const isLargeScope = fileCount > 5

  return [
    {
      name: "incremental",
      description: "Implement incrementally with small PRs per feature slice",
      pros: ["low risk per change", "easy to review", "rollback-friendly"],
      cons: ["more PRs to manage", "slower delivery"],
      risk: RISK_LEVEL.LOW,
      effort: isLargeScope ? EFFORT_LEVEL.LARGE : EFFORT_LEVEL.MEDIUM,
    },
    {
      name: "comprehensive",
      description: "Implement the full feature in a single cohesive PR",
      pros: ["complete picture in one review", "faster delivery"],
      cons: ["larger blast radius", "harder to review"],
      risk: isLargeScope ? RISK_LEVEL.HIGH : RISK_LEVEL.MEDIUM,
      effort: isLargeScope ? EFFORT_LEVEL.LARGE : EFFORT_LEVEL.MEDIUM,
    },
    {
      name: "prototype-first",
      description: "Build a working prototype, then refine with tests and cleanup",
      pros: ["fast feedback", "validates approach early"],
      cons: ["prototype code may leak into production", "two-pass effort"],
      risk: RISK_LEVEL.MEDIUM,
      effort: EFFORT_LEVEL.MEDIUM,
    },
  ]
}

function generateBugFixApproaches(context: TaskContext): readonly Approach[] {
  return [
    {
      name: "test-first",
      description: "Write failing test reproducing the bug, then fix",
      pros: ["guarantees regression coverage", "documents the bug"],
      cons: ["slower initial fix"],
      risk: RISK_LEVEL.LOW,
      effort: EFFORT_LEVEL.SMALL,
    },
    {
      name: "direct-fix",
      description: "Fix the bug directly, add test after",
      pros: ["fastest fix", "immediate relief"],
      cons: ["might miss edge cases", "less disciplined"],
      risk: RISK_LEVEL.MEDIUM,
      effort: EFFORT_LEVEL.SMALL,
    },
  ]
}

function generateRefactorApproaches(context: TaskContext): readonly Approach[] {
  return [
    {
      name: "strangler-fig",
      description: "Wrap old code with new interface, migrate callers gradually",
      pros: ["zero downtime", "reversible at every step"],
      cons: ["temporary duplication", "longer timeline"],
      risk: RISK_LEVEL.LOW,
      effort: EFFORT_LEVEL.LARGE,
    },
    {
      name: "big-bang",
      description: "Replace the old implementation in one atomic change",
      pros: ["no duplication", "clean codebase immediately"],
      cons: ["high risk", "hard to review", "all-or-nothing"],
      risk: RISK_LEVEL.HIGH,
      effort: EFFORT_LEVEL.MEDIUM,
    },
    {
      name: "extract-and-delegate",
      description: "Extract logic into new module, delegate from old code",
      pros: ["testable in isolation", "minimal caller changes"],
      cons: ["adds indirection"],
      risk: RISK_LEVEL.LOW,
      effort: EFFORT_LEVEL.MEDIUM,
    },
  ]
}

function generateDefaultApproaches(context: TaskContext): readonly Approach[] {
  return [
    {
      name: "standard",
      description: "Follow existing patterns in the codebase",
      pros: ["consistent with project conventions", "predictable"],
      cons: ["may not leverage new patterns"],
      risk: RISK_LEVEL.LOW,
      effort: EFFORT_LEVEL.MEDIUM,
    },
    {
      name: "innovative",
      description: "Introduce improved patterns where appropriate",
      pros: ["improves codebase quality", "modern approach"],
      cons: ["requires team alignment", "learning curve"],
      risk: RISK_LEVEL.MEDIUM,
      effort: EFFORT_LEVEL.MEDIUM,
    },
  ]
}

const APPROACH_GENERATORS: Record<string, (ctx: TaskContext) => readonly Approach[]> = {
  feature: generateFeatureApproaches,
  bug: generateBugFixApproaches,
  refactor: generateRefactorApproaches,
}

export function generateApproaches(context: TaskContext): ApproachRecommendation {
  const generator = APPROACH_GENERATORS[context.taskType] ?? generateDefaultApproaches
  const approaches = generator(context)

  const recommended = selectRecommended(approaches)

  return {
    approaches,
    recommended,
    reasoning: buildReasoning(approaches[recommended]!, context),
  }
}

function selectRecommended(approaches: readonly Approach[]): number {
  let bestIndex = 0
  let bestScore = -Infinity

  for (let i = 0; i < approaches.length; i++) {
    const approach = approaches[i]!
    const riskPenalty = approach.risk === "high" ? -2 : approach.risk === "medium" ? -1 : 0
    const effortPenalty = approach.effort === "large" ? -1 : approach.effort === "small" ? 1 : 0
    const prosBonus = approach.pros.length * 0.5
    const score = prosBonus + riskPenalty + effortPenalty

    if (score > bestScore) {
      bestScore = score
      bestIndex = i
    }
  }

  return bestIndex
}

function buildReasoning(approach: Approach, context: TaskContext): string {
  return `Recommended "${approach.name}" for ${context.taskType} task: ${approach.risk} risk, ${approach.effort} effort. ${approach.pros[0] ?? "Best fit for the context."}`
}
