import type { DfaState, RalphPhase } from "@holon/shared"
import { DFA_STATE, RALPH_PHASE } from "@holon/shared"

export const DFA_TO_RALPH: Partial<Record<DfaState, RalphPhase>> = {
  [DFA_STATE.BUILDING]: RALPH_PHASE.IMPLEMENT,
  [DFA_STATE.REVIEWING]: RALPH_PHASE.TEST,
  [DFA_STATE.COMPLETING]: RALPH_PHASE.PR,
} as const

export const RALPH_TO_DFA: Record<RalphPhase, DfaState> = {
  [RALPH_PHASE.IMPLEMENT]: DFA_STATE.BUILDING,
  [RALPH_PHASE.TEST]: DFA_STATE.REVIEWING,
  [RALPH_PHASE.PERF]: DFA_STATE.REVIEWING,
  [RALPH_PHASE.DOCS]: DFA_STATE.COMPLETING,
  [RALPH_PHASE.PR]: DFA_STATE.COMPLETING,
} as const

export function getRalphPhase(state: DfaState): RalphPhase | undefined {
  return DFA_TO_RALPH[state]
}

export function getDfaState(phase: RalphPhase): DfaState {
  return RALPH_TO_DFA[phase]
}
