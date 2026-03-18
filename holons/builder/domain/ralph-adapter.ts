import { match } from "ts-pattern"
import type { RalphPhase } from "@holon/shared"
import { RALPH_PHASE } from "@holon/shared"

export const RALPH_MAX_ITERATIONS: Record<RalphPhase, number> = {
  [RALPH_PHASE.IMPLEMENT]: 10,
  [RALPH_PHASE.TEST]: 5,
  [RALPH_PHASE.PERF]: 5,
  [RALPH_PHASE.DOCS]: 3,
  [RALPH_PHASE.PR]: 1,
} as const

export interface PhaseConfig {
  readonly phase: RalphPhase
  readonly maxIterations: number
  readonly prompt: string
  readonly skipped: boolean
  readonly skipReason?: string
}

export interface RalphContext {
  readonly taskDescription: string
  readonly ticketId?: string
  readonly hasTestGaps: boolean
  readonly hasPerfTarget: boolean
  readonly hasDocGaps: boolean
  readonly completedPhases: readonly RalphPhase[]
}

export function shouldSkipPhase(phase: RalphPhase, ctx: RalphContext): { skip: boolean; reason?: string } {
  return match(phase)
    .with(RALPH_PHASE.IMPLEMENT, () => ({ skip: false }))
    .with(RALPH_PHASE.TEST, () =>
      ctx.hasTestGaps
        ? { skip: false }
        : { skip: true, reason: "no test gaps identified" },
    )
    .with(RALPH_PHASE.PERF, () =>
      ctx.hasPerfTarget
        ? { skip: false }
        : { skip: true, reason: "no performance target defined" },
    )
    .with(RALPH_PHASE.DOCS, () =>
      ctx.hasDocGaps
        ? { skip: false }
        : { skip: true, reason: "no documentation gaps found" },
    )
    .with(RALPH_PHASE.PR, () => ({ skip: false }))
    .exhaustive()
}

export function generatePhasePrompt(phase: RalphPhase, ctx: RalphContext): string {
  const ticket = ctx.ticketId ? ` for ${ctx.ticketId}` : ""

  return match(phase)
    .with(RALPH_PHASE.IMPLEMENT, () =>
      `implement the acceptance criteria${ticket} using TDD (red-green-refactor): ${ctx.taskDescription}`,
    )
    .with(RALPH_PHASE.TEST, () =>
      `add edge case tests and improve coverage${ticket}: ${ctx.taskDescription}`,
    )
    .with(RALPH_PHASE.PERF, () =>
      `benchmark and optimize performance${ticket}: ${ctx.taskDescription}`,
    )
    .with(RALPH_PHASE.DOCS, () =>
      `add JSDoc annotations and update documentation${ticket}: ${ctx.taskDescription}`,
    )
    .with(RALPH_PHASE.PR, () =>
      `create pull request with conventional commit title and structured body${ticket}: ${ctx.taskDescription}`,
    )
    .exhaustive()
}

export function getPhaseConfig(phase: RalphPhase, ctx: RalphContext): PhaseConfig {
  const skipResult = shouldSkipPhase(phase, ctx)

  return {
    phase,
    maxIterations: RALPH_MAX_ITERATIONS[phase],
    prompt: generatePhasePrompt(phase, ctx),
    skipped: skipResult.skip,
    skipReason: skipResult.reason,
  }
}

export function nextPhase(current: RalphPhase, ctx: RalphContext): PhaseConfig | undefined {
  const phases: readonly RalphPhase[] = [
    RALPH_PHASE.IMPLEMENT,
    RALPH_PHASE.TEST,
    RALPH_PHASE.PERF,
    RALPH_PHASE.DOCS,
    RALPH_PHASE.PR,
  ]

  const currentIndex = phases.indexOf(current)
  if (currentIndex === -1 || currentIndex >= phases.length - 1) return undefined

  for (let i = currentIndex + 1; i < phases.length; i++) {
    const phase = phases[i]!
    const config = getPhaseConfig(phase, ctx)
    if (!config.skipped) return config
  }

  return undefined
}

export function isPhaseComplete(phase: RalphPhase, ctx: RalphContext): boolean {
  return ctx.completedPhases.includes(phase)
}
