export interface MetricPoint {
  readonly name: string
  readonly value: number
  readonly timestamp: number
  readonly labels: Record<string, string>
}

export class Counter {
  private _value = 0
  readonly name: string
  private readonly labels: Record<string, string>

  constructor(name: string, labels: Record<string, string> = {}) {
    this.name = name
    this.labels = labels
  }

  inc(amount = 1): void {
    this._value += amount
  }

  get value(): number {
    return this._value
  }

  toMetricPoint(): MetricPoint {
    return {
      name: this.name,
      value: this._value,
      timestamp: Date.now(),
      labels: this.labels,
    }
  }
}

export class Gauge {
  private _value = 0
  readonly name: string
  private readonly labels: Record<string, string>

  constructor(name: string, labels: Record<string, string> = {}) {
    this.name = name
    this.labels = labels
  }

  set(value: number): void {
    this._value = value
  }

  inc(amount = 1): void {
    this._value += amount
  }

  dec(amount = 1): void {
    this._value -= amount
  }

  get value(): number {
    return this._value
  }

  toMetricPoint(): MetricPoint {
    return {
      name: this.name,
      value: this._value,
      timestamp: Date.now(),
      labels: this.labels,
    }
  }
}

export class Histogram {
  private values: number[] = []
  readonly name: string
  private readonly labels: Record<string, string>

  constructor(name: string, labels: Record<string, string> = {}) {
    this.name = name
    this.labels = labels
  }

  observe(value: number): void {
    this.values.push(value)
  }

  count(): number {
    return this.values.length
  }

  sum(): number {
    return this.values.reduce((a, b) => a + b, 0)
  }

  mean(): number {
    if (this.values.length === 0) return 0
    return this.sum() / this.values.length
  }

  percentile(p: number): number {
    if (this.values.length === 0) return 0
    const sorted = [...this.values].sort((a, b) => a - b)
    const idx = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, idx)]!
  }
}

export class MetricsRegistry {
  private counters = new Map<string, Counter>()
  private gauges = new Map<string, Gauge>()
  private histograms = new Map<string, Histogram>()

  counter(name: string, labels: Record<string, string> = {}): Counter {
    const key = `${name}:${JSON.stringify(labels)}`
    const existing = this.counters.get(key)
    if (existing) return existing

    const counter = new Counter(name, labels)
    this.counters.set(key, counter)
    return counter
  }

  gauge(name: string, labels: Record<string, string> = {}): Gauge {
    const key = `${name}:${JSON.stringify(labels)}`
    const existing = this.gauges.get(key)
    if (existing) return existing

    const gauge = new Gauge(name, labels)
    this.gauges.set(key, gauge)
    return gauge
  }

  histogram(name: string, labels: Record<string, string> = {}): Histogram {
    const key = `${name}:${JSON.stringify(labels)}`
    const existing = this.histograms.get(key)
    if (existing) return existing

    const histogram = new Histogram(name, labels)
    this.histograms.set(key, histogram)
    return histogram
  }

  getAllMetrics(): readonly MetricPoint[] {
    const points: MetricPoint[] = []
    for (const c of this.counters.values()) points.push(c.toMetricPoint())
    for (const g of this.gauges.values()) points.push(g.toMetricPoint())
    return points
  }
}
