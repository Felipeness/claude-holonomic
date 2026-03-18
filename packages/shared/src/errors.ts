import { Data } from "effect"

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string
  readonly message: string
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly entity: string
  readonly id: string
}> {}

export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly operation: string
  readonly durationMs: number
}> {}

export class CircuitOpenError extends Data.TaggedError("CircuitOpenError")<{
  readonly service: string
}> {}

export class RetryExhausted extends Data.TaggedError("RetryExhausted")<{
  readonly operation: string
  readonly attempts: number
}> {}

export class AmbiguousIntent extends Data.TaggedError("AmbiguousIntent")<{
  readonly raw: string
}> {}

export class NoRelevantFiles extends Data.TaggedError("NoRelevantFiles")<{
  readonly query: string
}> {}

export class ContextTooLarge extends Data.TaggedError("ContextTooLarge")<{
  readonly tokens: number
  readonly limit: number
}> {}

export class PlanRejected extends Data.TaggedError("PlanRejected")<{
  readonly reason: string
}> {}

export class InvalidPhaseTransition extends Data.TaggedError("InvalidPhaseTransition")<{
  readonly from: string
  readonly to: string
}> {}
