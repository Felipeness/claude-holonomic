import { Effect } from "effect"
import { execSync } from "child_process"

export type AgentTask = {
  readonly description: string
  readonly workingDir: string
  readonly allowedTools: readonly string[]
  readonly maxTurns: number
  readonly systemPrompt?: string
}

export type AgentResult = {
  readonly output: string
  readonly exitCode: number
  readonly success: boolean
}

export class AgentError {
  readonly _tag = "AgentError" as const
  constructor(readonly reason: string, readonly output: string) {}
}

export const runClaudeAgent = (task: AgentTask): Effect.Effect<AgentResult, AgentError> =>
  Effect.try({
    try: () => {
      const args = ["-p", task.description]
      args.push("--allowedTools", task.allowedTools.join(","))
      args.push("--max-turns", String(task.maxTurns))
      args.push("--output-format", "text")

      if (task.systemPrompt) {
        args.push("--append-system-prompt", task.systemPrompt)
      }

      const cmd = `claude ${args.map(a => a.includes(" ") ? `"${a.replace(/"/g, '\\"')}"` : a).join(" ")}`
      const output = execSync(cmd, {
        encoding: "utf-8",
        timeout: 600_000,
        maxBuffer: 10 * 1024 * 1024,
        cwd: task.workingDir,
      })

      return { output: output.trim(), exitCode: 0, success: true } as AgentResult
    },
    catch: (error: any) => new AgentError(
      error?.message ?? "Agent execution failed",
      error?.stdout?.toString() ?? ""
    ),
  })
