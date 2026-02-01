#!/usr/bin/env python3
"""
Extract structured plans from markdown and convert to beads using br CLI.

This script parses markdown planning files and creates beads with proper
hierarchy, dependencies, priorities, and labels.

Usage:
    python3 extract_plan_to_bead.py <plan.md> [--dry-run]
"""

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Dict


@dataclass
class Bead:
    """Represents a bead to be created."""
    title: str
    bead_type: str = "task"  # epic, task, bug
    priority: int = 2  # 0-4, where 0 is critical
    labels: List[str] = field(default_factory=list)
    description: str = ""
    parent_id: Optional[str] = None  # For subtasks
    dependencies: List[str] = field(default_factory=list)
    created_id: Optional[str] = None  # Set after creation


class PlanParser:
    """Parse markdown plan files into bead structures."""

    # Priority patterns
    PRIORITY_MAP = {
        "P0": 0, "CRITICAL": 0, "URGENT": 0,
        "P1": 1, "HIGH": 1,
        "P2": 2, "MEDIUM": 2,
        "P3": 3, "LOW": 3,
        "P4": 4, "BACKLOG": 4,
    }

    def __init__(self, content: str):
        self.content = content
        self.beads: List[Bead] = []
        self.epic_map: Dict[str, str] = {}  # epic name -> bead id

    def parse(self) -> List[Bead]:
        """Parse plan content and return list of beads."""
        lines = self.content.split('\n')
        current_epic: Optional[Bead] = None
        current_task: Optional[Bead] = None

        for line in lines:
            # H1/H2 as epics
            if line.startswith('##'):
                current_epic = self._parse_section(line)
                if current_epic:
                    self.beads.append(current_epic)

            # Checkbox tasks
            elif match := re.match(r'^[\s]*-\s*\[.\]\s*(.+)', line):
                task = self._parse_task(match.group(1), current_epic)
                if task:
                    self.beads.append(task)
                    current_task = task

            # Nested subtasks (indented)
            elif match := re.match(r'^[\s]{2,}-\s*\[.\]\s*(.+)', line):
                if current_task:
                    subtask = self._parse_task(match.group(1), current_task)
                    if subtask:
                        self.beads.append(subtask)

            # Numbered list with dependencies
            elif match := re.match(r'^[\s]*\d+\.\s*depends on:\s*(\d+)\s*→\s*(.+)', line):
                dep_num = match.group(1)
                title = match.group(2)
                task = self._parse_task(title, None)
                if task:
                    # Store dependency number for resolution
                    task._dep_number = int(dep_num)
                    self.beads.append(task)

            # Plain numbered list items
            elif match := re.match(r'^[\s]*(\d+)\.\s*(.+)', line):
                title = match.group(2)
                task = self._parse_task(title, current_epic)
                if task:
                    task._line_number = int(match.group(1))
                    self.beads.append(task)

        return self.beads

    def _parse_section(self, line: str) -> Optional[Bead]:
        """Parse a section header as an epic."""
        # Remove ## prefix and clean
        title = re.sub(r'^#+\s*', '', line).strip()
        title = re.sub(r'\[.*?\]', '', title).strip()

        if not title or title.lower() in ['#', 'implementation plan', 'overview']:
            return None

        # Extract priority
        priority = self._extract_priority(line)

        # Extract labels
        labels = self._extract_labels(line)

        return Bead(
            title=title,
            bead_type="epic",
            priority=priority,
            labels=labels,
            description=f"Epic: {title}"
        )

    def _parse_task(self, text: str, parent: Optional[Bead]) -> Optional[Bead]:
        """Parse a task item."""
        # Extract priority
        priority = self._extract_priority(text)
        text = re.sub(r'\[.*?(P[0-4]|CRITICAL|URGENT|HIGH|MEDIUM|LOW|BACKLOG).*?\]', '', text)

        # Extract labels
        labels = self._extract_labels(text)
        text = re.sub(r'\[.*?\]', '', text).strip()

        # Clean title
        title = text.strip()

        if not title:
            return None

        # Determine type
        bead_type = "task"
        if "spike" in title.lower():
            bead_type = "task"
            labels.append("spike")
        elif "bug" in title.lower() or "fix" in title.lower():
            bead_type = "bug"

        return Bead(
            title=title,
            bead_type=bead_type,
            priority=priority if priority > -1 else (parent.priority if parent else 2),
            labels=labels,
            parent_id=parent.created_id if parent else None
        )

    def _extract_priority(self, text: str) -> int:
        """Extract priority from text, return -1 if not found."""
        text_upper = text.upper()
        for pattern, value in self.PRIORITY_MAP.items():
            if pattern in text_upper:
                return value
        return -1

    def _extract_labels(self, text: str) -> List[str]:
        """Extract labels from text."""
        labels = []

        # Bracket tags: [backend], [frontend]
        if matches := re.findall(r'\[([a-z0-9_-]+)\]', text.lower()):
            labels.extend(matches)

        # Hash tags: #security, #urgent
        if matches := re.findall(r'#([a-z0-9_-]+)', text.lower()):
            labels.extend(matches)

        # Colon tags: backend:, frontend:
        if matches := re.findall(r'([a-z0-9_-]+):', text.lower()):
            labels.extend(matches)

        return list(set(labels))


