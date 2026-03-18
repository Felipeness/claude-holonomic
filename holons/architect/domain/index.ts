import { HOLON_NAME } from "@holon/shared"

export const ARCHITECT_NAME = HOLON_NAME.ARCHITECT

export interface BlueprintStep {
  readonly id: string
  readonly description: string
  readonly files: readonly string[]
  readonly dependencies: readonly string[]
}

export interface Blueprint {
  readonly steps: readonly BlueprintStep[]
  readonly estimatedComplexity: "low" | "medium" | "high"
  readonly risks: readonly string[]
}

export function createEmptyBlueprint(): Blueprint {
  return {
    steps: [],
    estimatedComplexity: "low",
    risks: [],
  }
}

export function estimateComplexity(stepCount: number, fileCount: number): "low" | "medium" | "high" {
  const score = stepCount + fileCount
  if (score <= 3) return "low"
  if (score <= 8) return "medium"
  return "high"
}
