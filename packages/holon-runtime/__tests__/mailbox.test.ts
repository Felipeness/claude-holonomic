import { describe, it, expect } from "vitest"
import { Mailbox } from "../src/mailbox.js"
import type { Message } from "../src/mailbox.js"

const msg = (type: string, payload: unknown = {}): Message => ({
  id: `msg-${Date.now()}`,
  type,
  payload,
  timestamp: new Date(),
})

describe("Mailbox", () => {
  it("sends and receives messages in order", () => {
    const box = new Mailbox()
    box.send(msg("a"))
    box.send(msg("b"))

    expect(box.tryReceive()?.type).toBe("a")
    expect(box.tryReceive()?.type).toBe("b")
  })

  it("returns undefined on empty tryReceive", () => {
    const box = new Mailbox()
    expect(box.tryReceive()).toBeUndefined()
  })

  it("tracks size", () => {
    const box = new Mailbox()
    expect(box.size()).toBe(0)
    box.send(msg("x"))
    expect(box.size()).toBe(1)
    box.tryReceive()
    expect(box.size()).toBe(0)
  })

  it("peeks without consuming", () => {
    const box = new Mailbox()
    box.send(msg("peek-me"))

    expect(box.peek()?.type).toBe("peek-me")
    expect(box.size()).toBe(1)
  })

  it("resolves receive promise when message arrives", async () => {
    const box = new Mailbox()
    const promise = box.receive()

    box.send(msg("delayed"))
    const received = await promise
    expect(received.type).toBe("delayed")
  })

  it("clears all messages", () => {
    const box = new Mailbox()
    box.send(msg("a"))
    box.send(msg("b"))
    box.clear()

    expect(box.size()).toBe(0)
    expect(box.tryReceive()).toBeUndefined()
  })
})
