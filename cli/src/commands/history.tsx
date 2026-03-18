import React from "react"
import { Box, Text } from "ink"

export function HistoryCommand() {
  return (
    <Box flexDirection="column" gap={1}>
      <Box borderStyle="round" borderColor="blue" paddingX={1}>
        <Text bold color="blue">
          Event History
        </Text>
      </Box>
      <Box flexDirection="column">
        <Text dimColor>Total events: </Text>
        <Text>0</Text>
      </Box>
      <Text dimColor>No events recorded yet. Run a task to generate history.</Text>
    </Box>
  )
}
