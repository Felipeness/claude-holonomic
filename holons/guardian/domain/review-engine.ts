export const QUALITY_THRESHOLD_DEFAULT = 80

export const REVIEW_RULE = {
  FUNCTION_LENGTH: "function-length",
  NESTING_DEPTH: "nesting-depth",
  NAMING_CONVENTION: "naming-convention",
  NO_ANY: "no-any",
  NO_TYPE_ASSERTION: "no-type-assertion",
  NO_NON_NULL_ASSERTION: "no-non-null-assertion",
} as const

export type ReviewRule = (typeof REVIEW_RULE)[keyof typeof REVIEW_RULE]

export interface QualityFinding {
  readonly rule: ReviewRule
  readonly severity: "info" | "warning" | "error"
  readonly line: number
  readonly message: string
}

export interface QualityScore {
  readonly score: number
  readonly findings: readonly QualityFinding[]
  readonly passesThreshold: boolean
}

interface FunctionBounds {
  readonly startLine: number
  readonly lineCount: number
  readonly name: string
}

function extractFunctions(source: string): readonly FunctionBounds[] {
  const lines = source.split("\n")
  const functions: FunctionBounds[] = []
  const functionPattern = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/

  for (let i = 0; i < lines.length; i++) {
    const match = functionPattern.exec(lines[i])
    if (!match) continue

    let braceDepth = 0
    let started = false
    let endLine = i

    for (let j = i; j < lines.length; j++) {
      for (const ch of lines[j]) {
        if (ch === "{") { braceDepth++; started = true }
        if (ch === "}") braceDepth--
      }
      if (started && braceDepth === 0) { endLine = j; break }
    }

    functions.push({
      startLine: i + 1,
      lineCount: endLine - i + 1,
      name: match[1],
    })
  }

  return functions
}

function checkFunctionLength(source: string): readonly QualityFinding[] {
  return extractFunctions(source)
    .filter((fn) => fn.lineCount > 20)
    .map((fn) => ({
      rule: REVIEW_RULE.FUNCTION_LENGTH,
      severity: "warning" as const,
      line: fn.startLine,
      message: `function "${fn.name}" has ${fn.lineCount} lines (max 20)`,
    }))
}

function checkNestingDepth(source: string): readonly QualityFinding[] {
  const lines = source.split("\n")
  const findings: QualityFinding[] = []

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart()
    const indent = lines[i].length - trimmed.length
    const nestLevel = Math.floor(indent / 2)

    if (nestLevel >= 6 && trimmed.length > 0) {
      findings.push({
        rule: REVIEW_RULE.NESTING_DEPTH,
        severity: "warning",
        line: i + 1,
        message: `nesting depth ${nestLevel} exceeds maximum (3 logical levels)`,
      })
    }
  }

  return findings
}

function checkNamingConvention(source: string): readonly QualityFinding[] {
  const lines = source.split("\n")
  const findings: QualityFinding[] = []
  const declarationPattern = /(?:const|let|var)\s+([A-Z][a-z]\w*)\s*=/

  for (let i = 0; i < lines.length; i++) {
    const match = declarationPattern.exec(lines[i])
    if (!match) continue

    const name = match[1]
    if (/^[A-Z][a-z]/.test(name) && !lines[i].includes("class ") && !lines[i].includes("new ")) {
      findings.push({
        rule: REVIEW_RULE.NAMING_CONVENTION,
        severity: "info",
        line: i + 1,
        message: `"${name}" uses PascalCase — expected camelCase for variables`,
      })
    }
  }

  return findings
}

function checkTypeUnsafety(source: string): readonly QualityFinding[] {
  const lines = source.split("\n")
  const findings: QualityFinding[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (/:\s*any\b/.test(line) || /as\s+any\b/.test(line)) {
      findings.push({
        rule: REVIEW_RULE.NO_ANY,
        severity: "error",
        line: i + 1,
        message: "usage of `any` type — use `unknown` with type guards instead",
      })
    }

    if (/\bas\s+(?!const\b)\w+/.test(line) && !/as\s+any/.test(line)) {
      findings.push({
        rule: REVIEW_RULE.NO_TYPE_ASSERTION,
        severity: "warning",
        line: i + 1,
        message: "type assertion with `as` — prefer type narrowing",
      })
    }

    if (/\w+!\./.test(line) || /\w+!\[/.test(line)) {
      findings.push({
        rule: REVIEW_RULE.NO_NON_NULL_ASSERTION,
        severity: "error",
        line: i + 1,
        message: "non-null assertion `!` — handle undefined explicitly",
      })
    }
  }

  return findings
}

export function reviewCode(
  source: string,
  threshold = QUALITY_THRESHOLD_DEFAULT,
): QualityScore {
  const findings = [
    ...checkFunctionLength(source),
    ...checkNestingDepth(source),
    ...checkNamingConvention(source),
    ...checkTypeUnsafety(source),
  ]

  const errorCount = findings.filter((f) => f.severity === "error").length
  const warningCount = findings.filter((f) => f.severity === "warning").length

  const deductions = errorCount * 15 + warningCount * 5
  const score = Math.max(0, 100 - deductions)

  return {
    score,
    findings,
    passesThreshold: score >= threshold,
  }
}
