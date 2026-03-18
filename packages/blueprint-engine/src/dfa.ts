import type { DfaState } from "@holon/shared"
import { DFA_STATE, InvalidPhaseTransition } from "@holon/shared"
import { TRANSITIONS } from "./transitions.js"
import { type TransitionContext, checkGuard, defaultContext } from "./guards.js"
import { getRalphPhase } from "./ralph-integration.js"
import type { RalphPhase } from "@holon/shared"

export interface DfaSnapshot {
  readonly state: DfaState
  readonly context: TransitionContext
  readonly history: readonly DfaTransitionRecord[]
  readonly startedAt: Date
}

export interface DfaTransitionRecord {
  readonly from: DfaState
  readonly to: DfaState
  readonly timestamp: Date
  readonly ralphPhase: RalphPhase | undefined
}

export class BlueprintDfa {
  private _state: DfaState
  private _context: TransitionContext
  private _history: DfaTransitionRecord[] = []
  private _startedAt: Date

  constructor(initialState: DfaState = DFA_STATE.IDLE, context?: Partial<TransitionContext>) {
    this._state = initialState
    this._context = { ...defaultContext, ...context }
    this._startedAt = new Date()
  }

  get state(): DfaState {
    return this._state
  }

  get context(): TransitionContext {
    return this._context
  }

  get history(): readonly DfaTransitionRecord[] {
    return [...this._history]
  }

  get snapshot(): DfaSnapshot {
    return {
      state: this._state,
      context: this._context,
      history: [...this._history],
      startedAt: this._startedAt,
    }
  }

  get ralphPhase(): RalphPhase | undefined {
    return getRalphPhase(this._state)
  }

  canTransition(to: DfaState): boolean {
    const validTargets = TRANSITIONS[this._state]
    if (!validTargets.includes(to)) return false
    return checkGuard(this._state, to, this._context)
  }

  validTransitions(): readonly DfaState[] {
    const targets = TRANSITIONS[this._state]
    return targets.filter((to) => checkGuard(this._state, to, this._context))
  }

  transition(to: DfaState): DfaTransitionRecord {
    const validTargets = TRANSITIONS[this._state]
    if (!validTargets.includes(to)) {
      throw new InvalidPhaseTransition({ from: this._state, to })
    }

    if (!checkGuard(this._state, to, this._context)) {
      throw new InvalidPhaseTransition({ from: this._state, to })
    }

    const record: DfaTransitionRecord = {
      from: this._state,
      to,
      timestamp: new Date(),
      ralphPhase: getRalphPhase(to),
    }

    this._history.push(record)
    this._state = to
    return record
  }

  updateContext(patch: Partial<TransitionContext>): void {
    this._context = { ...this._context, ...patch }
  }

  reset(): void {
    this._state = DFA_STATE.IDLE
    this._context = { ...defaultContext }
    this._history = []
    this._startedAt = new Date()
  }

  isTerminal(): boolean {
    return this._state === DFA_STATE.IDLE && this._history.length > 0
  }

  isFailed(): boolean {
    return this._state === DFA_STATE.FAILED
  }
}
