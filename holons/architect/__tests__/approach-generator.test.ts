import { describe, it, expect } from "vitest"
import { generateApproaches } from "../domain/approach-generator.js"
import type { TaskContext } from "../domain/approach-generator.js"

describe("approach-generator", () => {
  const baseContext: TaskContext = {
    description: "add rate limiting to payment API",
    taskType: "feature",
    relevantFiles: ["src/api/payment.ts", "src/middleware/auth.ts"],
    codebasePatterns: ["repository-pattern", "guard-clauses"],
  }

  describe("generateApproaches", () => {
    it("generates 2-3 approaches for feature tasks", () => {
      const result = generateApproaches(baseContext)

      expect(result.approaches.length).toBeGreaterThanOrEqual(2)
      expect(result.approaches.length).toBeLessThanOrEqual(3)
    })

    it("generates 2 approaches for bug tasks", () => {
      const bugContext: TaskContext = {
        ...baseContext,
        taskType: "bug",
        description: "fix null pointer in user lookup",
      }

      const result = generateApproaches(bugContext)

      expect(result.approaches.length).toBe(2)
    })

    it("generates 3 approaches for refactor tasks", () => {
      const refactorContext: TaskContext = {
        ...baseContext,
        taskType: "refactor",
        description: "refactor payment module to use repository pattern",
      }

      const result = generateApproaches(refactorContext)

      expect(result.approaches.length).toBe(3)
    })

    it("generates 2 approaches for unknown task types", () => {
      const docsContext: TaskContext = {
        ...baseContext,
        taskType: "docs",
        description: "update API documentation",
      }

      const result = generateApproaches(docsContext)

      expect(result.approaches.length).toBe(2)
    })

    it("includes a recommendation index within bounds", () => {
      const result = generateApproaches(baseContext)

      expect(result.recommended).toBeGreaterThanOrEqual(0)
      expect(result.recommended).toBeLessThan(result.approaches.length)
    })

    it("includes reasoning for the recommendation", () => {
      const result = generateApproaches(baseContext)

      expect(result.reasoning).toBeTruthy()
      expect(typeof result.reasoning).toBe("string")
      expect(result.reasoning.length).toBeGreaterThan(0)
    })

    it("each approach has required properties", () => {
      const result = generateApproaches(baseContext)

      for (const approach of result.approaches) {
        expect(approach.name).toBeTruthy()
        expect(approach.description).toBeTruthy()
        expect(approach.pros.length).toBeGreaterThan(0)
        expect(approach.cons.length).toBeGreaterThan(0)
        expect(["low", "medium", "high"]).toContain(approach.risk)
        expect(["small", "medium", "large"]).toContain(approach.effort)
      }
    })

    it("recommends lower-risk approach when available", () => {
      const result = generateApproaches(baseContext)
      const recommended = result.approaches[result.recommended]!

      const hasLowerRiskAlternative = result.approaches.some(
        (a, i) => i !== result.recommended && a.risk === "low" && recommended.risk === "high",
      )

      expect(hasLowerRiskAlternative).toBe(false)
    })

    it("adjusts risk based on number of relevant files", () => {
      const manyFilesContext: TaskContext = {
        ...baseContext,
        relevantFiles: Array.from({ length: 10 }, (_, i) => `src/file-${i}.ts`),
      }

      const fewFilesResult = generateApproaches(baseContext)
      const manyFilesResult = generateApproaches(manyFilesContext)

      const fewFilesHighRisk = fewFilesResult.approaches.filter((a) => a.risk === "high").length
      const manyFilesHighRisk = manyFilesResult.approaches.filter((a) => a.risk === "high").length

      expect(manyFilesHighRisk).toBeGreaterThanOrEqual(fewFilesHighRisk)
    })
  })
})
