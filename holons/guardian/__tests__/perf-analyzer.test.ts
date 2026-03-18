import { describe, it, expect } from "vitest"
import { analyzePerformance, PERF_RULE } from "../domain/perf-analyzer.js"

describe("analyzePerformance", () => {
  it("detects N+1 pattern (await inside for loop)", () => {
    const source = `
for (const user of users) {
  const orders = await fetchOrders(user.id)
}
`
    const findings = analyzePerformance(source)

    const nPlusOne = findings.filter((f) => f.rule === PERF_RULE.N_PLUS_ONE)
    expect(nPlusOne).toHaveLength(1)
    expect(nPlusOne[0].severity).toBe("error")
    expect(nPlusOne[0].message).toContain("await inside loop")
  })

  it("detects N+1 pattern (await inside forEach)", () => {
    const source = `
users.forEach(async (user) => {
  const data = await getProfile(user.id)
}
`
    const findings = analyzePerformance(source)

    const nPlusOne = findings.filter((f) => f.rule === PERF_RULE.N_PLUS_ONE)
    expect(nPlusOne.length).toBeGreaterThanOrEqual(1)
  })

  it("detects missing LIMIT in SELECT *", () => {
    const source = `
const query = "SELECT * FROM users"
`
    const findings = analyzePerformance(source)

    const limitFindings = findings.filter((f) => f.rule === PERF_RULE.MISSING_LIMIT)
    expect(limitFindings).toHaveLength(1)
    expect(limitFindings[0].message).toContain("LIMIT")
  })

  it("accepts SELECT * with LIMIT", () => {
    const source = `
const query = "SELECT * FROM users LIMIT 100"
`
    const findings = analyzePerformance(source)

    const limitFindings = findings.filter((f) => f.rule === PERF_RULE.MISSING_LIMIT)
    expect(limitFindings).toHaveLength(0)
  })

  it("detects sequential awaits", () => {
    const source = `
const users = await fetchUsers()
const orders = await fetchOrders()
const products = await fetchProducts()
doSomething()
`
    const findings = analyzePerformance(source)

    const seqFindings = findings.filter((f) => f.rule === PERF_RULE.SEQUENTIAL_AWAIT)
    expect(seqFindings).toHaveLength(1)
    expect(seqFindings[0].message).toContain("3 sequential awaits")
    expect(seqFindings[0].message).toContain("Promise.all")
  })

  it("allows single await", () => {
    const source = `
const users = await fetchUsers()
doSomething(users)
`
    const findings = analyzePerformance(source)

    const seqFindings = findings.filter((f) => f.rule === PERF_RULE.SEQUENTIAL_AWAIT)
    expect(seqFindings).toHaveLength(0)
  })

  it("returns empty for clean code", () => {
    const source = `
function add(a: number, b: number): number {
  return a + b
}
`
    const findings = analyzePerformance(source)

    expect(findings).toHaveLength(0)
  })

  it("detects findMany without limit", () => {
    const source = `
const users = await prisma.user.findMany({
  where: { active: true }
})
`
    const findings = analyzePerformance(source)

    const limitFindings = findings.filter((f) => f.rule === PERF_RULE.MISSING_LIMIT)
    expect(limitFindings.length).toBeGreaterThanOrEqual(1)
  })
})
