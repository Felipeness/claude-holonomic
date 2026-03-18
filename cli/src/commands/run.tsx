import React, { useState, useEffect } from "react"
import { Box, Text } from "ink"
import { DFA_STATE, HOLON_NAME } from "@holon/shared"
import type { DfaState, HolonName } from "@holon/shared"
import { Dashboard, type HolonStatus } from "../ui/dashboard.js"
import { PhaseProgress } from "../ui/progress.js"
import { runPipeline } from "../pipeline.js"
import type { PipelineResult } from "../pipeline.js"

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

const STATE_TO_HOLON: Record<DfaState, HolonName> = {
  [DFA_STATE.IDLE]: HOLON_NAME.BRAIN,
  [DFA_STATE.UNDERSTANDING]: HOLON_NAME.BRAIN,
  [DFA_STATE.RESEARCHING]: HOLON_NAME.RESEARCHER,
  [DFA_STATE.PLANNING]: HOLON_NAME.ARCHITECT,
  [DFA_STATE.BUILDING]: HOLON_NAME.BUILDER,
  [DFA_STATE.REVIEWING]: HOLON_NAME.GUARDIAN,
  [DFA_STATE.COMPLETING]: HOLON_NAME.GUARDIAN,
  [DFA_STATE.LEARNING]: HOLON_NAME.SCHOLAR,
  [DFA_STATE.RECOVERING]: HOLON_NAME.BUILDER,
  [DFA_STATE.FAILED]: HOLON_NAME.BRAIN,
}

export interface RunCommandProps {
  readonly task: string
}

function ResultSummary({ result }: { readonly result: PipelineResult }) {
  return (
    <Box flexDirection="column" gap={1}>
      <Box borderStyle="round" borderColor={result.success ? "green" : "red"} paddingX={1} flexDirection="column">
        <Text bold color={result.success ? "green" : "red"}>
          {result.success ? "Pipeline Complete" : "Pipeline Failed"}
        </Text>
        <Text dimColor>Duration: {result.totalDurationMs}ms</Text>
      </Box>

      <Box flexDirection="column">
        <Text bold>Classification:</Text>
        <Text>  Type: {result.classification.type}</Text>
        <Text>  Complexity: {result.classification.complexity}</Text>
        <Text>  Risk: {result.classification.risk}</Text>
        <Text>  Confidence: {Math.round(result.classification.confidence * 100)}%</Text>
      </Box>

      <Box flexDirection="column">
        <Text bold>Holons activated:</Text>
        <Text>  {result.holonSelection.holons.join(" -> ")}</Text>
      </Box>

      <Box flexDirection="column">
        <Text bold>Blueprint:</Text>
        <Text>  Steps: {result.blueprint.steps.length}</Text>
        <Text>  Complexity: {result.blueprint.estimatedComplexity}</Text>
        <Text>  Risks: {result.blueprint.risks.length > 0 ? result.blueprint.risks.join(", ") : "none"}</Text>
      </Box>

      <Box flexDirection="column">
        <Text bold>Build:</Text>
        <Text>  Files modified: {result.buildResult.filesModified.length}</Text>
        <Text>  Tests added: {result.buildResult.testsAdded}</Text>
        <Text>  Errors: {result.buildResult.errors.length}</Text>
      </Box>

      <Box flexDirection="column">
        <Text bold>Review:</Text>
        <Text>  Tests: {result.review.testsPass ? "pass" : "fail"}</Text>
        <Text>  Type check: {result.review.typeCheckPass ? "pass" : "fail"}</Text>
        <Text>  Lint: {result.review.lintPass ? "pass" : "fail"}</Text>
        <Text>  Issues: {result.review.issues.length}</Text>
      </Box>

      <Box flexDirection="column">
        <Text bold>Insights learned: {result.insights.length}</Text>
        {result.insights.map((insight, i) => (
          <Text key={i} dimColor>  - {insight.message}</Text>
        ))}
      </Box>

      <Box flexDirection="column">
        <Text bold>Phases:</Text>
        {result.phases.map((phase) => (
          <Text key={phase.phase}>
            {"  "}
            {phase.success ? <Text color="green">pass</Text> : <Text color="red">fail</Text>}
            {" "}
            {phase.phase} ({phase.holon}) {phase.durationMs}ms
          </Text>
        ))}
      </Box>
    </Box>
  )
}

export function RunCommand({ task }: RunCommandProps) {
  const [phase, setPhase] = useState<DfaState>(DFA_STATE.IDLE)
  const [holonStatuses, setHolonStatuses] = useState<readonly HolonStatus[]>(
    ALL_HOLONS.map((name) => ({ name, status: "idle" as const })),
  )
  const [result, setResult] = useState<PipelineResult | null>(null)

  useEffect(() => {
    const pipelineResult = runPipeline({ task }, (currentPhase, activeHolon) => {
      setPhase(currentPhase)
      setHolonStatuses(
        ALL_HOLONS.map((name) => ({
          name,
          status: name === activeHolon ? ("active" as const) : ("idle" as const),
        })),
      )
    })

    setPhase(DFA_STATE.IDLE)
    setHolonStatuses(ALL_HOLONS.map((name) => ({ name, status: "idle" as const })))
    setResult(pipelineResult)
  }, [task])

  const phaseProgress = PHASES.map((p) => ({
    name: p,
    complete: result !== null || PHASES.indexOf(p) < PHASES.indexOf(phase),
    active: result === null && p === phase,
  }))

  return (
    <Box flexDirection="column" gap={1}>
      <Dashboard version="0.1.0" phase={result ? DFA_STATE.IDLE : phase} task={task} holons={holonStatuses} />
      <PhaseProgress phases={phaseProgress} />
      {result ? (
        <ResultSummary result={result} />
      ) : (
        <Box>
          <Text dimColor>Press Ctrl+C to cancel</Text>
        </Box>
      )}
    </Box>
  )
}
