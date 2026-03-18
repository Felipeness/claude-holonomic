import React from "react"
import { Box, Text } from "ink"

export interface PlanCommandProps {
  readonly task: string
}

export function PlanCommand({ task }: PlanCommandProps) {
  return (
    <Box flexDirection="column" gap={1}>
      <Box borderStyle="round" borderColor="yellow" paddingX={1}>
        <Text bold color="yellow">
          Plan Mode
        </Text>
      </Box>
      <Box flexDirection="column">
        <Text dimColor>Task: </Text>
        <Text>&quot;{task}&quot;</Text>
      </Box>
      <Box flexDirection="column">
        <Text dimColor>Planning steps:</Text>
        <Text color="yellow">1. Understand intent and classify task type</Text>
        <Text color="yellow">2. Research codebase for relevant files and patterns</Text>
        <Text color="yellow">3. Generate blueprint with steps and risk assessment</Text>
        <Text dimColor>4. (pause) Wait for approval before building</Text>
      </Box>
    </Box>
  )
}
