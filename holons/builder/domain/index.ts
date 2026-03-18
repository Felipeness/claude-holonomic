import { HOLON_NAME } from "@holon/shared"

export const BUILDER_NAME = HOLON_NAME.BUILDER

export interface BuildResult {
  readonly filesCreated: readonly string[]
  readonly filesModified: readonly string[]
  readonly testsAdded: number
  readonly errors: readonly string[]
}

export function createEmptyBuildResult(): BuildResult {
  return {
    filesCreated: [],
    filesModified: [],
    testsAdded: 0,
    errors: [],
  }
}

export function hasBuildErrors(result: BuildResult): boolean {
  return result.errors.length > 0
}
