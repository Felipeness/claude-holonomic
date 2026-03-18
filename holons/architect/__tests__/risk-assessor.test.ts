import { describe, it, expect } from "vitest"
import { assessRisk, detectCriticalPaths, RISK_RATING } from "../domain/risk-assessor.js"
import type { RiskInput } from "../domain/risk-assessor.js"

describe("risk-assessor", () => {
  describe("detectCriticalPaths", () => {
    it("detects auth-related paths", () => {
      expect(detectCriticalPaths(["src/auth/middleware.ts"])).toBe(true)
    })

    it("detects payment-related paths", () => {
      expect(detectCriticalPaths(["src/payment/processor.ts"])).toBe(true)
    })

    it("detects database/migration paths", () => {
      expect(detectCriticalPaths(["migrations/001_add_users.sql"])).toBe(true)
    })

    it("returns false for non-critical paths", () => {
      expect(detectCriticalPaths(["src/utils/format.ts", "src/components/button.tsx"])).toBe(false)
    })
  })

  describe("assessRisk", () => {
    it("rates few files with tests as low risk", () => {
      const input: RiskInput = {
        filesChanged: 2,
        touchesCriticalPaths: false,
        hasTests: true,
        isReversible: true,
        complexity: "low",
      }

      const result = assessRisk(input)

      expect(result.overall).toBe(RISK_RATING.LOW)
    })

    it("rates many files as high risk", () => {
      const input: RiskInput = {
        filesChanged: 15,
        touchesCriticalPaths: false,
        hasTests: true,
        isReversible: true,
        complexity: "low",
      }

      const result = assessRisk(input)

      expect(result.overall).toBe(RISK_RATING.HIGH)
    })

    it("rates critical path changes as high risk", () => {
      const input: RiskInput = {
        filesChanged: 1,
        touchesCriticalPaths: true,
        hasTests: true,
        isReversible: true,
        complexity: "low",
      }

      const result = assessRisk(input)

      expect(result.overall).toBe(RISK_RATING.HIGH)
    })

    it("includes missing tests as a risk factor", () => {
      const input: RiskInput = {
        filesChanged: 2,
        touchesCriticalPaths: false,
        hasTests: false,
        isReversible: true,
        complexity: "low",
      }

      const result = assessRisk(input)
      const noTestFactor = result.factors.find((f) => f.name === "no-tests")

      expect(noTestFactor).toBeDefined()
      expect(noTestFactor!.severity).toBe(RISK_RATING.MEDIUM)
    })

    it("includes irreversibility as a risk factor", () => {
      const input: RiskInput = {
        filesChanged: 1,
        touchesCriticalPaths: false,
        hasTests: true,
        isReversible: false,
        complexity: "low",
      }

      const result = assessRisk(input)
      const irreversibleFactor = result.factors.find((f) => f.name === "irreversible")

      expect(irreversibleFactor).toBeDefined()
      expect(irreversibleFactor!.severity).toBe(RISK_RATING.HIGH)
    })

    it("includes complexity as a risk factor when not low", () => {
      const input: RiskInput = {
        filesChanged: 1,
        touchesCriticalPaths: false,
        hasTests: true,
        isReversible: true,
        complexity: "high",
      }

      const result = assessRisk(input)
      const complexityFactor = result.factors.find((f) => f.name === "complexity")

      expect(complexityFactor).toBeDefined()
      expect(complexityFactor!.severity).toBe(RISK_RATING.HIGH)
    })

    it("suggests mitigations for identified risks", () => {
      const input: RiskInput = {
        filesChanged: 12,
        touchesCriticalPaths: true,
        hasTests: false,
        isReversible: false,
        complexity: "high",
      }

      const result = assessRisk(input)

      expect(result.mitigations.length).toBeGreaterThan(0)
    })

    it("provides a numeric score reflecting severity", () => {
      const lowRiskInput: RiskInput = {
        filesChanged: 1,
        touchesCriticalPaths: false,
        hasTests: true,
        isReversible: true,
        complexity: "low",
      }

      const highRiskInput: RiskInput = {
        filesChanged: 20,
        touchesCriticalPaths: true,
        hasTests: false,
        isReversible: false,
        complexity: "high",
      }

      const lowResult = assessRisk(lowRiskInput)
      const highResult = assessRisk(highRiskInput)

      expect(highResult.score).toBeGreaterThan(lowResult.score)
    })
  })
})
