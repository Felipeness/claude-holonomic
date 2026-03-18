import type { EntityType, RelationType } from "@holon/shared"
import { NotFoundError } from "@holon/shared"
import { PgEventStore } from "./pg-event-store.js"
import { GraphReadModel } from "./read-model.js"
import type { PgClient } from "./pg-client.js"
import type { GraphEntity, GraphEvent, GraphQuery, GraphRelation, GraphTraversal } from "./types.js"

let idCounter = 0
const generateId = (prefix: string): string => `${prefix}-${Date.now()}-${++idCounter}`

export class PgGraphMemory {
  private readonly eventStore: PgEventStore
  private readonly readModel: GraphReadModel
  private lastAppliedSequence = 0
  private initialized = false

  constructor(pg: PgClient) {
    this.eventStore = new PgEventStore(pg)
    this.readModel = new GraphReadModel()
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    const envelopes = await this.eventStore.getAll()
    for (const envelope of envelopes) {
      this.readModel.apply(envelope.event)
      this.lastAppliedSequence = envelope.sequenceNumber
    }
    this.initialized = true
  }

  async createEntity(
    type: EntityType,
    name: string,
    metadata: Record<string, unknown> = {},
  ): Promise<GraphEntity> {
    await this.ensureInitialized()

    const entity: GraphEntity = {
      id: generateId("ent"),
      type,
      name,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await this.applyEvent({ _tag: "EntityCreated", entity })
    return entity
  }

  async updateEntity(
    id: string,
    changes: Partial<Pick<GraphEntity, "name" | "metadata">>,
  ): Promise<GraphEntity> {
    await this.ensureInitialized()

    const existing = this.readModel.getEntity(id)
    if (!existing) {
      throw new NotFoundError({ entity: "GraphEntity", id })
    }

    await this.applyEvent({ _tag: "EntityUpdated", id, changes })
    return this.readModel.getEntity(id)!
  }

  async deleteEntity(id: string): Promise<void> {
    await this.ensureInitialized()

    const existing = this.readModel.getEntity(id)
    if (!existing) {
      throw new NotFoundError({ entity: "GraphEntity", id })
    }

    await this.applyEvent({ _tag: "EntityDeleted", id })
  }

  async createRelation(
    fromId: string,
    toId: string,
    type: RelationType,
    weight = 1.0,
    metadata: Record<string, unknown> = {},
  ): Promise<GraphRelation> {
    await this.ensureInitialized()

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

    await this.applyEvent({ _tag: "RelationCreated", relation })
    return relation
  }

  async deleteRelation(id: string): Promise<void> {
    await this.ensureInitialized()

    const existing = this.readModel.getRelation(id)
    if (!existing) {
      throw new NotFoundError({ entity: "GraphRelation", id })
    }

    await this.applyEvent({ _tag: "RelationDeleted", id })
  }

  async updateRelationWeight(id: string, weight: number): Promise<void> {
    await this.ensureInitialized()

    const existing = this.readModel.getRelation(id)
    if (!existing) {
      throw new NotFoundError({ entity: "GraphRelation", id })
    }

    await this.applyEvent({ _tag: "RelationWeightUpdated", id, weight })
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

  async eventCount(): Promise<number> {
    return this.eventStore.count()
  }

  async getEventLog() {
    return this.eventStore.getAll()
  }

  private async applyEvent(event: GraphEvent): Promise<void> {
    const envelope = await this.eventStore.append(event)
    this.readModel.apply(event)
    this.lastAppliedSequence = envelope.sequenceNumber
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }
}
