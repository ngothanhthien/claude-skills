---
name: extract-plan-to-bead
description: "Extract structured plans from markdown files and convert them into beads using the br (beads_rust) CLI, then generate execution plans for parallel worker orchestration. Use when user has a plan document with hierarchical tasks/epics that need to be converted into actionable beads with proper dependencies, priorities, and types, plus an execution plan with track assignments. Handles reading plan hierarchies, creating epic/task beads, setting priorities, adding labels, building dependency graphs, and creating execution-ready plans via bv --robot-plan. Uses br CLI (not bd) - requires br and bv to be installed."
---

# Extract Plan To Bead

Convert structured planning documents into actionable beads using the beads_rust (br) CLI.

## Quick Start

```bash
# Extract plan to beads
extract_plan_to_bead "path/to/plan.md"
```

## Workflow

```
Read Plan → Parse Hierarchy → Create Beads → Add Dependencies → Set Priorities → Add Labels → Create Execution Plan
```

### Step 1: Read and Parse Plan

Read the plan markdown file and identify hierarchical structure:

- **Epics** - Top-level features or major work items
- **Tasks** - Individual work items under epics
- **Subtasks** - Nested tasks (create with parent task dependency)

**Common plan patterns:**
- Numbered sections: `## 1. Feature Name` → Epic
- Bullet points with checkboxes: `- [ ] Task` → Task
- Nested bullets: Subtasks with parent dependency
- Priority markers: `[P0]`, `[CRITICAL]`, `[HIGH]`, `[LOW]`
- Tags: `backend:`, `frontend:`, `#label`

### Step 2: Create Beads

For each identified item, create beads using `br`:

```bash
# Epic bead
br create "Epic: Implement user auth" --type epic --priority 1

# Task bead
br create "Set up database schema" --type task --priority 1
```

**Type mapping:**
- Epics → `--type epic`
- Tasks → `--type task`
- Spike/Research → `--type task --label spike`
- Bug → `--type bug`

### Step 3: Build Dependency Graph

Create dependencies based on hierarchy:

```bash
# Task depends on epic (must complete epic first)
br dep add <task-id> <epic-id>

# Subtask depends on parent task
br dep add <subtask-id> <parent-task-id>
```

**Dependency rules:**
- Tasks under an epic depend ON the epic (epic blocks → tasks)
- Subtasks depend on their parent task
- Explicit dependencies: `depends on:` or `blocks:` keywords

### Step 4: Set Priorities

Map priority indicators to br priority values:

| Plan Indicator | br Priority | Description |
|----------------|-------------|-------------|
| P0, CRITICAL, URGENT | 0 | Critical - block everything |
| P1, HIGH | 1 | High priority |
| P2, MEDIUM | 2 | Medium priority (default) |
| P3, LOW | 3 | Low priority |
| P4, BACKLOG | 4 | Backlog |

```bash
br update <bead-id> --priority 0
```

### Step 5: Add Labels

Extract labels from plan sections and tags:

```bash
# Add domain labels (from sections)
br label add <bead-id> backend frontend database

# Add custom labels (from #tags or @mentions)
br label add <bead-id> security urgent
```

### Step 6: Create Execution Plan

Generate an **execution-ready plan** so the orchestrator can spawn parallel workers immediately.

#### Get Parallel Tracks

```bash
# Get track assignments from bv
bv --robot-plan 2>/dev/null | jq '.plan.tracks'
```

#### Assign File Scopes

For each track, determine the file scope based on beads in that track:

```bash
# For each bead, check which files it touches
br show <bead-id>  # Look at description for file hints
```

**File scope rules:**
- File scopes must NOT overlap between tracks
- Use glob patterns: `packages/sdk/**`, `apps/server/**`
- If overlap unavoidable, merge into single track

#### Generate Agent Names

Assign unique adjective+noun names to each track:
- BlueLake, GreenCastle, RedStone, PurpleBear
- Names are memorable identifiers, NOT role descriptions

#### Write Execution Plan Document

Save to `history/<feature>/execution-plan.md`:

