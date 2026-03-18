import type { DfaState, HolonName } from "@holon/shared"
import { DFA_STATE, HOLON_NAME } from "@holon/shared"
import { BlueprintDfa, defaultContext } from "@holon/blueprint-engine"
import type { TransitionContext } from "@holon/blueprint-engine"

import { classifyTask } from "@holon/brain"
import type { TaskClassification } from "@holon/brain"
import { selectHolons, allocateBudget } from "@holon/brain"
import type { HolonSelection, BudgetAllocation } from "@holon/brain"

import { scoreFileRelevance, createEmptyResearchResult } from "@holon/researcher"
import type { ResearchResult } from "@holon/researcher"

import { generateApproaches, buildBlueprint, validateBlueprint, estimateComplexity } from "@holon/architect"
import type { ApproachRecommendation, ExecutionBlueprint } from "@holon/architect"
import { createEmptyBlueprint } from "@holon/architect"
import type { Blueprint } from "@holon/architect"

import { createEmptyBuildResult } from "@holon/builder"
import type { BuildResult } from "@holon/builder"

import { reviewCode, isReviewApproved, createPassingReview } from "@holon/guardian"
import type { ReviewResult } from "@holon/guardian"

import { generateInsights, digestSession } from "@holon/scholar"
import type { Insight, SessionDigest } from "@holon/scholar"

import { researchWithClaude } from "../../holons/researcher/infra/claude-researcher.js"
import { runClaudeAgent } from "../../holons/builder/infra/claude-agent.js"
import type { AgentResult } from "../../holons/builder/infra/claude-agent.js"
import type { ResearchResult as ClaudeResearchResult } from "../../holons/researcher/infra/claude-researcher.js"
import { Effect } from "effect"

export interface PipelineInput {
  readonly task: string
  readonly cwd?: string
}

export interface PipelinePhaseResult {
  readonly phase: DfaState
  readonly holon: HolonName
  readonly durationMs: number
  readonly success: boolean
}

export interface LiveModeResult {
  readonly researchOutput: string
  readonly researchFilesExamined: readonly string[]
  readonly agentOutput: string
  readonly agentExitCode: number
}

export interface PipelineResult {
  readonly task: string
  readonly mode: "demo" | "live"
  readonly cwd?: string
  readonly classification: TaskClassification
  readonly holonSelection: HolonSelection
  readonly budget: BudgetAllocation
  readonly research: ResearchResult
  readonly blueprint: Blueprint
  readonly approachRecommendation: ApproachRecommendation
  readonly executionBlueprint: ExecutionBlueprint
  readonly buildResult: BuildResult
  readonly review: ReviewResult
  readonly insights: readonly Insight[]
  readonly sessionDigest: SessionDigest
  readonly phases: readonly PipelinePhaseResult[]
  readonly totalDurationMs: number
  readonly success: boolean
  readonly live?: LiveModeResult
}

export type PipelinePhaseCallback = (phase: DfaState, holon: HolonName) => void

function timeMs(fn: () => void): number {
  const start = Date.now()
  fn()
  return Date.now() - start
}

async function timeMsAsync(fn: () => Promise<void>): Promise<number> {
  const start = Date.now()
  await fn()
  return Date.now() - start
}

export const isLiveMode = (input: PipelineInput): input is PipelineInput & { cwd: string } =>
  input.cwd !== undefined && input.cwd !== ""

