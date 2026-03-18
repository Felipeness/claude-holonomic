import { HOLON_NAME } from "@holon/shared"

export const GUARDIAN_NAME = HOLON_NAME.GUARDIAN

export interface ReviewIssue {
  readonly severity: "info" | "warning" | "error"
  readonly file: string
  readonly line?: number
  readonly message: string
  readonly rule: string
}

export interface ReviewResult {
  readonly issues: readonly ReviewIssue[]
  readonly testsPass: boolean
  readonly typeCheckPass: boolean
  readonly lintPass: boolean
}

export function createPassingReview(): ReviewResult {
  return {
    issues: [],
    testsPass: true,
    typeCheckPass: true,
    lintPass: true,
  }
}

export function isReviewApproved(result: ReviewResult): boolean {
  const hasBlockingIssues = result.issues.some((i) => i.severity === "error")
  return result.testsPass && result.typeCheckPass && !hasBlockingIssues
}

export { reviewCode, QUALITY_THRESHOLD_DEFAULT, REVIEW_RULE } from "./review-engine.js"
export type { QualityScore, QualityFinding, ReviewRule } from "./review-engine.js"

export { scanSecurity, SECURITY_RULE } from "./security-scanner.js"
export type { SecurityFinding, SecurityRule } from "./security-scanner.js"

export { analyzePerformance, PERF_RULE } from "./perf-analyzer.js"
export type { PerfFinding, PerfRule } from "./perf-analyzer.js"

export { composePr } from "./pr-composer.js"
export type { PrInput, PrContent } from "./pr-composer.js"
