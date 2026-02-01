# MCP Agent Mail Tools Reference

Complete reference for all MCP tools provided by mcp-agent-mail.

## Table of Contents

- [Agent Registration](#agent-registration)
- [File Reservations](#file-reservations)
- [Messaging](#messaging)
- [Resources](#resources)
- [Macros](#macros)
- [Product Bus](#product-bus)
- [Build Slots](#build-slots)
- [Guard](#guard)

---

## Agent Registration

### `ensure_project`

Creates or ensures a project exists.

```python
ensure_project(project_key: str) -> dict
```

**Parameters:**
- `project_key`: Absolute path to repository (used as unique identifier)

**Returns:** Project metadata

### `register_agent`

Registers an agent identity for a project.

```python
register_agent(
    project_key: str,
    agent_name: str,
    patterns: list[str] | None = None
) -> dict
```

**Parameters:**
- `project_key`: Absolute path to repository
- `agent_name`: Unique name for this agent
- `patterns`: Optional glob patterns for default file reservation scope

**Returns:** Agent registration details

### `get_agent_status`

Get current status of an agent.

```python
get_agent_status(
    project_key: str,
    agent_name: str
) -> dict
```

---

## File Reservations

### `file_reservation_paths`

Create file reservations (leases) to signal intent and avoid conflicts.

```python
file_reservation_paths(
    project_key: str,
    agent_name: str,
    patterns: list[str],
    ttl_seconds: int = 3600,
    exclusive: bool = True,
    reason: str = ""
) -> dict
```

**Parameters:**
- `project_key`: Absolute path to repository
- `agent_name`: Agent creating the reservation
- `patterns`: Git pathspec patterns (`src/**`, `*.py`, `:/path/to/file`)
- `ttl_seconds`: Time-to-live in seconds (default: 3600)
- `exclusive`: Whether reservation blocks others (default: true)
- `reason`: Optional reason (e.g., issue ID like "bd-123")

**Returns:** Reservation details including reservation ID

**Errors:**
- `FILE_RESERVATION_CONFLICT`: Conflicts with existing exclusive reservation

### `release_file_reservations`

Release active file reservations.

```python
release_file_reservations(
    project_key: str,
    agent_name: str,
    paths: list[str] | None = None,
    reservation_id: str | None = None
) -> dict
```

**Parameters:**
- `project_key`: Absolute path to repository
- `agent_name`: Agent releasing reservations
- `paths`: Optional specific paths to release
- `reservation_id`: Optional specific reservation ID to release

### `list_reservations`

List active file reservations.

```python
list_reservations(
    project_key: str,
    agent_name: str | None = None
) -> list[dict]
```

---

## Messaging

### `send_message`

Send a message to another agent or broadcast.

```python
send_message(
    project_key: str,
    from_agent: str,
    to_agent: str | None = None,
    subject: str = "",
    body: str = "",
    thread_id: str | None = None,
    ack_required: bool = False,
    attachments: list[dict] | None = None
) -> dict
```

**Parameters:**
- `project_key`: Absolute path to repository
- `from_agent`: Sender agent name
- `to_agent`: Recipient agent name (null for broadcast)
- `subject`: Message subject line
- `body`: Message body content
- `thread_id`: Thread identifier for grouping related messages
- `ack_required`: Whether acknowledgment is required
- `attachments`: Optional list of attachment metadata

**Returns:** Message details including message ID

### `fetch_inbox`

Fetch messages for an agent's inbox.

```python
fetch_inbox(
    project_key: str,
    agent_name: str,
    limit: int = 50,
    include_acknowledged: bool = False,
    include_bodies: bool = False
) -> list[dict]
```

**Parameters:**
- `project_key`: Absolute path to repository
- `agent_name`: Agent whose inbox to fetch
- `limit`: Maximum messages to return
- `include_acknowledged`: Include already acknowledged messages
- `include_bodies`: Include message body content

**Returns:** List of message dictionaries

### `acknowledge_message`

Mark a message as acknowledged.

```python
acknowledge_message(
    project_key: str,
    message_id: str,
    agent_name: str
) -> dict
```

### `get_thread`

Get all messages in a thread.

```python
get_thread(
    project_key: str,
    thread_id: str,
    include_bodies: bool = True
) -> list[dict]
```

### `search_messages`

Search messages by content.

```python
search_messages(
    project_key: str,
    query: str,
    limit: int = 20
) -> list[dict]
```

---

## Resources

Resources provide fast read-only access via URI pattern.

### Inbox Resource

```
resource://inbox/{agent_name}?project={abs_path}&limit={n}
```

### Thread Resource

```
resource://thread/{thread_id}?project={abs_path}&include_bodies={true|false}
```

### Identity Resource

```
resource://identity/{abs_path}
```

Requires `WORKTREES_ENABLED=1` or `GIT_IDENTITY_ENABLED=1`.

---

## Macros

Bundled workflows for common operations.

### `macro_start_session`

Ensure project and register agent in one call.

```python
macro_start_session(
    project_key: str,
    agent_name: str
) -> dict
```

### `macro_prepare_thread`

Prepare a thread with initial message.

```python
macro_prepare_thread(
    project_key: str,
    agent_name: str,
    thread_id: str,
    subject: str,
    initial_message: str = ""
) -> dict
```

### `macro_file_reservation_cycle`

Complete reserve-work-release cycle.

```python
macro_file_reservation_cycle(
    project_key: str,
    agent_name: str,
    patterns: list[str],
    ttl_seconds: int = 3600,
    exclusive: bool = True
) -> dict
```

Returns reservation ID that can be used with `release_file_reservations`.

### `macro_contact_handshake`

Establish contact between agents in different repositories.

```python
macro_contact_handshake(
    from_project: str,
    from_agent: str,
    to_project: str,
    to_agent_name: str
) -> dict
```

### `macro_summarize_threads`

Summarize threads with optional LLM processing.

```python
macro_summarize_threads(
    project_key: str,
    thread_ids: list[str],
    use_llm: bool = True
) -> list[dict]
```

---

## Product Bus

Coordinate across multiple repositories in a product.

### `ensure_product`

Create or ensure a product exists.

```python
ensure_product(product_key: str) -> dict
```

### `products_link`

Link a repository to a product.

```python
products_link(
    product_key: str,
    project_key: str
) -> dict
```

### `search_messages_product`

Search across all repos in a product.

```python
search_messages_product(
    product_key: str,
    query: str,
    limit: int = 20
) -> list[dict]
```

### Product Resources

```
resource://product/{product_key}
```

Returns product status and linked projects.

---

## Build Slots

Advisory slots for long-running tasks like builds.

### `acquire_build_slot`

Acquire a build slot.

```python
acquire_build_slot(
    project_key: str,
    agent_name: str,
    slot_name: str,
    ttl_seconds: int = 3600,
    exclusive: bool = True
) -> dict
```

### `renew_build_slot`

Renew an existing build slot.

```python
renew_build_slot(
    project_key: str,
    agent_name: str,
    slot_name: str,
    extend_seconds: int = 1800
) -> dict
```

### `release_build_slot`

Release a build slot.

```python
release_build_slot(
    project_key: str,
    agent_name: str,
    slot_name: str
) -> dict
```

---

## Guard

Git hooks for conflict detection.

### `guard_status`

Check guard installation status.

```python
guard_status(project_key: str) -> dict
```

### `guard_install`

Install pre-commit/pre-push guards.

```python
guard_install(
    project_key: str,
    target_dir: str,
    hooks: list[str] = ["pre-commit", "pre-push"]
) -> dict
```

### `guard_check`

Run guard checks manually.

```python
guard_check(
    project_key: str,
    hook_type: str = "pre-commit"
) -> dict
```

---

## Contact Management

### `request_contact`

Request contact with another agent.

```python
request_contact(
    project_key: str,
    from_agent: str,
    to_agent_name: str,
    to_project: str | None = None
) -> dict
```

### `respond_contact`

Respond to a contact request.

```python
respond_contact(
    project_key: str,
    agent_name: str,
    contact_request_id: str,
    accept: bool = True
) -> dict
```

### `list_contacts`

List established contacts.

```python
list_contacts(
    project_key: str,
    agent_name: str
) -> list[dict]
```
