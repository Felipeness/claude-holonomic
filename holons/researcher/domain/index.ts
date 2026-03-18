import { HOLON_NAME } from "@holon/shared"

export const RESEARCHER_NAME = HOLON_NAME.RESEARCHER

export type {
  FileMetadata,
  Dependency,
  CodebaseMap,
} from "./codebase-explorer.js"

export {
  extractImports,
  buildFileMetadata,
  buildDependencyGraph,
  buildCodebaseMap,
  scoreFileForTask,
} from "./codebase-explorer.js"

export type {
  CommitInfo,
  HotspotFile,
  HistoryAnalysis,
} from "./history-analyzer.js"

export {
  identifyHotspots,
  buildHistoryAnalysis,
  filterCommitsByPath,
  recentCommitsWithinDays,
} from "./history-analyzer.js"

export type {
  ScoredFile,
  CuratedContext,
  CuratedFile,
} from "./context-curator.js"

export {
  estimateTokens,
  truncateToTokenBudget,
  curateContext,
} from "./context-curator.js"

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
