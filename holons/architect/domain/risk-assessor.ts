export const RISK_RATING = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const

export type RiskRating = (typeof RISK_RATING)[keyof typeof RISK_RATING]

export interface RiskFactor {
  readonly name: string
  readonly severity: RiskRating
  readonly description: string
}

export interface RiskAssessment {
  readonly overall: RiskRating
  readonly factors: readonly RiskFactor[]
  readonly score: number
  readonly mitigations: readonly string[]
}

export interface RiskInput {
  readonly filesChanged: number
  readonly touchesCriticalPaths: boolean
  readonly hasTests: boolean
  readonly isReversible: boolean
  readonly complexity: "low" | "medium" | "high"
}

const CRITICAL_PATH_PATTERNS = [
  "auth",
  "payment",
  "billing",
  "security",
  "migration",
  "database",
  "schema",
] as const

export function detectCriticalPaths(filePaths: readonly string[]): boolean {
  return filePaths.some((path) => {
    const lower = path.toLowerCase()
    return CRITICAL_PATH_PATTERNS.some((pattern) => lower.includes(pattern))
  })
}

function assessFileCountRisk(count: number): RiskFactor {
  if (count <= 3) {
    return { name: "file-count", severity: RISK_RATING.LOW, description: `${count} files changed` }
  }
  if (count <= 8) {
    return { name: "file-count", severity: RISK_RATING.MEDIUM, description: `${count} files changed` }
  }
  return { name: "file-count", severity: RISK_RATING.HIGH, description: `${count} files changed — large blast radius` }
}

function assessCriticalPathRisk(touches: boolean): RiskFactor | undefined {
  if (!touches) return undefined
  return {
    name: "critical-path",
    severity: RISK_RATING.HIGH,
    description: "touches critical system paths (auth, payment, security)",
  }
}

function assessTestCoverage(hasTests: boolean): RiskFactor | undefined {
  if (hasTests) return undefined
  return {
    name: "no-tests",
    severity: RISK_RATING.MEDIUM,
    description: "no existing tests to catch regressions",
  }
}

function assessReversibility(isReversible: boolean): RiskFactor | undefined {
  if (isReversible) return undefined
  return {
    name: "irreversible",
    severity: RISK_RATING.HIGH,
    description: "changes are difficult to reverse (data migration, API contract)",
  }
}

function assessComplexity(complexity: "low" | "medium" | "high"): RiskFactor | undefined {
  if (complexity === "low") return undefined
  return {
    name: "complexity",
    severity: complexity === "high" ? RISK_RATING.HIGH : RISK_RATING.MEDIUM,
    description: `${complexity} implementation complexity`,
  }
}

const SEVERITY_SCORES: Record<RiskRating, number> = {
  low: 1,
  medium: 2,
  high: 3,
}

function calculateOverallRisk(factors: readonly RiskFactor[]): { overall: RiskRating; score: number } {
  if (factors.length === 0) return { overall: RISK_RATING.LOW, score: 0 }

  const totalScore = factors.reduce((sum, f) => sum + SEVERITY_SCORES[f.severity], 0)
  const avgScore = totalScore / factors.length

  if (avgScore >= 2.5 || factors.some((f) => f.severity === RISK_RATING.HIGH)) {
    return { overall: RISK_RATING.HIGH, score: totalScore }
  }
  if (avgScore >= 1.5) {
    return { overall: RISK_RATING.MEDIUM, score: totalScore }
  }
  return { overall: RISK_RATING.LOW, score: totalScore }
}

function suggestMitigations(factors: readonly RiskFactor[]): readonly string[] {
  const mitigations: string[] = []
  for (const factor of factors) {
    switch (factor.name) {
      case "file-count":
        if (factor.severity !== RISK_RATING.LOW) {
          mitigations.push("split into smaller PRs to reduce blast radius")
        }
        break
      case "critical-path":
        mitigations.push("require additional reviewer for critical path changes")
        break
      case "no-tests":
        mitigations.push("add regression tests before making changes")
        break
      case "irreversible":
        mitigations.push("add feature flag or backward-compatible migration")
        break
      case "complexity":
        mitigations.push("break down into smaller, testable steps")
        break
    }
  }
  return mitigations
}

export function assessRisk(input: RiskInput): RiskAssessment {
  const rawFactors = [
    assessFileCountRisk(input.filesChanged),
    assessCriticalPathRisk(input.touchesCriticalPaths),
    assessTestCoverage(input.hasTests),
    assessReversibility(input.isReversible),
    assessComplexity(input.complexity),
  ]

  const factors = rawFactors.filter((f): f is RiskFactor => f !== undefined)
  const { overall, score } = calculateOverallRisk(factors)
  const mitigations = suggestMitigations(factors)

  return { overall, factors, score, mitigations }
}
