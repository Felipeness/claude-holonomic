import { describe, it, expect } from "vitest"
import {
  extractImports,
  buildFileMetadata,
  buildDependencyGraph,
  buildCodebaseMap,
  scoreFileForTask,
} from "../domain/codebase-explorer.js"
import type { FileMetadata } from "../domain/codebase-explorer.js"

describe("codebase-explorer", () => {
  describe("extractImports", () => {
    it("extracts ES module imports with from clause", () => {
      const content = `import { foo } from "./utils.js"\nimport { bar } from "@holon/shared"`
      const imports = extractImports(content)

      expect(imports).toContain("./utils.js")
      expect(imports).toContain("@holon/shared")
    })

    it("extracts side-effect imports", () => {
      const content = `import "./polyfill.js"`
      const imports = extractImports(content)

      expect(imports).toContain("./polyfill.js")
    })

    it("extracts require calls", () => {
      const content = `const fs = require("fs")\nconst path = require("path")`
      const imports = extractImports(content)

      expect(imports).toContain("fs")
      expect(imports).toContain("path")
    })

    it("returns empty array for no imports", () => {
      const content = `const x = 42\nconsole.log(x)`
      const imports = extractImports(content)

      expect(imports).toHaveLength(0)
    })

    it("deduplicates repeated imports", () => {
      const content = `import { a } from "./mod.js"\nimport { b } from "./mod.js"`
      const imports = extractImports(content)

      expect(imports.filter((i) => i === "./mod.js")).toHaveLength(1)
    })
  })

  describe("buildFileMetadata", () => {
    it("extracts extension from file path", () => {
      const now = new Date()
      const meta = buildFileMetadata("src/index.ts", 1024, now)

      expect(meta.path).toBe("src/index.ts")
      expect(meta.size).toBe(1024)
      expect(meta.extension).toBe("ts")
      expect(meta.lastModified).toBe(now)
    })

    it("handles files without extension", () => {
      const meta = buildFileMetadata("Makefile", 512, new Date())

      expect(meta.extension).toBe("")
    })

    it("handles nested extensions correctly", () => {
      const meta = buildFileMetadata("config.test.ts", 256, new Date())

      expect(meta.extension).toBe("ts")
    })
  })

  describe("buildDependencyGraph", () => {
    it("builds dependencies from file contents", () => {
      const files = new Map<string, string>([
        ["src/a.ts", `import { x } from "./b.js"`],
        ["src/b.ts", `import { y } from "./c.js"`],
      ])

      const deps = buildDependencyGraph(files)

      expect(deps).toHaveLength(2)
      expect(deps).toContainEqual({ source: "src/a.ts", target: "./b.js" })
      expect(deps).toContainEqual({ source: "src/b.ts", target: "./c.js" })
    })

    it("returns empty array for files with no imports", () => {
      const files = new Map<string, string>([
        ["src/constants.ts", "export const X = 1"],
      ])

      const deps = buildDependencyGraph(files)

      expect(deps).toHaveLength(0)
    })
  })

  describe("buildCodebaseMap", () => {
    it("combines files and dependencies into a map", () => {
      const files: FileMetadata[] = [
        { path: "a.ts", size: 100, extension: "ts", lastModified: new Date() },
        { path: "b.ts", size: 200, extension: "ts", lastModified: new Date() },
      ]
      const deps = [{ source: "a.ts", target: "./b.js" }]

      const map = buildCodebaseMap(files, deps)

      expect(map.files).toHaveLength(2)
      expect(map.dependencies).toHaveLength(1)
      expect(map.totalFiles).toBe(2)
    })
  })

  describe("scoreFileForTask", () => {
    it("scores TypeScript files higher than JSON files", () => {
      const now = new Date()
      const tsFile: FileMetadata = { path: "src/auth.ts", size: 500, extension: "ts", lastModified: now }
      const jsonFile: FileMetadata = { path: "src/auth.json", size: 500, extension: "json", lastModified: now }

      const tsScore = scoreFileForTask(tsFile, "feature", "auth")
      const jsonScore = scoreFileForTask(jsonFile, "feature", "auth")

      expect(tsScore).toBeGreaterThan(jsonScore)
    })

    it("scores path-matching files higher", () => {
      const now = new Date()
      const matchFile: FileMetadata = { path: "src/payment.ts", size: 500, extension: "ts", lastModified: now }
      const noMatchFile: FileMetadata = { path: "src/utils.ts", size: 500, extension: "ts", lastModified: now }

      const matchScore = scoreFileForTask(matchFile, "feature", "payment")
      const noMatchScore = scoreFileForTask(noMatchFile, "feature", "payment")

      expect(matchScore).toBeGreaterThan(noMatchScore)
    })

    it("gives test files a bonus for test tasks", () => {
      const now = new Date()
      const testFile: FileMetadata = { path: "src/auth.test.ts", size: 500, extension: "ts", lastModified: now }

      const testTaskScore = scoreFileForTask(testFile, "test", "auth")
      const featureTaskScore = scoreFileForTask(testFile, "feature", "auth")

      expect(testTaskScore).toBeGreaterThan(featureTaskScore)
    })

    it("returns a value between 0 and 1", () => {
      const now = new Date()
      const file: FileMetadata = { path: "src/index.ts", size: 100, extension: "ts", lastModified: now }

      const score = scoreFileForTask(file, "feature", "anything")

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })
})
