# Conventional Commits - Complete Specification

## Table of Contents

1. [Commit Message Format](#commit-message-format)
2. [Commit Types](#commit-types)
3. [Scopes](#scopes)
4. [Subject](#subject)
5. [Body](#body)
6. [Footer](#footer)
7. [Special Commit Types](#special-commit-types)
8. [Examples](#examples)

## Commit Message Format

```
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

### Format Rules

- **Type** is required
- **Scope** is optional
- **Breaking change indicator `!`** is optional
- **Description** is required
- Separate subject from body with blank line
- Separate body from footer with blank line
- Use `BREAKING CHANGE:` in footer for breaking changes

## Commit Types

### feat
Commits that **add**, **adjust**, or **remove** a new feature to the API or UI.

```
feat: add email notifications on new direct messages
feat(shopping cart): add the amazing button
feat!: remove ticket list endpoint
```

### fix
Commits that **fix** an API or UI bug of a preceded `feat` commit.

```
fix: prevent ordering empty shopping cart
fix(shopping-cart): prevent order an empty shopping cart
fix(api): fix wrong calculation of request body checksum
```

### refactor
Commits that **rewrite** or **restructure** code without altering API or UI behavior.

```
refactor: implement fibonacci number calculation as recursion
refactor(auth): simplify token validation logic
```

### perf
Commits are **special type of `refactor`** commits that specifically **improve performance**.

```
perf: decrease memory footprint for determine unique visitors by using HyperLogLog
perf(api): reduce response time by adding database index
```

### style
Commits that address **code style** (e.g., white-space, formatting, missing semi-colons) and **do not affect** application behavior.

```
style: remove empty line
style(ui): fix indentation in component files
```

### test
Commits that **add missing tests** or **correct existing ones**.

```
test: add unit tests for user service
test(auth): add integration tests for OAuth flow
```

### docs
Commits that **exclusively affect documentation**.

```
docs: update README with installation instructions
docs(api): add endpoint documentation
```

### build
Commits that affect **build-related components** such as build tools, dependencies, project version.

```
build: update dependencies
build(release): bump version to 1.0.0
```

### ops
Commits that affect **operational aspects** like infrastructure (IaC), deployment scripts, CI/CD pipelines, backups, monitoring, or recovery procedures.

```
ops: add monitoring for API response times
ops(deploy): update deployment pipeline
```

### chore
Commits that represent tasks like initial commit, modifying `.gitignore`, updating config files.

```
chore: init
chore: update .gitignore
```

## Scopes

The `scope` provides **additional contextual information** about the commit.

### Scope Rules

- The scope is an **optional** part
- Allowed scopes vary and are typically defined by the specific project
- **Do not** use issue identifiers as scopes
- Keep scope names short (1-20 characters recommended)

### Common Scopes

- `auth` - Authentication, authorization
- `api` - API endpoints, interfaces
- `ui` - User interface components
- `database` - Database schema, migrations
- `config` - Configuration files
- `docs` - Documentation
- `tests` - Test files
- `ci` - CI/CD configuration

## Subject

The `description` contains a **concise description** of the change.

### Subject Rules

- The description is a **mandatory** part
- Use the **imperative, present tense**: "change" not "changed" nor "changes"
- Think of `This commit will...` or `This commit should...`
- **Do not** capitalize the first letter
- **Do not** end the description with a period (`.`)
- Keep it under 100 characters recommended
- Keep it under 72 characters ideal for git log display

### Examples

```
feat: add email notifications on new direct messages
fix: prevent ordering empty shopping cart
refactor: implement fibonacci as recursion
```

## Body

The `body` should include the **motivation for the change** and **contrast this with previous behavior**.

### Body Rules

- The body is an **optional** part
- Use the **imperative, present tense**: "change" not "changed" nor "changes"
- Separate subject from body with a blank line
- Explain **what** and **why**, not **how**
- Include motivation for the change
- Contrast with previous behavior

### Example

```
feat(auth): add OAuth2 login support

Implement OAuth2 authentication flow with support for
Google and GitHub providers. This replaces the previous
basic authentication system which was insecure.

Previously, users had to remember passwords. Now they can
use their existing social media accounts for faster login.
```

## Footer

The `footer` should contain **issue references** and **information about Breaking Changes**.

### Footer Rules

- The footer is an **optional** part
- **Except:** If the commit introduces breaking changes, footer is required
- *Optionally* reference issue identifiers
- **Breaking Changes** **must** start with the word `BREAKING CHANGE:`

### Issue References

Common formats:
- `Closes #123`
- `Fixes #123`
- `Resolves #123`
- `Refs #123`
- `Closes JIRA-456`
- `Fixes ABC-123`

### Breaking Changes Format

**Single line:**
```
BREAKING CHANGE: ticket endpoints no longer supports list all entities.
```

**Multi-line:**
```
BREAKING CHANGE:

The ticket list endpoint has been removed. Use the search endpoint
with empty filters to achieve the same result.

Migration guide:
- Old: GET /api/tickets
- New: GET /api/tickets/search
```

## Special Commit Types

### Initial Commit
```
chore: init
```

### Merge Commit
Follows default git merge message:
```
Merge branch 'feature/new-auth'
```

### Revert Commit
Follows default git revert message:
```
Revert "feat: add new feature"

This reverts commit abc123def456.
```

## Examples

### Feature with scope and body
```
feat(auth): add OAuth2 login support

Implement OAuth2 authentication flow with support for
Google and GitHub providers.

Closes #123
```

### Breaking change with footer
```
feat!: remove ticket list endpoint
refers to JIRA-1337
BREAKING CHANGE: ticket endpoints no longer supports list all entities.
```

### Simple fix
```
fix(shopping-cart): prevent order an empty shopping cart
```

### Fix with detailed body
```
fix(api): fix wrong calculation of request body checksum

The checksum calculation was including the request headers,
which caused validation failures for requests with varying
header order. Now only the body bytes are included.
```

### Performance improvement
```
perf: decrease memory footprint for determine unique visitors by using HyperLogLog
```

### Dependency update
```
build: update dependencies
```

### Version bump
```
build(release): bump version to 1.0.0
```

### Refactoring
```
refactor: implement fibonacci number calculation as recursion
```

### Style fix
```
style: remove empty line
```

## References

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Angular Contributing Guide](https://github.com/angular/angular/blob/master/CONTRIBUTING.md)
- [Karma Git Commit Message Guide](http://karma-runner.github.io/1.0/dev/git-commit-msg.html)
