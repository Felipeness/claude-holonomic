import { CircuitOpenError } from "@holon/shared"

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN" | "DEGRADED"

export type FailureType = "timeout" | "error" | "rejection" | "rate_limit" | "resource_exhaustion"

export interface CircuitBreakerConfig {
  readonly failureThreshold: number
  readonly resetTimeoutMs: number
  readonly halfOpenMax: number
  readonly degradedThreshold: number
  readonly service: string
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  halfOpenMax: 3,
  degradedThreshold: 3,
  service: "unknown",
}

export interface FailureRecord {
  readonly type: FailureType
  readonly timestamp: number
  readonly error: string
}

export class CircuitBreaker {
  private _state: CircuitState = "CLOSED"
  private readonly config: CircuitBreakerConfig
  private failures: FailureRecord[] = []
  private halfOpenAttempts = 0
  private lastFailureTime = 0
  private successCount = 0

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  get state(): CircuitState {
    this.checkStateTransition()
    return this._state
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.checkStateTransition()

    if (this._state === "OPEN") {
      throw new CircuitOpenError({ service: this.config.service })
    }

    if (this._state === "HALF_OPEN" && this.halfOpenAttempts >= this.config.halfOpenMax) {
      throw new CircuitOpenError({ service: this.config.service })
    }

    if (this._state === "HALF_OPEN") {
      this.halfOpenAttempts++
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      const failureType = this.classifyError(error)
      this.onFailure(failureType, error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  recordFailure(type: FailureType, errorMessage = ""): void {
    this.onFailure(type, errorMessage)
  }

  recordSuccess(): void {
    this.onSuccess()
  }

  getFailures(): readonly FailureRecord[] {
    return [...this.failures]
  }

  getFailureCount(): number {
    return this.failures.length
  }

  reset(): void {
    this._state = "CLOSED"
    this.failures = []
    this.halfOpenAttempts = 0
    this.lastFailureTime = 0
    this.successCount = 0
  }

  private onSuccess(): void {
    this.successCount++

    if (this._state === "HALF_OPEN") {
      this._state = "CLOSED"
      this.failures = []
      this.halfOpenAttempts = 0
      this.successCount = 0
    }

    if (this._state === "DEGRADED" && this.successCount >= this.config.degradedThreshold) {
      this._state = "CLOSED"
      this.failures = []
      this.successCount = 0
    }
  }

  private onFailure(type: FailureType, errorMessage: string): void {
    const record: FailureRecord = {
      type,
      timestamp: Date.now(),
      error: errorMessage,
    }
    this.failures.push(record)
    this.lastFailureTime = record.timestamp
    this.successCount = 0

    if (this._state === "HALF_OPEN") {
      this._state = "OPEN"
      this.halfOpenAttempts = 0
      return
    }

    if (this.failures.length >= this.config.failureThreshold) {
      this._state = "OPEN"
    } else if (this.failures.length >= this.config.degradedThreshold) {
      this._state = "DEGRADED"
    }
  }

  private checkStateTransition(): void {
    if (this._state === "OPEN") {
      const elapsed = Date.now() - this.lastFailureTime
      if (elapsed >= this.config.resetTimeoutMs) {
        this._state = "HALF_OPEN"
        this.halfOpenAttempts = 0
      }
    }
  }

  private classifyError(error: unknown): FailureType {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase()
      if (msg.includes("timeout")) return "timeout"
      if (msg.includes("rate") || msg.includes("429")) return "rate_limit"
      if (msg.includes("reject")) return "rejection"
      if (msg.includes("memory") || msg.includes("resource")) return "resource_exhaustion"
    }
    return "error"
  }
}
