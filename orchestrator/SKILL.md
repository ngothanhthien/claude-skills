---
name: orchestrator
description: Plan and coordinate multi-agent bead execution. Use when starting a new epic, assigning tracks to agents, or monitoring parallel work progress.
---

# Orchestrator Skill: Autonomous Multi-Agent Coordination

This skill spawns and monitors parallel worker agents that execute beads autonomously.

**Prerequisites**:

**Execution Plan**: The user provides an execution plan directly as markdown content containing:
- EPIC_ID - the epic bead id
- TRACKS - array of {agent_name, beads[], file_scope, description}
- CROSS_DEPS - any cross-track dependencies (optional)
- PROJECT_PATH - absolute path to the project directory

## Architecture (Mode B: Autonomous)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ORCHESTRATOR                                   │
│                              (This Agent)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Read execution-plan.md (from planning skill)                            │
│  2. Initialize Agent Mail                                                   │
│  3. Spawn worker subagents via Task()                                       │
│  4. Monitor progress via Agent Mail                                         │
│  5. Handle cross-track blockers                                             │
│  6. Announce completion                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
           │
           │ Task() spawns parallel workers
           ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  BlueLake        │  │  GreenCastle     │  │  RedStone        │
│  Track 1         │  │  Track 2         │  │  Track 3         │
│  [a → b → c]     │  │  [x → y]         │  │  [m → n → o]     │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│  For each bead:  │  │  For each bead:  │  │  For each bead:  │
│  • Reserve files │  │  • Reserve files │  │  • Reserve files │
│  • Do work       │  │  • Do work       │  │  • Do work       │
│  • Report mail   │  │  • Report mail   │  │  • Report mail   │
│  • Next bead     │  │  • Next bead     │  │  • Next bead     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
           │                   │                   │
           └───────────────────┼───────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │     Agent Mail      │
                    │  ─────────────────  │
                    │  Epic Thread:       │
                    │  • Progress reports │
                    │  • Bead completions │
                    │  • Blockers         │
                    │                     │
                    │  Track Threads:     │
                    │  • Bead context     │
                    │  • Learnings        │
                    └─────────────────────┘
```

---

## Phase 1: Obtain Execution Plan

The user provides the execution plan directly as markdown content.

### Extract Required Fields

From the provided plan, extract:

- `EPIC_ID` - the epic bead id
- `TRACKS` - array of {agent_name, beads[], file_scope, description}
- `CROSS_DEPS` - any cross-track dependencies (optional)
- `PROJECT_PATH` - absolute path to the project directory

---

## Phase 2: Initialize Agent Mail

```bash
# Ensure project exists
ensure_project(human_key="<absolute-project-path>")

# Register orchestrator identity
register_agent(
  project_key="<path>",
  name="<OrchestratorName>",
  program="amp",
  model="<model>",
  task_description="Orchestrator for <epic-id>"
)
```

---

## Phase 3: Spawn Worker Subagents

**For each track in the execution plan's `TRACKS` array, spawn a worker in parallel using Task tool:**

```python
# FOR EACH track in TRACKS:
# Spawn Worker Subagent (parallel)
Task(
  description="Worker {TRACK.agent_name}: Track {N} - {TRACK.description}",
  prompt=f"""
You are agent BlueLake working on Track 1 of epic <epic-id>.

## Setup
1. Read /path/to/project/AGENTS.md for tool preferences
2. Load the worker skill: /skill worker

## Your Track
Beads to complete IN ORDER: <bead-a>, <bead-b>, <bead-c>
File scope: packages/sdk/**

## Protocol for EACH bead:

### Start Bead
1. Register: register_agent(name="BlueLake", task_description="<bead-id>")
2. Read context: summarize_thread(thread_id="track:BlueLake:<epic-id>")
3. Reserve files: file_reservation_paths(paths=["packages/sdk/**"], reason="<bead-id>")
4. Claim: bd update <bead-id> --status in_progress

### Work on Bead
- Use preferred tools from AGENTS.md (gkg for exploration, morph for edits, etc.)
- Check inbox periodically: fetch_inbox(agent_name="BlueLake")
- If blocked, send message to epic thread with importance="high"

### Complete Bead
1. Close: bd close <bead-id> --reason "Summary of work"
2. Report to orchestrator:
   send_message(
     to=["<OrchestratorName>"],
     thread_id="<epic-id>",
     subject="[<bead-id>] COMPLETE",
     body_md="Done: <summary>. Next: <next-bead-id>"
   )
3. Save context for next bead:
   send_message(
     to=["BlueLake"],
     thread_id="track:BlueLake:<epic-id>",
     subject="<bead-id> Complete - Context for next",
     body_md="## Learnings\\n- ...\\n## Gotchas\\n- ...\\n## Next bead notes\\n- ..."
   )
4. Release files: release_file_reservations()

### Continue to Next Bead
- Loop back to "Start Bead" with next bead in track
- Read your track thread for context from previous bead

## When Track Complete
send_message(
  to=["<OrchestratorName>"],
  thread_id="<epic-id>",
  subject="[Track 1] COMPLETE",
  body_md="All beads done: <list>. Summary: ..."
)

Return a summary of all work completed.
"""
)

