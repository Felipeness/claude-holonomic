import { describe, it, expect, beforeEach } from "vitest"
import { DFA_STATE, RALPH_PHASE } from "@holon/shared"
import { BlueprintDfa } from "../src/dfa.js"

describe("BlueprintDfa", () => {
  let dfa: BlueprintDfa

  beforeEach(() => {
    dfa = new BlueprintDfa()
  })

  describe("initial state", () => {
    it("starts in IDLE", () => {
      expect(dfa.state).toBe(DFA_STATE.IDLE)
    })

    it("starts with empty history", () => {
      expect(dfa.history).toHaveLength(0)
    })

    it("is not terminal at start", () => {
      expect(dfa.isTerminal()).toBe(false)
    })

    it("is not failed at start", () => {
      expect(dfa.isFailed()).toBe(false)
    })
  })

  describe("valid transitions", () => {
    it("transitions IDLE -> UNDERSTANDING when description provided", () => {
      dfa.updateContext({ taskDescription: "add rate limiting" })
      const record = dfa.transition(DFA_STATE.UNDERSTANDING)

      expect(dfa.state).toBe(DFA_STATE.UNDERSTANDING)
      expect(record.from).toBe(DFA_STATE.IDLE)
      expect(record.to).toBe(DFA_STATE.UNDERSTANDING)
    })

    it("transitions UNDERSTANDING -> RESEARCHING", () => {
      dfa.updateContext({ taskDescription: "fix bug" })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      const record = dfa.transition(DFA_STATE.RESEARCHING)

      expect(dfa.state).toBe(DFA_STATE.RESEARCHING)
      expect(record.from).toBe(DFA_STATE.UNDERSTANDING)
    })

    it("transitions RESEARCHING -> PLANNING when files analyzed", () => {
      dfa.updateContext({ taskDescription: "task" })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      dfa.updateContext({ filesAnalyzed: 5 })
      dfa.transition(DFA_STATE.PLANNING)

      expect(dfa.state).toBe(DFA_STATE.PLANNING)
    })

    it("transitions PLANNING -> BUILDING when plan approved", () => {
      dfa.updateContext({ taskDescription: "task" })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      dfa.updateContext({ filesAnalyzed: 3 })
      dfa.transition(DFA_STATE.PLANNING)
      dfa.updateContext({ planApproved: true })
      dfa.transition(DFA_STATE.BUILDING)

      expect(dfa.state).toBe(DFA_STATE.BUILDING)
    })

    it("transitions BUILDING -> REVIEWING", () => {
      dfa.updateContext({ taskDescription: "task", planApproved: true, filesAnalyzed: 1 })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      dfa.transition(DFA_STATE.PLANNING)
      dfa.transition(DFA_STATE.BUILDING)
      dfa.transition(DFA_STATE.REVIEWING)

      expect(dfa.state).toBe(DFA_STATE.REVIEWING)
    })

    it("transitions REVIEWING -> COMPLETING when tests pass", () => {
      dfa.updateContext({ taskDescription: "task", planApproved: true, filesAnalyzed: 1 })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      dfa.transition(DFA_STATE.PLANNING)
      dfa.transition(DFA_STATE.BUILDING)
      dfa.transition(DFA_STATE.REVIEWING)
      dfa.updateContext({ testsPass: true, buildErrors: 0 })
      dfa.transition(DFA_STATE.COMPLETING)

      expect(dfa.state).toBe(DFA_STATE.COMPLETING)
    })

    it("transitions REVIEWING -> BUILDING on review failure", () => {
      dfa.updateContext({ taskDescription: "task", planApproved: true, filesAnalyzed: 1 })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      dfa.transition(DFA_STATE.PLANNING)
      dfa.transition(DFA_STATE.BUILDING)
      dfa.transition(DFA_STATE.REVIEWING)
      dfa.updateContext({ testsPass: false, buildErrors: 2 })
      dfa.transition(DFA_STATE.BUILDING)

      expect(dfa.state).toBe(DFA_STATE.BUILDING)
    })

    it("completes full happy path: IDLE -> LEARNING -> IDLE", () => {
      dfa.updateContext({ taskDescription: "task", filesAnalyzed: 1, planApproved: true })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      dfa.transition(DFA_STATE.PLANNING)
      dfa.transition(DFA_STATE.BUILDING)
      dfa.transition(DFA_STATE.REVIEWING)
      dfa.updateContext({ testsPass: true, buildErrors: 0 })
      dfa.transition(DFA_STATE.COMPLETING)
      dfa.transition(DFA_STATE.LEARNING)
      dfa.transition(DFA_STATE.IDLE)

      expect(dfa.state).toBe(DFA_STATE.IDLE)
      expect(dfa.isTerminal()).toBe(true)
      expect(dfa.history).toHaveLength(8)
    })
  })

  describe("invalid transitions", () => {
    it("rejects IDLE -> BUILDING (skipping phases)", () => {
      dfa.updateContext({ taskDescription: "task" })
      expect(() => dfa.transition(DFA_STATE.BUILDING)).toThrow()
    })

    it("rejects IDLE -> UNDERSTANDING without description", () => {
      expect(() => dfa.transition(DFA_STATE.UNDERSTANDING)).toThrow()
    })

    it("rejects RESEARCHING -> PLANNING without files analyzed", () => {
      dfa.updateContext({ taskDescription: "task" })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      expect(() => dfa.transition(DFA_STATE.PLANNING)).toThrow()
    })

    it("rejects PLANNING -> BUILDING without plan approval", () => {
      dfa.updateContext({ taskDescription: "task", filesAnalyzed: 1 })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      dfa.transition(DFA_STATE.PLANNING)
      expect(() => dfa.transition(DFA_STATE.BUILDING)).toThrow()
    })
  })

  describe("recovery flow", () => {
    it("transitions BUILDING -> RECOVERING on build errors", () => {
      dfa.updateContext({ taskDescription: "task", filesAnalyzed: 1, planApproved: true })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      dfa.transition(DFA_STATE.PLANNING)
      dfa.transition(DFA_STATE.BUILDING)
      dfa.updateContext({ buildErrors: 3 })
      dfa.transition(DFA_STATE.RECOVERING)

      expect(dfa.state).toBe(DFA_STATE.RECOVERING)
    })

    it("transitions RECOVERING -> BUILDING when retries available", () => {
      dfa.updateContext({ taskDescription: "task", filesAnalyzed: 1, planApproved: true })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      dfa.transition(DFA_STATE.PLANNING)
      dfa.transition(DFA_STATE.BUILDING)
      dfa.updateContext({ buildErrors: 1 })
      dfa.transition(DFA_STATE.RECOVERING)
      dfa.updateContext({ retryCount: 1, buildErrors: 0 })
      dfa.transition(DFA_STATE.BUILDING)

      expect(dfa.state).toBe(DFA_STATE.BUILDING)
    })

    it("transitions RECOVERING -> FAILED when retries exhausted", () => {
      dfa.updateContext({ taskDescription: "task", filesAnalyzed: 1, planApproved: true })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      dfa.transition(DFA_STATE.PLANNING)
      dfa.transition(DFA_STATE.BUILDING)
      dfa.updateContext({ buildErrors: 1 })
      dfa.transition(DFA_STATE.RECOVERING)
      dfa.updateContext({ retryCount: 3, maxRetries: 3 })
      dfa.transition(DFA_STATE.FAILED)

      expect(dfa.state).toBe(DFA_STATE.FAILED)
      expect(dfa.isFailed()).toBe(true)
    })

    it("transitions FAILED -> IDLE to reset", () => {
      dfa.updateContext({ taskDescription: "task", filesAnalyzed: 1, planApproved: true })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      dfa.transition(DFA_STATE.PLANNING)
      dfa.transition(DFA_STATE.BUILDING)
      dfa.updateContext({ buildErrors: 1 })
      dfa.transition(DFA_STATE.RECOVERING)
      dfa.updateContext({ retryCount: 3, maxRetries: 3 })
      dfa.transition(DFA_STATE.FAILED)
      dfa.transition(DFA_STATE.IDLE)

      expect(dfa.state).toBe(DFA_STATE.IDLE)
    })
  })

  describe("canTransition", () => {
    it("returns true for valid transition with guard passing", () => {
      dfa.updateContext({ taskDescription: "task" })
      expect(dfa.canTransition(DFA_STATE.UNDERSTANDING)).toBe(true)
    })

    it("returns false for valid transition with guard failing", () => {
      expect(dfa.canTransition(DFA_STATE.UNDERSTANDING)).toBe(false)
    })

    it("returns false for invalid transition", () => {
      expect(dfa.canTransition(DFA_STATE.BUILDING)).toBe(false)
    })
  })

  describe("validTransitions", () => {
    it("returns empty array when no guards pass", () => {
      expect(dfa.validTransitions()).toEqual([])
    })

    it("returns valid states when guards pass", () => {
      dfa.updateContext({ taskDescription: "task" })
      expect(dfa.validTransitions()).toEqual([DFA_STATE.UNDERSTANDING])
    })
  })

  describe("ralph phase integration", () => {
    it("returns IMPLEMENT ralph phase for BUILDING state", () => {
      dfa.updateContext({ taskDescription: "task", filesAnalyzed: 1, planApproved: true })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      dfa.transition(DFA_STATE.PLANNING)
      dfa.transition(DFA_STATE.BUILDING)

      expect(dfa.ralphPhase).toBe(RALPH_PHASE.IMPLEMENT)
    })

    it("returns TEST ralph phase for REVIEWING state", () => {
      dfa.updateContext({ taskDescription: "task", filesAnalyzed: 1, planApproved: true })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      dfa.transition(DFA_STATE.PLANNING)
      dfa.transition(DFA_STATE.BUILDING)
      dfa.transition(DFA_STATE.REVIEWING)

      expect(dfa.ralphPhase).toBe(RALPH_PHASE.TEST)
    })

    it("returns undefined ralph phase for non-mapped state", () => {
      expect(dfa.ralphPhase).toBeUndefined()
    })

    it("records ralph phase in transition history", () => {
      dfa.updateContext({ taskDescription: "task", filesAnalyzed: 1, planApproved: true })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.transition(DFA_STATE.RESEARCHING)
      dfa.transition(DFA_STATE.PLANNING)
      dfa.transition(DFA_STATE.BUILDING)

      const last = dfa.history[dfa.history.length - 1]!
      expect(last.ralphPhase).toBe(RALPH_PHASE.IMPLEMENT)
    })
  })

  describe("snapshot", () => {
    it("returns current state snapshot", () => {
      dfa.updateContext({ taskDescription: "my task" })
      const snap = dfa.snapshot

      expect(snap.state).toBe(DFA_STATE.IDLE)
      expect(snap.context.taskDescription).toBe("my task")
      expect(snap.history).toHaveLength(0)
      expect(snap.startedAt).toBeInstanceOf(Date)
    })
  })

  describe("reset", () => {
    it("resets to initial state", () => {
      dfa.updateContext({ taskDescription: "task" })
      dfa.transition(DFA_STATE.UNDERSTANDING)
      dfa.reset()

      expect(dfa.state).toBe(DFA_STATE.IDLE)
      expect(dfa.history).toHaveLength(0)
      expect(dfa.context.taskDescription).toBe("")
    })
  })
})
