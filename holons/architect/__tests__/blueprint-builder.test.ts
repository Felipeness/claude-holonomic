import { describe, it, expect } from "vitest"
import {
  buildBlueprint,
  validateBlueprint,
  topologicalSort,
  NODE_TYPE,
} from "../domain/blueprint-builder.js"
import type { BlueprintNode } from "../domain/blueprint-builder.js"

describe("blueprint-builder", () => {
  describe("buildBlueprint", () => {
    it("creates a valid DAG for feature tasks", () => {
      const blueprint = buildBlueprint("feature", "incremental")

      expect(blueprint.nodes.length).toBeGreaterThan(0)
      expect(blueprint.taskType).toBe("feature")
      expect(validateBlueprint(blueprint)).toEqual([])
    })

    it("creates standard flow for feature tasks with all node types", () => {
      const blueprint = buildBlueprint("feature", "standard")
      const types = blueprint.nodes.map((n) => n.type)

      expect(types).toContain(NODE_TYPE.RESEARCH)
      expect(types).toContain(NODE_TYPE.PLAN)
      expect(types).toContain(NODE_TYPE.IMPLEMENT)
      expect(types).toContain(NODE_TYPE.TEST)
      expect(types).toContain(NODE_TYPE.REVIEW)
      expect(types).toContain(NODE_TYPE.COMMIT)
    })

    it("skips planning for bug tasks", () => {
      const blueprint = buildBlueprint("bug", "test-first")
      const types = blueprint.nodes.map((n) => n.type)

      expect(types).not.toContain(NODE_TYPE.PLAN)
      expect(types).toContain(NODE_TYPE.RESEARCH)
      expect(types).toContain(NODE_TYPE.IMPLEMENT)
    })

    it("skips implementation for review tasks", () => {
      const blueprint = buildBlueprint("review", "standard")
      const types = blueprint.nodes.map((n) => n.type)

      expect(types).not.toContain(NODE_TYPE.IMPLEMENT)
      expect(types).toContain(NODE_TYPE.RESEARCH)
      expect(types).toContain(NODE_TYPE.REVIEW)
    })

    it("creates simplified flow for docs tasks", () => {
      const blueprint = buildBlueprint("docs", "standard")
      const types = blueprint.nodes.map((n) => n.type)

      expect(types).toContain(NODE_TYPE.RESEARCH)
      expect(types).toContain(NODE_TYPE.IMPLEMENT)
      expect(types).toContain(NODE_TYPE.COMMIT)
      expect(types).not.toContain(NODE_TYPE.REVIEW)
    })

    it("sets estimatedSteps to the number of nodes", () => {
      const blueprint = buildBlueprint("feature", "incremental")

      expect(blueprint.estimatedSteps).toBe(blueprint.nodes.length)
    })

    it("first node has no dependencies", () => {
      const blueprint = buildBlueprint("feature", "standard")

      expect(blueprint.nodes[0]!.dependsOn).toHaveLength(0)
    })

    it("subsequent nodes depend on previous node", () => {
      const blueprint = buildBlueprint("feature", "standard")

      for (let i = 1; i < blueprint.nodes.length; i++) {
        expect(blueprint.nodes[i]!.dependsOn).toContain(blueprint.nodes[i - 1]!.id)
      }
    })
  })

  describe("validateBlueprint", () => {
    it("returns no errors for valid blueprint", () => {
      const blueprint = buildBlueprint("feature", "standard")

      expect(validateBlueprint(blueprint)).toEqual([])
    })

    it("detects missing dependency references", () => {
      const nodes: BlueprintNode[] = [
        { id: "a", type: NODE_TYPE.RESEARCH, description: "research", dependsOn: ["nonexistent"] },
      ]

      const errors = validateBlueprint({ nodes, taskType: "feature", estimatedSteps: 1 })

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain("nonexistent")
    })

    it("detects empty blueprint", () => {
      const errors = validateBlueprint({ nodes: [], taskType: "feature", estimatedSteps: 0 })

      expect(errors).toContain("blueprint has no nodes")
    })

    it("detects cycles in the DAG", () => {
      const nodes: BlueprintNode[] = [
        { id: "a", type: NODE_TYPE.RESEARCH, description: "a", dependsOn: ["b"] },
        { id: "b", type: NODE_TYPE.PLAN, description: "b", dependsOn: ["a"] },
      ]

      const errors = validateBlueprint({ nodes, taskType: "feature", estimatedSteps: 2 })

      expect(errors).toContain("blueprint contains a cycle")
    })
  })

  describe("topologicalSort", () => {
    it("sorts nodes respecting dependencies", () => {
      const nodes: BlueprintNode[] = [
        { id: "c", type: NODE_TYPE.COMMIT, description: "commit", dependsOn: ["b"] },
        { id: "a", type: NODE_TYPE.RESEARCH, description: "research", dependsOn: [] },
        { id: "b", type: NODE_TYPE.IMPLEMENT, description: "implement", dependsOn: ["a"] },
      ]

      const sorted = topologicalSort(nodes)
      const ids = sorted.map((n) => n.id)

      expect(ids.indexOf("a")).toBeLessThan(ids.indexOf("b"))
      expect(ids.indexOf("b")).toBeLessThan(ids.indexOf("c"))
    })

    it("preserves all nodes in output", () => {
      const blueprint = buildBlueprint("feature", "standard")
      const sorted = topologicalSort(blueprint.nodes)

      expect(sorted.length).toBe(blueprint.nodes.length)
    })

    it("handles single node", () => {
      const nodes: BlueprintNode[] = [
        { id: "solo", type: NODE_TYPE.RESEARCH, description: "solo", dependsOn: [] },
      ]

      const sorted = topologicalSort(nodes)

      expect(sorted).toHaveLength(1)
      expect(sorted[0]!.id).toBe("solo")
    })
  })
})
