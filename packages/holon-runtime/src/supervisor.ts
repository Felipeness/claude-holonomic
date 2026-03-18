import type { HolonName } from "@holon/shared"
import type { ActorSystem, MessageHandler } from "./actor.js"

export type SupervisorStrategy = "restart" | "stop" | "escalate"

export interface SupervisorConfig {
  readonly strategy: SupervisorStrategy
  readonly maxRestarts: number
  readonly windowMs: number
}

const DEFAULT_CONFIG: SupervisorConfig = {
  strategy: "restart",
  maxRestarts: 3,
  windowMs: 60_000,
}

export class Supervisor {
  private readonly config: SupervisorConfig
  private readonly system: ActorSystem
  private restartCounts = new Map<HolonName, { count: number; windowStart: number }>()
  private handlers = new Map<HolonName, MessageHandler>()

  constructor(system: ActorSystem, config?: Partial<SupervisorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.system = system

    this.system.onFailure((name, _error) => {
      this.handleFailure(name)
    })
  }

  register(name: HolonName, handler: MessageHandler): void {
    this.handlers.set(name, handler)
    this.system.spawn(name, handler)
  }

  private handleFailure(name: HolonName): void {
    switch (this.config.strategy) {
      case "restart":
        this.tryRestart(name)
        break
      case "stop":
        break
      case "escalate":
        break
    }
  }

  private tryRestart(name: HolonName): void {
    const handler = this.handlers.get(name)
    if (!handler) return

    const now = Date.now()
    const record = this.restartCounts.get(name)

    if (!record || now - record.windowStart > this.config.windowMs) {
      this.restartCounts.set(name, { count: 1, windowStart: now })
      this.system.spawn(name, handler)
      return
    }

    if (record.count < this.config.maxRestarts) {
      record.count++
      this.system.spawn(name, handler)
      return
    }
  }

  getRestartCount(name: HolonName): number {
    return this.restartCounts.get(name)?.count ?? 0
  }
}
