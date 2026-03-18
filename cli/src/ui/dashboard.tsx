import React from "react"
import { Box, Text } from "ink"
import type { DfaState, HolonName } from "@holon/shared"

export interface HolonStatus {
  readonly name: HolonName
  readonly status: "idle" | "active" | "failed"
}

export interface DashboardProps {
  readonly version: string
  readonly phase: DfaState
  readonly task: string
  readonly holons: readonly HolonStatus[]
}

function StatusIndicator({ status }: { readonly status: "idle" | "active" | "failed" }) {
  switch (status) {
    case "active":
      return <Text color="green">●</Text>
    case "failed":
      return <Text color="red">●</Text>
    case "idle":
      return <Text color="gray">○</Text>
  }
}

function StatusLabel({ status }: { readonly status: "idle" | "active" | "failed" }) {
  switch (status) {
    case "active":
      return <Text color="green">ACTIVE</Text>
    case "failed":
      return <Text color="red">FAILED</Text>
    case "idle":
      return <Text dimColor>IDLE</Text>
  }
}

export function Dashboard({ version, phase, task, holons }: DashboardProps) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          claude-holonomic v{version}
        </Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Box>
          <Text dimColor>Phase: </Text>
          <Text bold color="yellow">
            {phase}
          </Text>
        </Box>
        <Box>
          <Text dimColor>Task: </Text>
          <Text>&quot;{task}&quot;</Text>
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Holons:</Text>
        {holons.map((holon) => (
          <Box key={holon.name} gap={1}>
            <StatusIndicator status={holon.status} />
            <Box width={14}>
              <Text>{holon.name}</Text>
            </Box>
            <StatusLabel status={holon.status} />
          </Box>
        ))}
      </Box>
    </Box>
  )
}
