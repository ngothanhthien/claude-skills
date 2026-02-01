---
name: gitlab-knowledge-graph
description: "GitLab Knowledge Graph (GKG) CLI tool for creating structured, queryable graph databases from code repositories. Use when analyzing codebase structure and relationships, performing natural language queries against code (Codebase RAG), navigating code definitions and references, conducting impact analysis before making changes, or integrating AI agents with code via MCP. Supports Rust, TypeScript, Python, Ruby, Java/Kotlin with extensible architecture. Features: indexing, REST API/web UI (port 27495), code relationship analysis (dependencies, inheritance, function calls)."
---

# GitLab Knowledge Graph

## Overview

GitLab Knowledge Graph (GKG) is a Rust-based CLI tool that creates structured, queryable graph databases from code repositories. It indexes code structure and relationships, enabling natural language queries, code navigation, and impact analysis.

## Quick Start

### Installation
```bash
curl -fsSL https://gitlab.com/gitlab-org/rust/knowledge-graph/-/raw/main/install.sh | bash
export PATH="$HOME/.local/bin:$PATH"
```

### Basic Workflow
```bash
# Index the current project
gkg index

# Start the server with web UI
gkg server start

# Access web UI at http://127.0.0.1:27495
# Or use REST API endpoints
```

## Indexing Projects

**Index current directory:**
```bash
gkg index
```

**Index specific path:**
```bash
gkg index /path/to/project
```

**What gets indexed:**
- Structural elements: files, directories, classes, functions, methods
- Code relationships: function calls, inheritance, dependencies, imports
- Languages: Rust, TypeScript, Python, Ruby, Java/Kotlin
  - Java/Kotlin is considered mature and serves as reference implementation
  - Extensible architecture via gitlab-code-parser supports adding new languages

**Re-index after:** Adding files, significant refactoring, signature changes, dependency modifications.

## Querying the Knowledge Graph

### Web UI
Navigate to http://127.0.0.1:27495 after starting `gkg server`.

### REST API
```bash
# Natural language query
curl -X POST http://127.0.0.1:27495/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How is authentication implemented?", "limit": 10}'

# Get file details
curl http://127.0.0.1:27495/api/v1/files/src/auth/user.rb

# Get symbol details
curl http://127.0.0.1:27495/api/v1/symbols/User
```

### Effective Queries
- "How does [feature] work?"
- "Which files modify [resource]?"
- "Where is [component] configured?"
- "What APIs are exposed?"
- "How is user input validated?"

## Code Navigation

**Find definition:**
```bash
curl http://127.0.0.1:27495/api/v1/symbols/function_name
```

**Find all references (callers):**
```bash
curl "http://127.0.0.1:27495/api/v1/relationships?to=function_name&type=calls"
```

**Trace call chain:**
```bash
# What does this function call?
curl "http://127.0.0.1:27495/api/v1/relationships?from=function_name&type=calls"
```

## Impact Analysis

**Before changing a function:**
```bash
# What calls this function?
curl "http://127.0.0.1:27495/api/v1/relationships?to=function_name&type=calls"

# What does this function call?
curl "http://127.0.0.1:27495/api/v1/relationships?from=function_name&type=calls"

# File dependencies
curl http://127.0.0.1:27495/api/v1/files/src/module/file.py
```

**Refactoring safety check:**
```bash
# Check inheritance relationships
curl "http://127.0.0.1:27495/api/v1/relationships?to=ClassName&type=inherits"

# Check import dependencies
curl "http://127.0.0.1:27495/api/v1/relationships?to=ClassName&type=imports"
```

## MCP Integration

GKG provides an MCP server for AI agent integration.

**Configure MCP client:**
```json
{
  "mcpServers": {
    "gkg": {
      "command": "gkg",
      "args": ["mcp", "server"]
    }
  }
}
```

**MCP tools available:**
- `gkg_index` - Index current directory
- `gkg_query` - Query the knowledge graph
- `gkg_find_references` - Find symbol references
- `gkg_find_definitions` - Find symbol definitions
- `gkg_get_callers` - Find function callers
- `gkg_get_callees` - Find functions called
- `gkg_get_dependencies` - Get dependency graph
- `gkg_trace_impact` - Trace change impact

## Troubleshooting

### Connection Refused / Server Not Running

**Symptoms:**
```
curl: (7) Failed to connect to 127.0.0.1 port 27495
Connection refused
```

**Solution:**
```bash
# Start the server
gkg server start

# Verify server is running
curl http://127.0.0.1:27495/api/v1/files

# If port 27495 is in use, use a different port
gkg server start --port 8080
```

### Empty Results / No Data Found

**Symptoms:**
- Queries return `[]` or empty results
- API returns `{"results": []}`
- Web UI shows no files or symbols

**Cause 1: Codebase not indexed**
```bash
# Check if data exists
ls ~/.local/share/gkg/

# If empty or missing, index the project
cd /path/to/project
gkg index

# Verify indexing completed
gkg index --status  # or check ~/.local/share/gkg/ for new files
```

**Cause 2: Unsupported file format or language**

GKG supports: Rust, TypeScript, Python, Ruby, Java/Kotlin.

If your codebase uses unsupported languages:
```bash
# Check what was actually indexed
curl http://127.0.0.1:27495/api/v1/files

# If empty, your files may be unsupported formats
# Supported: .rs, .py, .ts, .java, .rb, .kt (primary extensions for supported languages)
# Additional languages may be added via extensible gitlab-code-parser architecture
# Unsupported: .md, .txt, .json, .yaml, .xml, .sql, .sh, Dockerfile, etc.
```

**Cause 3: Indexed wrong directory**
```bash
# Verify you indexed the correct project
gkg index /correct/path/to/project

# Check indexed files
curl http://127.0.0.1:27495/api/v1/files | jq '.[] | .path'
```

### Stale Data / Old Code Structure

**Symptoms:**
- Queries return old function names
- Recently added files don't appear
- Refactored code shows old structure

**Solution:**
```bash
# Re-index after code changes
gkg index

# Or force fresh index
rm -rf ~/.local/share/gkg/
gkg index
```

### Symbol Not Found

**Symptoms:**
```
404 Not Found
{"error": "Symbol not found"}
```

**Solution:**
```bash
# Search with partial match or list all symbols
curl http://127.0.0.1:27495/api/v1/symbols | grep -i "partial_name"

# Use the query API for fuzzy search
curl -X POST http://127.0.0.1:27495/api/v1/query \
  -d '{"query": "function_name similar", "limit": 10}'
```

### MCP Tools Not Working

**Symptoms:**
- MCP client cannot connect to GKG
- Tools return "server not running" errors

**Solution:**
```bash
# Ensure GKG server is running (not just MCP server)
gkg server start

# Verify MCP config has correct command
# "command": "gkg" must be in $PATH
which gkg

# Test MCP server directly
gkg mcp server --test
```

### Permission Errors

**Symptoms:**
```
Permission denied: ~/.local/share/gkg/
```

**Solution:**
```bash
# Fix data directory permissions
mkdir -p ~/.local/share/gkg/
chmod 755 ~/.local/share/gkg/

# Or specify custom data location
gkg index --data-dir /tmp/gkg
```

## Resources

### References
- **[gkg_commands.md](references/gkg_commands.md)** - Complete CLI and REST API reference
- **[usage_patterns.md](references/usage_patterns.md)** - Detailed usage patterns and workflows

Read these references for:
- Complete command syntax and options
- All REST API endpoints with examples
- MCP tool specifications
- Advanced usage patterns for each use case
