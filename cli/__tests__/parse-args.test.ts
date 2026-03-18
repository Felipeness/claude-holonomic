import { describe, it, expect } from "vitest"
import { parseArgs } from "../src/index.js"

describe("parseArgs", () => {
  it("extracts command and task from argv", () => {
    const result = parseArgs(["node", "index.ts", "run", "add rate limiting"])
    expect(result.command).toBe("run")
    expect(result.task).toBe("add rate limiting")
    expect(result.cwd).toBeUndefined()
  })

  it("extracts --cwd flag when present", () => {
    const result = parseArgs(["node", "index.ts", "run", "add tests", "--cwd", "/tmp/repo"])
    expect(result.command).toBe("run")
    expect(result.task).toBe("add tests")
    expect(result.cwd).toBe("/tmp/repo")
  })

  it("handles --cwd before task text", () => {
    const result = parseArgs(["node", "index.ts", "run", "--cwd", "/tmp/repo", "add tests"])
    expect(result.command).toBe("run")
    expect(result.task).toBe("add tests")
    expect(result.cwd).toBe("/tmp/repo")
  })

  it("defaults to help when no args provided", () => {
    const result = parseArgs(["node", "index.ts"])
    expect(result.command).toBe("help")
    expect(result.task).toBe("")
    expect(result.cwd).toBeUndefined()
  })

  it("handles plan command without --cwd", () => {
    const result = parseArgs(["node", "index.ts", "plan", "refactor auth"])
    expect(result.command).toBe("plan")
    expect(result.task).toBe("refactor auth")
    expect(result.cwd).toBeUndefined()
  })

  it("ignores --cwd without value", () => {
    const result = parseArgs(["node", "index.ts", "run", "task", "--cwd"])
    expect(result.command).toBe("run")
    expect(result.task).toBe("task")
    expect(result.cwd).toBeUndefined()
  })
})
