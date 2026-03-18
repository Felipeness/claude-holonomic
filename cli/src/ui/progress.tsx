import React from "react"
import { Box, Text } from "ink"

export interface ProgressBarProps {
  readonly label: string
  readonly percent: number
  readonly width?: number
  readonly color?: string
}

export function ProgressBar({ label, percent, width = 30, color = "green" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const filled = Math.round((clamped / 100) * width)
  const empty = width - filled

  return (
    <Box gap={1}>
      <Box width={16}>
        <Text>{label}</Text>
      </Box>
      <Text color={color}>{"█".repeat(filled)}</Text>
      <Text dimColor>{"░".repeat(empty)}</Text>
      <Text dimColor> {clamped}%</Text>
    </Box>
  )
}

export interface PhaseProgressProps {
  readonly phases: readonly { name: string; complete: boolean; active: boolean }[]
}

export function PhaseProgress({ phases }: PhaseProgressProps) {
  return (
    <Box flexDirection="column">
      <Text dimColor>Progress:</Text>
      {phases.map((phase, i) => (
        <Box key={phase.name} gap={1}>
          <Text dimColor>{i + 1}.</Text>
          {phase.complete ? (
            <Text color="green">[x] {phase.name}</Text>
          ) : phase.active ? (
            <Text color="yellow">[~] {phase.name}</Text>
          ) : (
            <Text dimColor>[ ] {phase.name}</Text>
          )}
        </Box>
      ))}
    </Box>
  )
}
