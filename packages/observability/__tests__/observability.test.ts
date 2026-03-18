import { describe, it, expect, beforeEach } from "vitest"
import {
  StructuredLogger,
  InMemoryLogSink,
  Tracer,
  Counter,
  Gauge,
  Histogram,
  MetricsRegistry,
} from "../src/index.js"

describe("StructuredLogger", () => {
  let sink: InMemoryLogSink
  let logger: StructuredLogger

  beforeEach(() => {
    sink = new InMemoryLogSink()
    logger = new StructuredLogger([sink], "debug")
  })

  it("logs at different levels", () => {
    logger.debug("debug msg")
    logger.info("info msg")
    logger.warn("warn msg")
    logger.error("error msg")

    const entries = sink.getEntries()
    expect(entries).toHaveLength(4)
    expect(entries.map((e) => e.level)).toEqual(["debug", "info", "warn", "error"])
  })

  it("filters by min level", () => {
    const warnLogger = new StructuredLogger([sink], "warn")
    warnLogger.debug("nope")
    warnLogger.info("nope")
    warnLogger.warn("yes")
    warnLogger.error("yes")

    expect(sink.getEntries()).toHaveLength(2)
  })

  it("includes context in log entries", () => {
    logger.info("user action", { userId: "123", action: "login" })

    const entry = sink.getEntries()[0]!
    expect(entry.context).toEqual({ userId: "123", action: "login" })
  })

  it("creates child logger with inherited context", () => {
    const child = logger.child({ source: "brain", correlationId: "abc" })
    child.info("processing")

    const entry = sink.getEntries()[0]!
    expect(entry.source).toBe("brain")
    expect(entry.correlationId).toBe("abc")
  })

  it("filters entries by level", () => {
    logger.info("a")
    logger.error("b")
    logger.info("c")

    expect(sink.getByLevel("error")).toHaveLength(1)
    expect(sink.getByLevel("info")).toHaveLength(2)
  })
})

describe("Tracer", () => {
  let tracer: Tracer

  beforeEach(() => {
    tracer = new Tracer()
  })

  it("creates spans", () => {
    const span = tracer.startSpan("test-op")
    expect(span.name).toBe("test-op")
    expect(span.traceId).toBeTruthy()
    expect(span.spanId).toBeTruthy()
    expect(span.status).toBe("ok")
  })

  it("ends spans with timing", () => {
    const span = tracer.startSpan("timed")
    tracer.endSpan(span)
    expect(span.endTime).toBeDefined()
    expect(span.endTime!).toBeGreaterThanOrEqual(span.startTime)
  })

  it("traces async operations", async () => {
    const result = await tracer.trace("async-op", async () => {
      return 42
    })

    expect(result).toBe(42)
    const spans = tracer.getSpans()
    expect(spans).toHaveLength(1)
    expect(spans[0]!.endTime).toBeDefined()
  })

  it("marks span as error on failure", async () => {
    try {
      await tracer.trace("failing", async () => {
        throw new Error("boom")
      })
    } catch {
      /* expected */
    }

    const spans = tracer.getSpans()
    expect(spans[0]!.status).toBe("error")
    expect(spans[0]!.attributes["error"]).toBe("boom")
  })

  it("supports parent-child spans", () => {
    const parent = tracer.startSpan("parent")
    const child = tracer.startSpan("child", parent.spanId, parent.traceId)

    expect(child.parentSpanId).toBe(parent.spanId)
    expect(child.traceId).toBe(parent.traceId)
  })
})

describe("Metrics", () => {
  it("counter increments", () => {
    const counter = new Counter("requests_total")
    counter.inc()
    counter.inc(5)
    expect(counter.value).toBe(6)
  })

  it("gauge sets and adjusts", () => {
    const gauge = new Gauge("active_connections")
    gauge.set(10)
    expect(gauge.value).toBe(10)
    gauge.inc(3)
    expect(gauge.value).toBe(13)
    gauge.dec(5)
    expect(gauge.value).toBe(8)
  })

  it("histogram observes and computes stats", () => {
    const hist = new Histogram("response_time_ms")
    hist.observe(100)
    hist.observe(200)
    hist.observe(300)

    expect(hist.count()).toBe(3)
    expect(hist.sum()).toBe(600)
    expect(hist.mean()).toBe(200)
    expect(hist.percentile(50)).toBe(200)
    expect(hist.percentile(99)).toBe(300)
  })

  it("histogram handles empty", () => {
    const hist = new Histogram("empty")
    expect(hist.mean()).toBe(0)
    expect(hist.percentile(50)).toBe(0)
  })

  it("registry manages metrics", () => {
    const registry = new MetricsRegistry()
    const counter = registry.counter("hits", { path: "/api" })
    counter.inc(10)

    const gauge = registry.gauge("cpu", { host: "web1" })
    gauge.set(0.85)

    const all = registry.getAllMetrics()
    expect(all).toHaveLength(2)
  })

  it("registry returns same metric for same key", () => {
    const registry = new MetricsRegistry()
    const a = registry.counter("x")
    const b = registry.counter("x")
    expect(a).toBe(b)
  })
})
