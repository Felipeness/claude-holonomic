import type { HolonName } from "@holon/shared"
import { HOLON_NAME } from "@holon/shared"
import type { Complexity } from "./task-classifier.js"
import { COMPLEXITY } from "./task-classifier.js"

export interface BudgetAllocation {
  readonly totalTokens: number
  readonly allocations: ReadonlyMap<HolonName, HolonBudget>
}

export interface HolonBudget {
  readonly holon: HolonName
  readonly tokens: number
  readonly percentage: number
}

const DEFAULT_BUDGET = 100_000

const BASE_PERCENTAGES: Record<HolonName, number> = {
  [HOLON_NAME.BRAIN]: 0,
  [HOLON_NAME.RESEARCHER]: 30,
  [HOLON_NAME.ARCHITECT]: 15,
  [HOLON_NAME.BUILDER]: 35,
  [HOLON_NAME.GUARDIAN]: 10,
  [HOLON_NAME.SCHOLAR]: 10,
} as const

const COMPLEXITY_ADJUSTMENTS: Record<Complexity, Partial<Record<HolonName, number>>> = {
  [COMPLEXITY.HIGH]: {
    [HOLON_NAME.RESEARCHER]: 25,
    [HOLON_NAME.ARCHITECT]: 20,
    [HOLON_NAME.BUILDER]: 30,
    [HOLON_NAME.GUARDIAN]: 15,
    [HOLON_NAME.SCHOLAR]: 10,
  },
  [COMPLEXITY.MEDIUM]: {},
  [COMPLEXITY.LOW]: {
    [HOLON_NAME.RESEARCHER]: 20,
    [HOLON_NAME.ARCHITECT]: 10,
    [HOLON_NAME.BUILDER]: 45,
    [HOLON_NAME.GUARDIAN]: 15,
    [HOLON_NAME.SCHOLAR]: 10,
  },
} as const

function resolvePercentages(
  activeHolons: readonly HolonName[],
  complexity: Complexity,
): ReadonlyMap<HolonName, number> {
  const adjustments = COMPLEXITY_ADJUSTMENTS[complexity]
  const rawPercentages = new Map<HolonName, number>()

  for (const holon of activeHolons) {
    if (holon === HOLON_NAME.BRAIN) continue
    const adjusted = adjustments[holon]
    rawPercentages.set(holon, adjusted ?? BASE_PERCENTAGES[holon])
  }

  const total = Array.from(rawPercentages.values()).reduce((sum, p) => sum + p, 0)

  if (total === 0) return rawPercentages

  const normalized = new Map<HolonName, number>()
  for (const [holon, pct] of rawPercentages) {
    normalized.set(holon, Math.round((pct / total) * 100 * 100) / 100)
  }

  return normalized
}

export function allocateBudget(
  activeHolons: readonly HolonName[],
  complexity: Complexity,
  totalTokens: number = DEFAULT_BUDGET,
): BudgetAllocation {
  const percentages = resolvePercentages(activeHolons, complexity)
  const allocations = new Map<HolonName, HolonBudget>()

  for (const [holon, percentage] of percentages) {
    const tokens = Math.floor((percentage / 100) * totalTokens)
    allocations.set(holon, { holon, tokens, percentage })
  }

  return { totalTokens, allocations }
}

export function totalAllocatedPercentage(allocation: BudgetAllocation): number {
  let total = 0
  for (const budget of allocation.allocations.values()) {
    total += budget.percentage
  }
  return Math.round(total * 100) / 100
}

export function totalAllocatedTokens(allocation: BudgetAllocation): number {
  let total = 0
  for (const budget of allocation.allocations.values()) {
    total += budget.tokens
  }
  return total
}
