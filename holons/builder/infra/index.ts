export function createBuilderInfra() {
  return {
    name: "builder-infra",
    async connect() {},
    async disconnect() {},
  }
}

export { runClaudeAgent, AgentError } from './claude-agent.js'
export type { AgentTask, AgentResult } from './claude-agent.js'
