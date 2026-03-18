import type { CorrelationId, EventId, HolonId, TaskId } from "./branded-types.js"
import type { DfaState, HolonName } from "./constants.js"

export interface DomainEvent {
  readonly id: EventId
  readonly correlationId: CorrelationId
  readonly timestamp: Date
  readonly source: HolonName
}

export interface TaskCreated extends DomainEvent {
  readonly _tag: "TaskCreated"
  readonly taskId: TaskId
  readonly description: string
  readonly taskType: string
}

export interface PhaseTransitioned extends DomainEvent {
  readonly _tag: "PhaseTransitioned"
  readonly taskId: TaskId
  readonly from: DfaState
  readonly to: DfaState
}

export interface HolonActivated extends DomainEvent {
  readonly _tag: "HolonActivated"
  readonly holonId: HolonId
  readonly holonName: HolonName
}

export interface HolonCompleted extends DomainEvent {
  readonly _tag: "HolonCompleted"
  readonly holonId: HolonId
  readonly holonName: HolonName
  readonly durationMs: number
}

export interface HolonFailed extends DomainEvent {
  readonly _tag: "HolonFailed"
  readonly holonId: HolonId
  readonly holonName: HolonName
  readonly error: string
}

export interface EntityObserved extends DomainEvent {
  readonly _tag: "EntityObserved"
  readonly entityId: string
  readonly entityType: string
  readonly name: string
  readonly metadata: Record<string, unknown>
}

export interface RelationObserved extends DomainEvent {
  readonly _tag: "RelationObserved"
  readonly fromEntityId: string
  readonly toEntityId: string
  readonly relationType: string
  readonly weight: number
}

export type SystemEvent =
  | TaskCreated
  | PhaseTransitioned
  | HolonActivated
  | HolonCompleted
  | HolonFailed
  | EntityObserved
  | RelationObserved
