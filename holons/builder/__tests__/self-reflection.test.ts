import { describe, it, expect } from "vitest"
import {
  FAILURE_PATTERN,
  detectFailurePattern,
  analyzePattern,
  suggestStrategy,
  reflect,
} from "../domain/self-reflection.js"
import type { FailureEntry } from "../domain/self-reflection.js"

describe("SelfReflection", () => {
  const now = Date.now()

  function makeFailures(
    errors: readonly string[],
    phase = "RED",
  ): readonly FailureEntry[] {
    return errors.map((error, i) => ({
      phase,
      error,
      timestamp: now + i * 1000,
    }))
  }

  describe("detectFailurePattern", () => {
    it("detects SAME_ERROR when all errors are identical", () => {
      const failures = makeFailures(["type error", "type error", "type error"])
      expect(detectFailurePattern(failures)).toBe(FAILURE_PATTERN.SAME_ERROR)
    })

    it("detects DIFFERENT_ERRORS when all errors are unique", () => {
      const failures = makeFailures(["error A", "error B", "error C"])
      expect(detectFailurePattern(failures)).toBe(FAILURE_PATTERN.DIFFERENT_ERRORS)
    })

    it("detects TIMEOUT when errors contain timeout", () => {
      const failures = makeFailures(["request timeout", "timeout", "timed out"])
      expect(detectFailurePattern(failures)).toBe(FAILURE_PATTERN.TIMEOUT)
    })

    it("detects FLAKY when some errors repeat but not all", () => {
      const failures = makeFailures(["error A", "error A", "error B"])
      expect(detectFailurePattern(failures)).toBe(FAILURE_PATTERN.FLAKY)
    })

    it("returns DIFFERENT_ERRORS for empty failures", () => {
      expect(detectFailurePattern([])).toBe(FAILURE_PATTERN.DIFFERENT_ERRORS)
    })
  })

  describe("analyzePattern", () => {
    it("provides analysis for SAME_ERROR", () => {
      const result = analyzePattern(FAILURE_PATTERN.SAME_ERROR)
      expect(result).toContain("identical error")
    })

    it("provides analysis for DIFFERENT_ERRORS", () => {
      const result = analyzePattern(FAILURE_PATTERN.DIFFERENT_ERRORS)
      expect(result).toContain("fails differently")
    })

    it("provides analysis for TIMEOUT", () => {
      const result = analyzePattern(FAILURE_PATTERN.TIMEOUT)
      expect(result).toContain("timing out")
    })

    it("provides analysis for FLAKY", () => {
      const result = analyzePattern(FAILURE_PATTERN.FLAKY)
      expect(result).toContain("race condition")
    })
  })

  describe("suggestStrategy", () => {
    it("suggests reframing for SAME_ERROR", () => {
      const result = suggestStrategy(FAILURE_PATTERN.SAME_ERROR, "RED")
      expect(result).toContain("different approach")
      expect(result).toContain("RED")
    })

    it("suggests simplifying for DIFFERENT_ERRORS", () => {
      const result = suggestStrategy(FAILURE_PATTERN.DIFFERENT_ERRORS, "GREEN")
      expect(result).toContain("simplify")
      expect(result).toContain("GREEN")
    })

    it("suggests reducing scope for TIMEOUT", () => {
      const result = suggestStrategy(FAILURE_PATTERN.TIMEOUT, "RED")
      expect(result).toContain("smaller")
    })

    it("suggests isolation for FLAKY", () => {
      const result = suggestStrategy(FAILURE_PATTERN.FLAKY, "RED")
      expect(result).toContain("isolate")
    })
  })

  describe("reflect", () => {
    it("does not trigger below threshold of 3 failures", () => {
      const failures = makeFailures(["error A", "error B"])
      const result = reflect(failures, "RED")

      expect(result.triggered).toBe(false)
      expect(result.failureCount).toBe(2)
    })

    it("triggers after 3 consecutive failures in same phase", () => {
      const failures = makeFailures(["error A", "error A", "error A"])
      const result = reflect(failures, "RED")

      expect(result.triggered).toBe(true)
      expect(result.pattern).toBe(FAILURE_PATTERN.SAME_ERROR)
      expect(result.analysis).toBeTruthy()
      expect(result.revisedStrategy).toBeTruthy()
    })

    it("triggers after 3+ failures in same phase", () => {
      const failures = makeFailures(["a", "b", "c", "d"])
      const result = reflect(failures, "RED")

      expect(result.triggered).toBe(true)
      expect(result.failureCount).toBe(4)
    })

    it("only counts failures in the current phase", () => {
      const failures: readonly FailureEntry[] = [
        { phase: "RED", error: "err", timestamp: now },
        { phase: "GREEN", error: "err", timestamp: now + 1000 },
        { phase: "RED", error: "err", timestamp: now + 2000 },
      ]
      const result = reflect(failures, "RED")

      expect(result.triggered).toBe(false)
      expect(result.failureCount).toBe(2)
    })

    it("analyzes pattern from the most recent 3 failures", () => {
      const failures = makeFailures([
        "old error",
        "timeout",
        "timeout",
        "timeout",
      ])
      const result = reflect(failures, "RED")

      expect(result.triggered).toBe(true)
      expect(result.pattern).toBe(FAILURE_PATTERN.TIMEOUT)
    })
  })
})
