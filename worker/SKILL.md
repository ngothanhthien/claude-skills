---
name: worker
description: Execute beads autonomously within a track. Handles bead-to-bead context persistence via Agent Mail, uses preferred tools from AGENTS.md, and reports progress to orchestrator.
---

# Worker Skill: Autonomous Bead Execution

This skill executes beads within an assigned track, maintaining context between beads via Agent Mail and reporting to the orchestrator.

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WORKER LIFECYCLE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  TRACK LOOP (repeat for each bead in track)                         │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │                                                                     │    │
│  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐            │    │
│  │  │ START BEAD   │ → │ WORK ON BEAD │ → │ COMPLETE     │ ──┐        │    │
│  │  │              │   │              │   │ BEAD         │   │        │    │
│  │  │ • Read ctx   │   │ • Implement  │   │ • Report     │   │        │    │
│  │  │ • Reserve    │   │ • Use tools  │   │ • Save ctx   │   │        │    │
│  │  │ • Claim      │   │ • Check mail │   │ • Release    │   │        │    │
│  │  └──────────────┘   └──────────────┘   └──────────────┘   │        │    │
│  │         ▲                                                  │        │    │
│  │         └──────────────────────────────────────────────────┘        │    │
│  │                      (next bead)                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  When all beads done → Report track complete to orchestrator                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Initial Setup (Once Per Track)

### 1. Read AGENTS.md for Tool Preferences

```bash
Read /path/to/project/AGENTS.md
```

**Key tool preferences:**

- **Codebase exploration**: `mcp__gkg__*` tools (search_codebase_definitions, get_definition, get_references)
- **File editing**: `mcp__morph_mcp__edit_file` (fast edits with `// ... existing code ...`)
- **Web search**: `mcp__exa__*` tools (get_code_context_exa, web_search_exa)
- **UI components**: `mcp__shadcn__*` tools + `frontend-design` skill

### 2. Register Agent Identity

```bash
register_agent(
  project_key="<absolute-project-path>",
  name="<YourAgentName>",  # e.g., BlueLake
  program="amp",
  model="<your-model>",
  task_description="Track N: <description>"
)
```

### 3. Understand Your Assignment

From orchestrator, you should know:

- **Track number**: Which track you're assigned
- **Beads (in order)**: The sequence of beads to complete
- **File scope**: What files you're allowed to edit
- **Epic thread**: `<epic-id>` for cross-agent communication
- **Track thread**: `track:<AgentName>:<epic-id>` for your context

---

## Bead Execution Loop

For EACH bead in your track, follow this protocol:

### Step 1: Start Bead

#### 1.1 Read Context from Previous Bead

```bash
summarize_thread(
  project_key="<path>",
  thread_id="track:<AgentName>:<epic-id>",
  include_examples=true
)
```

This gives you:

- What was done in previous beads
- Learnings and gotchas
- Recommendations for current bead

#### 1.2 Check Inbox for Messages

```bash
fetch_inbox(
  project_key="<path>",
  agent_name="<AgentName>",
  include_bodies=true
)
```

Look for:

- Messages from orchestrator
- Requests from other workers
- Interface change notifications

#### 1.3 Reserve Files

```bash
file_reservation_paths(
  project_key="<path>",
  agent_name="<AgentName>",
  paths=["<your-file-scope>/**"],
  ttl_seconds=7200,
  exclusive=true,
  reason="<bead-id>"
)
```

If conflict:

```bash
send_message(
  to=["<OrchestratorName>"],
  thread_id="<epic-id>",
  subject="[<bead-id>] BLOCKED: File conflict",
  body_md="Need <files> but held by <agent>",
  importance="high"
)
# Wait for resolution
```

#### 1.4 Claim Bead

```bash
bd update <bead-id> --status in_progress
```

#### 1.5 Read Bead Details

```bash
bd show <bead-id>
```

Understand:

