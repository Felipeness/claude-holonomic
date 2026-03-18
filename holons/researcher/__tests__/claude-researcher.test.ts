import { describe, it, expect } from "vitest"
import { Effect } from "effect"
import { researchWithClaude, ResearchError } from "../infra/claude-researcher.js"
import type { ResearchQuery } from "../infra/claude-researcher.js"

describe("claude-researcher", () => {
  it("constructs valid research query", () => {
    const query: ResearchQuery = {
      question: "How is authentication implemented in this codebase?",
      codebasePath: "/app/services/auth",
    }

    expect(query.question).toContain("authentication")
    expect(query.codebasePath).toBe("/app/services/auth")
  })

  it("ResearchError has correct tag", () => {
    const error = new ResearchError("Codebase path not found")

    expect(error._tag).toBe("ResearchError")
    expect(error.reason).toBe("Codebase path not found")
  })

  it("returns an Effect type", () => {
    const query: ResearchQuery = {
      question: "test",
      codebasePath: "/tmp",
    }
    const result = researchWithClaude(query)

    expect(Effect.isEffect(result)).toBe(true)
  })
})
