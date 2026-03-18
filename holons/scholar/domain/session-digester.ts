export const SESSION_EVENT_TYPE = {
  FILE_READ: "file-read",
  FILE_EDITED: "file-edited",
  TEST_RUN: "test-run",
  DECISION_MADE: "decision-made",
  ERROR_ENCOUNTERED: "error-encountered",
  COMMAND_EXECUTED: "command-executed",
} as const

export type SessionEventType = (typeof SESSION_EVENT_TYPE)[keyof typeof SESSION_EVENT_TYPE]

export interface SessionEvent {
  readonly type: SessionEventType
  readonly timestamp: Date
  readonly data: Record<string, unknown>
}

export interface SessionDigest {
  readonly learned: readonly string[]
  readonly succeeded: readonly string[]
  readonly failed: readonly string[]
  readonly filesModified: readonly string[]
  readonly decisionsCount: number
  readonly duration: DigestDuration
}

interface DigestDuration {
  readonly startedAt: Date
  readonly endedAt: Date
  readonly totalMs: number
}

function extractLearned(events: readonly SessionEvent[]): readonly string[] {
  const decisions = events.filter((e) => e.type === SESSION_EVENT_TYPE.DECISION_MADE)
  return decisions.map((d) => String(d.data["description"] ?? d.data["reason"] ?? "unknown decision"))
}

function extractSucceeded(events: readonly SessionEvent[]): readonly string[] {
  return events
    .filter((e) => e.type === SESSION_EVENT_TYPE.TEST_RUN && e.data["passed"] === true)
    .map((e) => String(e.data["testName"] ?? "unnamed test"))
}

function extractFailed(events: readonly SessionEvent[]): readonly string[] {
  const failedTests = events
    .filter((e) => e.type === SESSION_EVENT_TYPE.TEST_RUN && e.data["passed"] === false)
    .map((e) => String(e.data["testName"] ?? "unnamed test"))

  const errors = events
    .filter((e) => e.type === SESSION_EVENT_TYPE.ERROR_ENCOUNTERED)
    .map((e) => String(e.data["message"] ?? "unknown error"))

  return [...failedTests, ...errors]
}

function extractFilesModified(events: readonly SessionEvent[]): readonly string[] {
  const files = new Set<string>()
  for (const event of events) {
    if (event.type === SESSION_EVENT_TYPE.FILE_EDITED) {
      const path = event.data["path"]
      if (typeof path === "string") files.add(path)
    }
  }
  return [...files]
}

function computeDuration(events: readonly SessionEvent[]): DigestDuration {
  if (events.length === 0) {
    const now = new Date()
    return { startedAt: now, endedAt: now, totalMs: 0 }
  }

  const timestamps = events.map((e) => e.timestamp.getTime())
  const startedAt = new Date(Math.min(...timestamps))
  const endedAt = new Date(Math.max(...timestamps))

  return {
    startedAt,
    endedAt,
    totalMs: endedAt.getTime() - startedAt.getTime(),
  }
}

export function digestSession(events: readonly SessionEvent[]): SessionDigest {
  const decisionsCount = events.filter((e) => e.type === SESSION_EVENT_TYPE.DECISION_MADE).length

  return {
    learned: extractLearned(events),
    succeeded: extractSucceeded(events),
    failed: extractFailed(events),
    filesModified: extractFilesModified(events),
    decisionsCount,
    duration: computeDuration(events),
  }
}
