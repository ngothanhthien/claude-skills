# Conventional Commits - Examples

## Table of Contents

1. [Basic Examples](#basic-examples)
2. [Feature Commits](#feature-commits)
3. [Fix Commits](#fix-commits)
4. [Breaking Changes](#breaking-changes)
5. [Refactoring](#refactoring)
6. [Documentation](#documentation)
7. [Testing](#testing)
8. [Build & Dependencies](#build--dependencies)
9. [Operations](#operations)
10. [Chores](#chores)

## Basic Examples

### Simple feature
```
feat: add email notifications
```

### Feature with scope
```
feat(auth): add OAuth2 login support
```

### Simple fix
```
fix: correct typo in error message
```

### Fix with scope
```
fix(api): fix JSON response parsing
```

## Feature Commits

### Add new feature
```
feat: add user profile page

Implement new user profile page with avatar upload,
bio editing, and privacy settings.

Closes #123
```

### Feature with detailed body
```
feat(payment): integrate Stripe payment processing

Add Stripe integration for processing credit card payments.
Includes:
- Payment form component
- Webhook handler for payment confirmation
- Error handling for failed payments
- Transaction history tracking

Ref: JIRA-456
```

### Add feature with multiple scopes
```
feat(ui): add dark mode toggle

Implement dark mode using CSS custom properties.
Toggle state persists in localStorage.

The light/dark theme applies to all pages and respects
user's system preference by default.
```

### Remove feature (breaking)
```
feat!: remove legacy API endpoints

Remove v1 API endpoints that were deprecated in v2.0.
All clients should now use the v2 endpoints.

BREAKING CHANGE: The following endpoints have been removed:
- GET /api/v1/users
- POST /api/v1/users
- PUT /api/v1/users/:id

Migration guide available in docs/migration-v1-to-v2.md
```

## Fix Commits

### Simple bug fix
```
fix: prevent null pointer in user service
```

### Fix with detailed explanation
```
fix(auth): resolve token expiration edge case

Fix issue where JWT tokens would expire mid-request
causing authentication failures for long-running operations.

The error occurred because token validation only happened
at request start. Now we validate before each critical operation.

Fixes #789
```

### Fix for regression
```
fix(ui): restore responsive layout on mobile

Revert accidental CSS changes that broke mobile layout.
The flexbox properties were incorrectly modified in
the previous refactor commit.

Regression from abc123d
```

### Fix with performance impact
```
fix(database): add missing index for user queries

Add composite index on (email, status) to prevent full
table scans when looking up active users by email.

Resolves slow login issue reported in #456
```

## Breaking Changes

### Breaking change with `!` indicator
```
feat(api)!: rename user endpoint

Rename /api/user to /api/users for consistency with
other endpoints.

BREAKING CHANGE: User endpoint renamed from /api/user to /api/users.
Update all API calls accordingly.
```

### Breaking change without `!` (not recommended)
```
feat: change response format

BREAKING CHANGE: User object now returns `id` as string
instead of integer to support larger values.

Old: {"id": 123, "name": "..."}
New: {"id": "123", "name": "..."}
```

### Breaking change with migration guide
```
refactor(api)!: standardize error response format

BREAKING CHANGE: Error responses now follow RFC 7807 format.

Old format:
{
  "error": "Invalid input",
  "code": 400
}

New format:
{
  "type": "https://api.example.com/errors/invalid-input",
  "title": "Invalid Input",
  "status": 400,
  "detail": "The request payload is invalid."
}

See docs/error-handling.md for migration guide.
```

## Refactoring

### Code restructuring
```
refactor: extract user validation to separate module

Move user input validation logic from controller to
dedicated validation module for better reusability.

No behavior changes, internal refactoring only.
```

### Performance refactor
```
refactor(cache): implement caching layer

Add Redis caching layer for frequently accessed data.
Reduces database load and improves response times.

Cache invalidation handled through pub/sub.
```

### Simplification
```
refactor(auth): simplify token refresh logic

The previous token refresh logic had nested conditionals
that were hard to follow. Simplified to use early returns
and clearer error handling.
```

## Documentation

### Update README
```
docs: update installation instructions

Add Docker Compose setup option and update
dependency versions.
```

### API documentation
```
docs(api): document new authentication endpoints

Add OpenAPI spec for OAuth2 endpoints including
request/response examples and error codes.
```

### Inline documentation
```
docs: add JSDoc comments to utils module

Add comprehensive documentation for utility functions
including parameter types, return values, and examples.
```

## Testing

### Add unit tests
```
test: add unit tests for payment service

Cover payment processing, refund handling, and
error scenarios with 95% code coverage.
```

### Fix failing tests
```
test: fix flaky auth tests

The auth tests were occasionally failing due to
timing issues. Added proper wait conditions and
mocked external dependencies.
```

### Add integration tests
```
test(api): add integration tests for checkout flow

Add end-to-end tests covering the complete checkout
process including payment confirmation and order creation.
```

## Build & Dependencies

### Update dependencies
```
build: update dependencies to latest versions

Update all production dependencies to latest stable
versions including React 18, Node.js 20, and security patches.
```

### Version bump
```
build(release): bump version to 2.1.0

Prepare for release with new features and bug fixes.
```

### Build configuration
```
build: add webpack bundle analysis

Add webpack-bundle-analyzer plugin to help identify
bundle size issues and optimization opportunities.
```

## Operations

### CI/CD configuration
```
ops(ci): add automated testing pipeline

Add GitHub Actions workflow for running tests on every push
and creating deployment status checks.
```

### Infrastructure
```
ops(deploy): configure Kubernetes deployment

Add Kubernetes manifests for deploying the application
including deployment, service, and ingress resources.
```

### Monitoring
```
ops: add Prometheus metrics endpoints

Add /metrics endpoint for Prometheus scraping with
custom metrics for request latency, error rates, and
active user counts.
```

## Chores

### Initial commit
```
chore: init
```

### Update gitignore
```
chore: update .gitignore with node_modules

Add common Node.js ignore patterns to prevent
committing build artifacts and dependencies.
```

### Code formatting
```
style: format code with prettier

Run prettier across entire codebase to ensure
consistent code formatting.
```

### Remove unused code
```
chore: remove deprecated utility functions

Remove unused utility functions that were marked
for deprecation in v1.0.
```

## Complex Real-World Examples

### Multi-paragraph body with context
```
feat(search): implement full-text search with Elasticsearch

Add full-text search capability using Elasticsearch to replace
the simple LIKE query implementation. This provides:
- Faster search results (< 100ms vs 2s previously)
- Fuzzy matching and relevance scoring
- Support for searching across multiple fields
- Better handling of large datasets

The search index is automatically updated when records change
using a background job queue.

Related to #123, #456
```

### Breaking change with detailed migration
```
feat(api)!: move from query params to request body

All POST endpoints now accept parameters in request body
instead of URL query string for better readability and
to support complex nested parameters.

BREAKING CHANGE:

All POST endpoints have changed parameter format.

Old (query params):
POST /api/users?name=John&age=30&filters[status]=active

New (request body):
POST /api/users
{
  "name": "John",
  "age": 30,
  "filters": {
    "status": "active"
  }
}

Affected endpoints:
- POST /api/users
- POST /api/users/search
- POST /api/reports/generate

See docs/api-migration-guide.md for detailed examples.
```

### Combined fix and refactor
```
fix(auth): resolve session hijacking vulnerability

Refactor session token generation to use cryptographically
secure random bytes instead of timestamp-based tokens.

This fixes a security vulnerability where session tokens
could be predicted by an attacker with knowledge of the
token generation time.

The refactored implementation uses crypto.randomBytes()
with 32 bytes of entropy and stores hashed tokens in
the database for verification.

Security advisory: SEC-2024-001
```

## Common Mistakes (Don't Do These)

### Wrong: Wrong tense, capitalized
```
feat: Added new feature
```

### Correct: Imperative tense, lowercase
```
feat: add new feature
```

### Wrong: Period at end
```
fix: correct typo.
```

### Correct: No period
```
fix: correct typo
```

### Wrong: Issue as scope
```
fix(JIRA-123): resolve login issue
```

### Correct: Issue in footer
```
fix: resolve login issue
Refs JIRA-123
```

### Wrong: Missing type
```
update dependencies
```

### Correct: Proper type
```
build: update dependencies
```

## Additional Resources

- [Full Specification](../references/full-spec.md)
- [Migration Guide](../references/migration-guide.md)
- [Official Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md)
