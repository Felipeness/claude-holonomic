import { describe, it, expect } from "vitest"
import { reviewCode, QUALITY_THRESHOLD_DEFAULT, REVIEW_RULE } from "../domain/review-engine.js"

describe("reviewCode", () => {
  it("gives high score for short clean function", () => {
    const source = `
function greet(name: string): string {
  return "hello " + name
}
`
    const result = reviewCode(source)

    expect(result.score).toBeGreaterThanOrEqual(90)
    expect(result.passesThreshold).toBe(true)
    expect(result.findings).toHaveLength(0)
  })

  it("penalizes function longer than 20 lines", () => {
    const lines = Array.from({ length: 25 }, (_, i) => `  const x${i} = ${i}`)
    const source = `function longFunction() {\n${lines.join("\n")}\n}`

    const result = reviewCode(source)

    expect(result.score).toBeLessThan(100)
    const lengthFindings = result.findings.filter((f) => f.rule === REVIEW_RULE.FUNCTION_LENGTH)
    expect(lengthFindings.length).toBeGreaterThanOrEqual(1)
    expect(lengthFindings[0].message).toContain("longFunction")
  })

  it("detects any type usage as error", () => {
    const source = `
function process(data: any): void {
  console.log(data)
}
`
    const result = reviewCode(source)

    const anyFindings = result.findings.filter((f) => f.rule === REVIEW_RULE.NO_ANY)
    expect(anyFindings.length).toBeGreaterThanOrEqual(1)
    expect(anyFindings[0].severity).toBe("error")
  })

  it("detects non-null assertion as error", () => {
    const source = `
function getValue(obj: { name?: string }): string {
  return obj.name!.toUpperCase()
}
`
    const result = reviewCode(source)

    const assertions = result.findings.filter((f) => f.rule === REVIEW_RULE.NO_NON_NULL_ASSERTION)
    expect(assertions.length).toBeGreaterThanOrEqual(1)
    expect(assertions[0].severity).toBe("error")
  })

  it("detects type assertion with as", () => {
    const source = `
const value = something as string
`
    const result = reviewCode(source)

    const assertions = result.findings.filter((f) => f.rule === REVIEW_RULE.NO_TYPE_ASSERTION)
    expect(assertions.length).toBeGreaterThanOrEqual(1)
  })

  it("uses custom threshold", () => {
    const source = `
function process(data: any): void {
  console.log(data)
}
`
    const strictResult = reviewCode(source, 95)
    const lenientResult = reviewCode(source, 50)

    expect(strictResult.passesThreshold).toBe(false)
    expect(lenientResult.passesThreshold).toBe(true)
  })

  it("defaults threshold to 80", () => {
    expect(QUALITY_THRESHOLD_DEFAULT).toBe(80)
  })

  it("returns score between 0 and 100", () => {
    const terribleSource = Array.from(
      { length: 10 },
      (_, i) => `function f${i}(data: any): any { return data as unknown }`,
    ).join("\n")

    const result = reviewCode(terribleSource)

    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})
