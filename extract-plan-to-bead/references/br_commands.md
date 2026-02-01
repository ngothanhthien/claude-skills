# br (beads_rust) Command Reference

Quick reference for beads_rust CLI commands used in plan-to-bead extraction.

## Essential Commands for Plan Extraction

### Creating Beads

```bash
# Create a basic bead
br create "Task title"

# Create with type and priority
br create "Task title" --type epic --priority 1

# Create with description
br create "Task title" --description "Detailed description"

# Quick capture (returns ID only)
br q "Quick task"
```

**Types:** `epic`, `task`, `bug`

**Priorities:** `0` (critical) through `4` (backlog)

### Managing Dependencies

```bash
# Add dependency (first depends on second)
br dep add <child-id> <parent-id>

# List dependencies for a bead
br dep list <bead-id>

# Show dependency tree
br dep tree <bead-id>

# Find cycles in dependency graph
br dep cycles

# Remove dependency
br dep remove <child-id> <parent-id>
```

### Managing Labels

```bash
# Add labels
br label add <bead-id> backend frontend urgent

# Remove label
br label remove <bead-id> urgent

# List labels for a bead
br label list <bead-id>

# List all labels in project
br label list-all
```

### Updating Beads

```bash
# Update priority
br update <bead-id> --priority 0

# Update status
br update <bead-id> --status in_progress

# Update type
br update <bead-id> --type bug

# Set assignee
br update <bead-id> --assignee "user@example.com"
```

**Statuses:** `open`, `in_progress`, `closed`, `deferred`

### Querying Beads

```bash
# List all open beads
br list

# List by priority
br list --priority 0-1

# List by status
br list --status open

# List by type
br list --type epic

# Show actionable (not blocked) beads
br ready

# Show blocked beads
br blocked

# Search beads
br search "authentication"

# Show stale beads
br stale --days 30

# Count beads by status
br count --by status
```

### Viewing Beads

```bash
# Show bead details
br show <bead-id>

# Show as JSON
br show <bead-id> --json

# List as JSON (for scripting)
br list --json

# Ready beads as JSON
br ready --json
```

### Sync and Git Operations

```bash
# Export database to JSONL (for git commit)
br sync --flush-only

# Import from JSONL (after git pull)
br sync --import-only

# Full sync (import + export)
br sync

# Check sync status
br sync --status
```

**Important:** br does NOT auto-commit. After creating beads:

```bash
br sync --flush-only
git add .beads/
git commit -m "Add beads from plan"
```

### Closing Beads

```bash
# Close with reason
br close <bead-id> --reason "Completed implementation"

# Reopen closed bead
br reopen <bead-id>

# Delete (tombstone - marks as deleted)
br delete <bead-id>
```

## Global Flags

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON (machine-readable) |
| `--quiet` / `-q` | Suppress output |
| `--verbose` / `-v` | Increase verbosity |
| `--no-color` | Disable colored output |
| `--db <path>` | Override database path |

## Output Modes

br auto-detects output mode:

- **Rich** (TTY with color): Formatted tables and styled panels
- **Plain** (piped or NO_COLOR): Clean text
- **JSON** (`--json` flag): Structured output for scripts
- **Quiet** (`--quiet` flag): Minimal output

## Common Workflows

### Create Epic with Tasks

```bash
# Create epic
EPIC=$(br create "User Authentication" --type epic --priority 1)

# Create tasks that depend on epic
TASK1=$(br create "Design schema" --type task)
br dep add $TASK1 $EPIC

TASK2=$(br create "Implement login" --type task)
br dep add $TASK2 $EPIC

# Add labels
br label add $TASK1 backend
br label add $TASK2 backend

# Sync
br sync --flush-only
```

### View Actionable Work

```bash
# See what's ready to work on
br ready

# Get top priority as JSON for scripting
br ready --json | jq '.[0]'
```

### Check Dependency Graph

```bash
# Check for cycles
br dep cycles

# Visualize tree
br dep tree <bead-id>

# See what's blocking a bead
br dep list <bead-id>
```

## Migration from bd to br

| bd Command | br Equivalent |
|------------|---------------|
| `bd create` | `br create` |
| `bd sync` | `br sync --flush-only` (then git commit manually) |
| `bd dep add` | `br dep add` |
| `bd label add` | `br label add` |
| `bd ready` | `br ready` |
| `bd list --json` | `br list --json` |

**Key differences:**
- Command is `br`, not `bd`
- No automatic git commits (manual: `git add .beads/ && git commit`)
- Same JSONL format for `issues.jsonl`
- Compatible with beads_viewer (`bv`)
