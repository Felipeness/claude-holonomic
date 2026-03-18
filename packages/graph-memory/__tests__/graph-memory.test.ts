import { describe, it, expect, beforeEach } from "vitest"
import { ENTITY_TYPE, RELATION_TYPE } from "@holon/shared"
import { GraphMemory } from "../src/graph-memory.js"

describe("GraphMemory", () => {
  let graph: GraphMemory

  beforeEach(() => {
    graph = new GraphMemory()
  })

  describe("entity operations", () => {
    it("creates an entity with type and name", () => {
      const entity = graph.createEntity(ENTITY_TYPE.FILE, "auth.ts")

      expect(entity.type).toBe("file")
      expect(entity.name).toBe("auth.ts")
      expect(entity.id).toBeTruthy()
      expect(entity.createdAt).toBeInstanceOf(Date)
    })

    it("creates entities with metadata", () => {
      const entity = graph.createEntity(ENTITY_TYPE.FUNCTION, "handleLogin", {
        language: "typescript",
        lines: 42,
      })

      expect(entity.metadata).toEqual({ language: "typescript", lines: 42 })
    })

    it("retrieves entity by id", () => {
      const created = graph.createEntity(ENTITY_TYPE.PROJECT, "my-app")
      const retrieved = graph.getEntity(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved!.name).toBe("my-app")
    })

    it("returns undefined for unknown entity id", () => {
      expect(graph.getEntity("nonexistent")).toBeUndefined()
    })

    it("updates entity name", () => {
      const entity = graph.createEntity(ENTITY_TYPE.FILE, "old-name.ts")
      const updated = graph.updateEntity(entity.id, { name: "new-name.ts" })

      expect(updated.name).toBe("new-name.ts")
      expect(updated.type).toBe("file")
    })

    it("updates entity metadata", () => {
      const entity = graph.createEntity(ENTITY_TYPE.PATTERN, "singleton", { usage: 3 })
      const updated = graph.updateEntity(entity.id, { metadata: { usage: 4, deprecated: false } })

      expect(updated.metadata).toEqual({ usage: 4, deprecated: false })
    })

    it("throws NotFoundError when updating nonexistent entity", () => {
      expect(() => graph.updateEntity("fake-id", { name: "nope" })).toThrow()
    })

    it("deletes entity", () => {
      const entity = graph.createEntity(ENTITY_TYPE.FILE, "temp.ts")
      graph.deleteEntity(entity.id)

      expect(graph.getEntity(entity.id)).toBeUndefined()
      expect(graph.entityCount()).toBe(0)
    })

    it("throws NotFoundError when deleting nonexistent entity", () => {
      expect(() => graph.deleteEntity("fake-id")).toThrow()
    })

    it("tracks entity count", () => {
      expect(graph.entityCount()).toBe(0)
      graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      graph.createEntity(ENTITY_TYPE.FILE, "b.ts")
      expect(graph.entityCount()).toBe(2)
    })
  })

  describe("relation operations", () => {
    it("creates a relation between two entities", () => {
      const a = graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      const b = graph.createEntity(ENTITY_TYPE.FILE, "b.ts")

      const rel = graph.createRelation(a.id, b.id, RELATION_TYPE.DEPENDS_ON)

      expect(rel.fromId).toBe(a.id)
      expect(rel.toId).toBe(b.id)
      expect(rel.type).toBe("depends_on")
      expect(rel.weight).toBe(1.0)
    })

    it("creates relation with custom weight", () => {
      const a = graph.createEntity(ENTITY_TYPE.PATTERN, "observer")
      const b = graph.createEntity(ENTITY_TYPE.DECISION, "use-events")

      const rel = graph.createRelation(a.id, b.id, RELATION_TYPE.SUCCEEDED_WITH, 0.8)
      expect(rel.weight).toBe(0.8)
    })

    it("throws when creating relation with nonexistent source", () => {
      const b = graph.createEntity(ENTITY_TYPE.FILE, "b.ts")
      expect(() => graph.createRelation("fake", b.id, RELATION_TYPE.DEPENDS_ON)).toThrow()
    })

    it("throws when creating relation with nonexistent target", () => {
      const a = graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      expect(() => graph.createRelation(a.id, "fake", RELATION_TYPE.DEPENDS_ON)).toThrow()
    })

    it("gets outgoing relations", () => {
      const a = graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      const b = graph.createEntity(ENTITY_TYPE.FILE, "b.ts")
      const c = graph.createEntity(ENTITY_TYPE.FILE, "c.ts")

      graph.createRelation(a.id, b.id, RELATION_TYPE.DEPENDS_ON)
      graph.createRelation(a.id, c.id, RELATION_TYPE.DEPENDS_ON)

      const outgoing = graph.getOutgoingRelations(a.id)
      expect(outgoing).toHaveLength(2)
    })

    it("gets incoming relations", () => {
      const a = graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      const b = graph.createEntity(ENTITY_TYPE.FILE, "b.ts")

      graph.createRelation(a.id, b.id, RELATION_TYPE.DEPENDS_ON)

      expect(graph.getIncomingRelations(b.id)).toHaveLength(1)
      expect(graph.getIncomingRelations(a.id)).toHaveLength(0)
    })

    it("updates relation weight", () => {
      const a = graph.createEntity(ENTITY_TYPE.PREFERENCE, "tabs")
      const b = graph.createEntity(ENTITY_TYPE.PATTERN, "indentation")

      const rel = graph.createRelation(a.id, b.id, RELATION_TYPE.PREFERS, 0.5)
      graph.updateRelationWeight(rel.id, 0.9)

      const outgoing = graph.getOutgoingRelations(a.id)
      expect(outgoing[0]!.weight).toBe(0.9)
    })

    it("deletes relation", () => {
      const a = graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      const b = graph.createEntity(ENTITY_TYPE.FILE, "b.ts")

      const rel = graph.createRelation(a.id, b.id, RELATION_TYPE.DEPENDS_ON)
      graph.deleteRelation(rel.id)

      expect(graph.relationCount()).toBe(0)
      expect(graph.getOutgoingRelations(a.id)).toHaveLength(0)
    })

    it("cascades entity deletion to relations", () => {
      const a = graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      const b = graph.createEntity(ENTITY_TYPE.FILE, "b.ts")

      graph.createRelation(a.id, b.id, RELATION_TYPE.DEPENDS_ON)
      graph.deleteEntity(a.id)

      expect(graph.relationCount()).toBe(0)
      expect(graph.getIncomingRelations(b.id)).toHaveLength(0)
    })
  })

  describe("querying", () => {
    it("queries entities by type", () => {
      graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      graph.createEntity(ENTITY_TYPE.FILE, "b.ts")
      graph.createEntity(ENTITY_TYPE.FUNCTION, "main")

      const files = graph.query({ entityType: ENTITY_TYPE.FILE })
      expect(files).toHaveLength(2)
    })

    it("queries entities by name substring", () => {
      graph.createEntity(ENTITY_TYPE.FILE, "auth-middleware.ts")
      graph.createEntity(ENTITY_TYPE.FILE, "auth-guard.ts")
      graph.createEntity(ENTITY_TYPE.FILE, "payment.ts")

      const authFiles = graph.query({ name: "auth" })
      expect(authFiles).toHaveLength(2)
    })

    it("queries entities by name case-insensitively", () => {
      graph.createEntity(ENTITY_TYPE.LIBRARY, "React")

      const results = graph.query({ name: "react" })
      expect(results).toHaveLength(1)
    })

    it("queries related entities", () => {
      const project = graph.createEntity(ENTITY_TYPE.PROJECT, "my-app")
      const file1 = graph.createEntity(ENTITY_TYPE.FILE, "index.ts")
      const file2 = graph.createEntity(ENTITY_TYPE.FILE, "app.ts")
      const unrelated = graph.createEntity(ENTITY_TYPE.FILE, "other.ts")

      graph.createRelation(project.id, file1.id, RELATION_TYPE.DEPENDS_ON)
      graph.createRelation(project.id, file2.id, RELATION_TYPE.DEPENDS_ON)

      const related = graph.query({ relatedTo: project.id })
      expect(related).toHaveLength(2)
      expect(related.map((e) => e.name)).toContain("index.ts")
      expect(related.map((e) => e.name)).toContain("app.ts")
      expect(related.map((e) => e.name)).not.toContain("other.ts")
    })

    it("queries with limit", () => {
      for (let i = 0; i < 10; i++) {
        graph.createEntity(ENTITY_TYPE.FILE, `file-${i}.ts`)
      }

      const limited = graph.query({ entityType: ENTITY_TYPE.FILE, limit: 3 })
      expect(limited).toHaveLength(3)
    })
  })

  describe("graph traversal", () => {
    it("traverses outgoing relations", () => {
      const a = graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      const b = graph.createEntity(ENTITY_TYPE.FILE, "b.ts")
      const c = graph.createEntity(ENTITY_TYPE.FILE, "c.ts")

      graph.createRelation(a.id, b.id, RELATION_TYPE.DEPENDS_ON)
      graph.createRelation(b.id, c.id, RELATION_TYPE.DEPENDS_ON)

      const reachable = graph.traverse({
        startId: a.id,
        direction: "outgoing",
        maxDepth: 3,
      })

      expect(reachable).toHaveLength(2)
      expect(reachable.map((e) => e.name)).toContain("b.ts")
      expect(reachable.map((e) => e.name)).toContain("c.ts")
    })

    it("respects max depth", () => {
      const a = graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      const b = graph.createEntity(ENTITY_TYPE.FILE, "b.ts")
      const c = graph.createEntity(ENTITY_TYPE.FILE, "c.ts")

      graph.createRelation(a.id, b.id, RELATION_TYPE.DEPENDS_ON)
      graph.createRelation(b.id, c.id, RELATION_TYPE.DEPENDS_ON)

      const reachable = graph.traverse({
        startId: a.id,
        direction: "outgoing",
        maxDepth: 1,
      })

      expect(reachable).toHaveLength(1)
      expect(reachable[0]!.name).toBe("b.ts")
    })

    it("traverses incoming relations", () => {
      const a = graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      const b = graph.createEntity(ENTITY_TYPE.FILE, "b.ts")

      graph.createRelation(a.id, b.id, RELATION_TYPE.DEPENDS_ON)

      const incoming = graph.traverse({
        startId: b.id,
        direction: "incoming",
        maxDepth: 1,
      })

      expect(incoming).toHaveLength(1)
      expect(incoming[0]!.name).toBe("a.ts")
    })

    it("filters by relation type", () => {
      const file = graph.createEntity(ENTITY_TYPE.FILE, "service.ts")
      const dep = graph.createEntity(ENTITY_TYPE.LIBRARY, "express")
      const pattern = graph.createEntity(ENTITY_TYPE.PATTERN, "middleware")

      graph.createRelation(file.id, dep.id, RELATION_TYPE.DEPENDS_ON)
      graph.createRelation(file.id, pattern.id, RELATION_TYPE.USED_IN)

      const deps = graph.traverse({
        startId: file.id,
        direction: "outgoing",
        maxDepth: 1,
        relationTypes: [RELATION_TYPE.DEPENDS_ON],
      })

      expect(deps).toHaveLength(1)
      expect(deps[0]!.name).toBe("express")
    })

    it("handles cycles without infinite loop", () => {
      const a = graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      const b = graph.createEntity(ENTITY_TYPE.FILE, "b.ts")

      graph.createRelation(a.id, b.id, RELATION_TYPE.DEPENDS_ON)
      graph.createRelation(b.id, a.id, RELATION_TYPE.DEPENDS_ON)

      const reachable = graph.traverse({
        startId: a.id,
        direction: "outgoing",
        maxDepth: 10,
      })

      expect(reachable).toHaveLength(1)
      expect(reachable[0]!.name).toBe("b.ts")
    })
  })

  describe("event sourcing", () => {
    it("tracks all events", () => {
      graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      graph.createEntity(ENTITY_TYPE.FILE, "b.ts")

      expect(graph.eventCount()).toBe(2)
    })

    it("event log captures full history", () => {
      const entity = graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      graph.updateEntity(entity.id, { name: "b.ts" })
      graph.deleteEntity(entity.id)

      const log = graph.getEventLog()
      expect(log).toHaveLength(3)
      expect(log[0]!.event._tag).toBe("EntityCreated")
      expect(log[1]!.event._tag).toBe("EntityUpdated")
      expect(log[2]!.event._tag).toBe("EntityDeleted")
    })

    it("event envelopes have sequential numbers", () => {
      graph.createEntity(ENTITY_TYPE.FILE, "a.ts")
      graph.createEntity(ENTITY_TYPE.FILE, "b.ts")

      const log = graph.getEventLog()
      expect(log[0]!.sequenceNumber).toBe(1)
      expect(log[1]!.sequenceNumber).toBe(2)
    })
  })
})
