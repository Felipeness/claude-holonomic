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

export function classifyIntent(description: string): TaskType {
  const lower = description.toLowerCase()
  if (lower.includes("fix") || lower.includes("bug")) return "bug"
  if (lower.includes("refactor")) return "refactor"
  if (lower.includes("review") || lower.includes("pr")) return "review"
  if (lower.includes("doc")) return "docs"
  if (lower.includes("test")) return "test"
  if (lower.includes("perf") || lower.includes("optimiz")) return "perf"
  if (lower.includes("migrat")) return "migration"
  return "feature"
}
