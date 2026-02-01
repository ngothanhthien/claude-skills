# GKG Commands Reference

Complete reference for GitLab Knowledge Graph CLI commands and REST API.

## CLI Commands

### Installation
```bash
curl -fsSL https://gitlab.com/gitlab-org/rust/knowledge-graph/-/raw/main/install.sh | bash
export PATH="$HOME/.local/bin:$PATH"
```

### Index Commands

**`gkg index`**
Index the current directory as a code repository.
```bash
cd /path/to/project
gkg index
```

**`gkg index <path>`**
Index a specific directory.
```bash
gkg index ~/projects/my-app
```

**What gets indexed:**
- Structural elements: files, directories, classes, functions, methods
- Code relationships: function calls, inheritance, dependencies, imports
- Language support: Rust, Python, TypeScript, JavaScript, Go, Java, Ruby, PHP, C/C++, C#, Kotlin

### Server Commands

**`gkg server start`**
Start the HTTP server with web UI.
- Web UI: http://127.0.0.1:27495
- API endpoint: http://127.0.0.1:27495/api/v1/...

**`gkg server start --port <PORT>`**
Start server on a custom port.
```bash
gkg server start --port 8080
```

**`gkg server stop`**
Stop the running server.

### Data Location

Indexed data is stored in: `~/.local/share/gkg/`

## REST API

### Query Endpoints

**POST /api/v1/query**
Execute a natural language query against the indexed codebase.

Request:
```json
{
  "query": "Which files modify user permissions?",
  "limit": 10
}
```

Response:
```json
{
  "results": [
    {
      "file": "src/auth/user.rb",
      "confidence": 0.95,
      "excerpt": "def update_permission(user, permission)...",
      "line": 42
    }
  ]
}
```

**GET /api/v1/graph**
Retrieve the full graph structure (use with caution on large codebases).

Response:
```json
{
  "nodes": [
    {"id": "file_1", "type": "file", "name": "src/main.rs"},
    {"id": "class_1", "type": "class", "name": "User"}
  ],
  "edges": [
    {"from": "file_1", "to": "class_1", "type": "contains"}
  ]
}
```

**GET /api/v1/files**
List all indexed files.

**GET /api/v1/files/{file_path}**
Get details for a specific file.

Response:
```json
{
  "path": "src/auth/user.rb",
  "language": "Ruby",
  "classes": ["User", "Permission"],
  "functions": ["update_permission", "check_access"],
  "imports": ["bcrypt", "jwt"],
  "dependencies": ["database.rb"]
}
```

**GET /api/v1/symbols**
List all symbols (classes, functions, methods).

**GET /api/v1/symbols/{symbol_name}**
Get details for a specific symbol including references and relationships.

**GET /api/v1/relationships**
Get relationships between entities.

Query parameters:
- `from`: Source entity ID
- `to`: Target entity ID
- `type`: Relationship type (calls, imports, inherits, contains)

## MCP Integration

GKG provides an MCP (Model Context Protocol) server for AI agent integration.

### MCP Server Configuration

Add to your MCP client configuration (e.g., Claude Desktop config):

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

### MCP Tools

**`gkg_index`**: Index the current directory
**`gkg_query`**: Query the knowledge graph
**`gkg_find_references`**: Find all references to a symbol
**`gkg_find_definitions`**: Find definition of a symbol
**`gkg_get_callers`**: Find all callers of a function
**`gkg_get_callees`**: Find all functions called by a function
**`gkg_get_dependencies`**: Get dependency graph for a file
**`gkg_trace_impact`**: Trace impact of changing a symbol

## Usage Patterns

### Codebase RAG (Retrieval-Augmented Generation)
```bash
# Index the codebase
gkg index

# Start server
gkg server start

# Query via web UI at http://127.0.0.1:27495
# Or via API:
curl -X POST http://127.0.0.1:27495/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How is authentication implemented?", "limit": 5}'
```

### Code Navigation
```bash
# Find where a function is defined
curl http://127.0.0.1:27495/api/v1/symbols/process_payment

# Find all callers of a function
curl -X GET "http://127.0.0.1:27495/api/v1/relationships?from=process_payment&type=calls"

# Find what a function calls
curl -X GET "http://127.0.0.1:27495/api/v1/relationships?to=process_payment&type=calls"
```

### Impact Analysis
```bash
# Get dependencies for a file
curl http://127.0.0.1:27495/api/v1/files/src/payment/processor.py

# Trace impact of changing a function
curl http://127.0.0.1:27495/api/v1/symbols/validate_payment
# Returns: callers, callees, related files
```

## Tips

- Run `gkg index` after significant code changes
- The server must be running for queries to work
- Use MCP tools for seamless AI-assisted code exploration
- Results include confidence scores for relevance ranking
