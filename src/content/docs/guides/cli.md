---
title: CLI
description: The que command, what it is for, and where every command is documented.
---

The `que` command does everything the app does, from a terminal. It is a client of the same
background daemon as the app, so a workspace you make with `que work` is in the app's sidebar too,
and quiet hours hold for the CLI as they do for the window: there is no side door. To get it,
choose **que → Install \'que\' command in PATH** (see [Install](/guides/install/#the-que-command)).

## The ones you will use first

- `que doctor` checks the daemon, claude, gh, git, config and hooks.
- `que project add ~/code/uploader` registers a git repository.
- `que work "Add retry logic" -r ~/code/uploader` creates a workspace: a git worktree on its own
  branch.
- `que attach <workspace>` attaches to the workspace's terminal (Ctrl-] detaches).
- `que report` is the morning report: what the sessions did.
- `que unlock 15 --why "deploy check"` shows everything for a while when que is quiet;
  `que lock` ends it early.
- `que quiet start 45` goes quiet now, for 45 minutes; `que quiet end` ends it early.
- `que config set key=value` edits the config, and the daemon reloads at once.

[First run](/guides/first-run/) walks through the first few.

## Every command

The [CLI reference](/reference/cli/) lists every command with its options and arguments,
generated from `que --help` for each release.
