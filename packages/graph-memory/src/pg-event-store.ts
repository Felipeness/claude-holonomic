import type { PgClient } from "./pg-client.js"
import type { GraphEvent } from "./types.js"
import type { EventEnvelope } from "./event-store.js"

export class PgEventStore {
  constructor(private readonly pg: PgClient) {}

  async append(event: GraphEvent): Promise<EventEnvelope> {
    const result = await this.pg.query(
      `INSERT INTO event_store (event_id, correlation_id, event_type, source, payload)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING sequence_number, timestamp`,
      [
        crypto.randomUUID(),
        "graph-memory",
        event._tag,
        "graph-memory",
        JSON.stringify(event),
      ],
    )

    const row = result.rows[0]!
    return {
      sequenceNumber: Number(row.sequence_number),
      timestamp: new Date(row.timestamp as string),
      event,
    }
  }

  async appendBatch(events: readonly GraphEvent[]): Promise<readonly EventEnvelope[]> {
    const envelopes: EventEnvelope[] = []
    for (const event of events) {
      envelopes.push(await this.append(event))
    }
    return envelopes
  }

  async getAll(): Promise<readonly EventEnvelope[]> {
    const result = await this.pg.query(
      `SELECT sequence_number, payload, timestamp FROM event_store
       WHERE source = 'graph-memory'
       ORDER BY sequence_number ASC`,
    )
    return result.rows.map(rowToEnvelope)
  }

  async getSince(sequenceNumber: number): Promise<readonly EventEnvelope[]> {
    const result = await this.pg.query(
      `SELECT sequence_number, payload, timestamp FROM event_store
       WHERE source = 'graph-memory' AND sequence_number > $1
       ORDER BY sequence_number ASC`,
      [sequenceNumber],
    )
    return result.rows.map(rowToEnvelope)
  }

  async getByTag(tag: GraphEvent["_tag"]): Promise<readonly EventEnvelope[]> {
    const result = await this.pg.query(
      `SELECT sequence_number, payload, timestamp FROM event_store
       WHERE source = 'graph-memory' AND event_type = $1
       ORDER BY sequence_number ASC`,
      [tag],
    )
    return result.rows.map(rowToEnvelope)
  }

  async count(): Promise<number> {
    const result = await this.pg.query(
      `SELECT COUNT(*) as cnt FROM event_store WHERE source = 'graph-memory'`,
    )
    return Number(result.rows[0]!.cnt)
  }

  async clear(): Promise<void> {
    await this.pg.query(`DELETE FROM event_store WHERE source = 'graph-memory'`)
  }
}

const rowToEnvelope = (row: Record<string, unknown>): EventEnvelope => ({
  sequenceNumber: Number(row.sequence_number),
  timestamp: new Date(row.timestamp as string),
  event: row.payload as GraphEvent,
})
