import { describe, it, expect, beforeEach } from "vitest"
import { DFA_STATE, HOLON_NAME } from "@holon/shared"
import { holonForState, decideNextStep, advanceRouter, createRouter } from "../domain/dfa-router.js"
import { BlueprintDfa } from "@holon/blueprint-engine"

describe("holonForState", () => {
  const stateHolonMap = [
    { state: DFA_STATE.IDLE, holon: HOLON_NAME.BRAIN },
    { state: DFA_STATE.UNDERSTANDING, holon: HOLON_NAME.BRAIN },
    { state: DFA_STATE.RESEARCHING, holon: HOLON_NAME.RESEARCHER },
    { state: DFA_STATE.PLANNING, holon: HOLON_NAME.ARCHITECT },
    { state: DFA_STATE.BUILDING, holon: HOLON_NAME.BUILDER },
    { state: DFA_STATE.REVIEWING, holon: HOLON_NAME.GUARDIAN },
    { state: DFA_STATE.COMPLETING, holon: HOLON_NAME.GUARDIAN },
    { state: DFA_STATE.LEARNING, holon: HOLON_NAME.SCHOLAR },
    { state: DFA_STATE.RECOVERING, holon: HOLON_NAME.BUILDER },
    { state: DFA_STATE.FAILED, holon: HOLON_NAME.BRAIN },
  ] as const

  it.each(stateHolonMap)("maps $state to $holon", ({ state, holon }) => {
    expect(holonForState(state)).toBe(holon)
  })
})

describe("decideNextStep", () => {
  let dfa: BlueprintDfa

  beforeEach(() => {
    dfa = new BlueprintDfa()
  })

  it("returns canProceed false when no valid transitions", () => {
    const decision = decideNextStep(dfa)
    expect(decision.canProceed).toBe(false)
    expect(decision.nextState).toBe(DFA_STATE.IDLE)
    expect(decision.nextHolon).toBe(HOLON_NAME.BRAIN)
  })

  it("returns UNDERSTANDING as next step from IDLE", () => {
    dfa.updateContext({ taskDescription: "add feature" })
    const decision = decideNextStep(dfa)
    expect(decision.canProceed).toBe(true)
    expect(decision.nextState).toBe(DFA_STATE.UNDERSTANDING)
    expect(decision.nextHolon).toBe(HOLON_NAME.BRAIN)
  })

  it("returns RESEARCHING from UNDERSTANDING", () => {
    dfa.updateContext({ taskDescription: "task" })
    dfa.transition(DFA_STATE.UNDERSTANDING)
    const decision = decideNextStep(dfa)
    expect(decision.nextState).toBe(DFA_STATE.RESEARCHING)
    expect(decision.nextHolon).toBe(HOLON_NAME.RESEARCHER)
  })

  it("returns PLANNING from RESEARCHING when files analyzed", () => {
    dfa.updateContext({ taskDescription: "task" })
    dfa.transition(DFA_STATE.UNDERSTANDING)
    dfa.transition(DFA_STATE.RESEARCHING)
    dfa.updateContext({ filesAnalyzed: 5 })
    const decision = decideNextStep(dfa)
    expect(decision.nextState).toBe(DFA_STATE.PLANNING)
    expect(decision.nextHolon).toBe(HOLON_NAME.ARCHITECT)
  })

  it("prefers REVIEWING over RECOVERING from BUILDING", () => {
    dfa.updateContext({ taskDescription: "task", filesAnalyzed: 1, planApproved: true })
    dfa.transition(DFA_STATE.UNDERSTANDING)
    dfa.transition(DFA_STATE.RESEARCHING)
    dfa.transition(DFA_STATE.PLANNING)
    dfa.transition(DFA_STATE.BUILDING)
    const decision = decideNextStep(dfa)
    expect(decision.nextState).toBe(DFA_STATE.REVIEWING)
  })

  it("prefers COMPLETING over BUILDING from REVIEWING when tests pass", () => {
    dfa.updateContext({ taskDescription: "task", filesAnalyzed: 1, planApproved: true })
    dfa.transition(DFA_STATE.UNDERSTANDING)
    dfa.transition(DFA_STATE.RESEARCHING)
    dfa.transition(DFA_STATE.PLANNING)
    dfa.transition(DFA_STATE.BUILDING)
    dfa.transition(DFA_STATE.REVIEWING)
    dfa.updateContext({ testsPass: true, buildErrors: 0 })
    const decision = decideNextStep(dfa)
    expect(decision.nextState).toBe(DFA_STATE.COMPLETING)
  })
})

