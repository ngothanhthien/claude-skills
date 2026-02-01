---
name: implementation-planner
description: Structured implementation planning for software development tasks. Use when the user provides a spec, feature request, bug report, or any development task that needs to be broken into an actionable plan. Handles (1) Bug fixes - root cause analysis and fix planning, (2) New features - ERD, use cases, and implementation tasks, (3) Feature modifications - current vs target logic with migration plan, (4) Feature extensions - adding capabilities to existing features. Outputs dependency-aware task breakdowns where each file = 1 epic.
---

# Implementation Planner

Transform specs and requirements into structured, dependency-aware implementation plans.

## Pipeline

```
USER REQUEST → Classify → Keywords → Discovery → Synthesis → [Type Flow] → Ready Plan
```

| Phase        | Method                   | Output                    |
| ------------ | ------------------------ | ------------------------- |
| 1. Classify  | Auto-detect + confirm    | Type + Scope              |
| 2. Keywords  | Ask user                 | Search terms              |
| 3. Discovery | Parallel agents + C7     | Discovery Report          |
| 4. Synthesis | Oracle analysis          | Gap Analysis + Approach + Risks |
| 5. Type Flow | See flows below          | Validated plan            |

## Task Types

| Type         | When                              | Flow Summary                              |
| ------------ | --------------------------------- | ----------------------------------------- |
| Bug fix      | Something broken                  | Discovery → Root Cause ✓ → Single Task    |
| Modification | Change behavior A → B             | Discovery → Current ✓ → Target ✓ → Plan   |
| Extension    | Add C to existing A, B            | Discovery → Current ✓ → New Logic ✓ → Plan|
| New feature  | Build brand-new capability        | Discovery → ERD ✓ → Use Cases ✓ → Plan    |

**Scope**: Pure logic (API/function only) | Mixed (includes refactor)

Legend: `✓` = approval checkpoint (never skip)

## Workflow

### Step 1: Classify
Auto-classify, ask: "I classified this as [type] with [scope] scope. Correct?"

### Step 2: Execute Type Flow
See [references/flows.md](references/flows.md) for detailed step-by-step workflows.

### Step 3: Discovery Phase
See [references/discovery.md](references/discovery.md) for parallel agent launch pattern and report template.

### Step 4: Synthesis Phase
See [references/synthesis.md](references/synthesis.md) for Oracle analysis pattern and output template.

### Step 5: Output Plan
See [references/templates.md](references/templates.md) for plan output format.

## Output Rules

- Each file = 1 epic
- Tasks include explicit dependencies: `depends_on: [task_id]`
- Parallel tasks marked: `[PARALLEL]`
- Focus on business logic (pseudocode max, no deep code)
- UI work separated with `[UI]` label
