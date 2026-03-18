import { match } from "ts-pattern"

export const COMMIT_TYPE = {
  FEAT: "feat",
  FIX: "fix",
  REFACTOR: "refactor",
  TEST: "test",
  CHORE: "chore",
  DOCS: "docs",
  PERF: "perf",
} as const

export type CommitType = (typeof COMMIT_TYPE)[keyof typeof COMMIT_TYPE]

export interface TaskContext {
  readonly description: string
  readonly ticketId?: string
  readonly criterionIndex: number
  readonly totalCriteria: number
  readonly filesChanged: readonly string[]
}

export interface CommitPlan {
  readonly message: string
  readonly filesToStage: readonly string[]
  readonly type: CommitType
}

export function inferCommitType(filesChanged: readonly string[]): CommitType {
  const hasTests = filesChanged.some(
    (f) => f.includes(".test.") || f.includes(".spec.") || f.includes("__tests__"),
  )
  const hasOnlyTests = hasTests && filesChanged.every(
    (f) => f.includes(".test.") || f.includes(".spec.") || f.includes("__tests__"),
  )
  const hasDocs = filesChanged.some(
    (f) => f.endsWith(".md") || f.includes("docs/"),
  )
  const hasOnlyDocs = hasDocs && filesChanged.every(
    (f) => f.endsWith(".md") || f.includes("docs/"),
  )

  if (hasOnlyTests) return COMMIT_TYPE.TEST
  if (hasOnlyDocs) return COMMIT_TYPE.DOCS
  return COMMIT_TYPE.FEAT
}

export function formatScope(ticketId?: string): string {
  if (!ticketId) return ""
  return `(${ticketId})`
}

export function generateCommitMessage(ctx: TaskContext): string {
  const type = inferCommitType(ctx.filesChanged)
  const scope = formatScope(ctx.ticketId)
  const progressSuffix = ctx.totalCriteria > 1
    ? ` [${ctx.criterionIndex + 1}/${ctx.totalCriteria}]`
    : ""

  const description = summarizeDescription(ctx.description)

  return `${type}${scope}: ${description}${progressSuffix}`
}

export function summarizeDescription(raw: string): string {
  const cleaned = raw.trim().toLowerCase()
  const firstSentence = cleaned.split(/[.!?\n]/)[0] ?? cleaned
  const truncated = firstSentence.length > 50
    ? firstSentence.slice(0, 47) + "..."
    : firstSentence
  return truncated
}

export function createCommitPlan(ctx: TaskContext): CommitPlan {
  return {
    message: generateCommitMessage(ctx),
    filesToStage: ctx.filesChanged,
    type: inferCommitType(ctx.filesChanged),
  }
}
