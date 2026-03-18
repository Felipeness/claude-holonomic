import type { TaskType, DfaState } from "@holon/shared"
import { HOLON_NAME } from "@holon/shared"

export const BRAIN_NAME = HOLON_NAME.BRAIN

export interface TaskIntent {
  readonly description: string
  readonly type: TaskType
  readonly context: Record<string, unknown>
}

export interface BrainState {
  readonly currentPhase: DfaState
  readonly activeTask: TaskIntent | null
  readonly holonStatuses: Record<string, "idle" | "active" | "failed">
}

export function createInitialBrainState(): BrainState {
  return {
    currentPhase: "IDLE",
    activeTask: null,
    holonStatuses: {
      brain: "idle",
      researcher: "idle",
      architect: "idle",
      builder: "idle",
      guardian: "idle",
      scholar: "idle",
    },
  }
}

export { classifyTask, COMPLEXITY, RISK } from "./task-classifier.js"
export type { TaskClassification, Complexity, Risk } from "./task-classifier.js"

export { selectHolons } from "./holon-selector.js"
export type { HolonSelection } from "./holon-selector.js"

export { allocateBudget, totalAllocatedPercentage, totalAllocatedTokens } from "./context-budget.js"
export type { BudgetAllocation, HolonBudget } from "./context-budget.js"

export { holonForState, decideNextStep, advanceRouter, createRouter } from "./dfa-router.js"
export type { RouterDecision } from "./dfa-router.js"
