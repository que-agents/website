---
title: Quiet mode
description: What your sessions do while que is quiet, how to look anyway, and what the morning report tells you.
---

## Before bed

A session you start in the evening keeps going after you close the window, since its terminal
lives in the daemon:

```sh
que work "Add retry with backoff to the uploader" -r ~/code/uploader
que attach <workspace>         # start claude on it, then close the window
que report                     # in the morning: what the sessions did, what needs a look
```

It works in its own worktree and branch. When it needs an answer it stops and waits in its tab,
marked needs input, until you come back. In the morning `que report` (or the app's report view)
lists each session: what it did, its commits ahead, its pull request, and whether it is waiting
for you. [`notifications.morning_summary`](/reference/configuration/#the-user-config-configtoml)
adds a notification when quiet hours end. Sessions open their own pull requests with
`gh pr create`; the app's review pane picks them up, with their checks and comments.

## Quiet mode, in detail

From 19:00 to 07:00 by default, the app swaps its terminals for the quiet board: a dim line of
what is running, waiting, stuck and idle, a row for each, and nothing to click but Unlock. The
daemon refuses terminal contents, reports and new work to every client during those hours, so the
CLI cannot peek either. `que unlock 15 --why "deploy check"` (or the board's button) shows
everything for a while; `que lock` ends it early. When the window ends, `que report` (or the app's
report view) shows what the night did, unlocks included; `notifications.morning_summary` adds a
notification. Set different hours per day of the week, or none on a given night, in the
[configuration](/reference/configuration/#the-user-config-configtoml).

`que quiet start 45` goes quiet the same way for 45 minutes (default 60, at most 720), for a
meeting or a shared screen, whether or not quiet hours are on; the sidebar's **Quiet** row and the
menu-bar menu do the same in a click, and `que quiet end` ends it early. Unlocking inside it works
as at night, and those daytime unlocks stay out of the night's unlock log. A manual quiet never
ends scheduled quiet hours early.
