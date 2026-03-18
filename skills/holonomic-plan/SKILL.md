# holonomic-plan

Plans a coding task without executing it. Stops after generating the blueprint.

## Usage

```
/holonomic-plan <task description>
```

## What it does

1. **Brain** classifies the intent
2. **Researcher** analyzes relevant files and patterns
3. **Architect** generates a detailed blueprint
4. Outputs the plan for human review before any code changes

## Output

- Task classification (feature, bug, refactor, etc.)
- Relevant files identified with relevance scores
- Step-by-step implementation plan
- Risk assessment (low/medium/high)
- Dependencies and patterns detected

## Examples

```
/holonomic-plan migrate the database from MySQL to PostgreSQL
/holonomic-plan add WebSocket support for real-time notifications
```
