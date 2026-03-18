import { describe, it, expect } from "vitest"
import { scanSecurity, SECURITY_RULE } from "../domain/security-scanner.js"

describe("scanSecurity", () => {
  it("detects eval usage", () => {
    const source = `
const result = eval("2 + 2")
`
    const findings = scanSecurity(source)

    const evalFindings = findings.filter((f) => f.rule === SECURITY_RULE.EVAL_USAGE)
    expect(evalFindings).toHaveLength(1)
    expect(evalFindings[0].severity).toBe("critical")
    expect(evalFindings[0].message).toContain("eval")
  })

  it("detects innerHTML assignment", () => {
    const source = `
element.innerHTML = userInput
`
    const findings = scanSecurity(source)

    const htmlFindings = findings.filter((f) => f.rule === SECURITY_RULE.INNER_HTML)
    expect(htmlFindings).toHaveLength(1)
    expect(htmlFindings[0].severity).toBe("critical")
    expect(htmlFindings[0].message).toContain("XSS")
  })

  it("detects SQL string concatenation", () => {
    const source = `
const query = \`SELECT * FROM users WHERE id = \${userId}\`
`
    const findings = scanSecurity(source)

    const sqlFindings = findings.filter((f) => f.rule === SECURITY_RULE.SQL_CONCATENATION)
    expect(sqlFindings).toHaveLength(1)
    expect(sqlFindings[0].severity).toBe("critical")
    expect(sqlFindings[0].message).toContain("parameterized")
  })

  it("detects hardcoded secrets", () => {
    const source = `
const apiKey = "sk-1234567890abcdef"
`
    const findings = scanSecurity(source)

    const secretFindings = findings.filter((f) => f.rule === SECURITY_RULE.HARDCODED_SECRET)
    expect(secretFindings).toHaveLength(1)
    expect(secretFindings[0].severity).toBe("critical")
  })

  it("detects __proto__ access", () => {
    const source = `
obj["__proto__"].polluted = true
`
    const findings = scanSecurity(source)

    const protoFindings = findings.filter((f) => f.rule === SECURITY_RULE.PROTOTYPE_POLLUTION)
    expect(protoFindings).toHaveLength(1)
    expect(protoFindings[0].severity).toBe("critical")
  })

  it("returns empty array for clean code", () => {
    const source = `
function add(a: number, b: number): number {
  return a + b
}
`
    const findings = scanSecurity(source)

    expect(findings).toHaveLength(0)
  })

  it("detects multiple issues in same file", () => {
    const source = `
const result = eval(userInput)
element.innerHTML = data
const token = "secret-token-12345678"
`
    const findings = scanSecurity(source)

    expect(findings.length).toBeGreaterThanOrEqual(3)
  })

  it("reports correct line numbers", () => {
    const source = `line1
line2
const x = eval("code")
line4`

    const findings = scanSecurity(source)

    expect(findings[0].line).toBe(3)
  })
})
