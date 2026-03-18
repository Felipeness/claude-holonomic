import { describe, it, expect } from "vitest"
import { HolonId, TaskId, SessionId, PatternId, PreferenceId, EntityId } from "../src/index.js"

describe("branded types", () => {
  it("creates HolonId from string", () => {
    const id = HolonId("holon-1")
    expect(id).toBe("holon-1")
  })

  it("creates TaskId from string", () => {
    const id = TaskId("task-abc")
    expect(id).toBe("task-abc")
  })

  it("creates SessionId from string", () => {
    const id = SessionId("session-xyz")
    expect(id).toBe("session-xyz")
  })

  it("creates PatternId from string", () => {
    const id = PatternId("pattern-1")
    expect(id).toBe("pattern-1")
  })

  it("creates PreferenceId from string", () => {
    const id = PreferenceId("pref-1")
    expect(id).toBe("pref-1")
  })

  it("creates EntityId from string", () => {
    const id = EntityId("entity-1")
    expect(id).toBe("entity-1")
  })

  it("branded types maintain string semantics", () => {
    const id = HolonId("test")
    expect(typeof id).toBe("string")
    expect(id.length).toBe(4)
    expect(id.startsWith("test")).toBe(true)
  })
})
