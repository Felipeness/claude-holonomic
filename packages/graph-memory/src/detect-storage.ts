import { PgClient } from "./pg-client.js"
import { PgGraphMemory } from "./pg-graph-memory.js"
import { GraphMemory } from "./graph-memory.js"

export const DEFAULT_PG_URL = "postgresql://holonomic:holonomic_dev@localhost:5432/holonomic"

export const createGraphMemory = async (
  pgUrl?: string,
): Promise<GraphMemory | PgGraphMemory> => {
  if (pgUrl) {
    const client = new PgClient(pgUrl)
    const pgGraph = new PgGraphMemory(client)
    await pgGraph.initialize()
    return pgGraph
  }

  return new GraphMemory()
}
