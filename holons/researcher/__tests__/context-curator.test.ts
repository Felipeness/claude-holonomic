import { describe, it, expect } from "vitest"
import {
  estimateTokens,
  truncateToTokenBudget,
  curateContext,
} from "../domain/context-curator.js"
import type { ScoredFile } from "../domain/context-curator.js"

describe("context-curator", () => {
  describe("estimateTokens", () => {
    it("estimates tokens as content length / 4", () => {
      const content = "a".repeat(400)
      expect(estimateTokens(content)).toBe(100)
    })

    it("rounds up for non-exact divisions", () => {
      const content = "a".repeat(5)
      expect(estimateTokens(content)).toBe(2)
    })

    it("returns 0 for empty content", () => {
      expect(estimateTokens("")).toBe(0)
    })
  })

  describe("truncateToTokenBudget", () => {
    it("returns content unchanged when within budget", () => {
      const content = "a".repeat(40)
      const result = truncateToTokenBudget(content, 100)

      expect(result.content).toBe(content)
      expect(result.truncated).toBe(false)
    })

    it("truncates content exceeding budget", () => {
      const content = "a".repeat(400)
      const result = truncateToTokenBudget(content, 50)

      expect(result.content.length).toBe(200)
      expect(result.truncated).toBe(true)
    })

    it("handles exact budget match without truncation", () => {
      const content = "a".repeat(400)
      const result = truncateToTokenBudget(content, 100)

      expect(result.content).toBe(content)
      expect(result.truncated).toBe(false)
    })
  })

  describe("curateContext", () => {
    const makeFile = (path: string, score: number, contentSize: number): ScoredFile => ({
      path,
      content: "x".repeat(contentSize),
      score,
      tokenEstimate: Math.ceil(contentSize / 4),
    })

    it("fits all files when total tokens under budget", () => {
      const files: ScoredFile[] = [
        makeFile("a.ts", 0.9, 100),
        makeFile("b.ts", 0.8, 100),
      ]

      const result = curateContext(files, 1000)

      expect(result.totalFiles).toBe(2)
      expect(result.totalTokens).toBeLessThanOrEqual(1000)
    })

    it("prioritizes higher-scored files", () => {
      const files: ScoredFile[] = [
        makeFile("low.ts", 0.1, 200),
        makeFile("high.ts", 0.9, 200),
        makeFile("mid.ts", 0.5, 200),
      ]

      const result = curateContext(files, 200)

      expect(result.files[0]!.path).toBe("high.ts")
    })

    it("truncates large files to fit budget", () => {
      const files: ScoredFile[] = [
        makeFile("big.ts", 0.9, 4000),
      ]

      const result = curateContext(files, 100)

      expect(result.files[0]!.truncated).toBe(true)
      expect(result.totalTokens).toBeLessThanOrEqual(100)
    })

    it("excludes files that exceed remaining budget after higher-scored files", () => {
      const files: ScoredFile[] = [
        makeFile("a.ts", 0.9, 800),
        makeFile("b.ts", 0.5, 800),
      ]

      const result = curateContext(files, 250)

      expect(result.totalTokens).toBeLessThanOrEqual(250)
    })

    it("returns empty context for zero budget", () => {
      const files: ScoredFile[] = [
        makeFile("a.ts", 0.9, 100),
      ]

      const result = curateContext(files, 0)

      expect(result.totalFiles).toBe(0)
      expect(result.totalTokens).toBe(0)
    })

    it("reports budget usage as a fraction", () => {
      const files: ScoredFile[] = [
        makeFile("a.ts", 0.9, 200),
      ]

      const result = curateContext(files, 100)

      expect(result.budgetUsed).toBeGreaterThan(0)
      expect(result.budgetUsed).toBeLessThanOrEqual(1)
    })
  })
})
