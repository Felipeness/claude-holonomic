import type { DfaState, RalphPhase } from "@holon/shared"
import { DFA_STATE, RALPH_PHASE } from "@holon/shared"

export interface TransitionContext {
  readonly taskDescription: string
  readonly filesAnalyzed: number
  readonly planApproved: boolean
  readonly testsPass: boolean
  readonly buildErrors: number
  readonly retryCount: number
  readonly maxRetries: number
  readonly ralphPhase: RalphPhase
}

export const defaultContext: TransitionContext = {
  taskDescription: "",
  filesAnalyzed: 0,
  planApproved: false,
  testsPass: false,
  buildErrors: 0,
  retryCount: 0,
  maxRetries: 3,
  ralphPhase: RALPH_PHASE.IMPLEMENT,
}

export type GuardFn = (ctx: TransitionContext) => boolean

const always: GuardFn = () => true

const hasDescription: GuardFn = (ctx) => ctx.taskDescription.length > 0

const hasFilesAnalyzed: GuardFn = (ctx) => ctx.filesAnalyzed > 0

const planApproved: GuardFn = (ctx) => ctx.planApproved

const reviewPassed: GuardFn = (ctx) => ctx.testsPass && ctx.buildErrors === 0

const reviewFailed: GuardFn = (ctx) => !ctx.testsPass || ctx.buildErrors > 0

const hasBuildErrors: GuardFn = (ctx) => ctx.buildErrors > 0

const canRetry: GuardFn = (ctx) => ctx.retryCount < ctx.maxRetries

const retriesExhausted: GuardFn = (ctx) => ctx.retryCount >= ctx.maxRetries

type TransitionKey = `${DfaState}->${DfaState}`

export const GUARDS: Record<TransitionKey, GuardFn> = {
  "IDLE->UNDERSTANDING": hasDescription,
  "UNDERSTANDING->RESEARCHING": always,
  "RESEARCHING->PLANNING": hasFilesAnalyzed,
  "PLANNING->BUILDING": planApproved,
  "BUILDING->REVIEWING": always,
  "BUILDING->RECOVERING": hasBuildErrors,
  "REVIEWING->COMPLETING": reviewPassed,
  "REVIEWING->BUILDING": reviewFailed,
  "COMPLETING->LEARNING": always,
  "LEARNING->IDLE": always,
  "RECOVERING->BUILDING": canRetry,
  "RECOVERING->FAILED": retriesExhausted,
  "FAILED->IDLE": always,
} as const

export function checkGuard(from: DfaState, to: DfaState, ctx: TransitionContext): boolean {
  const key = `${from}->${to}` as TransitionKey
  const guard = GUARDS[key]
  if (!guard) return false
  return guard(ctx)
}
