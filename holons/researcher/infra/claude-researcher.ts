import { Effect } from "effect"
import { execSync } from "child_process"

export type ResearchQuery = {
  readonly question: string
  readonly codebasePath: string
}

export type ResearchResult = {
  readonly answer: string
  readonly filesExamined: string[]
  readonly confidence: number
}

export class ResearchError {
  readonly _tag = "ResearchError" as const
  constructor(readonly reason: string) {}
}

export const researchWithClaude = (query: ResearchQuery): Effect.Effect<ResearchResult, ResearchError> =>
  Effect.try({
    try: () => {
      const prompt = `Research this question about the codebase. Only use Read, Glob, Grep tools. Output JSON with: answer (string), filesExamined (string array), confidence (0-1).

Question: ${query.question}`

      const output = execSync(
        `claude -p "${prompt.replace(/"/g, '\\"')}" --allowedTools "Read,Glob,Grep" --output-format json --max-turns 10`,
        { encoding: "utf-8", timeout: 120_000, maxBuffer: 5 * 1024 * 1024, cwd: query.codebasePath }
      )

      return JSON.parse(output) as ResearchResult
    },
    catch: (error: any) => new ResearchError(error?.message ?? "Research failed"),
  })
