import { describe, it, expect } from "vitest"
import {
  createEmptyPreferenceState,
  recordChoice,
  getTopPreferences,
} from "../domain/preference-learner.js"
import type { ApproachChoice } from "../domain/preference-learner.js"

function makeChoice(chosen: string, rejected: string, context = "test"): ApproachChoice {
  return { chosen, rejected, context, timestamp: new Date() }
}

describe("preference-learner", () => {
  it("starts with empty state", () => {
    const state = createEmptyPreferenceState()
    expect(state.weights.size).toBe(0)
  })

  it("tracks chosen approach with weight boost", () => {
    const initial = createEmptyPreferenceState()
    const { state } = recordChoice(initial, makeChoice("functional", "oop"))

    const functional = state.weights.get("functional")
    expect(functional).toBeDefined()
    expect(functional!.weight).toBeGreaterThan(0.5)
    expect(functional!.chosenCount).toBe(1)
  })

  it("tracks rejected approach with weight decay", () => {
    const initial = createEmptyPreferenceState()
    const { state } = recordChoice(initial, makeChoice("functional", "oop"))

    const oop = state.weights.get("oop")
    expect(oop).toBeDefined()
    expect(oop!.weight).toBeLessThan(0.5)
    expect(oop!.rejectedCount).toBe(1)
  })

  it("returns updates for both approaches", () => {
    const initial = createEmptyPreferenceState()
    const { updates } = recordChoice(initial, makeChoice("guard-clauses", "nested-ifs"))

    expect(updates).toHaveLength(2)

    const chosenUpdate = updates.find((u) => u.approach === "guard-clauses")
    expect(chosenUpdate).toBeDefined()
    expect(chosenUpdate!.newWeight).toBeGreaterThan(chosenUpdate!.previousWeight)

    const rejectedUpdate = updates.find((u) => u.approach === "nested-ifs")
    expect(rejectedUpdate).toBeDefined()
    expect(rejectedUpdate!.newWeight).toBeLessThan(rejectedUpdate!.previousWeight)
  })

  it("accumulates weight across multiple choices", () => {
    let state = createEmptyPreferenceState()

    for (let i = 0; i < 5; i++) {
      const result = recordChoice(state, makeChoice("composition", "inheritance"))
      state = result.state
    }

    const composition = state.weights.get("composition")
    expect(composition).toBeDefined()
    expect(composition!.weight).toBeCloseTo(1, 10)
    expect(composition!.chosenCount).toBe(5)
  })

  it("clamps weight to [0, 1] range", () => {
    let state = createEmptyPreferenceState()

    for (let i = 0; i < 20; i++) {
      const result = recordChoice(state, makeChoice("A", "B"))
      state = result.state
    }

    const a = state.weights.get("A")
    const b = state.weights.get("B")
    expect(a!.weight).toBeLessThanOrEqual(1)
    expect(b!.weight).toBeGreaterThanOrEqual(0)
  })

  it("returns top preferences sorted by weight", () => {
    let state = createEmptyPreferenceState()

    for (let i = 0; i < 3; i++) {
      state = recordChoice(state, makeChoice("A", "B")).state
    }
    state = recordChoice(state, makeChoice("C", "D")).state

    const top = getTopPreferences(state, 2)

    expect(top).toHaveLength(2)
    expect(top[0].weight).toBeGreaterThanOrEqual(top[1].weight)
  })

  it("preserves immutability of original state", () => {
    const initial = createEmptyPreferenceState()
    recordChoice(initial, makeChoice("X", "Y"))

    expect(initial.weights.size).toBe(0)
  })
})
