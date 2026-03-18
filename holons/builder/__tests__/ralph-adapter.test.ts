import { describe, it, expect } from "vitest"
import { RALPH_PHASE } from "@holon/shared"
import {
  RALPH_MAX_ITERATIONS,
  shouldSkipPhase,
  generatePhasePrompt,
  getPhaseConfig,
  nextPhase,
  isPhaseComplete,
} from "../domain/ralph-adapter.js"
import type { RalphContext } from "../domain/ralph-adapter.js"

describe("RalphAdapter", () => {
  const fullContext: RalphContext = {
    taskDescription: "add rate limiting to payment API",
    ticketId: "CC-1234",
    hasTestGaps: true,
    hasPerfTarget: true,
    hasDocGaps: true,
    completedPhases: [],
  }

  const minimalContext: RalphContext = {
    taskDescription: "fix null check",
    hasTestGaps: false,
    hasPerfTarget: false,
    hasDocGaps: false,
    completedPhases: [],
  }

  describe("RALPH_MAX_ITERATIONS", () => {
    it("defines correct limits per phase", () => {
      expect(RALPH_MAX_ITERATIONS[RALPH_PHASE.IMPLEMENT]).toBe(10)
      expect(RALPH_MAX_ITERATIONS[RALPH_PHASE.TEST]).toBe(5)
      expect(RALPH_MAX_ITERATIONS[RALPH_PHASE.PERF]).toBe(5)
      expect(RALPH_MAX_ITERATIONS[RALPH_PHASE.DOCS]).toBe(3)
      expect(RALPH_MAX_ITERATIONS[RALPH_PHASE.PR]).toBe(1)
    })
  })

  describe("shouldSkipPhase", () => {
    it("never skips IMPLEMENT", () => {
      const result = shouldSkipPhase(RALPH_PHASE.IMPLEMENT, minimalContext)
      expect(result.skip).toBe(false)
    })

    it("never skips PR", () => {
      const result = shouldSkipPhase(RALPH_PHASE.PR, minimalContext)
      expect(result.skip).toBe(false)
    })

    it("skips TEST when no test gaps", () => {
      const result = shouldSkipPhase(RALPH_PHASE.TEST, minimalContext)
      expect(result.skip).toBe(true)
      expect(result.reason).toContain("test gaps")
    })

    it("does not skip TEST when gaps exist", () => {
      const result = shouldSkipPhase(RALPH_PHASE.TEST, fullContext)
      expect(result.skip).toBe(false)
    })

    it("skips PERF when no performance target", () => {
      const result = shouldSkipPhase(RALPH_PHASE.PERF, minimalContext)
      expect(result.skip).toBe(true)
      expect(result.reason).toContain("performance target")
    })

    it("does not skip PERF when target exists", () => {
      const result = shouldSkipPhase(RALPH_PHASE.PERF, fullContext)
      expect(result.skip).toBe(false)
    })

    it("skips DOCS when no doc gaps", () => {
      const result = shouldSkipPhase(RALPH_PHASE.DOCS, minimalContext)
      expect(result.skip).toBe(true)
      expect(result.reason).toContain("documentation gaps")
    })

    it("does not skip DOCS when gaps exist", () => {
      const result = shouldSkipPhase(RALPH_PHASE.DOCS, fullContext)
      expect(result.skip).toBe(false)
    })
  })

  describe("generatePhasePrompt", () => {
    it("generates IMPLEMENT prompt with ticket", () => {
      const prompt = generatePhasePrompt(RALPH_PHASE.IMPLEMENT, fullContext)
      expect(prompt).toContain("TDD")
      expect(prompt).toContain("CC-1234")
      expect(prompt).toContain("rate limiting")
    })

    it("generates prompt without ticket when not provided", () => {
      const prompt = generatePhasePrompt(RALPH_PHASE.IMPLEMENT, minimalContext)
      expect(prompt).not.toContain("for ")
      expect(prompt).toContain("fix null check")
    })

    it("generates TEST prompt", () => {
      const prompt = generatePhasePrompt(RALPH_PHASE.TEST, fullContext)
      expect(prompt).toContain("edge case")
    })

    it("generates PERF prompt", () => {
      const prompt = generatePhasePrompt(RALPH_PHASE.PERF, fullContext)
      expect(prompt).toContain("benchmark")
    })

    it("generates DOCS prompt", () => {
      const prompt = generatePhasePrompt(RALPH_PHASE.DOCS, fullContext)
      expect(prompt).toContain("JSDoc")
    })

    it("generates PR prompt", () => {
      const prompt = generatePhasePrompt(RALPH_PHASE.PR, fullContext)
      expect(prompt).toContain("pull request")
    })
  })

  describe("getPhaseConfig", () => {
    it("returns config with correct max iterations", () => {
      const config = getPhaseConfig(RALPH_PHASE.IMPLEMENT, fullContext)
      expect(config.maxIterations).toBe(10)
      expect(config.phase).toBe(RALPH_PHASE.IMPLEMENT)
      expect(config.skipped).toBe(false)
    })

    it("marks skipped phases with reason", () => {
      const config = getPhaseConfig(RALPH_PHASE.PERF, minimalContext)
      expect(config.skipped).toBe(true)
      expect(config.skipReason).toBeTruthy()
    })
  })

  describe("nextPhase", () => {
    it("returns TEST after IMPLEMENT when test gaps exist", () => {
      const next = nextPhase(RALPH_PHASE.IMPLEMENT, fullContext)
      expect(next?.phase).toBe(RALPH_PHASE.TEST)
    })

    it("skips TEST and PERF when no gaps/targets, goes to DOCS", () => {
      const ctx: RalphContext = {
        ...minimalContext,
        hasDocGaps: true,
      }
      const next = nextPhase(RALPH_PHASE.IMPLEMENT, ctx)
      expect(next?.phase).toBe(RALPH_PHASE.DOCS)
    })

    it("skips all optional phases, goes to PR", () => {
      const next = nextPhase(RALPH_PHASE.IMPLEMENT, minimalContext)
      expect(next?.phase).toBe(RALPH_PHASE.PR)
    })

    it("returns undefined after PR (last phase)", () => {
      const next = nextPhase(RALPH_PHASE.PR, fullContext)
      expect(next).toBeUndefined()
    })
  })

  describe("isPhaseComplete", () => {
    it("returns false for incomplete phase", () => {
      expect(isPhaseComplete(RALPH_PHASE.IMPLEMENT, fullContext)).toBe(false)
    })

    it("returns true for completed phase", () => {
      const ctx: RalphContext = {
        ...fullContext,
        completedPhases: [RALPH_PHASE.IMPLEMENT],
      }
      expect(isPhaseComplete(RALPH_PHASE.IMPLEMENT, ctx)).toBe(true)
    })
  })
})
