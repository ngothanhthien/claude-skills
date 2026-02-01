# Agent Mail Configuration Reference

Environment variables and configuration options for Agent Mail.

## Environment Variables

### Core Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AGENT_NAME` | Agent identity name for all operations | - | Yes (for agents) |
| `AGENT_MAIL_API_KEY` | API key for AgentMail service | - | Yes (for AgentMail API) |
| `WORKTREES_ENABLED` | Enable git worktree/identity features | `0` | No |
| `GIT_IDENTITY_ENABLED` | Enable git-based identity | `0` | No |

### Guard Behavior

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AGENT_MAIL_GUARD_MODE` | Guard mode: `block` or `warn` | `block` | No |
| `AGENT_MAIL_BYPASS` | Skip all guard checks | `0` | No |

### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AGENT_MAIL_SERVER_URL` | MCP server URL | `http://localhost:8007` | No |
| `AGENT_MAIL_JWKS_URL` | JWKS endpoint for JWT validation | - | No |
| `AGENT_MAIL_STATIC_TOKEN` | Static bearer token (when JWT disabled) | - | No |

### Cache and Storage

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CACHE_KEY` | Cache key prefix for build slots | Auto-generated | No |
| `ARTIFACT_DIR` | Directory for build artifacts | `.agent-mail/artifacts` | No |

## MCP Configuration

### Claude Desktop

Config file location:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### AgentMail API Configuration

```json
{
  "mcpServers": {
    "AgentMail": {
      "command": "npx",
      "args": ["-y", "agentmail-mcp"],
      "env": {
        "AGENTMAIL_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Selective Tool Enablement

```json
{
  "mcpServers": {
    "AgentMail": {
      "command": "npx",
      "args": ["-y", "agentmail-mcp", "--tools", "get_message,send_message,reply_to_message"],
      "env": {
        "AGENTMAIL_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### MCP Agent Mail Configuration

```json
{
  "mcpServers": {
    "mcp-agent-mail": {
      "command": "uvx",
      "args": ["mcp-agent-mail", "run"],
      "env": {
        "AGENT_NAME": "MyAgent",
        "PROJECT_KEY": "/path/to/repo"
      }
    }
  }
}
```

## File-Based Configuration

### .agent-mail.yaml

Discovery YAML for project identity (optional):

```yaml
project_uid: "my-product-frontend"
product_uid: "my-product"
display_name: "My Product - Frontend"
```

### .agent-mail-project-id

Committed marker file for stable identity:

```
abc123def456
```

Generate with:

```bash
mcp-agent-mail projects mark-identity . --commit
```

## CLI Configuration

### Global Config File

Location: `~/.config/mcp-agent-mail/config.yaml`

```yaml
default_agent_name: "ClaudeAgent"
default_project_key: "/home/user/projects/main"
guard_mode: "warn"  # or "block"
worktrees_enabled: false
```

### Project-Specific Config

Location: `.agent-mail/config.yaml` (in repo root)

```yaml
project_key: "/home/user/projects/myrepo"
agent_patterns:
  - "src/**"
  - "tests/**"
default_ttl: 3600
default_exclusive: true
```

## Identity Resolution Precedence

When `WORKTREES_ENABLED=1` or `GIT_IDENTITY_ENABLED=1`:

1. Committed marker `.agent-mail-project-id`
2. Discovery YAML `.agent-mail.yaml` with `project_uid:`
3. Private marker `.git/agent-mail/project-id`
4. Remote fingerprint: normalized `origin` + default branch
5. `git-common-dir` or path hash

## Authentication

### JWT Authentication (Recommended)

```bash
export AGENT_MAIL_JWKS_URL="https://your-auth.com/.well-known/jwks.json"
```

Tokens must include `kid` header that matches server JWKS.

### Static Token (Development Only)

```bash
export AGENT_MAIL_STATIC_TOKEN="your-secret-token"
```

**Warning:** Only use for local development. Never deploy with static tokens.

## Guard Modes

### Block Mode (Default)

```bash
export AGENT_MAIL_GUARD_MODE=block  # or unset
```

- Pre-commit: Blocks commits with conflicting reservations
- Pre-push: Blocks pushes with undetected conflicts

### Warn Mode

```bash
export AGENT_MAIL_GUARD_MODE=warn
```

- Prints rich conflict details
- Does not block operations
- Useful for initial deployment/trial

### Bypass

```bash
export AGENT_MAIL_BYPASS=1
```

- Disables all guard checks
- Use sparingly for emergency situations

## Build Slot Environment

When using build slots, additional environment variables are available:

| Variable | Description |
|----------|-------------|
| `CACHE_KEY` | Unique cache key for this slot |
| `ARTIFACT_DIR` | Directory for build artifacts |
| `SLOT_NAME` | Name of the acquired slot |
| `SLOT_ID` | Unique identifier for the slot |

Get via:

```bash
mcp-agent-mail amctl env --path . --agent $AGENT_NAME
```

## Quick Setup Checklist

- [ ] Set `AGENT_NAME` environment variable
- [ ] Configure MCP server in Claude Desktop/Cursor
- [ ] (Optional) Set `AGENT_MAIL_GUARD_MODE=warn` for trial
- [ ] (Optional) Create `.agent-mail.yaml` for project identity
- [ ] Run `mcp-agent-mail guard status .` to verify installation
