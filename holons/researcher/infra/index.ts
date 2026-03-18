export function createResearcherInfra() {
  return {
    name: "researcher-infra",
    async connect() {},
    async disconnect() {},
  }
}

export { researchWithClaude, ResearchError } from './claude-researcher.js'
export type { ResearchQuery, ResearchResult } from './claude-researcher.js'
