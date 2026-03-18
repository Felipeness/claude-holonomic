import type { GraphEvent } from "./types.js"

export interface EventEnvelope {
  readonly sequenceNumber: number
  readonly timestamp: Date
  readonly event: GraphEvent
}

export class InMemoryEventStore {
  private events: EventEnvelope[] = []
  private sequenceCounter = 0

  append(event: GraphEvent): EventEnvelope {
    const envelope: EventEnvelope = {
      sequenceNumber: ++this.sequenceCounter,
      timestamp: new Date(),
      event,
    }
    this.events.push(envelope)
    return envelope
  }

  appendBatch(events: readonly GraphEvent[]): readonly EventEnvelope[] {
    return events.map((e) => this.append(e))
  }

  getAll(): readonly EventEnvelope[] {
    return [...this.events]
  }

  getSince(sequenceNumber: number): readonly EventEnvelope[] {
    return this.events.filter((e) => e.sequenceNumber > sequenceNumber)
  }

  getByTag(tag: GraphEvent["_tag"]): readonly EventEnvelope[] {
    return this.events.filter((e) => e.event._tag === tag)
  }

  count(): number {
    return this.events.length
  }

  clear(): void {
    this.events = []
    this.sequenceCounter = 0
  }
}
