import { HOLON_NAME } from "@holon/shared"

export const SCHOLAR_NAME = HOLON_NAME.SCHOLAR

export interface LearningInsight {
  readonly pattern: string
  readonly confidence: number
  readonly evidence: readonly string[]
  readonly learnedAt: Date
}

export interface PreferenceRecord {
  readonly key: string
  readonly value: string
  readonly weight: number
  readonly source: string
}

export function createLearningInsight(
  pattern: string,
  evidence: readonly string[],
  confidence = 0.5,
): LearningInsight {
  return {
    pattern,
    confidence: Math.min(1, Math.max(0, confidence)),
    evidence,
    learnedAt: new Date(),
  }
}

export function mergeInsights(
  existing: LearningInsight,
  newEvidence: readonly string[],
): LearningInsight {
  const combined = [...existing.evidence, ...newEvidence]
  const boostFactor = Math.min(0.1, newEvidence.length * 0.02)
  return {
    ...existing,
    confidence: Math.min(1, existing.confidence + boostFactor),
    evidence: combined,
  }
}

export { digestSession, SESSION_EVENT_TYPE } from "./session-digester.js"
export type { SessionEvent, SessionDigest, SessionEventType } from "./session-digester.js"

export {
  recordChoice,
  createEmptyPreferenceState,
  getTopPreferences,
} from "./preference-learner.js"
export type {
  ApproachChoice,
  PreferenceWeight,
  PreferenceUpdate,
  PreferenceState,
} from "./preference-learner.js"

export { generateInsights, INSIGHT_TYPE } from "./insight-generator.js"
export type { Insight, InsightType, TaskOutcome } from "./insight-generator.js"
