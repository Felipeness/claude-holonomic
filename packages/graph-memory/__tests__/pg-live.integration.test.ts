import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { PgClient } from "../src/pg-client.js"
import { PgGraphMemory } from "../src/pg-graph-memory.js"
import { PgEventStore } from "../src/pg-event-store.js"
import { ENTITY_TYPE, RELATION_TYPE } from "@holon/shared"

const PG_URL = process.env.PG_URL ?? "postgresql://holonomic:holonomic_dev@localhost:5432/holonomic"

describe.skipIf(!process.env.PG_INTEGRATION)("Postgres live integration", () => {
  let pg: PgClient
  let graph: PgGraphMemory

  beforeAll(async () => {
    pg = new PgClient(PG_URL)
    await pg.query("DELETE FROM graph_relations")
    await pg.query("DELETE FROM graph_entities")
    await pg.query("DELETE FROM event_store WHERE source = 'graph-memory'")
    graph = new PgGraphMemory(pg)
    await graph.initialize()
  })

  afterAll(async () => {
    await pg.query("DELETE FROM graph_relations")
    await pg.query("DELETE FROM graph_entities")
    await pg.query("DELETE FROM event_store WHERE source = 'graph-memory'")
    await pg.end()
  })

  it("PgEventStore: append and retrieve", async () => {
    const store = new PgEventStore(pg)
    const entity = {
      id: "ent-test-pg-1",
      type: ENTITY_TYPE.FILE,
      name: "test.ts",
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const envelope = await store.append({ _tag: "EntityCreated", entity })
    expect(envelope.sequenceNumber).toBeGreaterThan(0)
    expect(envelope.event._tag).toBe("EntityCreated")

    const all = await store.getAll()
    expect(all.length).toBeGreaterThanOrEqual(1)

    const byTag = await store.getByTag("EntityCreated")
    expect(byTag.length).toBeGreaterThanOrEqual(1)
  })

  it("PgGraphMemory: create and query entity", async () => {
    const entity = await graph.createEntity(ENTITY_TYPE.FILE, "integration.ts", {
      language: "typescript",
    })

    expect(entity.name).toBe("integration.ts")
    expect(entity.type).toBe(ENTITY_TYPE.FILE)

    const found = graph.getEntity(entity.id)
    expect(found).toBeDefined()
    expect(found!.name).toBe("integration.ts")
  })

  it("PgGraphMemory: create relation", async () => {
    const a = await graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
    const b = await graph.createEntity(ENTITY_TYPE.FILE, "b.ts")

    const rel = await graph.createRelation(a.id, b.id, RELATION_TYPE.DEPENDS_ON, 0.9)
    expect(rel.weight).toBe(0.9)

    const outgoing = graph.getOutgoingRelations(a.id)
    expect(outgoing).toHaveLength(1)
    expect(outgoing[0]!.toId).toBe(b.id)
  })

  it("PgGraphMemory: query entities by type", async () => {
    const files = graph.query({ entityType: ENTITY_TYPE.FILE })
    expect(files.length).toBeGreaterThanOrEqual(1)
  })

  it("PgGraphMemory: events persist and count", async () => {
    const count = await graph.eventCount()
    expect(count).toBeGreaterThanOrEqual(4)
  })
})
