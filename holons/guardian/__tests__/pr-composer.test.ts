import { describe, it, expect } from "vitest"
import { composePr } from "../domain/pr-composer.js"

describe("composePr", () => {
  it("generates conventional commit title for feature", () => {
    const result = composePr({
      taskType: "feature",
      description: "Add rate limiting to payment API",
      filesChanged: ["src/api/payments.ts"],
    })

    expect(result.title).toMatch(/^feat/)
    expect(result.title).toContain("rate limiting")
  })

  it("generates conventional commit title for bug fix", () => {
    const result = composePr({
      taskType: "bug",
      description: "Fix null user in payment flow",
      filesChanged: ["src/payments.ts"],
    })

    expect(result.title).toMatch(/^fix/)
  })

  it("includes Jira ticket in title scope", () => {
    const result = composePr({
      taskType: "feature",
      description: "Add gamification scoring",
      filesChanged: ["src/scoring.ts"],
      jiraTicket: "CC-1234",
    })

    expect(result.title).toContain("(CC-1234)")
  })

  it("truncates title at 72 characters", () => {
    const result = composePr({
      taskType: "feature",
      description: "Add a very long feature description that exceeds the maximum allowed character limit for commit messages",
      filesChanged: ["src/file.ts"],
    })

    expect(result.title.length).toBeLessThanOrEqual(72)
    expect(result.title).toMatch(/\.\.\.$/)
  })

  it("body contains Summary section", () => {
    const result = composePr({
      taskType: "feature",
      description: "Add user authentication",
      filesChanged: ["src/auth.ts"],
    })

    expect(result.body).toContain("## Summary")
    expect(result.body).toContain("Add user authentication")
  })

  it("body contains Changes section with files", () => {
    const result = composePr({
      taskType: "feature",
      description: "Add auth",
      filesChanged: ["src/auth.ts", "src/middleware.ts"],
    })

    expect(result.body).toContain("## Changes")
    expect(result.body).toContain("`src/auth.ts`")
    expect(result.body).toContain("`src/middleware.ts`")
  })

  it("body contains Testing section", () => {
    const result = composePr({
      taskType: "feature",
      description: "Add auth",
      filesChanged: ["src/auth.ts"],
      testsSummary: "All 15 tests passing",
    })

    expect(result.body).toContain("## Testing")
    expect(result.body).toContain("All 15 tests passing")
  })

  it("body contains Jira link when ticket provided", () => {
    const result = composePr({
      taskType: "feature",
      description: "Add auth",
      filesChanged: ["src/auth.ts"],
      jiraTicket: "CC-5678",
    })

    expect(result.body).toContain("https://superlogica.atlassian.net/browse/CC-5678")
  })

  it("body shows N/A when no Jira ticket", () => {
    const result = composePr({
      taskType: "feature",
      description: "Add auth",
      filesChanged: ["src/auth.ts"],
    })

    expect(result.body).toContain("Jira: N/A")
  })

  it("assigns correct labels for task types", () => {
    expect(composePr({ taskType: "feature", description: "x", filesChanged: [] }).labels).toContain("enhancement")
    expect(composePr({ taskType: "bug", description: "x", filesChanged: [] }).labels).toContain("bug")
    expect(composePr({ taskType: "perf", description: "x", filesChanged: [] }).labels).toContain("performance")
    expect(composePr({ taskType: "docs", description: "x", filesChanged: [] }).labels).toContain("documentation")
  })
})
