import type { TaskType } from "@holon/shared"

export interface FileMetadata {
  readonly path: string
  readonly size: number
  readonly extension: string
  readonly lastModified: Date
}

export interface Dependency {
  readonly source: string
  readonly target: string
}

export interface CodebaseMap {
  readonly files: readonly FileMetadata[]
  readonly dependencies: readonly Dependency[]
  readonly totalFiles: number
}

const IMPORT_PATTERNS = [
  /import\s+.*?\s+from\s+["'](.+?)["']/g,
  /import\s+["'](.+?)["']/g,
  /require\(["'](.+?)["']\)/g,
] as const

export function extractImports(content: string): readonly string[] {
  const imports = new Set<string>()
  for (const pattern of IMPORT_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match: RegExpExecArray | null
    while ((match = regex.exec(content)) !== null) {
      imports.add(match[1]!)
    }
  }
  return [...imports]
}

export function buildFileMetadata(
  path: string,
  size: number,
  lastModified: Date,
): FileMetadata {
  const extensionMatch = path.match(/\.([^.]+)$/)
  return {
    path,
    size,
    extension: extensionMatch?.[1] ?? "",
    lastModified,
  }
}

export function buildDependencyGraph(
  files: ReadonlyMap<string, string>,
): readonly Dependency[] {
  const dependencies: Dependency[] = []
  for (const [filePath, content] of files) {
    const imports = extractImports(content)
    for (const target of imports) {
      dependencies.push({ source: filePath, target })
    }
  }
  return dependencies
}

export function buildCodebaseMap(
  files: readonly FileMetadata[],
  dependencies: readonly Dependency[],
): CodebaseMap {
  return {
    files,
    dependencies,
    totalFiles: files.length,
  }
}

const EXTENSION_RELEVANCE: Record<string, number> = {
  ts: 1.0,
  tsx: 1.0,
  js: 0.8,
  jsx: 0.8,
  json: 0.4,
  md: 0.2,
}

export function scoreFileForTask(
  file: FileMetadata,
  taskType: TaskType,
  query: string,
): number {
  const extensionScore = EXTENSION_RELEVANCE[file.extension] ?? 0.1
  const pathLower = file.path.toLowerCase()
  const queryTerms = query.toLowerCase().split(/\s+/)
  const pathMatchScore = queryTerms.reduce(
    (acc, term) => acc + (pathLower.includes(term) ? 1 : 0),
    0,
  ) / Math.max(1, queryTerms.length)

  const testBonus = taskType === "test" && pathLower.includes("test") ? 0.3 : 0
  const smallFileBonus = file.size < 5000 ? 0.1 : 0

  return Math.min(1, extensionScore * 0.3 + pathMatchScore * 0.5 + testBonus + smallFileBonus)
}
