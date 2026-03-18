import { describe, it, expect, beforeEach } from "vitest"
import { CircuitBreaker } from "../src/circuit-breaker.js"

describe("CircuitBreaker", () => {
  let cb: CircuitBreaker

  beforeEach(() => {
    cb = new CircuitBreaker({
      failureThreshold: 3,
      degradedThreshold: 2,
      resetTimeoutMs: 100,
      halfOpenMax: 2,
      service: "test-service",
    })
  })

  describe("CLOSED state", () => {
    it("starts CLOSED", () => {
      expect(cb.state).toBe("CLOSED")
    })

    it("executes operations in CLOSED state", async () => {
      const result = await cb.execute(() => Promise.resolve(42))
      expect(result).toBe(42)
    })

    it("stays CLOSED on success", async () => {
      await cb.execute(() => Promise.resolve("ok"))
      expect(cb.state).toBe("CLOSED")
    })
  })

  describe("failure tracking", () => {
    it("tracks failure count", () => {
      cb.recordFailure("error", "oops")
      cb.recordFailure("timeout", "slow")
      expect(cb.getFailureCount()).toBe(2)
    })

    it("records failure types", () => {
      cb.recordFailure("timeout", "timed out")
      const failures = cb.getFailures()
      expect(failures[0]!.type).toBe("timeout")
    })

    it("classifies timeout errors", async () => {
      try {
        await cb.execute(() => Promise.reject(new Error("request timeout")))
      } catch {
        /* expected */
      }
      expect(cb.getFailures()[0]!.type).toBe("timeout")
    })

    it("classifies rate limit errors", async () => {
      try {
        await cb.execute(() => Promise.reject(new Error("429 too many requests")))
      } catch {
        /* expected */
      }
      expect(cb.getFailures()[0]!.type).toBe("rate_limit")
    })
  })

  describe("DEGRADED state", () => {
    it("transitions to DEGRADED after degradedThreshold failures", () => {
      cb.recordFailure("error", "1")
      cb.recordFailure("error", "2")
      expect(cb.state).toBe("DEGRADED")
    })

    it("recovers from DEGRADED after consecutive successes", () => {
      cb.recordFailure("error", "1")
      cb.recordFailure("error", "2")
      expect(cb.state).toBe("DEGRADED")

      cb.recordSuccess()
      cb.recordSuccess()
      cb.recordSuccess()
      expect(cb.state).toBe("CLOSED")
    })
  })

  describe("OPEN state", () => {
    it("transitions to OPEN after failureThreshold", () => {
      cb.recordFailure("error", "1")
      cb.recordFailure("error", "2")
      cb.recordFailure("error", "3")
      expect(cb.state).toBe("OPEN")
    })

    it("rejects operations in OPEN state", async () => {
      cb.recordFailure("error", "1")
      cb.recordFailure("error", "2")
      cb.recordFailure("error", "3")

      await expect(cb.execute(() => Promise.resolve("nope"))).rejects.toThrow()
    })
  })

  describe("HALF_OPEN state", () => {
    it("transitions to HALF_OPEN after reset timeout", async () => {
      cb.recordFailure("error", "1")
      cb.recordFailure("error", "2")
      cb.recordFailure("error", "3")
      expect(cb.state).toBe("OPEN")

      await new Promise((r) => setTimeout(r, 150))
      expect(cb.state).toBe("HALF_OPEN")
    })

    it("transitions back to CLOSED on success in HALF_OPEN", async () => {
      cb.recordFailure("error", "1")
      cb.recordFailure("error", "2")
      cb.recordFailure("error", "3")

      await new Promise((r) => setTimeout(r, 150))
      expect(cb.state).toBe("HALF_OPEN")

      await cb.execute(() => Promise.resolve("ok"))
      expect(cb.state).toBe("CLOSED")
    })

    it("transitions back to OPEN on failure in HALF_OPEN", async () => {
      cb.recordFailure("error", "1")
      cb.recordFailure("error", "2")
      cb.recordFailure("error", "3")

      await new Promise((r) => setTimeout(r, 150))
      expect(cb.state).toBe("HALF_OPEN")

      try {
        await cb.execute(() => Promise.reject(new Error("still broken")))
      } catch {
        /* expected */
      }
      expect(cb.state).toBe("OPEN")
    })

    it("limits attempts in HALF_OPEN", async () => {
      cb.recordFailure("error", "1")
      cb.recordFailure("error", "2")
      cb.recordFailure("error", "3")

      await new Promise((r) => setTimeout(r, 150))

      await cb.execute(() => Promise.resolve("ok"))
      expect(cb.state).toBe("CLOSED")
    })
  })

  describe("reset", () => {
    it("resets to initial state", () => {
      cb.recordFailure("error", "1")
      cb.recordFailure("error", "2")
      cb.recordFailure("error", "3")

      cb.reset()
      expect(cb.state).toBe("CLOSED")
      expect(cb.getFailureCount()).toBe(0)
    })
  })
})
