import { describe, it, expect } from "vitest"
import {
  TDD_PHASE,
  TDD_EVENT,
  initialTddState,
  transitionTdd,
  isValidTransition,
  isCriterionComplete,
} from "../domain/tdd-engine.js"

describe("TddEngine", () => {
  describe("initial state", () => {
    it("starts in RED phase", () => {
      const state = initialTddState()
      expect(state.phase).toBe(TDD_PHASE.RED)
    })

    it("starts at criterion 0", () => {
      const state = initialTddState()
      expect(state.criterionIndex).toBe(0)
    })

    it("starts with zero iterations", () => {
      const state = initialTddState()
      expect(state.iterationCount).toBe(0)
    })

    it("starts with no completed criteria", () => {
      const state = initialTddState()
      expect(state.completedCriteria).toEqual([])
    })
  })

  describe("state transitions", () => {
    it("transitions RED -> GREEN on TEST_PASSES", () => {
      const state = initialTddState()
      const next = transitionTdd(state, TDD_EVENT.TEST_PASSES)

      expect(next.phase).toBe(TDD_PHASE.GREEN)
    })

    it("transitions GREEN -> REFACTOR on CLEANUP_DONE", () => {
      let state = initialTddState()
      state = transitionTdd(state, TDD_EVENT.TEST_PASSES)
      const next = transitionTdd(state, TDD_EVENT.CLEANUP_DONE)

      expect(next.phase).toBe(TDD_PHASE.REFACTOR)
    })

    it("transitions REFACTOR -> RED on NEXT_CRITERION", () => {
      let state = initialTddState()
      state = transitionTdd(state, TDD_EVENT.TEST_PASSES)
      state = transitionTdd(state, TDD_EVENT.CLEANUP_DONE)
      const next = transitionTdd(state, TDD_EVENT.NEXT_CRITERION)

      expect(next.phase).toBe(TDD_PHASE.RED)
    })

    it("advances criterion index after full cycle", () => {
      let state = initialTddState()
      state = transitionTdd(state, TDD_EVENT.TEST_PASSES)
      state = transitionTdd(state, TDD_EVENT.CLEANUP_DONE)
      state = transitionTdd(state, TDD_EVENT.NEXT_CRITERION)

      expect(state.criterionIndex).toBe(1)
    })

    it("marks criterion as completed after full cycle", () => {
      let state = initialTddState()
      state = transitionTdd(state, TDD_EVENT.TEST_PASSES)
      state = transitionTdd(state, TDD_EVENT.CLEANUP_DONE)
      state = transitionTdd(state, TDD_EVENT.NEXT_CRITERION)

      expect(state.completedCriteria).toEqual([0])
    })

    it("returns same state for invalid transitions", () => {
      const state = initialTddState()
      const next = transitionTdd(state, TDD_EVENT.CLEANUP_DONE)

      expect(next).toEqual(state)
    })
  })

  describe("iteration tracking", () => {
    it("increments iteration count on each transition", () => {
      let state = initialTddState()
      state = transitionTdd(state, TDD_EVENT.TEST_PASSES)
      expect(state.iterationCount).toBe(1)

      state = transitionTdd(state, TDD_EVENT.CLEANUP_DONE)
      expect(state.iterationCount).toBe(2)

      state = transitionTdd(state, TDD_EVENT.NEXT_CRITERION)
      expect(state.iterationCount).toBe(3)
    })

    it("tracks iterations across multiple criteria", () => {
      let state = initialTddState()

      // first criterion
      state = transitionTdd(state, TDD_EVENT.TEST_PASSES)
      state = transitionTdd(state, TDD_EVENT.CLEANUP_DONE)
      state = transitionTdd(state, TDD_EVENT.NEXT_CRITERION)

      // second criterion
      state = transitionTdd(state, TDD_EVENT.TEST_PASSES)
      state = transitionTdd(state, TDD_EVENT.CLEANUP_DONE)
      state = transitionTdd(state, TDD_EVENT.NEXT_CRITERION)

      expect(state.iterationCount).toBe(6)
      expect(state.criterionIndex).toBe(2)
      expect(state.completedCriteria).toEqual([0, 1])
    })
  })

  describe("isValidTransition", () => {
    it.each([
      [TDD_PHASE.RED, TDD_EVENT.TEST_PASSES, true],
      [TDD_PHASE.GREEN, TDD_EVENT.CLEANUP_DONE, true],
      [TDD_PHASE.REFACTOR, TDD_EVENT.NEXT_CRITERION, true],
      [TDD_PHASE.RED, TDD_EVENT.CLEANUP_DONE, false],
      [TDD_PHASE.RED, TDD_EVENT.NEXT_CRITERION, false],
      [TDD_PHASE.GREEN, TDD_EVENT.TEST_PASSES, false],
      [TDD_PHASE.GREEN, TDD_EVENT.NEXT_CRITERION, false],
      [TDD_PHASE.REFACTOR, TDD_EVENT.TEST_PASSES, false],
      [TDD_PHASE.REFACTOR, TDD_EVENT.CLEANUP_DONE, false],
    ] as const)("(%s, %s) => %s", (phase, event, expected) => {
      expect(isValidTransition(phase, event)).toBe(expected)
    })
  })

  describe("isCriterionComplete", () => {
    it("returns false for incomplete criterion", () => {
      const state = initialTddState()
      expect(isCriterionComplete(state, 0)).toBe(false)
    })

    it("returns true for completed criterion", () => {
      let state = initialTddState()
      state = transitionTdd(state, TDD_EVENT.TEST_PASSES)
      state = transitionTdd(state, TDD_EVENT.CLEANUP_DONE)
      state = transitionTdd(state, TDD_EVENT.NEXT_CRITERION)

      expect(isCriterionComplete(state, 0)).toBe(true)
    })
  })
})
