#!/usr/bin/env bash
# Conventional Commits - Server-Side Pre-Receive Hook
# Install: copy to repository's .git/hooks/pre-receive and chmod +x

# Regex patterns
commit_msg_type_regex='feat|fix|refactor|perf|style|test|docs|build|ops|chore'
commit_msg_scope_regex='.{1,20}'
commit_msg_description_regex='.{1,100}'
commit_msg_regex="^(${commit_msg_type_regex})(\(${commit_msg_scope_regex}\))?!?: (${commit_msg_description_regex})"
merge_msg_regex="^Merge branch '.+'"
zero_commit="0000000000000000000000000000000000000000"

# Do not traverse over commits that are already in the repository
excludeExisting="--not --all"

error=""
error_count=0

while read oldrev newrev refname; do
    # Branch or tag deleted - skip
    if [ "$newrev" = "$zero_commit" ]; then
        continue
    fi

    # Check for new branch or tag
    if [ "$oldrev" = "$zero_commit" ]; then
        rev_span=$(git rev-list $newrev $excludeExisting)
    else
        rev_span=$(git rev-list $oldrev..$newrev $excludeExisting)
    fi

    for commit in $rev_span; do
        commit_msg_header=$(git show -s --format=%s $commit)

        # Check if commit matches pattern
        if ! [[ "$commit_msg_header" =~ ${commit_msg_regex} ]] && \
           ! [[ "$commit_msg_header" =~ ${merge_msg_regex} ]]; then
            echo "ERROR: Invalid commit message format" >&2
            echo "" >&2
            echo "Commit: $commit" >&2
            echo "Branch: $refname" >&2
            echo "Message: $commit_msg_header" >&2
            echo "" >&2
            echo "Expected format: type(scope): subject" >&2
            echo "Types: feat, fix, refactor, perf, style, test, docs, build, ops, chore" >&2

            error="true"
            error_count=$((error_count + 1))

            # Limit output to first 10 errors
            if [ "$error_count" -ge 10 ]; then
                echo "... and more. Fix all commits before pushing." >&2
                break 2
            fi
        fi
    done
done

if [ -n "$error" ]; then
    echo "" >&2
    echo "Push rejected. Please fix commit message format and try again." >&2
    echo "For help, visit: https://www.conventionalcommits.org/" >&2
    exit 1
fi

exit 0