describe("advanceRouter", () => {
  it("advances the DFA state", () => {
    const dfa = new BlueprintDfa()
    dfa.updateContext({ taskDescription: "task" })
    const decision = advanceRouter(dfa)
    expect(decision.canProceed).toBe(true)
    expect(dfa.state).toBe(DFA_STATE.UNDERSTANDING)
  })

  it("does not advance when cannot proceed", () => {
    const dfa = new BlueprintDfa()
    const decision = advanceRouter(dfa)
    expect(decision.canProceed).toBe(false)
    expect(dfa.state).toBe(DFA_STATE.IDLE)
  })

  it("completes full happy path", () => {
    const dfa = new BlueprintDfa()
    dfa.updateContext({ taskDescription: "task", filesAnalyzed: 5, planApproved: true })

    advanceRouter(dfa)
    expect(dfa.state).toBe(DFA_STATE.UNDERSTANDING)

    advanceRouter(dfa)
    expect(dfa.state).toBe(DFA_STATE.RESEARCHING)

    advanceRouter(dfa)
    expect(dfa.state).toBe(DFA_STATE.PLANNING)

    advanceRouter(dfa)
    expect(dfa.state).toBe(DFA_STATE.BUILDING)

    advanceRouter(dfa)
    expect(dfa.state).toBe(DFA_STATE.REVIEWING)

    dfa.updateContext({ testsPass: true, buildErrors: 0 })
    advanceRouter(dfa)
    expect(dfa.state).toBe(DFA_STATE.COMPLETING)

    advanceRouter(dfa)
    expect(dfa.state).toBe(DFA_STATE.LEARNING)

    advanceRouter(dfa)
    expect(dfa.state).toBe(DFA_STATE.IDLE)
    expect(dfa.isTerminal()).toBe(true)
  })
})

describe("recovery path", () => {
  it("routes through RECOVERING when build errors occur", () => {
    const dfa = new BlueprintDfa()
    dfa.updateContext({ taskDescription: "task", filesAnalyzed: 1, planApproved: true })
    dfa.transition(DFA_STATE.UNDERSTANDING)
    dfa.transition(DFA_STATE.RESEARCHING)
    dfa.transition(DFA_STATE.PLANNING)
    dfa.transition(DFA_STATE.BUILDING)
    dfa.updateContext({ buildErrors: 2 })
    dfa.transition(DFA_STATE.RECOVERING)

    dfa.updateContext({ retryCount: 1, buildErrors: 0 })
    const decision = decideNextStep(dfa)
    expect(decision.nextState).toBe(DFA_STATE.BUILDING)
    expect(decision.nextHolon).toBe(HOLON_NAME.BUILDER)
  })

  it("routes to FAILED when retries exhausted", () => {
    const dfa = new BlueprintDfa()
    dfa.updateContext({ taskDescription: "task", filesAnalyzed: 1, planApproved: true })
    dfa.transition(DFA_STATE.UNDERSTANDING)
    dfa.transition(DFA_STATE.RESEARCHING)
    dfa.transition(DFA_STATE.PLANNING)
    dfa.transition(DFA_STATE.BUILDING)
    dfa.updateContext({ buildErrors: 1 })
    dfa.transition(DFA_STATE.RECOVERING)

    dfa.updateContext({ retryCount: 3, maxRetries: 3 })
    const decision = decideNextStep(dfa)
    expect(decision.nextState).toBe(DFA_STATE.FAILED)
    expect(decision.nextHolon).toBe(HOLON_NAME.BRAIN)
  })
})

describe("createRouter", () => {
  it("creates a DFA in IDLE state", () => {
    const dfa = createRouter()
    expect(dfa.state).toBe(DFA_STATE.IDLE)
  })

  it("creates a DFA with initial context", () => {
    const dfa = createRouter({ taskDescription: "test task" })
    expect(dfa.context.taskDescription).toBe("test task")
  })
})

describe("guards block invalid transitions", () => {
  it("blocks IDLE to UNDERSTANDING without description", () => {
    const dfa = new BlueprintDfa()
    const decision = decideNextStep(dfa)
    expect(decision.canProceed).toBe(false)
  })

  it("blocks RESEARCHING to PLANNING without analyzed files", () => {
    const dfa = new BlueprintDfa()
    dfa.updateContext({ taskDescription: "task" })
    dfa.transition(DFA_STATE.UNDERSTANDING)
    dfa.transition(DFA_STATE.RESEARCHING)
    const decision = decideNextStep(dfa)
    expect(decision.canProceed).toBe(false)
  })

  it("blocks PLANNING to BUILDING without plan approval", () => {
    const dfa = new BlueprintDfa()
    dfa.updateContext({ taskDescription: "task", filesAnalyzed: 1 })
    dfa.transition(DFA_STATE.UNDERSTANDING)
    dfa.transition(DFA_STATE.RESEARCHING)
    dfa.transition(DFA_STATE.PLANNING)
    const decision = decideNextStep(dfa)
    expect(decision.canProceed).toBe(false)
  })
})
