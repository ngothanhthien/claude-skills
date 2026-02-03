#!/usr/bin/env bash
# Conventional Commits - Client-Side Validation Hook
# Install: copy to .git/hooks/commit-msg and chmod +x

commit_msg_file=$1
commit_msg=$(cat "$commit_msg_file")

# Regex patterns
commit_msg_type_regex='feat|fix|refactor|perf|style|test|docs|build|ops|chore'
commit_msg_scope_regex='.{1,20}'
commit_msg_description_regex='.{1,100}'
commit_msg_regex="^(${commit_msg_type_regex})(\(${commit_msg_scope_regex}\))?!?: (${commit_msg_description_regex})$"

# Allow merge commits
merge_msg_regex="^Merge branch '.+"

# Allow revert commits (default git revert message format)
revert_msg_regex="^Revert \".+\""

# Check if commit message matches pattern
if [[ "$commit_msg" =~ $commit_msg_regex ]] || \
   [[ "$commit_msg" =~ $merge_msg_regex ]] || \
   [[ "$commit_msg" =~ $revert_msg_regex ]]; then
    exit 0
fi

# Invalid format - show error
echo "ERROR: Commit message does not follow Conventional Commits format" >&2
echo "" >&2
echo "Expected format:" >&2
echo "  type(scope): subject" >&2
echo "" >&2
echo "Types: feat, fix, refactor, perf, style, test, docs, build, ops, chore" >&2
echo "Scope: optional, project-specific (e.g., auth, api, ui)" >&2
echo "Subject: lowercase, imperative tense, no period" >&2
echo "" >&2
echo "Examples:" >&2
echo "  feat: add user login" >&2
echo "  fix(api): correct response format" >&2
echo "  feat!(api): remove deprecated endpoint" >&2
echo "" >&2
echo "Your message:" >&2
echo "$commit_msg" >&2

exit 1
