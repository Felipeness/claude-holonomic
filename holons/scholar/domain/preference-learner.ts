export interface ApproachChoice {
  readonly chosen: string
  readonly rejected: string
  readonly context: string
  readonly timestamp: Date
}

export interface PreferenceWeight {
  readonly approach: string
  readonly weight: number
  readonly chosenCount: number
  readonly rejectedCount: number
}

export interface PreferenceUpdate {
  readonly approach: string
  readonly previousWeight: number
  readonly newWeight: number
  readonly reason: string
}

export interface PreferenceState {
  readonly weights: ReadonlyMap<string, PreferenceWeight>
}

const INITIAL_WEIGHT = 0.5
const BOOST_FACTOR = 0.1
const DECAY_FACTOR = 0.05

function clampWeight(weight: number): number {
  return Math.min(1, Math.max(0, weight))
}

export function createEmptyPreferenceState(): PreferenceState {
  return { weights: new Map() }
}

export function recordChoice(
  state: PreferenceState,
  choice: ApproachChoice,
): { readonly state: PreferenceState; readonly updates: readonly PreferenceUpdate[] } {
  const mutableWeights = new Map(state.weights)
  const updates: PreferenceUpdate[] = []

  const chosenPrev = mutableWeights.get(choice.chosen) ?? {
    approach: choice.chosen,
    weight: INITIAL_WEIGHT,
    chosenCount: 0,
    rejectedCount: 0,
  }

  const newChosenWeight = clampWeight(chosenPrev.weight + BOOST_FACTOR)
  updates.push({
    approach: choice.chosen,
    previousWeight: chosenPrev.weight,
    newWeight: newChosenWeight,
    reason: `chosen over "${choice.rejected}" in context: ${choice.context}`,
  })

  mutableWeights.set(choice.chosen, {
    approach: choice.chosen,
    weight: newChosenWeight,
    chosenCount: chosenPrev.chosenCount + 1,
    rejectedCount: chosenPrev.rejectedCount,
  })

  const rejectedPrev = mutableWeights.get(choice.rejected) ?? {
    approach: choice.rejected,
    weight: INITIAL_WEIGHT,
    chosenCount: 0,
    rejectedCount: 0,
  }

  const newRejectedWeight = clampWeight(rejectedPrev.weight - DECAY_FACTOR)
  updates.push({
    approach: choice.rejected,
    previousWeight: rejectedPrev.weight,
    newWeight: newRejectedWeight,
    reason: `rejected in favor of "${choice.chosen}" in context: ${choice.context}`,
  })

  mutableWeights.set(choice.rejected, {
    approach: choice.rejected,
    weight: newRejectedWeight,
    chosenCount: rejectedPrev.chosenCount,
    rejectedCount: rejectedPrev.rejectedCount + 1,
  })

  return { state: { weights: mutableWeights }, updates }
}

export function getTopPreferences(
  state: PreferenceState,
  limit = 5,
): readonly PreferenceWeight[] {
  return [...state.weights.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
}
