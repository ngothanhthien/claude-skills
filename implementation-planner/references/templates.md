# Plan Output Template

```markdown
# Implementation Plan: [Feature Name]

## Classification
- **Type**: [bug fix | modification | extension | new feature]
- **Scope**: [pure logic | mixed]

## Overview
[1-2 sentence summary]

## Epics

### Epic 1: [filename.ext]
**Purpose**: [what this file accomplishes]

#### Tasks:
- [ ] **Task 1.1**: [description]
  - depends_on: none
  - [PARALLEL] if applicable
- [ ] **Task 1.2**: [description]
  - depends_on: Task 1.1
  - files: `path/to/file.ts`

### Epic 2: [filename.ext]
...

## Dependency Graph
```
Task 1.1 ──┬──► Task 1.2 ──► Task 2.1
           │
Task 1.3 ──┘
```

## UI Tasks (if applicable)
- [ ] **[UI] Task**: [description]
  - Wireframe: [component layout description]
  - Components: Button, Form, Alert, etc.
```
