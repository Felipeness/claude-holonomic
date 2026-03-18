import React from "react"
import { Box, Text } from "ink"

export function LearnCommand() {
  return (
    <Box flexDirection="column" gap={1}>
      <Box borderStyle="round" borderColor="magenta" paddingX={1}>
        <Text bold color="magenta">
          Graph Memory Insights
        </Text>
      </Box>
      <Box flexDirection="column">
        <Text dimColor>Entities: </Text>
        <Text>0 (empty graph)</Text>
      </Box>
      <Box flexDirection="column">
        <Text dimColor>Relations: </Text>
        <Text>0</Text>
      </Box>
      <Box flexDirection="column">
        <Text dimColor>Patterns learned: </Text>
        <Text>none yet</Text>
      </Box>
      <Text dimColor>Run tasks to populate the knowledge graph.</Text>
    </Box>
  )
}
