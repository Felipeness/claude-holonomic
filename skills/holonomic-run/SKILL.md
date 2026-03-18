# holonomic-run

Executes a full coding task through the holonomic agent pipeline.

## Usage

```
/holonomic-run <task description>
```

## What it does

1. **Brain** classifies the intent (feature, bug, refactor, etc.)
2. **Researcher** analyzes the codebase for relevant files and patterns
3. **Architect** generates a blueprint with steps and risk assessment
4. **Builder** implements the changes following the blueprint
5. **Guardian** reviews: runs tests, type checks, and linting
6. **Scholar** records learnings in the knowledge graph

## Phases (DFA)

```
IDLE -> UNDERSTANDING -> RESEARCHING -> PLANNING -> BUILDING -> REVIEWING -> COMPLETING -> LEARNING -> IDLE
```

Recovery path: `BUILDING -> RECOVERING -> BUILDING` (max 3 retries)
Failure path: `RECOVERING -> FAILED -> IDLE`

## Examples

```
/holonomic-run add rate limiting to the /api/users endpoint
/holonomic-run fix the null pointer in payment processing
/holonomic-run refactor auth middleware to use JWT
```

## Options

- Pass `--plan-only` to stop after the planning phase (same as `/holonomic-plan`)
- Pass `--no-learn` to skip the learning phase
