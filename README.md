# claude-holonomic

Holonomic autonomous coding agent built with TypeScript, Effect-TS, and Ink. Six specialized holons coordinate through an actor system and DFA-based phase engine to classify, research, plan, build, review, and learn from every coding task.

## Architecture

```
                         +------------------+
                         |      brain       |
                         | (orchestrator)   |
                         +--------+---------+
                                  |
                    classify intent & select holons
                                  |
                         +--------v---------+
                         |   researcher     |
                         | (codebase scan)  |
                         +--------+---------+
                                  |
                    score files & curate context
                                  |
                         +--------v---------+
                         |    architect     |
                         | (blueprint gen)  |
                         +--------+---------+
                                  |
                    approach + blueprint + risk
                                  |
                         +--------v---------+
                         |     builder      |
                         | (code execution) |
                         +--------+---------+
                                  |
                     TDD + incremental commits
                                  |
                         +--------v---------+
                         |    guardian      |
                         | (quality gate)   |
                         +--------+---------+
                                  |
              review + security scan + perf analysis
                                  |
                         +--------v---------+
                         |     scholar      |
                         | (learning)       |
                         +------------------+
               insights + preferences + session digest
```

## DFA State Machine

```
                                     +-----------+
                                     |   IDLE    |<-----------+
                                     +-----+-----+            |
                                           |                  |
                                    [task received]           |
                                           |                  |
                                     +-----v---------+       |
                                     | UNDERSTANDING |       |
                                     +-----+---------+       |
                                           |                  |
                                    [intent classified]       |
                                           |                  |
                                     +-----v--------+        |
                                     | RESEARCHING  |        |
                                     +-----+--------+        |
                                           |                  |
                                    [files analyzed]          |
                                           |                  |
                                     +-----v------+          |
                                     |  PLANNING  |          |
                                     +-----+------+          |
                                           |                  |
                                    [plan approved]           |
                                           |                  |
                                     +-----v------+          |
                              +----->|  BUILDING  |          |
                              |      +--+------+--+          |
                              |         |      |              |
                     [retry]  |  [done] |      | [errors]     |
                              |         |      |              |
                      +-------+--+   +--v------v--+          |
                      |RECOVERING|   | REVIEWING  |          |
                      +----+-----+   +--+------+--+          |
                           |            |      |              |
                 [exhausted]|    [pass] |      | [fail]       |
                           |            |      +------+       |
                      +----v---+  +-----v------+     |       |
                      | FAILED |  | COMPLETING |     +-------+
                      +----+---+  +-----+------+      (back to BUILDING)
                           |            |
                           |     [finalize]
                           |            |
                           |      +-----v------+
                           +----->|  LEARNING  |------+
                                  +------------+
```

Guard conditions:

| Transition                   | Guard                          |
|------------------------------|--------------------------------|
| IDLE -> UNDERSTANDING        | task description is non-empty  |
| RESEARCHING -> PLANNING      | files analyzed > 0             |
| PLANNING -> BUILDING         | plan approved                  |
| REVIEWING -> COMPLETING      | tests pass AND build errors = 0|
| REVIEWING -> BUILDING        | tests fail OR build errors > 0 |
| BUILDING -> RECOVERING       | build errors > 0               |
| RECOVERING -> BUILDING       | retry count < max retries (3)  |
| RECOVERING -> FAILED         | retries exhausted              |

## Quick Start

```bash
# clone
git clone https://github.com/your-org/claude-holonomic.git
cd claude-holonomic

# install
pnpm install

# start infrastructure (postgres, otel-collector, grafana)
docker compose -f infra/docker-compose.yml up -d

# run a task
pnpm exec tsx cli/src/index.tsx run "add rate limiting to API endpoints"

# or use the plan-only mode
pnpm exec tsx cli/src/index.tsx plan "refactor auth middleware to use JWT"
```

## CLI Commands

| Command                          | Description                                  |
|----------------------------------|----------------------------------------------|
| `claude-holonomic run <task>`    | Execute a full pipeline through all holons   |
| `claude-holonomic plan <task>`   | Plan only -- stops after blueprint generation|
| `claude-holonomic learn`         | Display graph memory insights                |
| `claude-holonomic history`       | Query the event store history                |
| `claude-holonomic help`          | Show available commands                      |

## Holons

| Holon        | Role                  | Key Functions                                                  |
|--------------|-----------------------|----------------------------------------------------------------|
| **brain**    | Orchestrator          | `classifyTask`, `selectHolons`, `allocateBudget`, `advanceRouter` |
| **researcher** | Codebase analysis   | `scoreFileRelevance`, `curateContext`, `identifyHotspots`      |
| **architect**  | Blueprint generation| `generateApproaches`, `buildBlueprint`, `assessRisk`           |
| **builder**    | Code execution      | `executeBlueprint`, `transitionTdd`, `generateCommitMessage`   |
| **guardian**   | Quality gate        | `reviewCode`, `scanSecurity`, `analyzePerformance`, `composePr`|
| **scholar**    | Learning            | `generateInsights`, `digestSession`, `recordChoice`            |

