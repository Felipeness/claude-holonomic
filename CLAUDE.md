# claude-holonomic

Holonomic autonomous coding agent built with TypeScript, Effect-TS, and Ink.

## Architecture

Six specialized holons coordinate through an actor system and DFA-based phase engine:

- **brain** — orchestrator, intent classification, phase management
- **researcher** — codebase analysis, file relevance scoring
- **architect** — blueprint generation, step planning, risk assessment
- **builder** — code generation, file modifications
- **guardian** — quality review, test/typecheck/lint validation
- **scholar** — learning, pattern recognition, preference tracking

## Monorepo structure

```
packages/shared          — branded types, errors, constants, events
packages/graph-memory    — CQRS event-sourced knowledge graph
packages/blueprint-engine — DFA state machine with guard conditions
packages/holon-runtime   — actor system, mailbox, supervisor
packages/circuit-breaker — circuit breaker with 5 failure types + token bucket
packages/observability   — structured logger, tracer, metrics registry
holons/{brain,researcher,architect,builder,guardian,scholar}/ — holon implementations
cli/                     — Ink-based terminal UI
skills/                  — Claude Code skill definitions
infra/                   — docker-compose, init.sql, OTel config
```

## Development

```bash
pnpm install
pnpm test          # run all tests
pnpm typecheck     # type check all packages
```

## Key patterns

- Effect-TS v3 (Brand, Data.TaggedError, Schema merged into `effect`)
- CQRS + Event Sourcing for graph memory
- DFA with guard conditions for phase management
- Actor model with supervisor for holon orchestration
- Circuit breaker pattern for external call resilience
- Ink + React for terminal UI rendering
