import { describe, it, expect } from "vitest"
import { TASK_TYPE } from "@holon/shared"
import { classifyTask, COMPLEXITY, RISK } from "../domain/task-classifier.js"

describe("classifyTask", () => {
  describe("type classification", () => {
    const typeTestCases = [
      { input: "fix the login bug", expected: TASK_TYPE.BUG },
      { input: "fix crash on null user", expected: TASK_TYPE.BUG },
      { input: "patch broken payment flow", expected: TASK_TYPE.BUG },
      { input: "hotfix error in checkout", expected: TASK_TYPE.BUG },
      { input: "refactor user service", expected: TASK_TYPE.REFACTOR },
      { input: "restructure auth module", expected: TASK_TYPE.REFACTOR },
      { input: "clean up database queries", expected: TASK_TYPE.REFACTOR },
      { input: "review PR #42", expected: TASK_TYPE.REVIEW },
      { input: "code review the auth changes", expected: TASK_TYPE.REVIEW },
      { input: "pull request for payments", expected: TASK_TYPE.REVIEW },
      { input: "update the README documentation", expected: TASK_TYPE.DOCS },
      { input: "add jsdoc to utils", expected: TASK_TYPE.DOCS },
      { input: "write unit tests for parser", expected: TASK_TYPE.TEST },
      { input: "add integration test for API", expected: TASK_TYPE.TEST },
      { input: "increase coverage for auth", expected: TASK_TYPE.TEST },
      { input: "optimize database queries", expected: TASK_TYPE.PERF },
      { input: "benchmark the search endpoint", expected: TASK_TYPE.PERF },
      { input: "fix slow response latency", expected: TASK_TYPE.PERF },
      { input: "add caching layer", expected: TASK_TYPE.PERF },
      { input: "migrate database schema", expected: TASK_TYPE.MIGRATION },
      { input: "upgrade to v2 API", expected: TASK_TYPE.MIGRATION },
      { input: "add rate limiting to payment API", expected: TASK_TYPE.FEATURE },
      { input: "create new dashboard", expected: TASK_TYPE.FEATURE },
      { input: "implement user notifications", expected: TASK_TYPE.FEATURE },
      { input: "build webhook support", expected: TASK_TYPE.FEATURE },
    ] as const

    it.each(typeTestCases)("classifies '$input' as $expected", ({ input, expected }) => {
      const result = classifyTask(input)
      expect(result.type).toBe(expected)
    })

    it("defaults to feature for ambiguous input", () => {
      const result = classifyTask("do something with the system")
      expect(result.type).toBe(TASK_TYPE.FEATURE)
      expect(result.confidence).toBeLessThan(0.5)
    })
  })

  describe("complexity classification", () => {
    it("classifies short simple tasks as low complexity", () => {
      const result = classifyTask("fix typo in readme")
      expect(result.complexity).toBe(COMPLEXITY.LOW)
    })

    it("classifies architecture tasks as high complexity", () => {
      const result = classifyTask("redesign the distributed database schema with concurrent access")
      expect(result.complexity).toBe(COMPLEXITY.HIGH)
    })

    it("classifies standard tasks as medium complexity", () => {
      const result = classifyTask("add user profile endpoint")
      expect(result.complexity).toBe(COMPLEXITY.MEDIUM)
    })

    it("classifies long descriptions as high complexity", () => {
      const words = Array.from({ length: 35 }, (_, i) => `word${i}`).join(" ")
      const result = classifyTask(`add feature ${words}`)
      expect(result.complexity).toBe(COMPLEXITY.HIGH)
    })
  })

  describe("risk assessment", () => {
    it("assigns high risk to migration tasks", () => {
      const result = classifyTask("migrate database schema to v3")
      expect(result.risk).toBe(RISK.HIGH)
    })

    it("assigns low risk to docs tasks", () => {
      const result = classifyTask("update the readme doc")
      expect(result.risk).toBe(RISK.LOW)
    })

    it("assigns low risk to review tasks", () => {
      const result = classifyTask("review PR changes")
      expect(result.risk).toBe(RISK.LOW)
    })

    it("escalates risk for high complexity", () => {
      const result = classifyTask("redesign the distributed system architecture for the feature")
      expect(result.risk).toBe(RISK.HIGH)
    })
  })

  describe("confidence", () => {
    it("returns high confidence for clear keyword matches", () => {
      const result = classifyTask("fix the bug")
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it("returns low confidence when no keywords match", () => {
      const result = classifyTask("do something")
      expect(result.confidence).toBeLessThanOrEqual(0.3)
    })
  })

  describe("return shape", () => {
    it("returns all required fields", () => {
      const result = classifyTask("add a new feature")
      expect(result).toHaveProperty("type")
      expect(result).toHaveProperty("complexity")
      expect(result).toHaveProperty("risk")
      expect(result).toHaveProperty("confidence")
    })
  })
})
