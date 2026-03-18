import type { EntityType, RelationType } from "@holon/shared"

export interface GraphEntity {
  readonly id: string
  readonly type: EntityType
  readonly name: string
  readonly metadata: Record<string, unknown>
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface GraphRelation {
  readonly id: string
  readonly fromId: string
  readonly toId: string
  readonly type: RelationType
  readonly weight: number
  readonly metadata: Record<string, unknown>
  readonly createdAt: Date
}

export type GraphEvent =
  | { readonly _tag: "EntityCreated"; readonly entity: GraphEntity }
  | { readonly _tag: "EntityUpdated"; readonly id: string; readonly changes: Partial<Pick<GraphEntity, "name" | "metadata">> }
  | { readonly _tag: "EntityDeleted"; readonly id: string }
  | { readonly _tag: "RelationCreated"; readonly relation: GraphRelation }
  | { readonly _tag: "RelationDeleted"; readonly id: string }
  | { readonly _tag: "RelationWeightUpdated"; readonly id: string; readonly weight: number }

export interface GraphQuery {
  readonly entityType?: EntityType
  readonly name?: string
  readonly relatedTo?: string
  readonly relationType?: RelationType
  readonly limit?: number
}

export interface GraphTraversal {
  readonly startId: string
  readonly direction: "outgoing" | "incoming" | "both"
  readonly maxDepth: number
  readonly relationTypes?: readonly RelationType[]
}