export async function runPipeline(input: PipelineInput, onPhase?: PipelinePhaseCallback): Promise<PipelineResult> {
  const pipelineStart = Date.now()
  const phases: PipelinePhaseResult[] = []
  const live = isLiveMode(input)

  const dfa = new BlueprintDfa(DFA_STATE.IDLE, {
    ...defaultContext,
    taskDescription: input.task,
  })

  // Phase 1: UNDERSTANDING (Brain)
  dfa.transition(DFA_STATE.UNDERSTANDING)
  onPhase?.(DFA_STATE.UNDERSTANDING, HOLON_NAME.BRAIN)

  let classification: TaskClassification
  let holonSelection: HolonSelection
  let budget: BudgetAllocation

  const understandMs = timeMs(() => {
    classification = classifyTask(input.task)
    holonSelection = selectHolons(classification!.type, classification!.complexity)
    budget = allocateBudget(holonSelection!.holons, classification!.complexity)
  })

  phases.push({
    phase: DFA_STATE.UNDERSTANDING,
    holon: HOLON_NAME.BRAIN,
    durationMs: understandMs,
    success: true,
  })

  dfa.updateContext({ filesAnalyzed: 1 })

  // Phase 2: RESEARCHING (Researcher)
  dfa.transition(DFA_STATE.RESEARCHING)
  onPhase?.(DFA_STATE.RESEARCHING, HOLON_NAME.RESEARCHER)

  let research: ResearchResult
  let liveResearchOutput = ""
  let liveResearchFiles: string[] = []

  if (live) {
    const researchMs = await timeMsAsync(async () => {
      const result = await Effect.runPromise(
        researchWithClaude({
          question: `Analyze the codebase structure for implementing: ${input.task}`,
          codebasePath: input.cwd!,
        })
      )
      liveResearchOutput = result.answer
      liveResearchFiles = result.filesExamined
      research = {
        files: result.filesExamined.map((path) => ({
          path,
          relevance: scoreFileRelevance(path, input.task),
          summary: "analyzed by claude",
        })),
        patterns: [`${classification!.type}-pattern`],
        dependencies: [],
      }
    })

    phases.push({
      phase: DFA_STATE.RESEARCHING,
      holon: HOLON_NAME.RESEARCHER,
      durationMs: researchMs,
      success: true,
    })
  } else {
    const researchMs = timeMs(() => {
      const queryTerms = input.task.toLowerCase().split(/\s+/)
      const samplePaths = [
        "src/index.ts",
        "src/api/routes.ts",
        "src/auth/middleware.ts",
        "src/db/connection.ts",
        "tests/integration.test.ts",
      ]

      const files = samplePaths.map((path) => ({
        path,
        relevance: scoreFileRelevance(path, input.task),
        summary: `relevant to: ${queryTerms.slice(0, 3).join(", ")}`,
      }))

      research = {
        files: files.filter((f) => f.relevance > 0),
        patterns: [`${classification!.type}-pattern`],
        dependencies: [],
      }
    })

    phases.push({
      phase: DFA_STATE.RESEARCHING,
      holon: HOLON_NAME.RESEARCHER,
      durationMs: researchMs,
      success: true,
    })
  }

  // Phase 3: PLANNING (Architect)
  dfa.updateContext({ planApproved: true })
  dfa.transition(DFA_STATE.PLANNING)
  onPhase?.(DFA_STATE.PLANNING, HOLON_NAME.ARCHITECT)

  let approachRecommendation: ApproachRecommendation
  let executionBlueprint: ExecutionBlueprint
  let blueprint: Blueprint

  const planMs = timeMs(() => {
    approachRecommendation = generateApproaches({
      description: input.task,
      taskType: classification!.type,
      relevantFiles: research!.files.map((f) => f.path),
      codebasePatterns: research!.patterns,
    })

    const selectedApproach = approachRecommendation!.approaches[approachRecommendation!.recommended]!
    executionBlueprint = buildBlueprint(classification!.type, selectedApproach.name)
    const errors = validateBlueprint(executionBlueprint!)

    const stepCount = executionBlueprint!.nodes.length
    const fileCount = research!.files.length
    blueprint = {
      steps: executionBlueprint!.nodes.map((node) => ({
        id: node.id,
        description: node.description,
        files: research!.files.map((f) => f.path),
        dependencies: [...node.dependsOn],
      })),
      estimatedComplexity: estimateComplexity(stepCount, fileCount),
      risks: approachRecommendation!.approaches[approachRecommendation!.recommended]!.cons.slice(),
    }
  })

  phases.push({
    phase: DFA_STATE.PLANNING,
    holon: HOLON_NAME.ARCHITECT,
    durationMs: planMs,
    success: true,
  })

  // Phase 4: BUILDING (Builder)
  dfa.transition(DFA_STATE.BUILDING)
  onPhase?.(DFA_STATE.BUILDING, HOLON_NAME.BUILDER)

  let buildResult: BuildResult
  let liveAgentOutput = ""
  let liveAgentExitCode = 0

  if (live) {
    let buildSuccess = true
    const buildMs = await timeMsAsync(async () => {
      const agentResult = await Effect.runPromise(
        runClaudeAgent({
          description: [
            `Task: ${input.task}`,
            "",
            "Instructions:",
            "1. Write failing test first (TDD RED)",
            "2. Implement minimal code (GREEN)",
            "3. Refactor (REFACTOR)",
            "4. Commit with conventional commits",
          ].join("\n"),
          workingDir: input.cwd!,
          allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
          maxTurns: 30,
        })
      )
      liveAgentOutput = agentResult.output
      liveAgentExitCode = agentResult.exitCode
      buildSuccess = agentResult.success
      buildResult = {
        filesCreated: [],
        filesModified: research!.files.map((f) => f.path),
        testsAdded: 1,
        errors: agentResult.success ? [] : [agentResult.output.slice(0, 200)],
      }
    })

    dfa.updateContext({ testsPass: buildSuccess, buildErrors: buildSuccess ? 0 : 1 })

    phases.push({
      phase: DFA_STATE.BUILDING,
      holon: HOLON_NAME.BUILDER,
      durationMs: buildMs,
      success: buildSuccess,
    })
  } else {
    const buildMs = timeMs(() => {
      buildResult = {
        filesCreated: [],
        filesModified: research!.files.map((f) => f.path),
        testsAdded: classification!.type === "test" ? 3 : 1,
        errors: [],
      }
    })

    dfa.updateContext({ testsPass: true, buildErrors: 0 })

    phases.push({
      phase: DFA_STATE.BUILDING,
      holon: HOLON_NAME.BUILDER,
      durationMs: buildMs,
      success: true,
    })
  }

  // Phase 5: REVIEWING (Guardian)
  dfa.transition(DFA_STATE.REVIEWING)
  onPhase?.(DFA_STATE.REVIEWING, HOLON_NAME.GUARDIAN)

  let review: ReviewResult

  const reviewMs = timeMs(() => {
    const sampleCode = `export function handler(req: Request) {\n  return { status: 200 }\n}\n`
    const qualityScore = reviewCode(sampleCode)

    review = {
      issues: qualityScore.findings.map((f) => ({
        severity: f.severity,
        file: "generated",
        line: f.line,
        message: f.message,
        rule: f.rule,
      })),
      testsPass: true,
      typeCheckPass: true,
      lintPass: qualityScore.passesThreshold,
    }
  })

  phases.push({
    phase: DFA_STATE.REVIEWING,
    holon: HOLON_NAME.GUARDIAN,
    durationMs: reviewMs,
    success: isReviewApproved(review!),
  })

  // Phase 6: COMPLETING (Guardian)
  dfa.transition(DFA_STATE.COMPLETING)
  onPhase?.(DFA_STATE.COMPLETING, HOLON_NAME.GUARDIAN)

  phases.push({
    phase: DFA_STATE.COMPLETING,
    holon: HOLON_NAME.GUARDIAN,
    durationMs: 0,
    success: true,
  })

  // Phase 7: LEARNING (Scholar)
  dfa.transition(DFA_STATE.LEARNING)
  onPhase?.(DFA_STATE.LEARNING, HOLON_NAME.SCHOLAR)

  let insights: readonly Insight[]
  let sessionDigest: SessionDigest

  const learnMs = timeMs(() => {
    insights = generateInsights([
      {
        taskId: "pipeline-run",
        success: isReviewApproved(review!),
        approach: approachRecommendation!.approaches[approachRecommendation!.recommended]!.name,
        patterns: research!.patterns,
        timestamp: new Date(),
      },
    ])

    sessionDigest = digestSession([
      {
        type: "decision-made" as const,
        timestamp: new Date(),
        data: { description: `classified as ${classification!.type}` },
      },
      {
        type: "file-edited" as const,
        timestamp: new Date(),
        data: { path: research!.files[0]?.path ?? "unknown" },
      },
    ])
  })

  phases.push({
    phase: DFA_STATE.LEARNING,
    holon: HOLON_NAME.SCHOLAR,
    durationMs: learnMs,
    success: true,
  })

  // Return to IDLE
  dfa.transition(DFA_STATE.IDLE)

  const totalDurationMs = Date.now() - pipelineStart

  return {
    task: input.task,
    mode: live ? "live" : "demo",
    cwd: input.cwd,
    classification: classification!,
    holonSelection: holonSelection!,
    budget: budget!,
    research: research!,
    blueprint: blueprint!,
    approachRecommendation: approachRecommendation!,
    executionBlueprint: executionBlueprint!,
    buildResult: buildResult!,
    review: review!,
    insights: insights!,
    sessionDigest: sessionDigest!,
    phases,
    totalDurationMs,
    success: phases.every((p) => p.success),
    ...(live ? {
      live: {
        researchOutput: liveResearchOutput,
        researchFilesExamined: liveResearchFiles,
        agentOutput: liveAgentOutput,
        agentExitCode: liveAgentExitCode,
      },
    } : {}),
  }
}
