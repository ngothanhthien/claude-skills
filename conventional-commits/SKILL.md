---
name: conventional-commits
description: Comprehensive conventional commit message specification and guidance. Use when creating git commits, writing commit messages, reviewing commit history, or setting up commit message validation. Includes commit types, scopes, breaking change indicators, body/footer format, and versioning rules for automated changelog generation.
---

# Conventional Commits

## Quick Start

Follow this format for commit messages:

```
type(scope)!: subject

body

footer
```

**Example:**
```
feat(auth): add OAuth2 login support

Implement OAuth2 authentication flow with support for
Google and GitHub providers.

Closes #123
```

## Commit Message Structure

### Format Template

```
type[(scope)][!]: subject
[empty line]
[body]
[empty line]
[footer]
```

**Components:**
- `type` - Category of change (required)
- `scope` - Context/affected module (optional)
- `!` - Breaking change indicator (optional)
- `subject` - Brief description (required, lowercase, no period)
- `body` - Detailed explanation (optional)
- `footer` - Metadata, breaking changes, issue references (optional)

### Subject Rules

- Use imperative, present tense: "add" not "added" or "adds"
- Lowercase first letter
- Do not end with period
- Think: "This commit will..." or "This commit should..."

## Commit Types

### API/UI Changes

| Type | Purpose |
|------|---------|
| `feat` | Add, adjust, or remove a feature |
| `fix` | Fix a bug from a previous `feat` commit |
| `refactor` | Restructure code without changing behavior |
| `perf` | Performance improvements (special `refactor`) |
| `style` | Code style only (whitespace, formatting) |

### Development Changes

| Type | Purpose |
|------|---------|
| `test` | Add or fix tests |
| `docs` | Documentation changes only |
| `build` | Build tools, dependencies, version |
| `ops` | Infrastructure, deployment, CI/CD, monitoring |
| `chore` | Initial commit, .gitignore, etc. |

## Breaking Changes

**Indicator:** Add `!` before the colon in subject line

```
feat(api)!: remove status endpoint
```

**Footer description:** Required if subject isn't sufficiently descriptive

```
BREAKING CHANGE: ticket endpoints no longer support list all entities.
To list all tickets, use the new search endpoint with empty filters.
```

## Scopes

- Optional contextual information
- Project-specific (define in your project guidelines)
- **Do not** use issue identifiers as scopes

**Common scopes:** `auth`, `api`, `ui`, `database`, `config`, `docs`

## Body & Footer

### Body
- Explain motivation and contrast with previous behavior
- Use imperative, present tense
- What and why, not how

### Footer
- **Breaking Changes:** `BREAKING CHANGE:` followed by description
- **Issue References:** `Closes #123`, `Fixes JIRA-456`, `Refs #789`

## Versioning

Based on commit types since last release:

| Change | Version Increment |
|--------|-------------------|
| Breaking changes | Major (1.0.0 → 2.0.0) |
| `feat` or `fix` commits | Minor (1.0.0 → 1.1.0) |
| Other commits only | Patch (1.0.0 → 1.0.1) |

## Resources

### scripts/
Git hooks for enforcing commit message conventions:
- `commit-msg-validate.sh` - Client-side commit validation
- `pre-receive-validate.sh` - Server-side pre-receive hook

**Usage:**
```bash
# Install client-side hook
cp scripts/commit-msg-validate.sh .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg

# Server-side: copy to repository's .git/hooks/pre-receive
```

### examples/
Additional commit examples for various scenarios. See [examples/README.md](examples/README.md) for comprehensive examples covering edge cases and common patterns.

### references/
- [full-spec.md](references/full-spec.md) - Complete conventional commits specification with all rules and edge cases
- [migration-guide.md](references/migration-guide.md) - Migrating repositories to conventional commits
