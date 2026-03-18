import type { HolonName, TaskType } from "@holon/shared"
import { HOLON_NAME, TASK_TYPE } from "@holon/shared"
import type { Complexity } from "./task-classifier.js"
import { COMPLEXITY } from "./task-classifier.js"

export interface HolonSelection {
  readonly holons: readonly HolonName[]
  readonly reason: string
}

const STRATEGY_MAP: Record<TaskType, readonly HolonName[]> = {
  [TASK_TYPE.FEATURE]: [
    HOLON_NAME.RESEARCHER,
    HOLON_NAME.ARCHITECT,
    HOLON_NAME.BUILDER,
    HOLON_NAME.GUARDIAN,
    HOLON_NAME.SCHOLAR,
  ],
  [TASK_TYPE.BUG]: [
    HOLON_NAME.RESEARCHER,
    HOLON_NAME.BUILDER,
    HOLON_NAME.GUARDIAN,
    HOLON_NAME.SCHOLAR,
  ],
  [TASK_TYPE.REFACTOR]: [
    HOLON_NAME.RESEARCHER,
    HOLON_NAME.ARCHITECT,
    HOLON_NAME.BUILDER,
    HOLON_NAME.GUARDIAN,
    HOLON_NAME.SCHOLAR,
  ],
  [TASK_TYPE.REVIEW]: [
    HOLON_NAME.RESEARCHER,
    HOLON_NAME.GUARDIAN,
  ],
  [TASK_TYPE.DOCS]: [
    HOLON_NAME.RESEARCHER,
    HOLON_NAME.BUILDER,
    HOLON_NAME.SCHOLAR,
  ],
  [TASK_TYPE.TEST]: [
    HOLON_NAME.RESEARCHER,
    HOLON_NAME.BUILDER,
    HOLON_NAME.GUARDIAN,
    HOLON_NAME.SCHOLAR,
  ],
  [TASK_TYPE.PERF]: [
    HOLON_NAME.RESEARCHER,
    HOLON_NAME.ARCHITECT,
    HOLON_NAME.BUILDER,
    HOLON_NAME.GUARDIAN,
    HOLON_NAME.SCHOLAR,
  ],
  [TASK_TYPE.MIGRATION]: [
    HOLON_NAME.RESEARCHER,
    HOLON_NAME.ARCHITECT,
    HOLON_NAME.BUILDER,
    HOLON_NAME.GUARDIAN,
    HOLON_NAME.SCHOLAR,
  ],
} as const

function addArchitectForComplexBugs(
  holons: readonly HolonName[],
  taskType: TaskType,
  complexity: Complexity,
): readonly HolonName[] {
  if (taskType !== TASK_TYPE.BUG || complexity !== COMPLEXITY.HIGH) return holons
  if (holons.includes(HOLON_NAME.ARCHITECT)) return holons

  const researcherIdx = holons.indexOf(HOLON_NAME.RESEARCHER)
  const insertAt = researcherIdx + 1
  return [...holons.slice(0, insertAt), HOLON_NAME.ARCHITECT, ...holons.slice(insertAt)]
}

function buildReason(taskType: TaskType, complexity: Complexity, holons: readonly HolonName[]): string {
  const holonList = holons.join(", ")
  return `${taskType} task (${complexity} complexity): activating [${holonList}]`
}

export function selectHolons(taskType: TaskType, complexity: Complexity): HolonSelection {
  const baseHolons = STRATEGY_MAP[taskType]
  const holons = addArchitectForComplexBugs(baseHolons, taskType, complexity)
  const reason = buildReason(taskType, complexity, holons)

  return { holons, reason }
}
