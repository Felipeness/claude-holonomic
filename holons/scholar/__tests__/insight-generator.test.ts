import { describe, it, expect } from "vitest"
import { generateInsights, INSIGHT_TYPE } from "../domain/insight-generator.js"
import type { TaskOutcome } from "../domain/insight-generator.js"

function makeOutcome(overrides: Partial<TaskOutcome> = {}): TaskOutcome {
  return {
    taskId: "task-1",
    success: true,
    approach: "tdd",
    patterns: ["guard-clause"],
    timestamp: new Date(),
    ...overrides,
  }
}

describe("generateInsights", () => {
  it("returns empty array for no outcomes", () => {
    const insights = generateInsights([])
    expect(insights).toHaveLength(0)
  })

  it("generates success rate insight", () => {
    const outcomes = [
      makeOutcome({ taskId: "t1", success: true }),
      makeOutcome({ taskId: "t2", success: true }),
      makeOutcome({ taskId: "t3", success: false }),
      makeOutcome({ taskId: "t4", success: true }),
    ]

    const insights = generateInsights(outcomes)
    const successInsight = insights.find((i) => i.type === INSIGHT_TYPE.SUCCESS_RATE)

    expect(successInsight).toBeDefined()
    expect(successInsight!.message).toContain("4 tasks")
    expect(successInsight!.message).toContain("75%")
  })

  it("generates pattern frequency insight", () => {
    const outcomes = [
      makeOutcome({ taskId: "t1", patterns: ["guard-clause"], success: true }),
      makeOutcome({ taskId: "t2", patterns: ["guard-clause"], success: true }),
      makeOutcome({ taskId: "t3", patterns: ["guard-clause"], success: true }),
      makeOutcome({ taskId: "t4", patterns: ["guard-clause", "early-return"], success: true }),
      makeOutcome({ taskId: "t5", patterns: ["guard-clause", "early-return"], success: true }),
    ]

    const insights = generateInsights(outcomes)
    const patternInsights = insights.filter((i) => i.type === INSIGHT_TYPE.PATTERN_FREQUENCY)

    expect(patternInsights.length).toBeGreaterThanOrEqual(1)

    const guardClause = patternInsights.find((i) => i.message.includes("guard-clause"))
    expect(guardClause).toBeDefined()
    expect(guardClause!.message).toContain("5 times")
    expect(guardClause!.message).toContain("always successful")
  })

  it("generates preference comparison insight", () => {
    const outcomes = [
      makeOutcome({ taskId: "t1", approach: "tdd" }),
      makeOutcome({ taskId: "t2", approach: "tdd" }),
      makeOutcome({ taskId: "t3", approach: "tdd" }),
      makeOutcome({ taskId: "t4", approach: "tdd" }),
      makeOutcome({ taskId: "t5", approach: "tdd" }),
      makeOutcome({ taskId: "t6", approach: "tdd" }),
      makeOutcome({ taskId: "t7", approach: "tdd" }),
      makeOutcome({ taskId: "t8", approach: "spike" }),
      makeOutcome({ taskId: "t9", approach: "spike" }),
    ]

    const insights = generateInsights(outcomes)
    const prefInsights = insights.filter((i) => i.type === INSIGHT_TYPE.PREFERENCE_COMPARISON)

    expect(prefInsights.length).toBeGreaterThanOrEqual(1)
    expect(prefInsights[0].message).toContain("tdd")
    expect(prefInsights[0].message).toContain("preferred over")
    expect(prefInsights[0].message).toContain("7 vs 2")
  })

  it("skips pattern frequency for patterns used only once", () => {
    const outcomes = [
      makeOutcome({ taskId: "t1", patterns: ["rare-pattern"] }),
    ]

    const insights = generateInsights(outcomes)
    const patternInsights = insights.filter((i) => i.type === INSIGHT_TYPE.PATTERN_FREQUENCY)

    expect(patternInsights).toHaveLength(0)
  })

  it("calculates confidence based on data size", () => {
    const outcomes = Array.from({ length: 20 }, (_, i) =>
      makeOutcome({ taskId: `t${i}`, success: true }),
    )

    const insights = generateInsights(outcomes)
    const successInsight = insights.find((i) => i.type === INSIGHT_TYPE.SUCCESS_RATE)

    expect(successInsight!.confidence).toBe(1)
  })

  it("reports partial success rate for patterns", () => {
    const outcomes = [
      makeOutcome({ taskId: "t1", patterns: ["strategy-map"], success: true }),
      makeOutcome({ taskId: "t2", patterns: ["strategy-map"], success: false }),
      makeOutcome({ taskId: "t3", patterns: ["strategy-map"], success: true }),
    ]

    const insights = generateInsights(outcomes)
    const patternInsight = insights.find(
      (i) => i.type === INSIGHT_TYPE.PATTERN_FREQUENCY && i.message.includes("strategy-map"),
    )

    expect(patternInsight).toBeDefined()
    expect(patternInsight!.message).toContain("67%")
  })
})
