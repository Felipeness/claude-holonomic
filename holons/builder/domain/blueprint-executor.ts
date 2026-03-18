import { match } from "ts-pattern"

export const NODE_TYPE = {
  DETERMINISTIC: "DETERMINISTIC",
  AGENTIC: "AGENTIC",
  GATE: "GATE",
  PARALLEL: "PARALLEL",
} as const

export type NodeType = (typeof NODE_TYPE)[keyof typeof NODE_TYPE]

export interface BlueprintNode {
  readonly id: string
  readonly type: NodeType
  readonly description: string
  readonly dependencies: readonly string[]
  readonly command?: string
  readonly prompt?: string
  readonly condition?: string
  readonly children?: readonly string[]
}

export const EXECUTION_STATUS = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  SKIPPED: "SKIPPED",
} as const

export type ExecutionStatus = (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS]

export interface ExecutionResult {
  readonly nodeId: string
  readonly status: ExecutionStatus
  readonly output: string
  readonly durationMs: number
  readonly error?: string
}

export interface NodeExecutor {
  readonly runCommand: (command: string) => Promise<string>
  readonly runAgent: (prompt: string) => Promise<string>
  readonly checkCondition: (condition: string) => Promise<boolean>
}

export function topologicalSort(nodes: readonly BlueprintNode[]): readonly BlueprintNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const visited = new Set<string>()
  const sorted: BlueprintNode[] = []

  function visit(nodeId: string): void {
    if (visited.has(nodeId)) return
    visited.add(nodeId)

    const node = nodeMap.get(nodeId)
    if (!node) return

    for (const dep of node.dependencies) {
      visit(dep)
    }
    sorted.push(node)
  }

  for (const node of nodes) {
    visit(node.id)
  }

  return sorted
}

export async function executeNode(
  node: BlueprintNode,
  executor: NodeExecutor,
): Promise<ExecutionResult> {
  const start = Date.now()

  try {
    const output = await match(node.type)
      .with(NODE_TYPE.DETERMINISTIC, async () => {
        if (!node.command) return "no command specified"
        return executor.runCommand(node.command)
      })
      .with(NODE_TYPE.AGENTIC, async () => {
        if (!node.prompt) return "no prompt specified"
        return executor.runAgent(node.prompt)
      })
      .with(NODE_TYPE.GATE, async () => {
        if (!node.condition) return "no condition specified"
        const passed = await executor.checkCondition(node.condition)
        return passed ? "gate:passed" : "gate:blocked"
      })
      .with(NODE_TYPE.PARALLEL, async () => {
        if (!node.children?.length) return "no children to execute"
        return `parallel:${node.children.length} children`
      })
      .exhaustive()

    return {
      nodeId: node.id,
      status: EXECUTION_STATUS.SUCCESS,
      output,
      durationMs: Date.now() - start,
    }
  } catch (error) {
    return {
      nodeId: node.id,
      status: EXECUTION_STATUS.FAILED,
      output: "",
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function executeBlueprint(
  nodes: readonly BlueprintNode[],
  executor: NodeExecutor,
): Promise<readonly ExecutionResult[]> {
  const sorted = topologicalSort(nodes)
  const results: ExecutionResult[] = []
  const completed = new Set<string>()

  for (const node of sorted) {
    const depsReady = node.dependencies.every((dep) => completed.has(dep))
    if (!depsReady) {
      results.push({
        nodeId: node.id,
        status: EXECUTION_STATUS.SKIPPED,
        output: "dependencies not met",
        durationMs: 0,
      })
      continue
    }

    if (node.type === NODE_TYPE.PARALLEL && node.children?.length) {
      const childNodes = sorted.filter((n) => node.children!.includes(n.id))
      const childResults = await Promise.all(
        childNodes.map((child) => executeNode(child, executor)),
      )
      results.push(...childResults)

      const allChildrenOk = childResults.every(
        (r) => r.status === EXECUTION_STATUS.SUCCESS,
      )
      results.push({
        nodeId: node.id,
        status: allChildrenOk ? EXECUTION_STATUS.SUCCESS : EXECUTION_STATUS.FAILED,
        output: `parallel: ${childResults.length} children executed`,
        durationMs: childResults.reduce((sum, r) => sum + r.durationMs, 0),
      })
      if (allChildrenOk) completed.add(node.id)
      continue
    }

    if (node.type === NODE_TYPE.GATE) {
      const result = await executeNode(node, executor)
      results.push(result)
      if (result.output === "gate:passed") {
        completed.add(node.id)
      }
      continue
    }

    const result = await executeNode(node, executor)
    results.push(result)
    if (result.status === EXECUTION_STATUS.SUCCESS) {
      completed.add(node.id)
    }
  }

  return results
}
