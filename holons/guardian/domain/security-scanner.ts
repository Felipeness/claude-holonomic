export const SECURITY_RULE = {
  EVAL_USAGE: "eval-usage",
  INNER_HTML: "inner-html",
  SQL_CONCATENATION: "sql-concatenation",
  HARDCODED_SECRET: "hardcoded-secret",
  PROTOTYPE_POLLUTION: "prototype-pollution",
} as const

export type SecurityRule = (typeof SECURITY_RULE)[keyof typeof SECURITY_RULE]

export interface SecurityFinding {
  readonly rule: SecurityRule
  readonly severity: "warning" | "critical"
  readonly line: number
  readonly message: string
}

function checkEvalUsage(lines: readonly string[]): readonly SecurityFinding[] {
  const findings: SecurityFinding[] = []

  for (let i = 0; i < lines.length; i++) {
    if (/\beval\s*\(/.test(lines[i])) {
      findings.push({
        rule: SECURITY_RULE.EVAL_USAGE,
        severity: "critical",
        line: i + 1,
        message: "`eval()` allows arbitrary code execution",
      })
    }
  }

  return findings
}

function checkInnerHtml(lines: readonly string[]): readonly SecurityFinding[] {
  const findings: SecurityFinding[] = []

  for (let i = 0; i < lines.length; i++) {
    if (/\.innerHTML\s*=/.test(lines[i])) {
      findings.push({
        rule: SECURITY_RULE.INNER_HTML,
        severity: "critical",
        line: i + 1,
        message: "direct `innerHTML` assignment enables XSS attacks",
      })
    }
  }

  return findings
}

function checkSqlConcatenation(lines: readonly string[]): readonly SecurityFinding[] {
  const findings: SecurityFinding[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const hasSqlKeyword = /\b(?:SELECT|INSERT|UPDATE|DELETE|DROP)\b/i.test(line)
    const hasConcatenation = /\$\{/.test(line) || /\+\s*\w+/.test(line)

    if (hasSqlKeyword && hasConcatenation) {
      findings.push({
        rule: SECURITY_RULE.SQL_CONCATENATION,
        severity: "critical",
        line: i + 1,
        message: "SQL string concatenation — use parameterized queries",
      })
    }
  }

  return findings
}

function checkHardcodedSecrets(lines: readonly string[]): readonly SecurityFinding[] {
  const findings: SecurityFinding[] = []
  const secretPattern = /(?:password|secret|api_key|apiKey|token|private_key)\s*[:=]\s*["'`][^"'`]{8,}/i

  for (let i = 0; i < lines.length; i++) {
    if (secretPattern.test(lines[i])) {
      findings.push({
        rule: SECURITY_RULE.HARDCODED_SECRET,
        severity: "critical",
        line: i + 1,
        message: "potential hardcoded secret detected",
      })
    }
  }

  return findings
}

function checkPrototypePollution(lines: readonly string[]): readonly SecurityFinding[] {
  const findings: SecurityFinding[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/__proto__/.test(line) || /\["__proto__"\]/.test(line) || /Object\.assign\(\s*\{\}/.test(line) === false && /\[(\w+)\]\s*=/.test(line) && /prototype/.test(line)) {
      if (/__proto__/.test(line) || /\["__proto__"\]/.test(line)) {
        findings.push({
          rule: SECURITY_RULE.PROTOTYPE_POLLUTION,
          severity: "critical",
          line: i + 1,
          message: "`__proto__` access enables prototype pollution",
        })
      }
    }
  }

  return findings
}

export function scanSecurity(source: string): readonly SecurityFinding[] {
  const lines = source.split("\n")

  return [
    ...checkEvalUsage(lines),
    ...checkInnerHtml(lines),
    ...checkSqlConcatenation(lines),
    ...checkHardcodedSecrets(lines),
    ...checkPrototypePollution(lines),
  ]
}
