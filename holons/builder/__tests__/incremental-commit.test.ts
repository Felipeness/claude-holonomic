import { describe, it, expect } from "vitest"
import {
  COMMIT_TYPE,
  inferCommitType,
  formatScope,
  generateCommitMessage,
  summarizeDescription,
  createCommitPlan,
} from "../domain/incremental-commit.js"
import type { TaskContext } from "../domain/incremental-commit.js"

describe("IncrementalCommit", () => {
  describe("inferCommitType", () => {
    it("returns TEST when all files are tests", () => {
      const files = ["src/__tests__/foo.test.ts", "src/bar.spec.ts"]
      expect(inferCommitType(files)).toBe(COMMIT_TYPE.TEST)
    })

    it("returns DOCS when all files are docs", () => {
      const files = ["README.md", "docs/usage.md"]
      expect(inferCommitType(files)).toBe(COMMIT_TYPE.DOCS)
    })

    it("returns FEAT when mix of source and test files", () => {
      const files = ["src/engine.ts", "src/__tests__/engine.test.ts"]
      expect(inferCommitType(files)).toBe(COMMIT_TYPE.FEAT)
    })

    it("returns FEAT for source-only files", () => {
      const files = ["src/handler.ts", "src/types.ts"]
      expect(inferCommitType(files)).toBe(COMMIT_TYPE.FEAT)
    })
  })

  describe("formatScope", () => {
    it("returns empty string without ticket", () => {
      expect(formatScope()).toBe("")
    })

    it("wraps ticket in parentheses", () => {
      expect(formatScope("CC-1234")).toBe("(CC-1234)")
    })
  })

  describe("summarizeDescription", () => {
    it("lowercases and trims the description", () => {
      expect(summarizeDescription("  Add Rate Limiting  ")).toBe("add rate limiting")
    })

    it("takes only the first sentence", () => {
      expect(summarizeDescription("Fix the bug. Then deploy")).toBe("fix the bug")
    })

    it("truncates long descriptions to 50 chars", () => {
      const long = "implement the entire gamification scoring system with badges"
      const result = summarizeDescription(long)
      expect(result.length).toBeLessThanOrEqual(50)
      expect(result).toContain("...")
    })

    it("does not truncate short descriptions", () => {
      expect(summarizeDescription("fix null check")).toBe("fix null check")
    })
  })

  describe("generateCommitMessage", () => {
    it("generates message with ticket scope", () => {
      const ctx: TaskContext = {
        description: "Add user authentication",
        ticketId: "CC-42",
        criterionIndex: 0,
        totalCriteria: 1,
        filesChanged: ["src/auth.ts"],
      }
      expect(generateCommitMessage(ctx)).toBe("feat(CC-42): add user authentication")
    })

    it("generates message without ticket", () => {
      const ctx: TaskContext = {
        description: "Fix null pointer",
        criterionIndex: 0,
        totalCriteria: 1,
        filesChanged: ["src/handler.ts"],
      }
      expect(generateCommitMessage(ctx)).toBe("feat: fix null pointer")
    })

    it("appends progress for multi-criterion tasks", () => {
      const ctx: TaskContext = {
        description: "Add validation",
        criterionIndex: 1,
        totalCriteria: 3,
        filesChanged: ["src/validate.ts"],
      }
      expect(generateCommitMessage(ctx)).toBe("feat: add validation [2/3]")
    })

    it("uses test type for test-only changes", () => {
      const ctx: TaskContext = {
        description: "Add edge case tests",
        criterionIndex: 0,
        totalCriteria: 1,
        filesChanged: ["src/__tests__/foo.test.ts"],
      }
      expect(generateCommitMessage(ctx)).toBe("test: add edge case tests")
    })
  })

  describe("createCommitPlan", () => {
    it("creates plan with message and files", () => {
      const ctx: TaskContext = {
        description: "Add feature",
        ticketId: "CC-99",
        criterionIndex: 0,
        totalCriteria: 1,
        filesChanged: ["src/feature.ts", "src/__tests__/feature.test.ts"],
      }
      const plan = createCommitPlan(ctx)

      expect(plan.message).toBe("feat(CC-99): add feature")
      expect(plan.filesToStage).toEqual(ctx.filesChanged)
      expect(plan.type).toBe(COMMIT_TYPE.FEAT)
    })
  })
})
