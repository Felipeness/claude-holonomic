import { describe, it, expect } from "vitest"
import { Effect } from "effect"
import { runClaudeAgent, AgentError } from "../infra/claude-agent.js"
import type { AgentTask } from "../infra/claude-agent.js"

describe("claude-agent", () => {
  it("constructs valid agent task with all fields", () => {
    const task: AgentTask = {
      description: "Implement user authentication module",
      workingDir: "/app/src",
      allowedTools: ["Read", "Edit", "Bash", "Glob", "Grep"],
      maxTurns: 20,
      systemPrompt: "Follow TDD approach",
    }

    expect(task.description).toBe("Implement user authentication module")
    expect(task.allowedTools).toHaveLength(5)
    expect(task.maxTurns).toBe(20)
    expect(task.systemPrompt).toBe("Follow TDD approach")
  })

  it("accepts task without optional systemPrompt", () => {
    const task: AgentTask = {
      description: "Fix failing tests",
      workingDir: "/app",
      allowedTools: ["Read", "Edit"],
      maxTurns: 10,
    }

    expect(task.systemPrompt).toBeUndefined()
  })

  it("AgentError has correct tag and preserves output", () => {
    const error = new AgentError("Timeout exceeded", "partial output here")

    expect(error._tag).toBe("AgentError")
    expect(error.reason).toBe("Timeout exceeded")
    expect(error.output).toBe("partial output here")
  })

  it("returns an Effect type", () => {
    const task: AgentTask = {
      description: "test",
      workingDir: "/tmp",
      allowedTools: ["Read"],
      maxTurns: 1,
    }
    const result = runClaudeAgent(task)

    expect(Effect.isEffect(result)).toBe(true)
  })
})