# Repeat Task() for each track in TRACKS array
```

---

## Phase 4: Monitor Progress

While workers execute, monitor via:

### Check Epic Thread for Updates

```bash
search_messages(
  project_key="<path>",
  query="<epic-id>",
  limit=20
)
```

### Check for Blockers

```bash
fetch_inbox(
  project_key="<path>",
  agent_name="<OrchestratorName>",
  urgent_only=true,
  include_bodies=true
)
```

### Check Bead Status

```bash
bv --robot-triage --graph-root <epic-id> 2>/dev/null | jq '.quick_ref'
```

---

## Phase 5: Handle Cross-Track Issues

### If Worker Reports Blocker

```bash
# Read the blocker message
# Determine if it's:
# 1. Waiting on another track → message that worker
# 2. Needs decision → make decision and reply
# 3. External blocker → update bead status

reply_message(
  message_id=<blocker-msg-id>,
  body_md="Resolution: ..."
)
```

### If File Conflict

```bash
# Check who holds reservation
# Message holder to coordinate
send_message(
  to=["<Holder>"],
  thread_id="<epic-id>",
  subject="File conflict resolution",
  body_md="<Worker> needs <files>. Can you release?"
)
```

---

## Phase 6: Epic Completion

When all workers report track complete:

### Verify All Done

```bash
bv --robot-triage --graph-root <epic-id> 2>/dev/null | jq '.quick_ref.open_count'
# Should be 0
```

### Send Completion Summary

```bash
send_message(
  to=["BlueLake", "GreenCastle", "RedStone"],
  thread_id="<epic-id>",
  subject="[<epic-id>] EPIC COMPLETE",
  body_md="""
## Epic Complete: <title>

### Track Summaries
- Track 1 (BlueLake): <summary>
- Track 2 (GreenCastle): <summary>
- Track 3 (RedStone): <summary>

### Deliverables
- <what was built>

### Learnings
- <key insights>
"""
)
```

### Close Epic

```bash
bd close <epic-id> --reason "All tracks complete"
```

### Template Variables

| Variable | Source | Example |
|----------|--------|---------|
| `{AGENT_NAME}` | TRACKS[].agent_name | `"BlueLake"` |
| `{N}` | Track index (1-based) | `1` |
| `{EPIC_ID}` | EPIC_ID | `"epic-2024-001"` |
| `{PROJECT_PATH}` | PROJECT_PATH | `"/home/user/myproject"` |
| `{TRACK_NUMBER}` | Track index | `1` |
| `{BEAD_LIST}` | TRACKS[].beads | `"bead-a, bead-b, bead-c"` |
| `{FILE_SCOPE}` | TRACKS[].file_scope | `"packages/sdk/**"` |
| `{ORCHESTRATOR_NAME}` | From register_agent | `"Orchestrator-001"` |

---

## Quick Reference

| Phase      | Action                                   |
| ---------- | ---------------------------------------- |
| Get Plan   | User provides execution plan            |
| Initialize | `ensure_project`, `register_agent`      |
| Spawn      | `Task()` for each track (parallel)      |
| Monitor    | `fetch_inbox`, `search_messages`        |
| Resolve    | `reply_message` for blockers            |
| Complete   | Verify all done, send summary, close epic|
