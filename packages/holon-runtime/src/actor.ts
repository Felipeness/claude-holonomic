import type { HolonName } from "@holon/shared"
import { Mailbox, type Message } from "./mailbox.js"

export type ActorStatus = "idle" | "active" | "stopped" | "failed"

export interface ActorRef {
  readonly name: HolonName
  readonly status: ActorStatus
  send(msg: Message): void
}

export type MessageHandler = (msg: Message, ctx: ActorContext) => Promise<void>

export interface ActorContext {
  readonly self: ActorRef
  send(target: HolonName, msg: Message): void
  spawn(name: HolonName, handler: MessageHandler): ActorRef
  stop(): void
}

export class Actor implements ActorRef {
  readonly name: HolonName
  private _status: ActorStatus = "idle"
  private readonly mailbox = new Mailbox()
  private readonly handler: MessageHandler
  private abortController: AbortController | null = null
  private readonly system: ActorSystem

  constructor(name: HolonName, handler: MessageHandler, system: ActorSystem) {
    this.name = name
    this.handler = handler
    this.system = system
  }

  get status(): ActorStatus {
    return this._status
  }

  send(msg: Message): void {
    if (this._status === "stopped" || this._status === "failed") return
    this.mailbox.send(msg)
  }

  async start(): Promise<void> {
    if (this._status === "active") return
    this._status = "active"
    this.abortController = new AbortController()
    this.processLoop()
  }

  stop(): void {
    this._status = "stopped"
    this.abortController?.abort()
    this.mailbox.clear()
  }

  private async processLoop(): Promise<void> {
    while (this._status === "active") {
      try {
        const msg = this.mailbox.tryReceive()
        if (!msg) {
          await new Promise((resolve) => setTimeout(resolve, 10))
          continue
        }

        const ctx: ActorContext = {
          self: this,
          send: (target, m) => this.system.send(target, m),
          spawn: (name, handler) => this.system.spawn(name, handler),
          stop: () => this.stop(),
        }

        await this.handler(msg, ctx)
      } catch (error) {
        this._status = "failed"
        this.system.notifyFailure(this.name, error)
        break
      }
    }
  }
}

export class ActorSystem {
  private actors = new Map<HolonName, Actor>()
  private failureHandlers: Array<(name: HolonName, error: unknown) => void> = []

  spawn(name: HolonName, handler: MessageHandler): ActorRef {
    const existing = this.actors.get(name)
    if (existing && existing.status === "active") return existing

    const actor = new Actor(name, handler, this)
    this.actors.set(name, actor)
    actor.start()
    return actor
  }

  send(target: HolonName, msg: Message): void {
    const actor = this.actors.get(target)
    if (actor) actor.send(msg)
  }

  get(name: HolonName): ActorRef | undefined {
    return this.actors.get(name)
  }

  stopAll(): void {
    for (const actor of this.actors.values()) {
      actor.stop()
    }
    this.actors.clear()
  }

  onFailure(handler: (name: HolonName, error: unknown) => void): void {
    this.failureHandlers.push(handler)
  }

  notifyFailure(name: HolonName, error: unknown): void {
    for (const handler of this.failureHandlers) {
      handler(name, error)
    }
  }

  activeCount(): number {
    let count = 0
    for (const actor of this.actors.values()) {
      if (actor.status === "active") count++
    }
    return count
  }
}
