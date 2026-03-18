import { describe, it, expect } from "vitest"
import { HOLON_NAME } from "@holon/shared"
import { allocateBudget, totalAllocatedPercentage, totalAllocatedTokens } from "../domain/context-budget.js"
import { COMPLEXITY } from "../domain/task-classifier.js"

describe("allocateBudget", () => {
  const fullPipeline = [
    HOLON_NAME.RESEARCHER,
    HOLON_NAME.ARCHITECT,
    HOLON_NAME.BUILDER,
    HOLON_NAME.GUARDIAN,
    HOLON_NAME.SCHOLAR,
  ] as const

  describe("percentage normalization", () => {
    it("allocations sum to approximately 100%", () => {
      const allocation = allocateBudget(fullPipeline, COMPLEXITY.MEDIUM)
      const total = totalAllocatedPercentage(allocation)
      expect(total).toBeGreaterThanOrEqual(99)
      expect(total).toBeLessThanOrEqual(101)
    })

    it("allocations sum to approximately 100% for high complexity", () => {
      const allocation = allocateBudget(fullPipeline, COMPLEXITY.HIGH)
      const total = totalAllocatedPercentage(allocation)
      expect(total).toBeGreaterThanOrEqual(99)
      expect(total).toBeLessThanOrEqual(101)
    })

    it("allocations sum to approximately 100% for low complexity", () => {
      const allocation = allocateBudget(fullPipeline, COMPLEXITY.LOW)
      const total = totalAllocatedPercentage(allocation)
      expect(total).toBeGreaterThanOrEqual(99)
      expect(total).toBeLessThanOrEqual(101)
    })
  })

  describe("default budget", () => {
    it("uses 100K tokens as default", () => {
      const allocation = allocateBudget(fullPipeline, COMPLEXITY.MEDIUM)
      expect(allocation.totalTokens).toBe(100_000)
    })

    it("respects custom total tokens", () => {
      const allocation = allocateBudget(fullPipeline, COMPLEXITY.MEDIUM, 200_000)
      expect(allocation.totalTokens).toBe(200_000)
    })
  })

  describe("base allocation (medium complexity)", () => {
    it("gives builder the largest share", () => {
      const allocation = allocateBudget(fullPipeline, COMPLEXITY.MEDIUM)
      const builder = allocation.allocations.get(HOLON_NAME.BUILDER)!
      const researcher = allocation.allocations.get(HOLON_NAME.RESEARCHER)!
      expect(builder.percentage).toBeGreaterThan(researcher.percentage)
    })

    it("gives researcher second largest share", () => {
      const allocation = allocateBudget(fullPipeline, COMPLEXITY.MEDIUM)
      const researcher = allocation.allocations.get(HOLON_NAME.RESEARCHER)!
      const architect = allocation.allocations.get(HOLON_NAME.ARCHITECT)!
      expect(researcher.percentage).toBeGreaterThan(architect.percentage)
    })
  })

  describe("high complexity adjustments", () => {
    it("gives architect more budget for high complexity", () => {
      const medium = allocateBudget(fullPipeline, COMPLEXITY.MEDIUM)
      const high = allocateBudget(fullPipeline, COMPLEXITY.HIGH)

      const architectMedium = medium.allocations.get(HOLON_NAME.ARCHITECT)!
      const architectHigh = high.allocations.get(HOLON_NAME.ARCHITECT)!

      expect(architectHigh.percentage).toBeGreaterThan(architectMedium.percentage)
    })

    it("gives guardian more budget for high complexity", () => {
      const medium = allocateBudget(fullPipeline, COMPLEXITY.MEDIUM)
      const high = allocateBudget(fullPipeline, COMPLEXITY.HIGH)

      const guardianMedium = medium.allocations.get(HOLON_NAME.GUARDIAN)!
      const guardianHigh = high.allocations.get(HOLON_NAME.GUARDIAN)!

      expect(guardianHigh.percentage).toBeGreaterThan(guardianMedium.percentage)
    })
  })

  describe("low complexity adjustments", () => {
    it("gives builder more budget for low complexity", () => {
      const medium = allocateBudget(fullPipeline, COMPLEXITY.MEDIUM)
      const low = allocateBudget(fullPipeline, COMPLEXITY.LOW)

      const builderMedium = medium.allocations.get(HOLON_NAME.BUILDER)!
      const builderLow = low.allocations.get(HOLON_NAME.BUILDER)!

      expect(builderLow.percentage).toBeGreaterThan(builderMedium.percentage)
    })
  })

  describe("subset allocation", () => {
    it("normalizes to 100% even for subset of holons", () => {
      const reviewHolons = [HOLON_NAME.RESEARCHER, HOLON_NAME.GUARDIAN] as const
      const allocation = allocateBudget(reviewHolons, COMPLEXITY.MEDIUM)
      const total = totalAllocatedPercentage(allocation)
      expect(total).toBeGreaterThanOrEqual(99)
      expect(total).toBeLessThanOrEqual(101)
    })

    it("only allocates to active holons", () => {
      const reviewHolons = [HOLON_NAME.RESEARCHER, HOLON_NAME.GUARDIAN] as const
      const allocation = allocateBudget(reviewHolons, COMPLEXITY.MEDIUM)
      expect(allocation.allocations.size).toBe(2)
      expect(allocation.allocations.has(HOLON_NAME.BUILDER)).toBe(false)
    })
  })

  describe("token calculation", () => {
    it("allocates tokens proportional to percentage", () => {
      const allocation = allocateBudget(fullPipeline, COMPLEXITY.MEDIUM, 100_000)
      const builder = allocation.allocations.get(HOLON_NAME.BUILDER)!
      expect(builder.tokens).toBe(Math.floor((builder.percentage / 100) * 100_000))
    })

    it("total allocated tokens approximate total budget", () => {
      const allocation = allocateBudget(fullPipeline, COMPLEXITY.MEDIUM, 100_000)
      const allocated = totalAllocatedTokens(allocation)
      expect(allocated).toBeGreaterThan(90_000)
      expect(allocated).toBeLessThanOrEqual(100_000)
    })
  })

  describe("brain holon exclusion", () => {
    it("excludes brain from budget even if passed", () => {
      const withBrain = [HOLON_NAME.BRAIN, ...fullPipeline] as const
      const allocation = allocateBudget(withBrain, COMPLEXITY.MEDIUM)
      expect(allocation.allocations.has(HOLON_NAME.BRAIN)).toBe(false)
    })
  })
})
