import { match } from "ts-pattern"

export const TDD_PHASE = {
  RED: "RED",
  GREEN: "GREEN",
  REFACTOR: "REFACTOR",
} as const

export type TddPhase = (typeof TDD_PHASE)[keyof typeof TDD_PHASE]

export const TDD_EVENT = {
  TEST_PASSES: "TEST_PASSES",
  CLEANUP_DONE: "CLEANUP_DONE",
  NEXT_CRITERION: "NEXT_CRITERION",
} as const

export type TddEvent = (typeof TDD_EVENT)[keyof typeof TDD_EVENT]

export interface TddState {
  readonly phase: TddPhase
  readonly criterionIndex: number
  readonly iterationCount: number
  readonly completedCriteria: readonly number[]
}

export function initialTddState(): TddState {
  return {
    phase: TDD_PHASE.RED,
    criterionIndex: 0,
    iterationCount: 0,
    completedCriteria: [],
  }
}

export function transitionTdd(state: TddState, event: TddEvent): TddState {
  return match<[TddPhase, TddEvent], TddState>([state.phase, event])
    .with([TDD_PHASE.RED, TDD_EVENT.TEST_PASSES], () => ({
      ...state,
      phase: TDD_PHASE.GREEN as TddPhase,
      iterationCount: state.iterationCount + 1,
    }))
    .with([TDD_PHASE.GREEN, TDD_EVENT.CLEANUP_DONE], () => ({
      ...state,
      phase: TDD_PHASE.REFACTOR as TddPhase,
      iterationCount: state.iterationCount + 1,
    }))
    .with([TDD_PHASE.REFACTOR, TDD_EVENT.NEXT_CRITERION], () => ({
      phase: TDD_PHASE.RED as TddPhase,
      criterionIndex: state.criterionIndex + 1,
      iterationCount: state.iterationCount + 1,
      completedCriteria: [...state.completedCriteria, state.criterionIndex],
    }))
    .otherwise(() => state)
}

export function isValidTransition(phase: TddPhase, event: TddEvent): boolean {
  return match<[TddPhase, TddEvent], boolean>([phase, event])
    .with([TDD_PHASE.RED, TDD_EVENT.TEST_PASSES], () => true)
    .with([TDD_PHASE.GREEN, TDD_EVENT.CLEANUP_DONE], () => true)
    .with([TDD_PHASE.REFACTOR, TDD_EVENT.NEXT_CRITERION], () => true)
    .otherwise(() => false)
}

export function isCriterionComplete(state: TddState, criterionIndex: number): boolean {
  return state.completedCriteria.includes(criterionIndex)
}
