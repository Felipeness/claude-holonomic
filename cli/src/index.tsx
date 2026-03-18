#!/usr/bin/env node
import React from "react"
import { render, Box, Text } from "ink"
import { RunCommand } from "./commands/run.js"
import { PlanCommand } from "./commands/plan.js"
import { LearnCommand } from "./commands/learn.js"
import { HistoryCommand } from "./commands/history.js"

const args = process.argv.slice(2)
const command = args[0] ?? "help"
const taskArg = args.slice(1).join(" ")

function App() {
  switch (command) {
    case "run":
      return <RunCommand task={taskArg || "no task specified"} />
    case "plan":
      return <PlanCommand task={taskArg || "no task specified"} />
    case "learn":
      return <LearnCommand />
    case "history":
      return <HistoryCommand />
    case "help":
    default:
      return (
        <Box flexDirection="column" gap={1}>
          <Box borderStyle="round" borderColor="cyan" paddingX={1}>
            <Text bold color="cyan">
              claude-holonomic v0.1.0
            </Text>
          </Box>
          <Box flexDirection="column">
            <Text bold>Usage:</Text>
            <Text>  claude-holonomic run &lt;task&gt;     Execute a coding task</Text>
            <Text>  claude-holonomic plan &lt;task&gt;    Plan without executing</Text>
            <Text>  claude-holonomic learn           Show graph insights</Text>
            <Text>  claude-holonomic history         Query event store</Text>
            <Text>  claude-holonomic help            Show this help</Text>
          </Box>
          <Box flexDirection="column">
            <Text bold>Examples:</Text>
            <Text dimColor>  claude-holonomic run &quot;add rate limiting to API endpoints&quot;</Text>
            <Text dimColor>  claude-holonomic plan &quot;refactor auth to use JWT&quot;</Text>
          </Box>
        </Box>
      )
  }
}

render(<App />)