## Graph Memory

CQRS + event-sourced knowledge graph with entities and relations.

### Entity Types

| Type         | Description                                      |
|--------------|--------------------------------------------------|
| `project`    | A codebase or repository                         |
| `file`       | A source file                                    |
| `function`   | A function or method                             |
| `pattern`    | A recognized coding pattern                      |
| `decision`   | An architectural or implementation decision       |
| `preference` | A learned user preference                        |
| `session`    | A task execution session                         |
| `task`       | A classified coding task                         |
| `error`      | An error encountered during execution            |
| `library`    | An external dependency                           |

### Relation Types

| Type            | Description                                      |
|-----------------|--------------------------------------------------|
| `prefers`       | User prefers this approach/pattern                |
| `avoids`        | User avoids this approach/pattern                 |
| `depends_on`    | Entity depends on another entity                  |
| `learned_from`  | Insight was learned from a task/session           |
| `used_in`       | Pattern/approach was used in a task               |
| `contradicts`   | Two decisions/patterns contradict each other      |
| `succeeded_with`| Task succeeded using this approach                |
| `failed_with`   | Task failed using this approach                   |

## Ralph Loop Integration

The DFA maps to Ralph phases for structured iteration:

| DFA State    | Ralph Phase  | Description                          |
|--------------|-------------|--------------------------------------|
| BUILDING     | IMPLEMENT   | Code generation and file modifications|
| REVIEWING    | TEST        | Test execution and quality validation |
| COMPLETING   | PR          | PR composition and finalization      |

Ralph enforces a max of 5 iterations per phase with phase-specific prompts and skip conditions. Recovery from BUILDING failures uses up to 3 retries before transitioning to FAILED.

## Skills

Installable Claude Code skills under `skills/`:

| Skill              | Command              | Description                           |
|--------------------|----------------------|---------------------------------------|
| `holonomic-run`    | `/holonomic-run`     | Full pipeline execution               |
| `holonomic-plan`   | `/holonomic-plan`    | Plan-only mode (no code changes)      |
| `holonomic-review` | `/holonomic-review`  | Quality review through Guardian       |

Install by adding the `skills/` directory to your Claude Code configuration.

## Tech Stack

| Layer            | Technology                                          |
|------------------|-----------------------------------------------------|
| Language         | TypeScript 5.9, ES2022 target                       |
| Runtime          | Node.js 20+                                         |
| Effect system    | Effect-TS v3 (Brand, Data.TaggedError, Schema)      |
| Pattern matching | ts-pattern v5                                       |
| Terminal UI      | Ink v6 + React 19                                   |
| Validation       | Zod v4                                              |
| Testing          | Vitest v4                                           |
| Package manager  | pnpm 9+ (workspace monorepo)                        |
| Observability    | OpenTelemetry (collector + Grafana)                  |
| Database         | PostgreSQL 16                                       |
| Infra            | Docker Compose                                      |

## Design Patterns

- **Holonomic architecture** -- self-contained holons with domain/infra/resilience layers
- **DFA state machine** -- deterministic phase transitions with guard conditions
- **CQRS + Event Sourcing** -- append-only event store with materialized read models
- **Actor model** -- mailbox-based message passing with supervisor restart strategies
- **Circuit breaker** -- 5 failure type classification with token bucket rate limiting
- **Branded types** -- compile-time identity safety (`HolonId` != `TaskId`)
- **Functional core / Imperative shell** -- pure domain logic, side effects at boundaries
- **TDD engine** -- red/green/refactor state machine for builder phase

## Monorepo Structure

```
packages/
  shared/              -- branded types, errors, constants, domain events
  graph-memory/        -- CQRS event-sourced knowledge graph
  blueprint-engine/    -- DFA state machine with guard conditions
  holon-runtime/       -- actor system, mailbox, supervisor
  circuit-breaker/     -- circuit breaker + token bucket rate limiter
  observability/       -- structured logger, tracer, metrics registry

holons/
  brain/               -- orchestrator, task classification, phase routing
  researcher/          -- codebase exploration, context curation
  architect/           -- approach generation, blueprint building, risk assessment
  builder/             -- blueprint execution, TDD, incremental commits
  guardian/            -- code review, security scanning, perf analysis, PR composition
  scholar/             -- session digestion, insight generation, preference learning

cli/                   -- Ink-based terminal UI with pipeline integration
skills/                -- Claude Code skill definitions (run, plan, review)
infra/                 -- docker-compose, init.sql, OTel collector config
```
