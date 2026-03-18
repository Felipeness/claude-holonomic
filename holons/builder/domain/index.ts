import { HOLON_NAME } from "@holon/shared"

export const BUILDER_NAME = HOLON_NAME.BUILDER

export interface BuildResult {
  readonly filesCreated: readonly string[]
  readonly filesModified: readonly string[]
  readonly testsAdded: number
  readonly errors: readonly string[]
}

export function createEmptyBuildResult(): BuildResult {
  return {
    filesCreated: [],
    filesModified: [],
    testsAdded: 0,
    errors: [],
  }
}

export function hasBuildErrors(result: BuildResult): boolean {
  return result.errors.length > 0
}

export {
  TDD_PHASE,
  TDD_EVENT,
  initialTddState,
  transitionTdd,
  isValidTransition,
  isCriterionComplete,
} from "./tdd-engine.js"

export type { TddPhase, TddEvent, TddState } from "./tdd-engine.js"

export {
  NODE_TYPE,
  EXECUTION_STATUS,
  topologicalSort,
  executeNode,
  executeBlueprint,
} from "./blueprint-executor.js"

export type {
  NodeType,
  BlueprintNode,
  ExecutionStatus,
  ExecutionResult,
  NodeExecutor,
} from "./blueprint-executor.js"

export {
  FAILURE_PATTERN,
  detectFailurePattern,
  analyzePattern,
  suggestStrategy,
  reflect,
} from "./self-reflection.js"

export type {
  FailurePattern,
  FailureEntry,
  ReflectionResult,
} from "./self-reflection.js"

export {
  COMMIT_TYPE,
  inferCommitType,
  formatScope,
  generateCommitMessage,
  summarizeDescription,
  createCommitPlan,
} from "./incremental-commit.js"

export type { CommitType, TaskContext, CommitPlan } from "./incremental-commit.js"

export {
  RALPH_MAX_ITERATIONS,
  shouldSkipPhase,
  generatePhasePrompt,
  getPhaseConfig,
  nextPhase,
  isPhaseComplete,
} from "./ralph-adapter.js"

export type { PhaseConfig, RalphContext } from "./ralph-adapter.js"
