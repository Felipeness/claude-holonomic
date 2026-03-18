export interface Span {
  readonly traceId: string
  readonly spanId: string
  readonly parentSpanId?: string
  readonly name: string
  readonly startTime: number
  endTime?: number
  readonly attributes: Record<string, unknown>
  status: "ok" | "error"
}

let traceCounter = 0
const generateId = (): string => `${Date.now()}-${++traceCounter}`

export class Tracer {
  private spans: Span[] = []

  startSpan(name: string, parentSpanId?: string, traceId?: string): Span {
    const span: Span = {
      traceId: traceId ?? generateId(),
      spanId: generateId(),
      parentSpanId,
      name,
      startTime: performance.now(),
      attributes: {},
      status: "ok",
    }
    this.spans.push(span)
    return span
  }

  endSpan(span: Span): void {
    span.endTime = performance.now()
  }

  async trace<T>(name: string, operation: (span: Span) => Promise<T>): Promise<T> {
    const span = this.startSpan(name)
    try {
      const result = await operation(span)
      this.endSpan(span)
      return result
    } catch (error) {
      span.status = "error"
      span.attributes["error"] = error instanceof Error ? error.message : String(error)
      this.endSpan(span)
      throw error
    }
  }

  getSpans(): readonly Span[] {
    return [...this.spans]
  }

  getSpansByTrace(traceId: string): readonly Span[] {
    return this.spans.filter((s) => s.traceId === traceId)
  }

  clear(): void {
    this.spans = []
  }
}
