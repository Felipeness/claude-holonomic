#!/usr/bin/env node

import { runPipeline } from './pipeline.js'

const VERSION = '0.1.0'

const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const MAGENTA = '\x1b[35m'
const BLUE = '\x1b[34m'
const RED = '\x1b[31m'

const check = `${GREEN}\u2713${RESET}`
const cross = `${RED}\u2717${RESET}`

const printBanner = () => {
  console.log(`${CYAN}${BOLD}`)
  console.log(`\u2554${'═'.repeat(54)}\u2557`)
  console.log(`\u2551  claude-holonomic v${VERSION}${' '.repeat(54 - 23 - VERSION.length)}\u2551`)
  console.log(`\u255A${'═'.repeat(54)}\u255D`)
  console.log(RESET)
}

const printHelp = () => {
  printBanner()
  console.log(`${BOLD}Usage:${RESET}`)
  console.log('  claude-holonomic run <task>     Execute a coding task')
  console.log('  claude-holonomic plan <task>    Plan without executing')
  console.log('  claude-holonomic help           Show this help')
  console.log('')
  console.log(`${BOLD}Examples:${RESET}`)
  console.log(`  ${DIM}claude-holonomic run "add rate limiting to API endpoints"${RESET}`)
  console.log(`  ${DIM}claude-holonomic plan "refactor auth to use JWT"${RESET}`)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const spinner = ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807', '\u280F']

const withSpinner = async <T>(label: string, fn: () => T): Promise<T> => {
  let i = 0
  const interval = setInterval(() => {
    process.stdout.write(`\r  ${CYAN}${spinner[i % spinner.length]}${RESET} ${DIM}${label}${RESET}`)
    i++
  }, 80)

  try {
    await sleep(200)
    const result = fn()
    clearInterval(interval)
    process.stdout.write(`\r  ${check} ${label}${' '.repeat(20)}\n`)
    return result
  } catch (err) {
    clearInterval(interval)
    process.stdout.write(`\r  ${cross} ${label}${' '.repeat(20)}\n`)
    throw err
  }
}

const runCommand = async (task: string) => {
  printBanner()
  console.log(`  ${DIM}Task:${RESET} ${BOLD}"${task}"${RESET}`)

  const result = await withSpinner('Running holonomic pipeline...', () => runPipeline({ task }))

  // Brain
  console.log(`\n${CYAN}${BOLD}\uD83E\uDDE0 BRAIN${RESET}`)
  await sleep(80)
  console.log(`  Task: ${BOLD}${result.classification.type}${RESET} | Complexity: ${BOLD}${result.classification.complexity}${RESET} | Risk: ${BOLD}${result.classification.risk}${RESET}`)
  console.log(`  Confidence: ${BOLD}${Math.round(result.classification.confidence * 100)}%${RESET}`)
  console.log(`  Holons activated: ${DIM}${result.holonSelection.holons.join(' \u2192 ')}${RESET}`)
  console.log(`  DFA: ${DIM}IDLE \u2192 UNDERSTANDING \u2192 RESEARCHING${RESET}`)

  // Researcher
  console.log(`\n${BLUE}${BOLD}\uD83D\uDD2C RESEARCHER${RESET}`)
  await sleep(80)
  console.log(`  Files analyzed: ${BOLD}${result.research.files.length}${RESET} | Patterns: ${BOLD}${result.research.patterns.length}${RESET}`)
  console.log(`  Context curated: ${BOLD}${result.budget.totalTokens.toLocaleString('en-US')}${RESET} tokens`)

  // Architect
  console.log(`\n${MAGENTA}${BOLD}\uD83D\uDCD0 ARCHITECT${RESET}`)
  await sleep(80)
  const recommended = result.approachRecommendation.approaches[result.approachRecommendation.recommended]
  console.log(`  Approaches generated: ${BOLD}${result.approachRecommendation.approaches.length}${RESET}`)
  console.log(`  Recommended: ${DIM}"${recommended?.name ?? 'default'}"${RESET}`)
  console.log(`  Blueprint: ${BOLD}${result.blueprint.steps.length} nodes${RESET} | Complexity: ${BOLD}${result.blueprint.estimatedComplexity}${RESET}`)

  // Builder
  console.log(`\n${YELLOW}${BOLD}\uD83C\uDFD7\uFE0F  BUILDER${RESET}`)
  await sleep(80)
  console.log(`  TDD Phase: ${DIM}RED \u2192 GREEN \u2192 REFACTOR${RESET}`)
  console.log(`  Files modified: ${BOLD}${result.buildResult.filesModified.length}${RESET} | Tests added: ${BOLD}${result.buildResult.testsAdded}${RESET}`)
  console.log(`  Errors: ${result.buildResult.errors.length === 0 ? `${GREEN}none${RESET} ${check}` : `${RED}${result.buildResult.errors.length}${RESET} ${cross}`}`)

  // Guardian
  console.log(`\n${GREEN}${BOLD}\uD83D\uDEE1\uFE0F  GUARDIAN${RESET}`)
  await sleep(80)
  console.log(`  Tests: ${result.review.testsPass ? `${GREEN}pass${RESET} ${check}` : `${RED}fail${RESET} ${cross}`}`)
  console.log(`  Type check: ${result.review.typeCheckPass ? `${GREEN}pass${RESET} ${check}` : `${RED}fail${RESET} ${cross}`}`)
  console.log(`  Lint: ${result.review.lintPass ? `${GREEN}pass${RESET} ${check}` : `${RED}fail${RESET} ${cross}`}`)
  console.log(`  Issues: ${BOLD}${result.review.issues.length}${RESET}`)

  // Scholar
  console.log(`\n${CYAN}${BOLD}\uD83D\uDCDA SCHOLAR${RESET}`)
  await sleep(80)
  const eventCount = result.sessionDigest.learned.length + result.sessionDigest.succeeded.length + result.sessionDigest.failed.length + result.sessionDigest.decisionsCount
  console.log(`  Session digested: ${BOLD}${eventCount}${RESET} events`)
  console.log(`  Insights: ${BOLD}${result.insights.length}${RESET}`)
  for (const insight of result.insights) {
    console.log(`    ${DIM}- ${insight.message}${RESET}`)
  }

  // Summary
  const statusColor = result.success ? GREEN : RED
  const statusIcon = result.success ? '\u2705' : '\u274C'
  console.log(`\n${statusColor}${BOLD}${statusIcon} Pipeline ${result.success ? 'complete' : 'failed'}!${RESET} ${DIM}DFA: LEARNING \u2192 IDLE${RESET}`)
  console.log(`  ${DIM}Duration: ${result.totalDurationMs}ms${RESET}`)

  // Phase summary
  console.log(`\n${DIM}Phase details:${RESET}`)
  for (const phase of result.phases) {
    const icon = phase.success ? check : cross
    console.log(`  ${icon} ${phase.phase} (${phase.holon}) ${DIM}${phase.durationMs}ms${RESET}`)
  }
  console.log('')
}

const planCommand = async (task: string) => {
  printBanner()
  console.log(`  ${DIM}Task:${RESET} ${BOLD}"${task}"${RESET}`)
  console.log(`  ${DIM}Mode: plan-only (no code changes)${RESET}`)

  const result = await withSpinner('Planning...', () => runPipeline({ task }))

  console.log(`\n${CYAN}${BOLD}\uD83E\uDDE0 BRAIN${RESET}`)
  console.log(`  Task: ${BOLD}${result.classification.type}${RESET} | Complexity: ${BOLD}${result.classification.complexity}${RESET}`)

  console.log(`\n${MAGENTA}${BOLD}\uD83D\uDCD0 ARCHITECT${RESET}`)
  const recommended = result.approachRecommendation.approaches[result.approachRecommendation.recommended]
  console.log(`  Recommended: ${DIM}"${recommended?.name ?? 'default'}"${RESET}`)
  console.log(`  Blueprint: ${BOLD}${result.blueprint.steps.length} steps${RESET}`)
  for (const step of result.blueprint.steps) {
    console.log(`    ${DIM}${step.id}: ${step.description}${RESET}`)
  }

  console.log(`\n${GREEN}${BOLD}\u2705 Plan ready${RESET}\n`)
}

const main = async () => {
  const args = process.argv.slice(2)
  const command = args[0] ?? 'help'
  const task = args.slice(1).join(' ')

  switch (command) {
    case 'run':
      if (!task) {
        console.error(`${RED}Error: task description required${RESET}`)
        console.log(`Usage: claude-holonomic run "your task"`)
        process.exit(1)
      }
      await runCommand(task)
      break
    case 'plan':
      if (!task) {
        console.error(`${RED}Error: task description required${RESET}`)
        console.log(`Usage: claude-holonomic plan "your task"`)
        process.exit(1)
      }
      await planCommand(task)
      break
    case 'help':
    default:
      printHelp()
      break
  }
}

main().catch((error: unknown) => {
  console.error(`${RED}${BOLD}Pipeline failed:${RESET}`, error)
  process.exit(1)
})
