import type { EntityType, RelationType } from "@holon/shared"
import { NotFoundError } from "@holon/shared"
import { InMemoryEventStore } from "./event-store.js"
import { GraphReadModel } from "./read-model.js"
import type { GraphEntity, GraphEvent, GraphQuery, GraphRelation, GraphTraversal } from "./types.js"

let idCounter = 0
const generateId = (prefix: string): string => `${prefix}-${Date.now()}-${++idCounter}`

export class GraphMemory {
  private readonly eventStore: InMemoryEventStore
  private readonly readModel: GraphReadModel
  private lastAppliedSequence = 0

  constructor(
    eventStore?: InMemoryEventStore,
    readModel?: GraphReadModel,
  ) {
    this.eventStore = eventStore ?? new InMemoryEventStore()
    this.readModel = readModel ?? new GraphReadModel()
  }

  createEntity(type: EntityType, name: string, metadata: Record<string, unknown> = {}): GraphEntity {
    const entity: GraphEntity = {
      id: generateId("ent"),
      type,
      name,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.applyEvent({ _tag: "EntityCreated", entity })
    return entity
  }

  updateEntity(id: string, changes: Partial<Pick<GraphEntity, "name" | "metadata">>): GraphEntity {
    const existing = this.readModel.getEntity(id)
    if (!existing) {
      throw new NotFoundError({ entity: "GraphEntity", id })
    }

    this.applyEvent({ _tag: "EntityUpdated", id, changes })
    return this.readModel.getEntity(id)!
  }

  deleteEntity(id: string): void {
    const existing = this.readModel.getEntity(id)
    if (!existing) {
      throw new NotFoundError({ entity: "GraphEntity", id })
    }

    this.applyEvent({ _tag: "EntityDeleted", id })
  }

  createRelation(
    fromId: string,
    toId: string,
    type: RelationType,
    weight = 1.0,
    metadata: Record<string, unknown> = {},
  ): GraphRelation {
    const from = this.readModel.getEntity(fromId)
    if (!from) throw new NotFoundError({ entity: "GraphEntity", id: fromId })

    const to = this.readModel.getEntity(toId)
    if (!to) throw new NotFoundError({ entity: "GraphEntity", id: toId })

    const relation: GraphRelation = {
      id: generateId("rel"),
      fromId,
      toId,
      type,
      weight,
      metadata,
      createdAt: new Date(),
    }

    this.applyEvent({ _tag: "RelationCreated", relation })
    return relation
  }

  deleteRelation(id: string): void {
    const existing = this.readModel.getRelation(id)
    if (!existing) {
      throw new NotFoundError({ entity: "GraphRelation", id })
    }

    this.applyEvent({ _tag: "RelationDeleted", id })
  }

  updateRelationWeight(id: string, weight: number): void {
    const existing = this.readModel.getRelation(id)
    if (!existing) {
      throw new NotFoundError({ entity: "GraphRelation", id })
    }

    this.applyEvent({ _tag: "RelationWeightUpdated", id, weight })
  }

  getEntity(id: string): GraphEntity | undefined {
    return this.readModel.getEntity(id)
  }

  query(q: GraphQuery): readonly GraphEntity[] {
    return this.readModel.query(q)
  }

  traverse(params: GraphTraversal): readonly GraphEntity[] {
    return this.readModel.traverse(params)
  }

  getOutgoingRelations(entityId: string): readonly GraphRelation[] {
    return this.readModel.getOutgoingRelations(entityId)
  }

  getIncomingRelations(entityId: string): readonly GraphRelation[] {
    return this.readModel.getIncomingRelations(entityId)
  }

  entityCount(): number {
    return this.readModel.entityCount()
  }

  relationCount(): number {
    return this.readModel.relationCount()
  }

  eventCount(): number {
    return this.eventStore.count()
  }

  getEventLog() {
    return this.eventStore.getAll()
  }

  private applyEvent(event: GraphEvent): void {
    const envelope = this.eventStore.append(event)
    this.readModel.apply(event)
    this.lastAppliedSequence = envelope.sequenceNumber
  }
}
