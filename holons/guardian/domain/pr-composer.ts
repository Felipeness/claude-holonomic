import type { TaskType } from "@holon/shared"

export interface PrInput {
  readonly taskType: TaskType
  readonly description: string
  readonly filesChanged: readonly string[]
  readonly jiraTicket?: string
  readonly testsSummary?: string
}

export interface PrContent {
  readonly title: string
  readonly body: string
  readonly labels: readonly string[]
}

const TASK_TYPE_TO_COMMIT_PREFIX = {
  feature: "feat",
  bug: "fix",
  refactor: "refactor",
  review: "chore",
  docs: "docs",
  test: "test",
  perf: "perf",
  migration: "chore",
} as const

const TASK_TYPE_TO_LABELS: Record<string, readonly string[]> = {
  feature: ["enhancement"],
  bug: ["bug"],
  refactor: ["refactor"],
  review: ["review"],
  docs: ["documentation"],
  test: ["testing"],
  perf: ["performance"],
  migration: ["migration"],
}

function buildTitle(taskType: TaskType, description: string, jiraTicket?: string): string {
  const prefix = TASK_TYPE_TO_COMMIT_PREFIX[taskType]
  const scope = jiraTicket ? `(${jiraTicket})` : ""
  const cleanDescription = description
    .replace(/^(add|fix|update|refactor|implement)\s+/i, "")
    .toLowerCase()

  const title = `${prefix}${scope}: ${cleanDescription}`
  return title.length > 72 ? title.slice(0, 69) + "..." : title
}

function buildBody(input: PrInput): string {
  const sections: string[] = []

  sections.push("## Summary")
  sections.push(`- ${input.description}`)
  sections.push("")

  sections.push("## Changes")
  for (const file of input.filesChanged) {
    sections.push(`- \`${file}\``)
  }
  sections.push("")

  sections.push("## Testing")
  sections.push(input.testsSummary ?? "- [ ] Unit tests added")
  sections.push("")

  const jiraUrl = input.jiraTicket
    ? `https://superlogica.atlassian.net/browse/${input.jiraTicket}`
    : "N/A"
  sections.push(`Jira: ${jiraUrl}`)

  return sections.join("\n")
}

function resolveLabels(taskType: TaskType): readonly string[] {
  return TASK_TYPE_TO_LABELS[taskType] ?? []
}

export function composePr(input: PrInput): PrContent {
  return {
    title: buildTitle(input.taskType, input.description, input.jiraTicket),
    body: buildBody(input),
    labels: resolveLabels(input.taskType),
  }
}
