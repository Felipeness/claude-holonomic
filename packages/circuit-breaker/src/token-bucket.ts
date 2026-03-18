export interface TokenBucketConfig {
  readonly maxTokens: number
  readonly refillRate: number
  readonly refillIntervalMs: number
}

const DEFAULT_CONFIG: TokenBucketConfig = {
  maxTokens: 10,
  refillRate: 1,
  refillIntervalMs: 1000,
}

export class TokenBucket {
  private tokens: number
  private readonly config: TokenBucketConfig
  private lastRefill: number

  constructor(config?: Partial<TokenBucketConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.tokens = this.config.maxTokens
    this.lastRefill = Date.now()
  }

  tryConsume(count = 1): boolean {
    this.refill()
    if (this.tokens >= count) {
      this.tokens -= count
      return true
    }
    return false
  }

  available(): number {
    this.refill()
    return this.tokens
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const intervals = Math.floor(elapsed / this.config.refillIntervalMs)

    if (intervals > 0) {
      this.tokens = Math.min(this.config.maxTokens, this.tokens + intervals * this.config.refillRate)
      this.lastRefill = now
    }
  }
}