class BeadCreator:
    """Create beads using br CLI."""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.created_beads: Dict[str, str] = {}  # title -> id

    def create_beads(self, beads: List[Bead]) -> bool:
        """Create all beads and their dependencies."""
        # Create beads first
        for bead in beads:
            bead_id = self._create_single_bead(bead)
            if bead_id:
                bead.created_id = bead_id
                self.created_beads[bead.title] = bead_id

        # Create dependencies
        for bead in beads:
            if bead.parent_id and bead.created_id:
                self._add_dependency(bead.created_id, bead.parent_id)

        # Add labels
        for bead in beads:
            if bead.created_id and bead.labels:
                self._add_labels(bead.created_id, bead.labels)

        return True

    def _create_single_bead(self, bead: Bead) -> Optional[str]:
        """Create a single bead using br CLI."""
        cmd = [
            "br", "create", bead.title,
            "--type", bead.bead_type,
            "--priority", str(bead.priority)
        ]

        if bead.description:
            cmd.extend(["--description", bead.description])

        if self.dry_run:
            print(f"DRY RUN: {' '.join(cmd)}")
            return f"dry-run-{bead.title[:8]}"

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            # Extract bead ID from output
            if match := re.search(r'(bd|br)-[a-f0-9]+', result.stdout):
                return match.group(0)
            return None
        except subprocess.CalledProcessError as e:
            print(f"Error creating bead: {e.stderr}", file=sys.stderr)
            return None

    def _add_dependency(self, bead_id: str, dep_id: str):
        """Add a dependency between beads."""
        cmd = ["br", "dep", "add", bead_id, dep_id]

        if self.dry_run:
            print(f"DRY RUN: {' '.join(cmd)}")
            return

        try:
            subprocess.run(cmd, capture_output=True, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error adding dependency: {e.stderr}", file=sys.stderr)

    def _add_labels(self, bead_id: str, labels: List[str]):
        """Add labels to a bead."""
        cmd = ["br", "label", "add", bead_id] + labels

        if self.dry_run:
            print(f"DRY RUN: {' '.join(cmd)}")
            return

        try:
            subprocess.run(cmd, capture_output=True, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error adding labels: {e.stderr}", file=sys.stderr)

    def sync(self):
        """Run br sync --flush-only after creating beads."""
        cmd = ["br", "sync", "--flush-only"]

        if self.dry_run:
            print(f"DRY RUN: {' '.join(cmd)}")
            return

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            print("Beads synced successfully. Run: git add .beads/ && git commit -m 'Add beads from plan'")
        except subprocess.CalledProcessError as e:
            print(f"Error syncing beads: {e.stderr}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Extract plan to beads")
    parser.add_argument("plan_file", help="Path to plan markdown file")
    parser.add_argument("--dry-run", action="store_true", help="Show commands without executing")
    args = parser.parse_args()

    # Read plan file
    plan_path = Path(args.plan_file)
    if not plan_path.exists():
        print(f"Error: Plan file not found: {plan_path}", file=sys.stderr)
        sys.exit(1)

    content = plan_path.read_text()

    # Parse plan
    parser_obj = PlanParser(content)
    beads = parser_obj.parse()

    if not beads:
        print("No beads found in plan")
        sys.exit(0)

    print(f"Found {len(beads)} beads to create")

    # Create beads
    creator = BeadCreator(dry_run=args.dry_run)
    creator.create_beads(beads)

    # Sync
    if not args.dry_run:
        creator.sync()


if __name__ == "__main__":
    main()
