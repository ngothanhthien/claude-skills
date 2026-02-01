# GKG Usage Patterns

Practical usage patterns and workflows for GitLab Knowledge Graph.

## Codebase RAG Patterns

### Pattern: Exploring Unknown Codebase

**Scenario**: You're joining a new project and need to understand how it works.

**Workflow**:
1. Index the repository: `gkg index`
2. Start the server: `gkg server start`
3. Ask natural language questions via web UI or API

**Example Queries**:
- "How does user authentication work?"
- "Which files handle payment processing?"
- "Where is the database connection configured?"
- "What APIs does this application expose?"
- "How are errors handled across the codebase?"

**Expected Output**: Ranked list of relevant files, functions, and code snippets with confidence scores.

### Pattern: Feature Investigation

**Scenario**: You need to understand how a specific feature is implemented.

**Workflow**:
1. Query the feature name: "Where is the OAuth flow implemented?"
2. Follow the returned references to understand the call chain
3. Use symbol lookup to get detailed information about key functions

**Example**:
```bash
# Initial query
curl -X POST http://127.0.0.1:27495/api/v1/query \
  -d '{"query": "OAuth authentication flow", "limit": 10}'

# Get details on key function
curl http://127.0.0.1:27495/api/v1/symbols/oauth_callback

# Trace the flow
curl "http://127.0.0.1:27495/api/v1/relationships?from=oauth_callback&type=calls"
```

## Code Navigation Patterns

### Pattern: Find Definitions

**Scenario**: You see a function call and need to find its definition.

**Workflow**:
```bash
# Using API
curl http://127.0.0.1:27495/api/v1/symbols/function_name

# Returns: file path, line number, signature, parameters
```

### Pattern: Find All References

**Scenario**: You need to refactor a function and want to find all places it's used.

**Workflow**:
```bash
# Find all callers
curl "http://127.0.0.1:27495/api/v1/relationships?to=function_name&type=calls"

# Returns: list of all functions that call this one, with file locations
```

### Pattern: Trace Call Chain

**Scenario**: Understanding the execution flow from entry point to database.

**Workflow**:
```bash
# Start from entry point (e.g., request handler)
curl http://127.0.0.1:27495/api/v1/symbols/handle_request

# Follow the call chain
curl "http://127.0.0.1:27495/api/v1/relationships?from=handle_request&type=calls"

# Continue tracing as needed
```

## Impact Analysis Patterns

### Pattern: Before Making Changes

**Scenario**: You need to modify a function and want to know what will be affected.

**Workflow**:
1. Get all callers of the function
2. Get all functions the function calls
3. Check the files that depend on this module

```bash
# What calls this function?
curl "http://127.0.0.1:27495/api/v1/relationships?to=validate_user&type=calls"

# What does this function call?
curl "http://127.0.0.1:27495/api/v1/relationships?from=validate_user&type=calls"

# What files import this module?
curl http://127.0.0.1:27495/api/v1/files/src/auth/validator.py
```

### Pattern: Refactoring Safety Check

**Scenario**: Planning to rename or move a class/function.

**Workflow**:
1. Get symbol details including all references
2. Check for inheritance relationships
3. Verify import dependencies

```bash
# Get symbol details
curl http://127.0.0.1:27495/api/v1/symbols/UserManager

# Check inheritance
curl "http://127.0.0.1:27495/api/v1/relationships?to=UserManager&type=inherits"

# Check imports
curl "http://127.0.0.1:27495/api/v1/relationships?to=UserManager&type=imports"
```

## AI-Assisted Workflows

### Pattern: MCP Integration with AI

**Scenario**: Using Claude or other AI to explore codebase with context.

**Setup**:
1. Configure MCP server in your AI client
2. Ensure GKG server is running: `gkg server start`

**Workflow**:
1. AI can query the knowledge graph directly via MCP tools
2. AI receives structured context about code relationships
3. AI provides answers grounded in actual codebase structure

**Example Prompts**:
- "Find all functions that modify the user table"
- "What tests cover the payment flow?"
- "Show me the dependency chain for the checkout module"

### Pattern: Documentation Generation

**Scenario**: Generate documentation from code structure.

**Workflow**:
1. Query for key symbols and their relationships
2. Use the graph structure to understand module organization
3. Generate documentation based on actual code structure

```bash
# Get module structure
curl http://127.0.0.1:27495/api/v1/graph

# Get specific module details
curl http://127.0.0.1:27495/api/v1/files/src/auth/

# Combine with AI for documentation generation
```

## Best Practices

### When to Re-Index

Re-run `gkg index` when:
- New files are added to the project
- Significant refactoring occurs
- Function signatures change
- Import dependencies are modified

### Server Management

- Start server once per session: `gkg server start`
- Server runs on port 27495 by default
- Use `--port` flag if port is in use
- Server persists until explicitly stopped

### Query Optimization

- Be specific in queries for better results
- Use code terms (function names, class names) when known
- Limit results with the `limit` parameter for large codebases
- Use confidence scores to filter results

### Integration with Development Workflow

1. **On project clone**: Run `gkg index` to build initial index
2. **During development**: Keep server running for quick queries
3. **Before commits**: Use impact analysis to verify change scope
4. **During code review**: Use GKG to verify understanding of changes

## Common Query Patterns

| Goal | Query Pattern |
|------|---------------|
| Find implementation | "How is [feature] implemented?" |
| Locate configuration | "Where is [component] configured?" |
| Understand data flow | "How does [data] flow through the system?" |
| Find security issues | "Where is user input validated?" |
| API discovery | "What endpoints are exposed?" |
| Error handling | "How are errors handled in [module]?" |
| Database access | "Which files access the [table] table?" |
| Testing coverage | "What tests cover [function]?" |
