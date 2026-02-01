# Discovery Phase

Launch parallel sub-agents to gather codebase intelligence:

```
Task() → Agent A: Architecture snapshot (project structure, entry points)
Task() → Agent B: Pattern search (find similar existing code)
Task() → Agent C: Constraints (package.json, tsconfig, deps)
librarian → Third-party library docs (if external packages specified)
```

## Discovery Focus by Type

| Type         | Focus Areas                                      |
| ------------ | ------------------------------------------------ |
| Bug fix      | Error traces, related tests, recent changes      |
| New feature  | Similar features, data models, API patterns      |
| Modification | Current implementation, callers, test coverage   |
| Extension    | Extension points, existing interfaces, contracts |

## Discovery Report Template

```markdown
# Discovery Report: <Feature Name>

## Architecture Snapshot
- Relevant packages: ...
- Key modules: ...
- Entry points: ...

## Existing Patterns
- Similar implementation: <file> does X using Y pattern
- Reusable utilities: ...
- Naming conventions: ...

## Technical Constraints
- Runtime version: ...
- Key dependencies: ...
- Build requirements: ...

## External References (if applicable)
- Library docs: ...
- API references: ...
```
