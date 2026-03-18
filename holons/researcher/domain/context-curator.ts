export interface ScoredFile {
  readonly path: string
  readonly content: string
  readonly score: number
  readonly tokenEstimate: number
}

export interface CuratedContext {
  readonly files: readonly CuratedFile[]
  readonly totalTokens: number
  readonly totalFiles: number
  readonly budgetUsed: number
}

export interface CuratedFile {
  readonly path: string
  readonly content: string
  readonly score: number
  readonly tokens: number
  readonly truncated: boolean
}

const CHARS_PER_TOKEN = 4

export function estimateTokens(content: string): number {
  return Math.ceil(content.length / CHARS_PER_TOKEN)
}

export function truncateToTokenBudget(
  content: string,
  maxTokens: number,
): { content: string; truncated: boolean } {
  const estimated = estimateTokens(content)
  if (estimated <= maxTokens) {
    return { content, truncated: false }
  }
  const maxChars = maxTokens * CHARS_PER_TOKEN
  return {
    content: content.slice(0, maxChars),
    truncated: true,
  }
}

export function curateContext(
  files: readonly ScoredFile[],
  tokenBudget: number,
): CuratedContext {
  const sorted = [...files].sort((a, b) => b.score - a.score)
  const curated: CuratedFile[] = []
  let tokensRemaining = tokenBudget

  for (const file of sorted) {
    if (tokensRemaining <= 0) break

    const { content, truncated } = truncateToTokenBudget(
      file.content,
      tokensRemaining,
    )
    const tokens = estimateTokens(content)

    if (tokens === 0) continue

    curated.push({
      path: file.path,
      content,
      score: file.score,
      tokens,
      truncated,
    })

    tokensRemaining -= tokens
  }

  const totalTokens = curated.reduce((sum, f) => sum + f.tokens, 0)

  return {
    files: curated,
    totalTokens,
    totalFiles: curated.length,
    budgetUsed: totalTokens / tokenBudget,
  }
}
