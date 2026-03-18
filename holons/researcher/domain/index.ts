import { HOLON_NAME } from "@holon/shared"

export const RESEARCHER_NAME = HOLON_NAME.RESEARCHER

export interface FileContext {
  readonly path: string
  readonly relevance: number
  readonly summary: string
}

export interface ResearchResult {
  readonly files: readonly FileContext[]
  readonly patterns: readonly string[]
  readonly dependencies: readonly string[]
}

export function createEmptyResearchResult(): ResearchResult {
  return {
    files: [],
    patterns: [],
    dependencies: [],
  }
}

export function scoreFileRelevance(path: string, query: string): number {
  const lower = path.toLowerCase()
  const queryLower = query.toLowerCase()
  const terms = queryLower.split(/\s+/)
  let score = 0
  for (const term of terms) {
    if (lower.includes(term)) score += 1
  }
  return Math.min(1, score / Math.max(1, terms.length))
}
