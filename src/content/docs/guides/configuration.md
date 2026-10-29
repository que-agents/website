---
title: Configuration
description: Where que's settings live, how to change them, and the per-repository que.toml.
---

que reads two TOML files. Both are optional: with neither, everything is the default.

## Your settings: `config.toml`

`~/.config/que/config.toml` (or `$QUE_CONFIG`); `que config set key=value` edits it and the daemon
reloads at once. Settings in the app write the same file.

```sh
que config set quiet_hours.default=19:00,07:00
que config get                 # the file's path and the parsed values
```

## Per repository: `que.toml`

Put `que.toml` at the root of a repository to set the commands run inside a new worktree and
before one is removed, the base branch for new workspaces, the gitignored files copied into them,
and the permission mode for their sessions. None of its keys has a default.

## Every key

The [Configuration reference](/reference/configuration/) lists every key of both files with its
default, generated from que's own defaults so it cannot drift from what the daemon uses.
