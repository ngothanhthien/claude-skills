---
name: agent-mail
description: "Agent Mail integration for email management and multi-agent coordination. Use for: email management via AgentMail API (send, receive, reply), multi-agent coordination with mail-like messaging, file reservations to prevent agent conflicts, agent identity and communication threads, and Beads integration for dependency-aware task planning."
---

# Agent Mail

## Overview

Agent Mail provides two complementary capabilities:

1. **AgentMail API** - Email management through MCP (send, receive, reply to messages)
2. **MCP Agent Mail** - Mail-like coordination layer for multi-agent workflows (identities, file reservations, threads)

Use **AgentMail API** when you need to manage emails through natural language. Use **MCP Agent Mail** when orchestrating multiple agents to avoid conflicts and coordinate work.

## Quick Decision Tree

```
Need to manage emails?
    YES -> AgentMail API (section below)
    NO
Need multi-agent coordination?
    YES -> MCP Agent Mail (section below)
    NO -> Consider other skills
```

---

# AgentMail API

## Installation

Get API key from https://agentmail.to

Add to MCP config (Claude Desktop, Cursor, etc.):

```json
{
  "mcpServers": {
    "AgentMail": {
      "command": "npx",
      "args": ["-y", "agentmail-mcp"],
      "env": {
        "AGENTMAIL_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

### Selective Tool Enablement

Enable only specific tools:

```json
{
  "mcpServers": {
    "AgentMail": {
      "command": "npx",
      "args": ["-y", "agentmail-mcp", "--tools", "get_message,send_message,reply_to_message"],
      "env": {
        "AGENTMAIL_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

## Available Tools

| Tool | Purpose |
|------|---------|
| `get_message` | Retrieve a message by its ID |
| `send_message` | Send a new message |
| `reply_to_message` | Reply to an existing message |

## Common Workflows

### Email Summarization
```
"Summarize my unread emails and prioritize by importance"
```

### Draft Creation
```
"Draft a professional email to [recipient] about [topic]"
```

### Auto-Reply
```
"Reply to this email with a confirmation of the meeting"
```

---

# MCP Agent Mail

## Overview

A mail-like coordination layer for coding agents that provides:
- **Identities**: Memorable agent names for coordination
- **Inbox/Outbox**: Asynchronous communication stored in Git
- **File Reservations**: Advisory leases to prevent conflicts
- **Searchable Threads**: Per-project message archives
- **Macros**: Bundled workflows for common operations

## Installation

```bash
pip install mcp-agent-mail
```

Or with uv:
```bash
uv pip install mcp-agent-mail
```

## Core Concepts

### Project Key
The absolute path of the repository, used as the unique identifier for all operations.

### Agent Name
Set via `AGENT_NAME` environment variable. Used for:
- Identity registration
- File reservations
- Message sending/receiving

### Thread ID
Shared identifier for related messages. Often maps to issue trackers (e.g., `bd-123` for Beads).

## Key Tools Reference

See [references/tools.md](references/tools.md) for complete tool documentation.

### Agent Registration

```python
# Ensure project exists
ensure_project(project_key="/path/to/repo")

# Register this agent
register_agent(project_key="/path/to/repo", agent_name="MyAgent")
```

### File Reservations

Reserve files before editing to signal intent and avoid conflicts:

```python
# Exclusive reservation (blocks others)
file_reservation_paths(
    project_key="/path/to/repo",
    agent_name="MyAgent",
    patterns=["src/**", "tests/**"],
    ttl_seconds=3600,
    exclusive=True,
    reason="Implementing feature bd-123"
)

# Non-exclusive reservation (advisory only)
file_reservation_paths(
    project_key="/path/to/repo",
    agent_name="MyAgent",
    patterns=["docs/**"],
    ttl_seconds=1800,
    exclusive=False
)
```

**Pattern syntax**: Git pathspec semantics (`src/**`, `*.py`, `:/path/to/file`)

### Messaging

```python
# Send message to a thread
send_message(
    project_key="/path/to/repo",
    from_agent="MyAgent",
    to_agent="OtherAgent",
    subject="[bd-123] Starting implementation",
    body="Beginning work on the authentication module...",
    thread_id="bd-123",
    ack_required=True
)

# Fetch inbox
inbox = fetch_inbox(
    project_key="/path/to/repo",
    agent_name="MyAgent",
    limit=50
)

# Acknowledge message
acknowledge_message(
    project_key="/path/to/repo",
    message_id="msg-abc123"
)
```

### Resources (Fast Reads)

```
# Read inbox
resource://inbox/MyAgent?project=/abs/path&limit=20

# Read thread
resource://thread/bd-123?project=/abs/path&include_bodies=true

# Check identity
resource://identity//abs/path
```

## Macros

Macros bundle common operations for efficiency.

### `macro_start_session`
Ensures project and registers agent in one call:
```python
macro_start_session(project_key="/path/to/repo", agent_name="MyAgent")
```

### `macro_prepare_thread`
Prepares a thread for communication:
```python
macro_prepare_thread(
    project_key="/path/to/repo",
    agent_name="MyAgent",
    thread_id="bd-123",
    subject="[bd-123] Feature implementation"
)
```

### `macro_file_reservation_cycle`
Reserve, work, release pattern:
```python
macro_file_reservation_cycle(
    project_key="/path/to/repo",
    agent_name="MyAgent",
    patterns=["src/**"],
    ttl_seconds=3600,
    exclusive=True
)
```

### `macro_contact_handshake`
Establish contact between agents in different repos:
```python
macro_contact_handshake(
    from_project="/path/to/frontend",
    from_agent="FrontendAgent",
    to_project="/path/to/backend",
    to_agent_name="BackendAgent"
)
```

## Multi-Repository Coordination

### Option A: Single Project Bus
Register both repos under the same `project_key`:
```python
# Frontend repo
register_agent(project_key="/shared/product", agent_name="FrontendAgent", patterns=["frontend/**"])

# Backend repo
register_agent(project_key="/shared/product", agent_name="BackendAgent", patterns=["backend/**"])
```

### Option B: Separate Projects
Link agents via contact handshake, then message directly:
```python
# Establish contact
macro_contact_handshake(
    from_project="/frontend",
    from_agent="FrontendAgent",
    to_project="/backend",
    to_agent_name="BackendAgent"
)

# Send cross-repo message
send_message(
    project_key="/frontend",
    from_agent="FrontendAgent",
    to_agent="BackendAgent@/backend",
    subject="API change notification",
    thread_id="FEAT-456"
)
```

## Git Guard Integration (Optional)

The pre-commit/pre-push guard blocks commits that conflict with others' active exclusive reservations.

### Enable Guards

```bash
mcp-agent-mail guard install /path/to/repo . --prepush
```

### Set Agent Name for Guards

```bash
export AGENT_NAME="MyAgent"
```

### Check Guard Status

```bash
mcp-agent-mail guard status .
```

### Advisory Mode

Set to warn without blocking:
```bash
export AGENT_MAIL_GUARD_MODE=warn
```

## Integration with Beads

Beads is the single source of truth for task status. Use Agent Mail for conversation and coordination.

| Concept | Beads | Agent Mail |
|---------|-------|------------|
| Task ID | `bd-123` | `thread_id` |
| Status | `bd ready`, `bd close` | Messages with `[bd-123]` prefix |
| Work scope | Issue metadata | File reservations with `reason="bd-123"` |

### Typical Flow

1. `bd ready --json` → Select task
2. `file_reservation_paths(..., reason="bd-123")`
3. `send_message(..., thread_id="bd-123", subject="[bd-123] Starting...")`
4. Work and reply in-thread
5. `bd close bd-123` + `release_file_reservations(...)`
6. Final reply: `[bd-123] Completed`

## Product Bus (Multi-Repo Orchestration)

Coordinate across all repos in a product:

```bash
# Create product
mcp-agent-mail products ensure MyProduct --name "My Product"

# Link repos
mcp-agent-mail products link MyProduct /path/to/frontend
mcp-agent-mail products link MyProduct /path/to/backend

# Search across all repos
mcp-agent-mail products search MyProduct "bd-123 OR release plan" --limit 50

# Product-wide inbox
mcp-agent-mail products inbox MyProduct MyAgent --limit 50 --urgent-only
```

## Common Pitfalls

| Error | Solution |
|-------|----------|
| "from_agent not registered" | Call `register_agent` first |
| "FILE_RESERVATION_CONFLICT" | Adjust patterns, wait for expiry, or use non-exclusive |
| Auth errors | Ensure JWT token `kid` matches server JWKS |
| Messages not received | Check `fetch_inbox` and call `acknowledge_message` |

## Resources

- **[references/tools.md](references/tools.md)** - Complete MCP tool reference
- **[references/configuration.md](references/configuration.md)** - Environment variables and config options
- **[references/beads_integration.md](references/beads_integration.md)** - Beads integration patterns
