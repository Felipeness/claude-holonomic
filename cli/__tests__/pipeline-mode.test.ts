import { describe, it, expect } from "vitest"
import { isLiveMode } from "../src/pipeline.js"

describe("isLiveMode", () => {
  it("returns true when cwd is provided", () => {
    expect(isLiveMode({ task: "test", cwd: "/tmp/repo" })).toBe(true)
  })

  it("returns false when cwd is undefined", () => {
    expect(isLiveMode({ task: "test" })).toBe(false)
  })

  it("returns false when cwd is empty string", () => {
    expect(isLiveMode({ task: "test", cwd: "" })).toBe(false)
  })
})
