---
title: Overview
description: What que is, a day with it, and what you get.
---

**Focus when you need it. Your agents keep working.**

Coding agents made the work faster, and every tool built around them gives you more: more
sessions, more parallel tasks, more panes, more pings. None of them helps you stop looking. You
start a session before dinner and check it from the couch. You run three during a meeting and
watch them instead of the meeting. At one in the morning one of them asks a question, and you
answer it.

que is a macOS app for running Claude Code sessions in git worktrees that also puts a boundary
around them. Choose your hours, or start a quiet hour before a meeting, and que goes quiet. Your
sessions keep running in their own branches. The window shrinks to the one question that matters
while you're away: **is it running, and is it stuck?** Terminals, diffs and reports stay hidden
until the quiet ends. You can still look: an unlock lasts a few minutes, then quiet comes back on
its own, and every unlock shows up in the morning report.

It works like putting your phone in a box by the door. Nothing is out of reach; reaching for it is
a decision now, not a reflex.

![que going quiet: the sessions keep running, the window shows only whether they are running and not stuck, and looking closer is a time-boxed unlock](/images/quiet-mode.gif)

## A day with que

**At work.** Every task gets its own workspace: a git worktree on its own branch, with your repo's
setup run inside it. Sessions live in a background daemon, so closing the window, or quitting the
app, ends nothing. The sidebar shows each session as working, idle, needs input or stuck, and a
chime tells you when one finishes. A review pane at the right shows what a workspace changed, its
files, and its pull request with checks and comments.

**When you go quiet.** At the hours you set (19:00 to 07:00 by default), or when you click
**Quiet** for 30 minutes, an hour or two before a meeting or a shared screen, the terminals give
way to the quiet board: a dim row per session and a count of what is running, waiting and stuck.
Nothing on it asks for your attention. A session that needs an answer says `waiting` and waits,
with no badge and no sound. The daemon enforces it: terminal contents, reports and new work are
refused to every client, the `que` CLI included, so there is no side door.

**When you really need to look.** Click Unlock on the board, or run
`que unlock 15 --why "deploy check"` to note why. Everything comes back for a while (20 minutes by
default), then it goes quiet again by itself. `que lock` ends it early.

**In the morning.** The report says what the night did: each session's time working, the
questions it asked, its commits and pull request, what is waiting for you, and every unlock with
its time and length. You start the day knowing where things are, not scrolling back through
terminals to find out.

## What you get

- **Workspaces**: one git worktree per task, with per-repo setup and teardown from
  [`que.toml`](/reference/configuration/#the-repository-config-quetoml).
- **Terminals that outlive the app**: quit and relaunch, and every screen comes back; sessions
  even resume after the daemon itself restarts.
- **Live status** for every session, from Claude Code hooks that que passes per session. Your own
  settings are never edited.
- **Review without leaving**: diffs, the workspace's files, and its pull request with checks and
  conversation, side by side with the terminals.
- **Quiet hours and on-demand quiet**: enforced by the daemon, with a board that shows counts and
  dots only, and unlocks that are time-boxed and logged. See [Quiet mode](/guides/quiet-mode/).
- **A morning report**, in the app or with `que report`.
- **A CLI** for everything the app does, and a menu-bar title (`● 3 ▸ 1 ✕ 0`). See
  [CLI](/guides/cli/).
- **Local**: no account and no server. The terminals, the state and the logs stay on your Mac.

que is open source. Its code, its issues and
[how to contribute](https://github.com/que-agents/que/blob/main/CONTRIBUTING.md) are in
[que-agents/que](https://github.com/que-agents/que).
