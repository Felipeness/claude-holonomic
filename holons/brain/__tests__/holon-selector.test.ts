import { describe, it, expect } from "vitest"
import { TASK_TYPE, HOLON_NAME } from "@holon/shared"
import { selectHolons } from "../domain/holon-selector.js"
import { COMPLEXITY } from "../domain/task-classifier.js"

describe("selectHolons", () => {
  describe("strategy map per task type", () => {
    it("selects full pipeline for feature tasks", () => {
      const result = selectHolons(TASK_TYPE.FEATURE, COMPLEXITY.MEDIUM)
      expect(result.holons).toEqual([
        HOLON_NAME.RESEARCHER,
        HOLON_NAME.ARCHITECT,
        HOLON_NAME.BUILDER,
        HOLON_NAME.GUARDIAN,
        HOLON_NAME.SCHOLAR,
      ])
    })

    it("skips architect for simple bug fixes", () => {
      const result = selectHolons(TASK_TYPE.BUG, COMPLEXITY.LOW)
      expect(result.holons).toEqual([
        HOLON_NAME.RESEARCHER,
        HOLON_NAME.BUILDER,
        HOLON_NAME.GUARDIAN,
        HOLON_NAME.SCHOLAR,
      ])
      expect(result.holons).not.toContain(HOLON_NAME.ARCHITECT)
    })

    it("skips architect for medium bug fixes", () => {
      const result = selectHolons(TASK_TYPE.BUG, COMPLEXITY.MEDIUM)
      expect(result.holons).not.toContain(HOLON_NAME.ARCHITECT)
    })

    it("includes architect for high complexity bugs", () => {
      const result = selectHolons(TASK_TYPE.BUG, COMPLEXITY.HIGH)
      expect(result.holons).toContain(HOLON_NAME.ARCHITECT)
    })

    it("selects read-only holons for review tasks", () => {
      const result = selectHolons(TASK_TYPE.REVIEW, COMPLEXITY.MEDIUM)
      expect(result.holons).toEqual([
        HOLON_NAME.RESEARCHER,
        HOLON_NAME.GUARDIAN,
      ])
    })

    it("selects full pipeline for refactor tasks", () => {
      const result = selectHolons(TASK_TYPE.REFACTOR, COMPLEXITY.MEDIUM)
      expect(result.holons).toContain(HOLON_NAME.ARCHITECT)
      expect(result.holons).toContain(HOLON_NAME.BUILDER)
    })

    it("selects docs pipeline without architect or guardian", () => {
      const result = selectHolons(TASK_TYPE.DOCS, COMPLEXITY.LOW)
      expect(result.holons).toEqual([
        HOLON_NAME.RESEARCHER,
        HOLON_NAME.BUILDER,
        HOLON_NAME.SCHOLAR,
      ])
    })

    it("selects test pipeline with guardian", () => {
      const result = selectHolons(TASK_TYPE.TEST, COMPLEXITY.MEDIUM)
      expect(result.holons).toEqual([
        HOLON_NAME.RESEARCHER,
        HOLON_NAME.BUILDER,
        HOLON_NAME.GUARDIAN,
        HOLON_NAME.SCHOLAR,
      ])
    })

    it("selects full pipeline for perf tasks", () => {
      const result = selectHolons(TASK_TYPE.PERF, COMPLEXITY.MEDIUM)
      expect(result.holons).toContain(HOLON_NAME.ARCHITECT)
      expect(result.holons).toContain(HOLON_NAME.BUILDER)
      expect(result.holons).toContain(HOLON_NAME.GUARDIAN)
    })

    it("selects full pipeline for migration tasks", () => {
      const result = selectHolons(TASK_TYPE.MIGRATION, COMPLEXITY.HIGH)
      expect(result.holons).toContain(HOLON_NAME.ARCHITECT)
      expect(result.holons).toContain(HOLON_NAME.BUILDER)
      expect(result.holons).toContain(HOLON_NAME.GUARDIAN)
    })
  })

  describe("holon ordering", () => {
    it("always starts with researcher", () => {
      const types = Object.values(TASK_TYPE)
      for (const type of types) {
        const result = selectHolons(type, COMPLEXITY.MEDIUM)
        expect(result.holons[0]).toBe(HOLON_NAME.RESEARCHER)
      }
    })

    it("places architect after researcher for high complexity bugs", () => {
      const result = selectHolons(TASK_TYPE.BUG, COMPLEXITY.HIGH)
      const researcherIdx = result.holons.indexOf(HOLON_NAME.RESEARCHER)
      const architectIdx = result.holons.indexOf(HOLON_NAME.ARCHITECT)
      expect(architectIdx).toBe(researcherIdx + 1)
    })

    it("places scholar last when present", () => {
      const result = selectHolons(TASK_TYPE.FEATURE, COMPLEXITY.MEDIUM)
      expect(result.holons[result.holons.length - 1]).toBe(HOLON_NAME.SCHOLAR)
    })
  })

  describe("reason", () => {
    it("includes task type in reason", () => {
      const result = selectHolons(TASK_TYPE.FEATURE, COMPLEXITY.MEDIUM)
      expect(result.reason).toContain("feature")
    })

    it("includes complexity in reason", () => {
      const result = selectHolons(TASK_TYPE.BUG, COMPLEXITY.HIGH)
      expect(result.reason).toContain("high")
    })

    it("includes holon names in reason", () => {
      const result = selectHolons(TASK_TYPE.REVIEW, COMPLEXITY.LOW)
      expect(result.reason).toContain("researcher")
      expect(result.reason).toContain("guardian")
    })
  })

  describe("never includes brain holon", () => {
    it("brain is never in the selected holons", () => {
      const types = Object.values(TASK_TYPE)
      const complexities = Object.values(COMPLEXITY)
      for (const type of types) {
        for (const complexity of complexities) {
          const result = selectHolons(type, complexity)
          expect(result.holons).not.toContain(HOLON_NAME.BRAIN)
        }
      }
    })
  })
})
