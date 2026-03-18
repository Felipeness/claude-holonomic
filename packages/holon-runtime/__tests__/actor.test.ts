import { describe, it, expect, afterEach } from "vitest"
import { ActorSystem } from "../src/actor.js"
import { HOLON_NAME } from "@holon/shared"
import type { Message } from "../src/mailbox.js"

const msg = (type: string, payload: unknown = {}): Message => ({
  id: `msg-${Date.now()}-${Math.random()}`,
  type,
  payload,
  timestamp: new Date(),
})

describe("ActorSystem", () => {
  let system: ActorSystem

  afterEach(() => {
    system?.stopAll()
  })

  it("spawns an actor", () => {
    system = new ActorSystem()
    const ref = system.spawn(HOLON_NAME.BRAIN, async () => {})

    expect(ref.name).toBe("brain")
    expect(ref.status).toBe("active")
  })

  it("sends messages to actors", async () => {
    system = new ActorSystem()
    const received: string[] = []

    system.spawn(HOLON_NAME.RESEARCHER, async (m) => {
      received.push(m.type)
    })

    system.send(HOLON_NAME.RESEARCHER, msg("search"))
    await new Promise((r) => setTimeout(r, 50))

    expect(received).toContain("search")
  })

  it("stops all actors", () => {
    system = new ActorSystem()
    system.spawn(HOLON_NAME.BRAIN, async () => {})
    system.spawn(HOLON_NAME.BUILDER, async () => {})

    system.stopAll()
    expect(system.activeCount()).toBe(0)
  })

  it("gets actor by name", () => {
    system = new ActorSystem()
    system.spawn(HOLON_NAME.GUARDIAN, async () => {})

    const ref = system.get(HOLON_NAME.GUARDIAN)
    expect(ref).toBeDefined()
    expect(ref!.name).toBe("guardian")
  })

  it("returns undefined for unknown actor", () => {
    system = new ActorSystem()
    expect(system.get(HOLON_NAME.SCHOLAR)).toBeUndefined()
  })

  it("notifies on actor failure", async () => {
    system = new ActorSystem()
    const failures: string[] = []

    system.onFailure((name) => failures.push(name))
    system.spawn(HOLON_NAME.BUILDER, async () => {
      throw new Error("build failed")
    })

    system.send(HOLON_NAME.BUILDER, msg("build"))
    await new Promise((r) => setTimeout(r, 50))

    expect(failures).toContain("builder")
  })
})
