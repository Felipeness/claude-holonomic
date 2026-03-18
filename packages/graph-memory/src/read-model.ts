import type { EntityType, RelationType } from "@holon/shared"
import type { GraphEntity, GraphEvent, GraphQuery, GraphRelation, GraphTraversal } from "./types.js"

export class GraphReadModel {
  private entities = new Map<string, GraphEntity>()
  private relations = new Map<string, GraphRelation>()
  private outgoing = new Map<string, Set<string>>()
  private incoming = new Map<string, Set<string>>()

  apply(event: GraphEvent): void {
    switch (event._tag) {
      case "EntityCreated":
        this.entities.set(event.entity.id, event.entity)
        break

      case "EntityUpdated": {
        const existing = this.entities.get(event.id)
        if (existing) {
          this.entities.set(event.id, {
            ...existing,
            ...event.changes,
            metadata: { ...existing.metadata, ...event.changes.metadata },
            updatedAt: new Date(),
          })
        }
        break
      }

      case "EntityDeleted":
        this.entities.delete(event.id)
        this.removeRelationsFor(event.id)
        break

      case "RelationCreated":
        this.relations.set(event.relation.id, event.relation)
        this.addToIndex(this.outgoing, event.relation.fromId, event.relation.id)
        this.addToIndex(this.incoming, event.relation.toId, event.relation.id)
        break

      case "RelationDeleted": {
        const rel = this.relations.get(event.id)
        if (rel) {
          this.removeFromIndex(this.outgoing, rel.fromId, event.id)
          this.removeFromIndex(this.incoming, rel.toId, event.id)
          this.relations.delete(event.id)
        }
        break
      }

      case "RelationWeightUpdated": {
        const r = this.relations.get(event.id)
        if (r) {
          this.relations.set(event.id, { ...r, weight: event.weight })
        }
        break
      }
    }
  }

  getEntity(id: string): GraphEntity | undefined {
    return this.entities.get(id)
  }

  getRelation(id: string): GraphRelation | undefined {
    return this.relations.get(id)
  }

  query(q: GraphQuery): readonly GraphEntity[] {
    let results = Array.from(this.entities.values())

    if (q.entityType) {
      results = results.filter((e) => e.type === q.entityType)
    }

    if (q.name) {
      const lower = q.name.toLowerCase()
      results = results.filter((e) => e.name.toLowerCase().includes(lower))
    }

    if (q.relatedTo) {
      const relatedIds = this.getRelatedEntityIds(q.relatedTo, q.relationType)
      results = results.filter((e) => relatedIds.has(e.id))
    }

    if (q.limit && q.limit > 0) {
      results = results.slice(0, q.limit)
    }

    return results
  }

  traverse(params: GraphTraversal): readonly GraphEntity[] {
    const visited = new Set<string>()
    const result: GraphEntity[] = []

    const visit = (id: string, depth: number): void => {
      if (depth > params.maxDepth || visited.has(id)) return
      visited.add(id)

      const entity = this.entities.get(id)
      if (entity && id !== params.startId) {
        result.push(entity)
      }

      const neighborIds = this.getNeighborIds(id, params.direction, params.relationTypes)
      for (const neighborId of neighborIds) {
        visit(neighborId, depth + 1)
      }
    }

    visit(params.startId, 0)
    return result
  }

  entityCount(): number {
    return this.entities.size
  }

  relationCount(): number {
    return this.relations.size
  }

  getOutgoingRelations(entityId: string): readonly GraphRelation[] {
    const relIds = this.outgoing.get(entityId)
    if (!relIds) return []
    return Array.from(relIds)
      .map((id) => this.relations.get(id))
      .filter((r): r is GraphRelation => r !== undefined)
  }

  getIncomingRelations(entityId: string): readonly GraphRelation[] {
    const relIds = this.incoming.get(entityId)
    if (!relIds) return []
    return Array.from(relIds)
      .map((id) => this.relations.get(id))
      .filter((r): r is GraphRelation => r !== undefined)
  }

  private getRelatedEntityIds(entityId: string, relationType?: RelationType): Set<string> {
    const ids = new Set<string>()
    const outRelIds = this.outgoing.get(entityId) ?? new Set()
    const inRelIds = this.incoming.get(entityId) ?? new Set()

    for (const relId of outRelIds) {
      const rel = this.relations.get(relId)
      if (rel && (!relationType || rel.type === relationType)) {
        ids.add(rel.toId)
      }
    }

    for (const relId of inRelIds) {
      const rel = this.relations.get(relId)
      if (rel && (!relationType || rel.type === relationType)) {
        ids.add(rel.fromId)
      }
    }

    return ids
  }

  private getNeighborIds(
    entityId: string,
    direction: "outgoing" | "incoming" | "both",
    relationTypes?: readonly RelationType[],
  ): string[] {
    const ids: string[] = []
    const typeSet = relationTypes ? new Set(relationTypes) : undefined

    if (direction === "outgoing" || direction === "both") {
      const outRelIds = this.outgoing.get(entityId) ?? new Set()
      for (const relId of outRelIds) {
        const rel = this.relations.get(relId)
        if (rel && (!typeSet || typeSet.has(rel.type))) {
          ids.push(rel.toId)
        }
      }
    }

    if (direction === "incoming" || direction === "both") {
      const inRelIds = this.incoming.get(entityId) ?? new Set()
      for (const relId of inRelIds) {
        const rel = this.relations.get(relId)
        if (rel && (!typeSet || typeSet.has(rel.type))) {
          ids.push(rel.fromId)
        }
      }
    }

    return ids
  }

  private removeRelationsFor(entityId: string): void {
    const outRelIds = this.outgoing.get(entityId) ?? new Set()
    for (const relId of outRelIds) {
      const rel = this.relations.get(relId)
      if (rel) {
        this.removeFromIndex(this.incoming, rel.toId, relId)
        this.relations.delete(relId)
      }
    }
    this.outgoing.delete(entityId)

    const inRelIds = this.incoming.get(entityId) ?? new Set()
    for (const relId of inRelIds) {
      const rel = this.relations.get(relId)
      if (rel) {
        this.removeFromIndex(this.outgoing, rel.fromId, relId)
        this.relations.delete(relId)
      }
    }
    this.incoming.delete(entityId)
  }

  private addToIndex(index: Map<string, Set<string>>, key: string, value: string): void {
    const set = index.get(key) ?? new Set()
    set.add(value)
    index.set(key, set)
  }

  private removeFromIndex(index: Map<string, Set<string>>, key: string, value: string): void {
    const set = index.get(key)
    if (set) {
      set.delete(value)
      if (set.size === 0) index.delete(key)
    }
  }
}
