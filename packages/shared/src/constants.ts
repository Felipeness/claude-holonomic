export const TASK_TYPE = {
  FEATURE: "feature",
  BUG: "bug",
  REFACTOR: "refactor",
  REVIEW: "review",
  DOCS: "docs",
  TEST: "test",
  PERF: "perf",
  MIGRATION: "migration",
} as const

export type TaskType = (typeof TASK_TYPE)[keyof typeof TASK_TYPE]

export const DFA_STATE = {
  IDLE: "IDLE",
  UNDERSTANDING: "UNDERSTANDING",
  RESEARCHING: "RESEARCHING",
  PLANNING: "PLANNING",
  BUILDING: "BUILDING",
  REVIEWING: "REVIEWING",
  COMPLETING: "COMPLETING",
  LEARNING: "LEARNING",
  RECOVERING: "RECOVERING",
  FAILED: "FAILED",
} as const

export type DfaState = (typeof DFA_STATE)[keyof typeof DFA_STATE]

export const RALPH_PHASE = {
  IMPLEMENT: "IMPLEMENT",
  TEST: "TEST",
  PERF: "PERF",
  DOCS: "DOCS",
  PR: "PR",
} as const

export type RalphPhase = (typeof RALPH_PHASE)[keyof typeof RALPH_PHASE]

export const HOLON_NAME = {
  BRAIN: "brain",
  RESEARCHER: "researcher",
  ARCHITECT: "architect",
  BUILDER: "builder",
  GUARDIAN: "guardian",
  SCHOLAR: "scholar",
} as const

export type HolonName = (typeof HOLON_NAME)[keyof typeof HOLON_NAME]

export const ENTITY_TYPE = {
  PROJECT: "project",
  FILE: "file",
  FUNCTION: "function",
  PATTERN: "pattern",
  DECISION: "decision",
  PREFERENCE: "preference",
  SESSION: "session",
  TASK: "task",
  ERROR: "error",
  LIBRARY: "library",
} as const

export type EntityType = (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE]

export const RELATION_TYPE = {
  PREFERS: "prefers",
  AVOIDS: "avoids",
  DEPENDS_ON: "depends_on",
  LEARNED_FROM: "learned_from",
  USED_IN: "used_in",
  CONTRADICTS: "contradicts",
  SUCCEEDED_WITH: "succeeded_with",
  FAILED_WITH: "failed_with",
} as const

export type RelationType = (typeof RELATION_TYPE)[keyof typeof RELATION_TYPE]
