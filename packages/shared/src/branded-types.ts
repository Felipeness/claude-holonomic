import { Brand } from "effect"

export type HolonId = string & Brand.Brand<"HolonId">
export const HolonId = Brand.nominal<HolonId>()

export type TaskId = string & Brand.Brand<"TaskId">
export const TaskId = Brand.nominal<TaskId>()

export type EventId = string & Brand.Brand<"EventId">
export const EventId = Brand.nominal<EventId>()

export type CorrelationId = string & Brand.Brand<"CorrelationId">
export const CorrelationId = Brand.nominal<CorrelationId>()

export type SessionId = string & Brand.Brand<"SessionId">
export const SessionId = Brand.nominal<SessionId>()

export type PatternId = string & Brand.Brand<"PatternId">
export const PatternId = Brand.nominal<PatternId>()

export type PreferenceId = string & Brand.Brand<"PreferenceId">
export const PreferenceId = Brand.nominal<PreferenceId>()

export type EntityId = string & Brand.Brand<"EntityId">
export const EntityId = Brand.nominal<EntityId>()

export type RelationId = string & Brand.Brand<"RelationId">
export const RelationId = Brand.nominal<RelationId>()
