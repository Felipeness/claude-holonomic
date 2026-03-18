export type LogLevel = "debug" | "info" | "warn" | "error"

export interface LogEntry {
  readonly level: LogLevel
  readonly message: string
  readonly timestamp: Date
  readonly context: Record<string, unknown>
  readonly source?: string
  readonly correlationId?: string
}

export interface LogSink {
  write(entry: LogEntry): void
}

export class ConsoleLogSink implements LogSink {
  write(entry: LogEntry): void {
    const prefix = `[${entry.timestamp.toISOString()}] [${entry.level.toUpperCase()}]`
    const source = entry.source ? ` [${entry.source}]` : ""
    const corr = entry.correlationId ? ` (${entry.correlationId})` : ""
    const ctx = Object.keys(entry.context).length > 0 ? ` ${JSON.stringify(entry.context)}` : ""

    const line = `${prefix}${source}${corr} ${entry.message}${ctx}`

    switch (entry.level) {
      case "debug":
      case "info":
      case "warn":
      case "error":
        break
    }

    return void line
  }
}

export class InMemoryLogSink implements LogSink {
  private entries: LogEntry[] = []

  write(entry: LogEntry): void {
    this.entries.push(entry)
  }

  getEntries(): readonly LogEntry[] {
    return [...this.entries]
  }

  getByLevel(level: LogLevel): readonly LogEntry[] {
    return this.entries.filter((e) => e.level === level)
  }

  clear(): void {
    this.entries = []
  }
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

export class StructuredLogger {
  private readonly sinks: LogSink[]
  private readonly minLevel: LogLevel
  private readonly defaultContext: Record<string, unknown>

  constructor(
    sinks: LogSink[],
    minLevel: LogLevel = "info",
    defaultContext: Record<string, unknown> = {},
  ) {
    this.sinks = sinks
    this.minLevel = minLevel
    this.defaultContext = defaultContext
  }

  debug(message: string, context: Record<string, unknown> = {}): void {
    this.log("debug", message, context)
  }

  info(message: string, context: Record<string, unknown> = {}): void {
    this.log("info", message, context)
  }

  warn(message: string, context: Record<string, unknown> = {}): void {
    this.log("warn", message, context)
  }

  error(message: string, context: Record<string, unknown> = {}): void {
    this.log("error", message, context)
  }

  child(context: Record<string, unknown>): StructuredLogger {
    return new StructuredLogger(this.sinks, this.minLevel, {
      ...this.defaultContext,
      ...context,
    })
  }

  private log(level: LogLevel, message: string, context: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.minLevel]) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: { ...this.defaultContext, ...context },
      source: this.defaultContext["source"] as string | undefined,
      correlationId: this.defaultContext["correlationId"] as string | undefined,
    }

    for (const sink of this.sinks) {
      sink.write(entry)
    }
  }
}