```markdown
# Execution Plan: <Feature Name>

Epic: <epic-id>
Generated: <date>

## Tracks

| Track | Agent       | Beads (in order)      | File Scope        |
| ----- | ----------- | --------------------- | ----------------- |
| 1     | BlueLake    | br-10 → br-11 → br-12 | `packages/sdk/**` |
| 2     | GreenCastle | br-20 → br-21         | `packages/cli/**` |
| 3     | RedStone    | br-30 → br-31 → br-32 | `apps/server/**`  |

## Track Details

### Track 1: BlueLake - <track-description>

**File scope**: `packages/sdk/**`
**Beads**:

1. `br-10`: <title> - <brief description>
2. `br-11`: <title> - <brief description>
3. `br-12`: <title> - <brief description>

### Track 2: GreenCastle - <track-description>

**File scope**: `packages/cli/**`
**Beads**:

1. `br-20`: <title> - <brief description>
2. `br-21`: <title> - <brief description>

### Track 3: RedStone - <track-description>

**File scope**: `apps/server/**`
**Beads**:

1. `br-30`: <title> - <brief description>
2. `br-31`: <title> - <brief description>
3. `br-32`: <title> - <brief description>

## Cross-Track Dependencies

- Track 2 can start after br-11 (Track 1) completes
- Track 3 has no cross-track dependencies

## Key Learnings

Embedded in beads, summarized for orchestrator reference:

- <learning 1>
- <learning 2>
```

#### Validate Execution Plan

Before finalizing, verify:

```bash
# No cycles in the graph
bv --robot-insights 2>/dev/null | jq '.Cycles'

# All beads assigned to tracks
bv --robot-plan 2>/dev/null | jq '.plan.unassigned'
```

## Plan Format Examples

### Format 1: Numbered with Priority Tags

```markdown
## 1. User Authentication [P0]

- [ ] Design auth schema [backend]
- [ ] Implement login endpoint [backend]
- [ ] Create login UI [frontend]
```

**Creates:**
- Epic: `bd-xxx` "User Authentication" (priority 0)
- Task: `bd-yyy` "Design auth schema" (depends on epic, label: backend)
- Task: `bd-zzz` "Implement login endpoint" (depends on epic, label: backend)
- Task: `bd-aaa` "Create login UI" (depends on epic, label: frontend)

### Format 2: Hierarchical Checkboxes

```markdown
## Epic: Payment Processing

- [ ] Integrate Stripe SDK [HIGH]
  - [ ] Create webhook handler
  - [ ] Add payment method storage
- [ ] Build checkout flow [MEDIUM]
```

**Creates:**
- Epic: `bd-xxx` "Payment Processing"
- Task: `bd-yyy` "Integrate Stripe SDK" (priority 1)
- Subtask: `bd-zzz` "Create webhook handler" (depends on bd-yyy)
- Subtask: `bd-aaa` "Add payment method storage" (depends on bd-yyy)
- Task: `bd-bbb` "Build checkout flow" (priority 2)

### Format 3: Flat List with Dependencies

```markdown
# Implementation Plan

1. Setup project structure
2. depends on: 1 → Configure build tools
3. depends on: 2 → Implement core feature
```

**Creates:**
- Task: `bd-xxx` "Setup project structure"
- Task: `bd-yyy` "Configure build tools" (depends on bd-xxx)
- Task: `bd-zzz` "Implement core feature" (depends on bd-yyy)

## Resources

### scripts/extract_plan_to_bead.py

Python script that automates plan parsing and bead creation. Use for complex or large plans.

**Usage:**
```bash
python3 /path/to/extract_plan_to_bead/extract_plan_to_bead.py "plan.md"
```

**Handles:**
- Multiple plan formats
- Priority extraction
- Label parsing
- Dependency graph building
- Automatic br command execution

### references/br_commands.md

Quick reference for br and bv commands used in this workflow.

**Essential br commands:**
- `br create` - Create new bead
- `br dep add` - Add dependency
- `br label add` - Add label
- `br update` - Update bead properties
- `br show` - Display bead details (for file scope hints)
- `br ready` - Show actionable beads

**Essential bv commands (for execution planning):**
- `bv --robot-plan` - Generate parallel track assignments
- `bv --robot-suggest` - Find missing dependencies
- `bv --robot-insights` - Detect cycles, bottlenecks
- `bv --robot-priority` - Validate priorities

## Important Notes

**br vs bd differences:**
- Command is `br`, not `bd`

**Prerequisites:**
- br must be installed and initialized in the repo (`br init`)
- bv must be available for execution planning (`bv --robot-plan`)
- Plan file must be markdown format
- jq must be available for parsing bv JSON output

**Best practices:**
- Run `br ready` after creation to verify dependency graph
- Use `br list --json` to programmatically verify created beads
- Check for cycles with `br dep cycles` if dependencies seem wrong
- Labels should be lowercase, use hyphens for multi-word labels
- Run `bv --robot-insights` before creating execution plan to validate graph
- Verify no unassigned beads with `bv --robot-plan | jq '.plan.unassigned'`
