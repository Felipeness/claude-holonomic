import { describe, it, expect } from "vitest"
import {
  ValidationError,
  NotFoundError,
  AmbiguousIntent,
  NoRelevantFiles,
  ContextTooLarge,
  PlanRejected,
  InvalidPhaseTransition,
} from "../src/index.js"

describe("tagged errors", () => {
  it("creates ValidationError with field and message", () => {
    const err = new ValidationError({ field: "name", message: "required" })
    expect(err._tag).toBe("ValidationError")
    expect(err.field).toBe("name")
    expect(err.message).toBe("required")
  })

  it("creates NotFoundError with entity and id", () => {
    const err = new NotFoundError({ entity: "task", id: "123" })
    expect(err._tag).toBe("NotFoundError")
    expect(err.entity).toBe("task")
    expect(err.id).toBe("123")
  })

  it("creates AmbiguousIntent with raw string", () => {
    const err = new AmbiguousIntent({ raw: "do the thing" })
    expect(err._tag).toBe("AmbiguousIntent")
    expect(err.raw).toBe("do the thing")
  })

  it("creates NoRelevantFiles with query", () => {
    const err = new NoRelevantFiles({ query: "auth middleware" })
    expect(err._tag).toBe("NoRelevantFiles")
    expect(err.query).toBe("auth middleware")
  })

  it("creates ContextTooLarge with tokens and limit", () => {
    const err = new ContextTooLarge({ tokens: 200_000, limit: 128_000 })
    expect(err._tag).toBe("ContextTooLarge")
    expect(err.tokens).toBe(200_000)
    expect(err.limit).toBe(128_000)
  })

  it("creates PlanRejected with reason", () => {
    const err = new PlanRejected({ reason: "too complex" })
    expect(err._tag).toBe("PlanRejected")
    expect(err.reason).toBe("too complex")
  })

  it("creates InvalidPhaseTransition with from/to", () => {
    const err = new InvalidPhaseTransition({ from: "IDLE", to: "BUILDING" })
    expect(err._tag).toBe("InvalidPhaseTransition")
    expect(err.from).toBe("IDLE")
    expect(err.to).toBe("BUILDING")
  })

  it("errors are instances of Error", () => {
    const err = new ValidationError({ field: "x", message: "y" })
    expect(err).toBeInstanceOf(Error)
  })
})
