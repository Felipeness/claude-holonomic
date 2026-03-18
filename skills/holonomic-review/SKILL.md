# holonomic-review

Reviews code changes through the Guardian holon's quality pipeline.

## Usage

```
/holonomic-review [path or PR URL]
```

## What it does

1. Analyzes staged/committed changes
2. Runs type checking validation
3. Runs test suite
4. Performs lint analysis
5. Checks patterns against the knowledge graph
6. Reports issues with severity levels (info, warning, error)

## Review criteria

- Type safety (no `any`, proper narrowing)
- Error handling (no swallowed errors, proper boundaries)
- Test coverage for changed code
- Adherence to codebase patterns (from graph memory)
- Performance concerns (N+1 queries, missing limits, sequential awaits)

## Output

- Pass/fail status for: tests, typecheck, lint
- Issue list with severity, file, line, message, and rule
- Overall approval recommendation

## Examples

```
/holonomic-review
/holonomic-review src/auth/
/holonomic-review https://github.com/org/repo/pull/123
```
