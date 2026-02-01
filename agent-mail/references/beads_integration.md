# Beads Integration Guide

Integration patterns for combining Beads (task planning) with Agent Mail (coordination).

## Overview

| Concern | Tool | Responsibility |
|---------|------|----------------|
| Task status, priority, dependencies | **Beads** | Single source of truth |
| Communication, decisions, audit trail | **Agent Mail** | Conversation and artifacts |
| Work scope coordination | **Agent Mail** | File reservations |

## Shared Identifiers

### Mapping Beads Issues to Mail Threads

| Beads | Agent Mail |
|-------|------------|
| Issue ID: `bd-123` | Thread ID: `bd-123` |
| Subject: Task title | Subject prefix: `[bd-123] ...` |
| Status: `open`, `blocked`, `done` | Messages with progress updates |
| Dependencies | File reservation `reason: "bd-123"` |

## Complete Workflow

### 1. Select Ready Work

```bash
bd ready --json
```

Returns tasks that are:
- Not blocked (dependencies satisfied)
- Highest priority first
- Available to start

### 2. Reserve Work Scope

```python
file_reservation_paths(
    project_key="/path/to/repo",
    agent_name="MyAgent",
    patterns=["src/**", "tests/**"],
    ttl_seconds=3600,
    exclusive=True,
    reason="bd-123"  # Links to Beads issue
)
```

### 3. Announce Work Start

```python
send_message(
    project_key="/path/to/repo",
    from_agent="MyAgent",
    to_agent=None,  # Broadcast
    subject="[bd-123] Start: Implement authentication",
    body="Beginning work on login flow...",
    thread_id="bd-123",
    ack_required=True
)
```

### 4. Work and Update

Reply in-thread as progress is made:

```python
send_message(
    project_key="/path/to/repo",
    from_agent="MyAgent",
    subject="[bd-123] Update: Schema designed",
    body="Created User model with email and password fields...",
    thread_id="bd-123"
)
```

Attach artifacts as needed:

```python
send_message(
    project_key="/path/to/repo",
    from_agent="MyAgent",
    subject="[bd-123] Screenshot: Login form",
    body="Attached preview of the new login UI",
    thread_id="bd-123",
    attachments=[{
        "type": "image",
        "path": "screenshots/login-form.png"
    }]
)
```

### 5. Complete and Release

```bash
# Update Beads (status authority)
bd close bd-123 --reason "Completed - login flow working"

# Release file reservations
release_file_reservations(
    project_key="/path/to/repo",
    agent_name="MyAgent",
    paths=["src/**", "tests/**"]
)

# Final mail message
send_message(
    project_key="/path/to/repo",
    from_agent="MyAgent",
    subject="[bd-123] Completed",
    body="Login flow complete. All tests passing.",
    thread_id="bd-123"
)
```

## Event Mirroring (Optional Automation)

### Beads → Mail Events

When Beads status changes, send Mail message:

```python
# On: bd update bd-123 --status blocked
send_message(
    project_key="/path/to/repo",
    from_agent="BeadsBot",
    subject="[bd-123] BLOCKED: Waiting for API",
    body="Issue blocked by bd-456 (API endpoint needed)",
    thread_id="bd-123",
    importance="high"
)
```

### Mail → Beads Events

When critical Mail acknowledgment is overdue:

```python
# Add label to surface in bd ready
bd label add bd-123 needs-ack

# Or bump priority
bd priority bd-123 --set critical
```

## Convention Summary

### Do

- Use `bd-###` as Mail `thread_id`
- Prefix all Mail subjects with `[bd-###]`
- Include `bd-###` in file reservation `reason`
- Reference `bd-###` in commit messages (optional)
- Treat Beads as single status source of truth

### Don't

- Create or manage tasks in Mail
- Use separate ID systems (causes drift)
- Duplicate status tracking in both tools

## Multi-Agent Coordination with Beads

### Scenario: Two Agents, One Task

**Task `bd-123`**: "Add user authentication"

**Frontend Agent:**
1. Reserve `frontend/src/**` with `reason="bd-123"`
2. Send `[bd-123] Start: Login form UI`
3. Work, update thread
4. Send `[bd-123] Ready: Backend API needed`

**Backend Agent:**
1. Reserve `backend/src/**` with `reason="bd-123"`
2. Send `[bd-123] Start: Auth endpoints`
3. Work, update thread
4. Send `[bd-123] Completed: API ready`

**Either Agent:**
5. `bd close bd-123 --reason "Completed by both agents"`

## CLI Integration Helpers

### Quick Start Workflow

```bash
# 1. Get ready task
TASK=$(bd ready --json | jq -r '.[0].id')

# 2. Reserve files (via Agent Mail MCP tool)
# ... call file_reservation_paths with reason="$TASK"

# 3. Update Beads status
bd start "$TASK" --reason "In progress"

# 4. When done
bd close "$TASK" --reason "Completed"
```

### Check Thread Status

```bash
# Get all messages for a Beads issue
mcp-agent-mail thread show "bd-123" --project /path/to/repo

# Summarize without LLM
mcp-agent-mail thread summarize "bd-123" --project /path/to/repo --no-llm
```

## Cross-Tool Search

```bash
# Find all Mail messages for Beads tasks
mcp-agent-mail search "bd-" --project /path/to/repo --limit 100

# Find specific issue across both tools
bd show bd-123
mcp-agent-mail thread show "bd-123" --project /path/to/repo
```

## Debugging

### Task Not Showing in `bd ready`

Check Beads:
```bash
bd show bd-123
```

Check if all dependencies are satisfied:
```bash
bd dependencies bd-123
```

### Messages Not in Thread

Verify `thread_id` matches Beads ID exactly:
```python
# Correct
thread_id="bd-123"

# Incorrect (causes split threads)
thread_id="BD-123"
thread_id="issue-123"
thread_id="beads-123"
```

### File Reservation Conflicts

Check who has conflicting reservations:
```python
reservations = list_reservations(
    project_key="/path/to/repo"
)
```

Wait for expiry or adjust patterns to avoid overlap.
