import React, { useState, useEffect } from "react"
import { Box, Text } from "ink"
import { DFA_STATE, HOLON_NAME } from "@holon/shared"
import type { HolonName } from "@holon/shared"
import { Dashboard, type HolonStatus } from "../ui/dashboard.js"
import { PhaseProgress } from "../ui/progress.js"

const ALL_HOLONS: readonly HolonName[] = [
  HOLON_NAME.BRAIN,
  HOLON_NAME.RESEARCHER,
  HOLON_NAME.ARCHITECT,
  HOLON_NAME.BUILDER,
  HOLON_NAME.GUARDIAN,
  HOLON_NAME.SCHOLAR,
]

const PHASES = [
  DFA_STATE.UNDERSTANDING,
  DFA_STATE.RESEARCHING,
  DFA_STATE.PLANNING,
  DFA_STATE.BUILDING,
  DFA_STATE.REVIEWING,
  DFA_STATE.COMPLETING,
  DFA_STATE.LEARNING,
]

export interface RunCommandProps {
  readonly task: string
}

export function RunCommand({ task }: RunCommandProps) {
  const [phase, setPhase] = useState(DFA_STATE.IDLE)
  const [holonStatuses, setHolonStatuses] = useState<readonly HolonStatus[]>(
    ALL_HOLONS.map((name) => ({ name, status: "idle" as const })),
  )

  useEffect(() => {
    setPhase(DFA_STATE.UNDERSTANDING)
    setHolonStatuses((prev) =>
      prev.map((h) => (h.name === HOLON_NAME.BRAIN ? { ...h, status: "active" as const } : h)),
    )
  }, [task])

  const phaseProgress = PHASES.map((p) => ({
    name: p,
    complete: PHASES.indexOf(p) < PHASES.indexOf(phase),
    active: p === phase,
  }))

  return (
    <Box flexDirection="column" gap={1}>
      <Dashboard version="0.1.0" phase={phase} task={task} holons={holonStatuses} />
      <PhaseProgress phases={phaseProgress} />
      <Box>
        <Text dimColor>Press Ctrl+C to cancel</Text>
      </Box>
    </Box>
  )
}
