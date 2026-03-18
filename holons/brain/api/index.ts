import type { TaskIntent } from "../domain/index.js"
import { classifyIntent, createInitialBrainState } from "../domain/index.js"

export interface BrainCommand {
  readonly _tag: "StartTask" | "PauseTask" | "ResumeTask" | "CancelTask"
}

export interface StartTaskCommand extends BrainCommand {
  readonly _tag: "StartTask"
  readonly description: string
}

export function handleStartTask(description: string): TaskIntent {
  const type = classifyIntent(description)
  return {
    description,
    type,
    context: {},
  }
}

export function createBrainApi() {
  const state = createInitialBrainState()

  return {
    getState: () => state,
    startTask: (description: string) => handleStartTask(description),
  }
}
