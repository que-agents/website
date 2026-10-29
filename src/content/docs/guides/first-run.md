---
title: First run
description: Check your setup, add a project, make a workspace and start Claude Code in it.
---

With que open and the `que` command [on your PATH](/guides/install/#the-que-command):

```sh
que doctor                     # checks the daemon, claude, gh, git, config, hooks
que project add ~/code/uploader
que work "Add retry logic" -r ~/code/uploader --name app-142-retry   # a worktree on branch app-142-retry
que attach app-142-retry       # or click it in the app's sidebar
claude                         # in the workspace terminal; its status shows in the sidebar
```

Then set your hours, or keep the defaults:

```sh
que config set quiet_hours.default=19:00,07:00
que quiet start 45             # or go quiet now, for 45 minutes
```

[Quiet mode](/guides/quiet-mode/) explains what happens then, and the
[CLI reference](/reference/cli/) has every command.
