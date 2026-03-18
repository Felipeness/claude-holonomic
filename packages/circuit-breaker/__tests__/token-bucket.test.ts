import { describe, it, expect } from "vitest"
import { TokenBucket } from "../src/token-bucket.js"

describe("TokenBucket", () => {
  it("starts with max tokens", () => {
    const bucket = new TokenBucket({ maxTokens: 5 })
    expect(bucket.available()).toBe(5)
  })

  it("consumes tokens", () => {
    const bucket = new TokenBucket({ maxTokens: 5 })
    expect(bucket.tryConsume()).toBe(true)
    expect(bucket.available()).toBe(4)
  })

  it("consumes multiple tokens at once", () => {
    const bucket = new TokenBucket({ maxTokens: 10 })
    expect(bucket.tryConsume(3)).toBe(true)
    expect(bucket.available()).toBe(7)
  })

  it("rejects when insufficient tokens", () => {
    const bucket = new TokenBucket({ maxTokens: 2 })
    bucket.tryConsume(2)
    expect(bucket.tryConsume()).toBe(false)
  })

  it("rejects multi-consume when insufficient", () => {
    const bucket = new TokenBucket({ maxTokens: 3 })
    expect(bucket.tryConsume(5)).toBe(false)
    expect(bucket.available()).toBe(3)
  })

  it("refills tokens over time", async () => {
    const bucket = new TokenBucket({
      maxTokens: 5,
      refillRate: 2,
      refillIntervalMs: 50,
    })

    bucket.tryConsume(5)
    expect(bucket.available()).toBe(0)

    await new Promise((r) => setTimeout(r, 120))
    expect(bucket.available()).toBeGreaterThan(0)
  })

  it("does not exceed max tokens on refill", async () => {
    const bucket = new TokenBucket({
      maxTokens: 3,
      refillRate: 5,
      refillIntervalMs: 50,
    })

    await new Promise((r) => setTimeout(r, 200))
    expect(bucket.available()).toBe(3)
  })
})
