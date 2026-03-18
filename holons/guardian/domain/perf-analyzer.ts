export const PERF_RULE = {
  N_PLUS_ONE: "n-plus-one",
  MISSING_LIMIT: "missing-limit",
  SEQUENTIAL_AWAIT: "sequential-await",
} as const

export type PerfRule = (typeof PERF_RULE)[keyof typeof PERF_RULE]

export interface PerfFinding {
  readonly rule: PerfRule
  readonly severity: "warning" | "error"
  readonly line: number
  readonly message: string
}

function checkNPlusOne(lines: readonly string[]): readonly PerfFinding[] {
  const findings: PerfFinding[] = []
  let inLoop = false
  let loopStartLine = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (/\bfor\s*\(/.test(line) || /\.forEach\(/.test(line) || /\.map\(/.test(line) || /\bwhile\s*\(/.test(line)) {
      inLoop = true
      loopStartLine = i + 1
    }

    if (inLoop && /\bawait\b/.test(line)) {
      findings.push({
        rule: PERF_RULE.N_PLUS_ONE,
        severity: "error",
        line: i + 1,
        message: `await inside loop (started at line ${loopStartLine}) — batch operations instead`,
      })
    }

    if (inLoop && line === "}") {
      inLoop = false
    }
  }

  return findings
}

function checkMissingLimit(lines: readonly string[]): readonly PerfFinding[] {
  const findings: PerfFinding[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const hasSelect = /\bSELECT\b/i.test(line)
    const hasSelectAll = /SELECT\s+\*/i.test(line)
    const hasLimit = /\bLIMIT\b/i.test(line)
    const hasFindMany = /\.findMany\s*\(/.test(line) || /\.find\s*\(\s*\{/.test(line)

    if (hasSelect && hasSelectAll && !hasLimit) {
      findings.push({
        rule: PERF_RULE.MISSING_LIMIT,
        severity: "warning",
        line: i + 1,
        message: "`SELECT *` without LIMIT — add pagination",
      })
    }

    if (hasFindMany) {
      const context = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 3)).join(" ")
      if (!/take\s*:/.test(context) && !/limit\s*:/.test(context)) {
        findings.push({
          rule: PERF_RULE.MISSING_LIMIT,
          severity: "warning",
          line: i + 1,
          message: "`findMany`/`find` without limit — add pagination",
        })
      }
    }
  }

  return findings
}

function checkSequentialAwait(lines: readonly string[]): readonly PerfFinding[] {
  const findings: PerfFinding[] = []
  let consecutiveAwaits: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (/^(?:const|let|var)\s+\w+\s*=\s*await\b/.test(line)) {
      consecutiveAwaits.push(i + 1)
    } else if (line.length > 0 && !/^\s*$/.test(line) && !/^\/\//.test(line)) {
      if (consecutiveAwaits.length >= 2) {
        findings.push({
          rule: PERF_RULE.SEQUENTIAL_AWAIT,
          severity: "warning",
          line: consecutiveAwaits[0],
          message: `${consecutiveAwaits.length} sequential awaits (lines ${consecutiveAwaits.join(", ")}) — use Promise.all if independent`,
        })
      }
      consecutiveAwaits = []
    }
  }

  if (consecutiveAwaits.length >= 2) {
    findings.push({
      rule: PERF_RULE.SEQUENTIAL_AWAIT,
      severity: "warning",
      line: consecutiveAwaits[0],
      message: `${consecutiveAwaits.length} sequential awaits (lines ${consecutiveAwaits.join(", ")}) — use Promise.all if independent`,
    })
  }

  return findings
}

export function analyzePerformance(source: string): readonly PerfFinding[] {
  const lines = source.split("\n")

  return [
    ...checkNPlusOne(lines),
    ...checkMissingLimit(lines),
    ...checkSequentialAwait(lines),
  ]
}