- Description (what to do)
- Acceptance criteria (definition of done)
- Dependencies (what's already done)

---

### Step 2: Work on Bead

#### 2.1 Explore Codebase (gkg tools)

```bash
# Find relevant code
mcp__gkg__search_codebase_definitions(
  search_terms=["<relevant-terms>"],
  project_absolute_path="<path>"
)

# Get definition details
mcp__gkg__get_definition(
  absolute_file_path="<file>",
  line="<code-line>",
  symbol_name="<symbol>"
)

# Find all usages
mcp__gkg__get_references(
  absolute_file_path="<file>",
  definition_name="<symbol>"
)
```

#### 2.2 Make Changes (morph tool)

```bash
mcp__morph_mcp__edit_file(
  path="<file>",
  code_edit="""
// ... existing code ...

<your changes>

// ... existing code ...
""",
  instruction="<what you're changing>"
)
```

#### 2.2.1 Verify Changes

```bash
# Quick LSP check after edits
get_diagnostics("<edited-file-or-directory>")
```

Fix any errors before continuing.

#### 2.3 For UI Work (shadcn + frontend-design)

```bash
# Load frontend skill
/skill frontend-design

# Find components
mcp__shadcn__search_items_in_registries(
  registries=["@shadcn"],
  query="<component>"
)

# Get examples
mcp__shadcn__get_item_examples_from_registries(
  registries=["@shadcn"],
  query="<component>-demo"
)
```

#### 2.4 Web Search for Docs (exa tools)

```bash
mcp__exa__get_code_context_exa(
  query="<library> <feature> examples"
)
```

#### 2.5 Check Inbox Periodically

```bash
fetch_inbox(
  agent_name="<AgentName>",
  since_ts="<session-start>"
)
```

#### 2.6 If You Hit a Blocker

```bash
send_message(
  to=["<OrchestratorName>"],
  thread_id="<epic-id>",
  subject="[<bead-id>] BLOCKED: <reason>",
  body_md="Blocked by: <explanation>. Need: <what you need>",
  importance="high",
  ack_required=true
)

# Update bead status
bd update <bead-id> --status blocked
```

#### 2.7 If You Change Shared Interface

```bash
send_message(
  to=["<OtherWorker1>", "<OtherWorker2>"],
  thread_id="<epic-id>",
  subject="[<bead-id>] Interface Change: <what>",
  body_md="Changed <interface> from X to Y. Update your code.",
  importance="high"
)
```

---

### Step 3: Complete Bead

#### 3.1 Verify Acceptance Criteria

Check all criteria from `bd show <bead-id>` are met.

#### 3.2 Run Checks

```bash
# Fast LSP diagnostics first
get_diagnostics("<project-path>")

# Full build verification (from AGENTS.md)
bun run check-types
bun run build
```

#### 3.3 Close Bead

```bash
bd close <bead-id> --reason "<concise summary of what was done>"
```

#### 3.4 Report to Orchestrator

```bash
send_message(
  project_key="<path>",
  sender_name="<AgentName>",
  to=["<OrchestratorName>"],
  thread_id="<epic-id>",
  subject="[<bead-id>] COMPLETE",
  body_md="""
## Completed: <bead-id>

### What Was Done
- <bullet points>

### Files Modified
- <file list>

### Next Bead
- <next-bead-id>: <brief plan>

### Track Progress
- Completed: X/Y beads
"""
)
```

#### 3.5 Save Context for Next Bead

```bash
send_message(
  project_key="<path>",
  sender_name="<AgentName>",
  to=["<AgentName>"],  # Self-addressed!
  thread_id="track:<AgentName>:<epic-id>",
  subject="<bead-id> Complete - Context for Next",
  body_md="""
## Bead Complete: <bead-id>

### Key Changes
- <what was implemented>

### Learnings
- <patterns discovered>
- <things that work well>

### Gotchas
- <things to watch out for>

### For Next Bead (<next-bead-id>)
- <recommendations>
- <relevant context>

### Files to Reference
- <key files for next bead>
"""
)
```

#### 3.6 Release Reservations

```bash
release_file_reservations(
  project_key="<path>",
  agent_name="<AgentName>"
)
```

---

### Step 4: Continue to Next Bead

**Loop back to Step 1** with the next bead in your track.

The context you saved in Step 3.5 will be available when you read the track thread in Step 1.1.

---

## Track Completion

When all beads in your track are done:

### Report Track Complete

```bash
send_message(
  project_key="<path>",
  sender_name="<AgentName>",
  to=["<OrchestratorName>"],
  thread_id="<epic-id>",
  subject="[Track N] COMPLETE",
  body_md="""
## Track N Complete

### Beads Completed
- <bead-1>: <summary>
- <bead-2>: <summary>
- <bead-3>: <summary>

### Track Summary
- <overall what was accomplished>

### Key Learnings
- <insights for future work>

### Files Modified
- <comprehensive list>
"""
)
```

### Return Summary

Return a summary to the orchestrator (Task return value):

```
Track N (BlueLake) Complete:
- Completed beads: a, b, c
- Summary: <what was built>
- All acceptance criteria met
```

---

## Quick Reference

### Bead Lifecycle Checklist

```
START BEAD:
- [ ] summarize_thread (track thread)
- [ ] fetch_inbox
- [ ] file_reservation_paths
- [ ] bd update --status in_progress
- [ ] bd show (read requirements)

WORK:
- [ ] Use gkg for exploration
- [ ] Use morph for edits
- [ ] get_diagnostics after edits
- [ ] Check inbox periodically
- [ ] Report blockers immediately

COMPLETE:
- [ ] Verify acceptance criteria
- [ ] get_diagnostics (fast check)
- [ ] Run checks (check-types, build)
- [ ] bd close --reason
- [ ] send_message to orchestrator
- [ ] send_message to self (track thread)
- [ ] release_file_reservations

NEXT:
- [ ] Loop to START BEAD with next bead
```

### Thread Reference

| Thread                        | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `<epic-id>`                   | Cross-agent, orchestrator communication |
| `track:<AgentName>:<epic-id>` | Your personal context persistence       |

### Tool Reference

| Task           | Tool                                    |
| -------------- | --------------------------------------- |
| Find code      | `mcp__gkg__search_codebase_definitions` |
| Get definition | `mcp__gkg__get_definition`              |
| Find usages    | `mcp__gkg__get_references`              |
| Edit file      | `mcp__morph_mcp__edit_file`             |
| Search docs    | `mcp__exa__get_code_context_exa`        |
| UI components  | `mcp__shadcn__*`                        |
