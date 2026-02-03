# Migrating to Conventional Commits

## Why Migrate?

Conventional commits provide:
- **Automated changelog generation** - Tools can parse commit history
- **Automated versioning** - Semantic version based on commit types
- **Consistent history** - Easier to understand what changed
- **Better collaboration** - Clear commit messages help team communication

## Pre-Migration Checklist

- [ ] Define commit types for your project (custom scopes)
- [ ] Get team buy-in for the new format
- [ ] Set up validation hooks (see scripts/)
- [ ] Configure changelog generation tool
- [ ] Plan training for team members

## Migration Strategies

### Strategy 1: Clean Break (Recommended for Small Teams)

Start using conventional commits immediately for all new commits.

**Steps:**
1. Team meeting to explain the format
2. Install commit-msg hook (see scripts/)
3. Start using conventional commits for all new commits
4. Optionally, rewrite recent non-compliant commits

**Pros:** Simple, immediate adoption
**Cons:** Mixed commit history during transition

### Strategy 2: Gradual Adoption (Recommended for Large Teams)

Use conventional commits for new features, allow legacy format for bug fixes.

**Steps:**
1. Team meeting to explain the format
2. Define scope names for your project
3. Install commit-msg hook in "warn" mode
4. Gradually increase compliance
5. Switch to "enforce" mode after transition period

**Pros:** Lower friction, gradual learning curve
**Cons:** Longer transition period

### Strategy 3: Git History Rewrite (Not Recommended)

Rewrite all past commits to follow conventional commits format.

**Steps:**
1. Backup your repository
2. Use `git filter-branch` or `git-rebase` to rewrite commits
3. Force push to remote
4. Notify all team members to re-clone

**Pros:** Clean, consistent history
**Cons:**
- Disrupts all contributors
- Breaks existing clones
- Can lose commit metadata
- Generally not worth the effort

## Defining Your Scopes

Scopes should reflect your project's architecture. Common examples:

### Web Application
```
feat(auth): add OAuth login
feat(api): add user endpoint
feat(ui): add dark mode
feat(database): add user preferences table
```

### Library/SDK
```
feat(client): add retry logic
docs(readme): update installation
test(integration): add e2e tests
```

### Microservices
```
feat(user-service): add profile endpoint
ops(deployment): add kubernetes config
feat(payment-gateway): integrate Stripe
```

## Setting Up Validation

### Client-Side Hook (Recommended First Step)

Copy `scripts/commit-msg-validate.sh` to `.git/hooks/commit-msg`:
```bash
cp scripts/commit-msg-validate.sh .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```

This validates commits before they're created.

### Server-Side Hook (For Team Enforcement)

Copy `scripts/pre-receive-validate.sh` to your server's `.git/hooks/pre-receive`:
```bash
cp scripts/pre-receive-validate.sh .git/hooks/pre-receive
chmod +x .git/hooks/pre-receive
```

This blocks non-compliant commits from being pushed.

## Training Team Members

### Quick Reference Card

Share this one-page summary with your team:

```
FORMAT: type(scope): subject

TYPES:
  feat     - new feature
  fix      - bug fix
  refactor - code restructuring
  perf     - performance improvement
  style    - formatting only
  test     - add/update tests
  docs     - documentation only
  build    - build system/deps
  ops      - infrastructure/deployment
  chore    - miscellaneous

SCOPES: (project-specific)
  auth, api, ui, database, etc.

EXAMPLES:
  feat: add user login
  fix(api): correct response format
  feat!: breaking API change
```

### Common Mistakes

**Don't do:**
- `feat: Added new feature` (wrong tense, capital letter)
- `feat: add new feature.` (period at end)
- `fix(JIRA-123): fix bug` (issue as scope)
- `update dependencies` (missing type)

**Do instead:**
- `feat: add new feature`
- `fix(api): correct response format`
- `build: update dependencies`
- `fix: resolve login issue` (reference JIRA in footer: `Refs JIRA-123`)

## Configuring Changelog Generation

Popular tools:
- [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) - Node.js
- [git-conventional-commits](https://github.com/qoomon/git-conventional-commits) - CLI tool
- [semantic-release](https://github.com/semantic-release/semantic-release) - Automated releases

### Example: Using semantic-release

```bash
npm install --save-dev semantic-release
```

Add to `.releaserc.json`:
```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github"
  ]
}
```

## Measuring Adoption

Track adoption with:

```bash
# Check percentage of compliant commits
git log --oneline | grep -E '^(feat|fix|refactor|perf|style|test|docs|build|ops|chore)(\(.+\))?: ' | wc -l

# Find non-compliant commits since a date
git log --since="2024-01-01" --oneline | grep -vE '^(feat|fix|refactor|perf|style|test|docs|build|ops|chore|Merge|Revert)'
```

## Timeline Example

**Week 1:** Team training, install client-side hooks (warn mode)
**Week 2-3:** Monitor adoption, answer questions
**Week 4:** Switch hooks to enforce mode
**Week 5:** Set up changelog generation
**Week 6:** Celebrate first automated changelog!

## Troubleshooting

### "We can't agree on scopes"

Solution: Start with no scopes. Add them later when patterns emerge.

### "Too much effort for small fixes"

Solution: Simple commits can be just type + subject:
```
fix: correct typo in error message
```

### "Team forgets the format"

Solution: The commit-msg hook will remind them. Consider adding a git alias:
```bash
git config alias.commit "!git commit"
```

### "Need to document complex decisions"

Solution: Use the body section freely. Conventional commits support detailed explanations.
