import type { DfaState, HolonName } from "@holon/shared"
import { DFA_STATE, HOLON_NAME } from "@holon/shared"
import { BlueprintDfa } from "@holon/blueprint-engine"
import type { TransitionContext } from "@holon/blueprint-engine"

export interface RouterDecision {
  readonly nextState: DfaState
  readonly nextHolon: HolonName
  readonly canProceed: boolean
}

const STATE_TO_HOLON: Record<DfaState, HolonName> = {
  [DFA_STATE.IDLE]: HOLON_NAME.BRAIN,
  [DFA_STATE.UNDERSTANDING]: HOLON_NAME.BRAIN,
  [DFA_STATE.RESEARCHING]: HOLON_NAME.RESEARCHER,
  [DFA_STATE.PLANNING]: HOLON_NAME.ARCHITECT,
  [DFA_STATE.BUILDING]: HOLON_NAME.BUILDER,
  [DFA_STATE.REVIEWING]: HOLON_NAME.GUARDIAN,
  [DFA_STATE.COMPLETING]: HOLON_NAME.GUARDIAN,
  [DFA_STATE.LEARNING]: HOLON_NAME.SCHOLAR,
  [DFA_STATE.RECOVERING]: HOLON_NAME.BUILDER,
  [DFA_STATE.FAILED]: HOLON_NAME.BRAIN,
} as const

export function holonForState(state: DfaState): HolonName {
  return STATE_TO_HOLON[state]
}

export function decideNextStep(dfa: BlueprintDfa): RouterDecision {
  const validStates = dfa.validTransitions()

  if (validStates.length === 0) {
    return {
      nextState: dfa.state,
      nextHolon: holonForState(dfa.state),
      canProceed: false,
    }
  }

  const preferred = selectPreferredTransition(dfa.state, validStates)
  return {
    nextState: preferred,
    nextHolon: holonForState(preferred),
    canProceed: true,
  }
}

function selectPreferredTransition(current: DfaState, valid: readonly DfaState[]): DfaState {
  const preference = TRANSITION_PREFERENCE[current]
  if (preference) {
    for (const preferred of preference) {
      if (valid.includes(preferred)) return preferred
    }
  }
  return valid[0]!
}

const TRANSITION_PREFERENCE: Partial<Record<DfaState, readonly DfaState[]>> = {
  [DFA_STATE.BUILDING]: [DFA_STATE.REVIEWING, DFA_STATE.RECOVERING],
  [DFA_STATE.REVIEWING]: [DFA_STATE.COMPLETING, DFA_STATE.BUILDING],
  [DFA_STATE.RECOVERING]: [DFA_STATE.BUILDING, DFA_STATE.FAILED],
} as const

export function advanceRouter(dfa: BlueprintDfa): RouterDecision {
  const decision = decideNextStep(dfa)

  if (decision.canProceed) {
    dfa.transition(decision.nextState)
  }

  return decision
}

export function createRouter(context?: Partial<TransitionContext>): BlueprintDfa {
  return new BlueprintDfa(DFA_STATE.IDLE, context)
}
