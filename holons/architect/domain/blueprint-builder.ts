import type { TaskType } from "@holon/shared"

export const NODE_TYPE = {
  RESEARCH: "research",
  PLAN: "plan",
  IMPLEMENT: "implement",
  TEST: "test",
  REVIEW: "review",
  COMMIT: "commit",
} as const

export type NodeType = (typeof NODE_TYPE)[keyof typeof NODE_TYPE]

export interface BlueprintNode {
  readonly id: string
  readonly type: NodeType
  readonly description: string
  readonly dependsOn: readonly string[]
}

export interface ExecutionBlueprint {
  readonly nodes: readonly BlueprintNode[]
  readonly taskType: TaskType
  readonly estimatedSteps: number
}

const STANDARD_FLOW: readonly NodeType[] = [
  NODE_TYPE.RESEARCH,
  NODE_TYPE.PLAN,
  NODE_TYPE.IMPLEMENT,
  NODE_TYPE.TEST,
  NODE_TYPE.REVIEW,
  NODE_TYPE.COMMIT,
]

const TASK_OVERRIDES: Partial<Record<TaskType, readonly NodeType[]>> = {
  bug: [NODE_TYPE.RESEARCH, NODE_TYPE.IMPLEMENT, NODE_TYPE.TEST, NODE_TYPE.REVIEW, NODE_TYPE.COMMIT],
  review: [NODE_TYPE.RESEARCH, NODE_TYPE.REVIEW],
  docs: [NODE_TYPE.RESEARCH, NODE_TYPE.IMPLEMENT, NODE_TYPE.COMMIT],
  test: [NODE_TYPE.RESEARCH, NODE_TYPE.PLAN, NODE_TYPE.TEST, NODE_TYPE.COMMIT],
}

function nodeDescription(type: NodeType, taskType: TaskType): string {
  const descriptions: Record<NodeType, string> = {
    research: `gather context for ${taskType} task`,
    plan: `design approach for ${taskType}`,
    implement: `implement changes for ${taskType}`,
    test: `write and run tests for ${taskType}`,
    review: `review changes for ${taskType}`,
    commit: `commit and finalize ${taskType}`,
  }
  return descriptions[type]
}

function buildNodeId(type: NodeType, index: number): string {
  return `${type}-${index}`
}

export function buildBlueprint(
  taskType: TaskType,
  approachName: string,
): ExecutionBlueprint {
  const flow = TASK_OVERRIDES[taskType] ?? STANDARD_FLOW
  const nodes = flow.map((type, index) => {
    const id = buildNodeId(type, index)
    const dependsOn = index > 0 ? [buildNodeId(flow[index - 1]!, index - 1)] : []

    return {
      id,
      type,
      description: nodeDescription(type, taskType),
      dependsOn,
    }
  })

  return {
    nodes,
    taskType,
    estimatedSteps: nodes.length,
  }
}

export function validateBlueprint(blueprint: ExecutionBlueprint): readonly string[] {
  const errors: string[] = []
  const nodeIds = new Set(blueprint.nodes.map((n) => n.id))

  for (const node of blueprint.nodes) {
    for (const dep of node.dependsOn) {
      if (!nodeIds.has(dep)) {
        errors.push(`node "${node.id}" depends on unknown node "${dep}"`)
      }
    }
  }

  if (hasCycle(blueprint.nodes)) {
    errors.push("blueprint contains a cycle")
  }

  if (blueprint.nodes.length === 0) {
    errors.push("blueprint has no nodes")
  }

  return errors
}

function hasCycle(nodes: readonly BlueprintNode[]): boolean {
  const visited = new Set<string>()
  const visiting = new Set<string>()
  const adjacency = new Map<string, readonly string[]>()

  for (const node of nodes) {
    adjacency.set(node.id, node.dependsOn)
  }

  function dfs(nodeId: string): boolean {
    if (visiting.has(nodeId)) return true
    if (visited.has(nodeId)) return false

    visiting.add(nodeId)
    const deps = adjacency.get(nodeId) ?? []
    for (const dep of deps) {
      if (dfs(dep)) return true
    }
    visiting.delete(nodeId)
    visited.add(nodeId)
    return false
  }

  for (const node of nodes) {
    if (dfs(node.id)) return true
  }

  return false
}

export function topologicalSort(nodes: readonly BlueprintNode[]): readonly BlueprintNode[] {
  const result: BlueprintNode[] = []
  const visited = new Set<string>()
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  function visit(nodeId: string): void {
    if (visited.has(nodeId)) return
    visited.add(nodeId)

    const node = nodeMap.get(nodeId)
    if (!node) return

    for (const dep of node.dependsOn) {
      visit(dep)
    }
    result.push(node)
  }

  for (const node of nodes) {
    visit(node.id)
  }

  return result
}
