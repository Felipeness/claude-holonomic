export interface CommitInfo {
  readonly hash: string
  readonly message: string
  readonly author: string
  readonly date: Date
  readonly filesChanged: readonly string[]
}

export interface HotspotFile {
  readonly path: string
  readonly changeCount: number
}

export interface HistoryAnalysis {
  readonly recentCommits: readonly CommitInfo[]
  readonly hotspots: readonly HotspotFile[]
  readonly totalCommitsAnalyzed: number
}

export function identifyHotspots(
  commits: readonly CommitInfo[],
  topN: number = 10,
): readonly HotspotFile[] {
  const changeCounts = new Map<string, number>()
  for (const commit of commits) {
    for (const file of commit.filesChanged) {
      changeCounts.set(file, (changeCounts.get(file) ?? 0) + 1)
    }
  }

  return [...changeCounts.entries()]
    .map(([path, changeCount]) => ({ path, changeCount }))
    .sort((a, b) => b.changeCount - a.changeCount)
    .slice(0, topN)
}

export function buildHistoryAnalysis(
  commits: readonly CommitInfo[],
  topN: number = 10,
): HistoryAnalysis {
  return {
    recentCommits: commits,
    hotspots: identifyHotspots(commits, topN),
    totalCommitsAnalyzed: commits.length,
  }
}

export function filterCommitsByPath(
  commits: readonly CommitInfo[],
  pathPrefix: string,
): readonly CommitInfo[] {
  return commits.filter((commit) =>
    commit.filesChanged.some((file) => file.startsWith(pathPrefix)),
  )
}

export function recentCommitsWithinDays(
  commits: readonly CommitInfo[],
  days: number,
): readonly CommitInfo[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return commits.filter((commit) => commit.date >= cutoff)
}
