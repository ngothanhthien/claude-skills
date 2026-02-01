# Synthesis Phase

Feed Discovery Report to Oracle for gap analysis and approach generation.

## Purpose

Transform raw discovery data into actionable analysis:
- **Gap Analysis** - What exists vs what's needed
- **Approach Options** - Strategies with tradeoffs
- **Risk Assessment** - Per-component risk levels

## Oracle Invocation

```
Task(
  subagent_type: "oracle",
  prompt: """Analyze gap between current codebase and feature requirements.

Discovery report attached. User wants: <feature>

Provide:
1. Gap Analysis - What exists vs what's needed
2. Approach Options - 1-3 strategies with tradeoffs
3. Risk Assessment - LOW/MEDIUM/HIGH per component
""",
  files: ["history/<feature>/discovery.md"]
)
```

## Synthesis Output Template

```markdown
# Synthesis: <Feature Name>

## Gap Analysis

| Component | Have | Need | Gap |
| --------- | ---- | ---- | --- |
| ...       | ...  | ...  | ... |

## Recommended Approach

<Description>

### Alternative Approaches

1. <Option A> - Tradeoff: ...
2. <Option B> - Tradeoff: ...

## Risk Map

| Component   | Risk | Reason           | Verification       |
| ----------- | ---- | ---------------- | ------------------ |
| Stripe SDK  | HIGH | New external dep | Spike required     |
| User entity | LOW  | Follows existing | Proceed            |
```

## Risk Classification

| Level  | Criteria                      | Verification                 |
| ------ | ----------------------------- | ---------------------------- |
| LOW    | Pattern exists in codebase    | Proceed                      |
| MEDIUM | Variation of existing pattern | Interface sketch, type-check |
| HIGH   | Novel or external integration | Spike required               |

## Risk Indicators

```
Pattern exists in codebase? ─── YES → LOW base
                            └── NO  → MEDIUM+ base

External dependency? ─── YES → HIGH
                     └── NO  → Check blast radius

Blast radius >5 files? ─── YES → HIGH
                       └── NO  → MEDIUM
```

## Synthesis Focus by Type

| Type         | Synthesis Focus                          |
| ------------ | ---------------------------------------- |
| Bug fix      | Root cause hypotheses, fix strategies    |
| New feature  | Integration points, data flow, risks      |
| Modification | Delta analysis, migration strategies     |
| Extension    | Extension points, contract compatibility |

## Integration with Type Flow

After Synthesis completes, feed results into the appropriate Type Flow:
- **Bug fix**: Use risk map to prioritize fix approach
- **New feature**: Use gap analysis to inform ERD design
- **Modification**: Use delta analysis for current → target logic
- **Extension**: Use extension points for new capability design
