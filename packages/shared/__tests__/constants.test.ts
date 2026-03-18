import { describe, it, expect } from "vitest"
import { TASK_TYPE, DFA_STATE, RALPH_PHASE, HOLON_NAME, ENTITY_TYPE, RELATION_TYPE } from "../src/index.js"

describe("constants", () => {
  it("TASK_TYPE has all expected values", () => {
    expect(TASK_TYPE.FEATURE).toBe("feature")
    expect(TASK_TYPE.BUG).toBe("bug")
    expect(TASK_TYPE.REFACTOR).toBe("refactor")
    expect(TASK_TYPE.REVIEW).toBe("review")
    expect(TASK_TYPE.DOCS).toBe("docs")
    expect(TASK_TYPE.TEST).toBe("test")
    expect(TASK_TYPE.PERF).toBe("perf")
    expect(TASK_TYPE.MIGRATION).toBe("migration")
  })

  it("DFA_STATE has all 10 states", () => {
    const states = Object.values(DFA_STATE)
    expect(states).toHaveLength(10)
    expect(states).toContain("IDLE")
    expect(states).toContain("UNDERSTANDING")
    expect(states).toContain("RESEARCHING")
    expect(states).toContain("PLANNING")
    expect(states).toContain("BUILDING")
    expect(states).toContain("REVIEWING")
    expect(states).toContain("COMPLETING")
    expect(states).toContain("LEARNING")
    expect(states).toContain("RECOVERING")
    expect(states).toContain("FAILED")
  })

  it("RALPH_PHASE has all 5 phases", () => {
    const phases = Object.values(RALPH_PHASE)
    expect(phases).toHaveLength(5)
    expect(phases).toContain("IMPLEMENT")
    expect(phases).toContain("TEST")
    expect(phases).toContain("PERF")
    expect(phases).toContain("DOCS")
    expect(phases).toContain("PR")
  })

  it("HOLON_NAME has all 6 holons", () => {
    const holons = Object.values(HOLON_NAME)
    expect(holons).toHaveLength(6)
  })

  it("ENTITY_TYPE has all 10 entity types", () => {
    const entities = Object.values(ENTITY_TYPE)
    expect(entities).toHaveLength(10)
  })

  it("RELATION_TYPE has all 8 relation types", () => {
    const relations = Object.values(RELATION_TYPE)
    expect(relations).toHaveLength(8)
  })
})
