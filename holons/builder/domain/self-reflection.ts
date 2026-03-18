import { match } from "ts-pattern"

export const FAILURE_PATTERN = {
  SAME_ERROR: "SAME_ERROR",
  DIFFERENT_ERRORS: "DIFFERENT_ERRORS",
  TIMEOUT: "TIMEOUT",
  FLAKY: "FLAKY",
} as const

export type FailurePattern = (typeof FAILURE_PATTERN)[keyof typeof FAILURE_PATTERN]

export interface FailureEntry {
  readonly phase: string
  readonly error: string
  readonly timestamp: number
}

export interface ReflectionResult {
  readonly triggered: boolean
  readonly pattern: FailurePattern
  readonly analysis: string
  readonly revisedStrategy: string
  readonly failureCount: number
}

const REFLECTION_THRESHOLD = 3

export function detectFailurePattern(failures: readonly FailureEntry[]): FailurePattern {
  if (failures.length === 0) return FAILURE_PATTERN.DIFFERENT_ERRORS

  const errors = failures.map((f) => f.error)
  const uniqueErrors = new Set(errors)

  const isTimeoutError = (e: string) =>
    e.toLowerCase().includes("timeout") || e.toLowerCase().includes("timed out")
  const timeoutCount = errors.filter(isTimeoutError).length
  if (timeoutCount >= Math.ceil(errors.length / 2)) return FAILURE_PATTERN.TIMEOUT

  if (uniqueErrors.size === 1) return FAILURE_PATTERN.SAME_ERROR

  const errorCounts = new Map<string, number>()
  for (const e of errors) {
    errorCounts.set(e, (errorCounts.get(e) ?? 0) + 1)
  }
  const maxCount = Math.max(...errorCounts.values())
  if (maxCount >= 2 && uniqueErrors.size > 1) return FAILURE_PATTERN.FLAKY

  return FAILURE_PATTERN.DIFFERENT_ERRORS
}

export function analyzePattern(pattern: FailurePattern): string {
  return match(pattern)
    .with(FAILURE_PATTERN.SAME_ERROR, () =>
      "repeated identical error indicates a fundamental misunderstanding of the problem — the current approach is hitting the same wall each time",
    )
    .with(FAILURE_PATTERN.DIFFERENT_ERRORS, () =>
      "each attempt fails differently — the solution space is not well understood and the approach lacks a stable foundation",
    )
    .with(FAILURE_PATTERN.TIMEOUT, () =>
      "operations are timing out — the task may require breaking into smaller steps or the external service is unresponsive",
    )
    .with(FAILURE_PATTERN.FLAKY, () =>
      "intermittent failures suggest a race condition, non-deterministic dependency, or unstable test environment",
    )
    .exhaustive()
}

export function suggestStrategy(pattern: FailurePattern, currentPhase: string): string {
  return match(pattern)
    .with(FAILURE_PATTERN.SAME_ERROR, () =>
      `reframe the problem: re-read the failing test/error, identify the root assumption that is wrong, and try a fundamentally different approach in ${currentPhase}`,
    )
    .with(FAILURE_PATTERN.DIFFERENT_ERRORS, () =>
      `step back and simplify: write the smallest possible passing test first, then build up incrementally in ${currentPhase}`,
    )
    .with(FAILURE_PATTERN.TIMEOUT, () =>
      `reduce scope: break the current operation into smaller independent steps with explicit timeouts in ${currentPhase}`,
    )
    .with(FAILURE_PATTERN.FLAKY, () =>
      `isolate the non-determinism: add explicit waits, mock flaky dependencies, or run in a controlled environment in ${currentPhase}`,
    )
    .exhaustive()
}

export function reflect(
  failures: readonly FailureEntry[],
  currentPhase: string,
): ReflectionResult {
  const consecutiveInPhase = failures.filter((f) => f.phase === currentPhase)

  if (consecutiveInPhase.length < REFLECTION_THRESHOLD) {
    return {
      triggered: false,
      pattern: FAILURE_PATTERN.DIFFERENT_ERRORS,
      analysis: "",
      revisedStrategy: "",
      failureCount: consecutiveInPhase.length,
    }
  }

  const recentFailures = consecutiveInPhase.slice(-REFLECTION_THRESHOLD)
  const pattern = detectFailurePattern(recentFailures)

  return {
    triggered: true,
    pattern,
    analysis: analyzePattern(pattern),
    revisedStrategy: suggestStrategy(pattern, currentPhase),
    failureCount: consecutiveInPhase.length,
  }
}
