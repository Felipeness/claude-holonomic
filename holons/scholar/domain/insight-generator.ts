export const INSIGHT_TYPE = {
  SUCCESS_RATE: "success-rate",
  PATTERN_FREQUENCY: "pattern-frequency",
  PREFERENCE_COMPARISON: "preference-comparison",
  FAILURE_TREND: "failure-trend",
} as const

export type InsightType = (typeof INSIGHT_TYPE)[keyof typeof INSIGHT_TYPE]

export interface Insight {
  readonly type: InsightType
  readonly message: string
  readonly confidence: number
  readonly data: Record<string, unknown>
}

export interface TaskOutcome {
  readonly taskId: string
  readonly success: boolean
  readonly approach: string
  readonly patterns: readonly string[]
  readonly timestamp: Date
}

function generateSuccessRate(outcomes: readonly TaskOutcome[]): Insight | null {
  if (outcomes.length === 0) return null

  const successCount = outcomes.filter((o) => o.success).length
  const rate = Math.round((successCount / outcomes.length) * 100)

  return {
    type: INSIGHT_TYPE.SUCCESS_RATE,
    message: `last ${outcomes.length} tasks: ${rate}% success rate`,
    confidence: Math.min(1, outcomes.length / 20),
    data: { total: outcomes.length, successes: successCount, rate },
  }
}

function generatePatternFrequency(outcomes: readonly TaskOutcome[]): readonly Insight[] {
  const patternCounts = new Map<string, { total: number; successes: number }>()

  for (const outcome of outcomes) {
    for (const pattern of outcome.patterns) {
      const existing = patternCounts.get(pattern) ?? { total: 0, successes: 0 }
      patternCounts.set(pattern, {
        total: existing.total + 1,
        successes: existing.successes + (outcome.success ? 1 : 0),
      })
    }
  }

  return [...patternCounts.entries()]
    .filter(([, counts]) => counts.total >= 2)
    .map(([pattern, counts]) => {
      const successRate = counts.successes === counts.total ? "always successful" : `${Math.round((counts.successes / counts.total) * 100)}% success rate`

      return {
        type: INSIGHT_TYPE.PATTERN_FREQUENCY,
        message: `pattern "${pattern}" used ${counts.total} times, ${successRate}`,
        confidence: Math.min(1, counts.total / 10),
        data: { pattern, total: counts.total, successes: counts.successes },
      }
    })
}

function generatePreferenceComparison(outcomes: readonly TaskOutcome[]): readonly Insight[] {
  const approachCounts = new Map<string, number>()

  for (const outcome of outcomes) {
    const current = approachCounts.get(outcome.approach) ?? 0
    approachCounts.set(outcome.approach, current + 1)
  }

  const sorted = [...approachCounts.entries()].sort((a, b) => b[1] - a[1])

  if (sorted.length < 2) return []

  const insights: Insight[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const [approachA, countA] = sorted[i]
      const [approachB, countB] = sorted[j]

      insights.push({
        type: INSIGHT_TYPE.PREFERENCE_COMPARISON,
        message: `approach "${approachA}" preferred over "${approachB}" (${countA} vs ${countB} times)`,
        confidence: Math.min(1, (countA + countB) / 15),
        data: { approachA, countA, approachB, countB },
      })
    }
  }

  return insights
}

export function generateInsights(outcomes: readonly TaskOutcome[]): readonly Insight[] {
  const insights: Insight[] = []

  const successRate = generateSuccessRate(outcomes)
  if (successRate) insights.push(successRate)

  insights.push(...generatePatternFrequency(outcomes))
  insights.push(...generatePreferenceComparison(outcomes))

  return insights
}
