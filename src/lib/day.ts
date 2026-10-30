// The home page's "day with que" animation as a pure function of the clock.
// The clock ticks every 300 ms; the day is six steps of 20 ticks (six seconds
// each) and starts over after 120. dayState(t) says everything the pixel scene
// and the app window show at tick t; DayAnimation.astro only puts it on the page.

export const TICK_MS = 300
export const TICKS_PER_STEP = 20

export interface Step {
  /** The time of day, for the screen-reader list. */
  time: string
  /** The caption in the scene's text box. */
  caption: string
  /** What the app shows, in one sentence, for the screen-reader list. */
  shows: string
  /** The tick within the step that stands for the whole step while the clock is stopped. */
  settle: number
}

export const STEPS: readonly Step[] = [
  {
    time: '8 AM',
    caption: 'Coffee first. Two pull requests opened overnight.',
    shows:
      'The report view sums up the night: five sessions, two pull requests, one session waiting for you and one unlock.',
    settle: 19
  },
  {
    time: '9:30 AM',
    caption: "Each task gets a worktree, and a chime when it's done.",
    shows:
      'A Claude Code session reads, edits and tests the uploader in its own worktree while the others work, and a chime sounds as the cache session finishes.',
    settle: 12
  },
  {
    time: '11 AM',
    caption: 'In a meeting? Go quiet for an hour.',
    shows:
      'One click on Quiet 1h swaps the window for the quiet board, a dim row per session saying working, waiting or idle, until 12:00.',
    settle: 19
  },
  {
    time: '12 PM',
    caption: 'Back at your desk, anything that needs you is waiting.',
    shows:
      'The terminals come back, and the billing session is still asking for permission to run npm run migrate.',
    settle: 11
  },
  {
    time: '6 PM',
    caption: 'End of the day. You leave, but the sessions keep running.',
    shows:
      'Quiet hours start: the quiet board stays up until 08:00 while three sessions keep working.',
    settle: 19
  },
  {
    time: '10:14 PM',
    caption: 'Need to check in? Unlock for a quick, timed look.',
    shows:
      'From home, a 20-minute unlock shows the terminals again; asked whether the checks on #88 passed, Claude Code looks and says all three pass, then the quiet board comes back.',
    settle: 13
  }
]

export const LOOP_TICKS = TICKS_PER_STEP * STEPS.length

/** The step a tick falls in, 0 to 5. */
export function stepOf(tick: number): number {
  return Math.floor(wrap(tick) / TICKS_PER_STEP)
}

/**
 * Where the animation lands on a step: the step's first tick while it plays, so
 * the step runs from its start, or the step's settled frame while it is paused,
 * so the frame that stays up says what the step is about.
 */
export function stepTick(step: number, paused: boolean): number {
  return step * TICKS_PER_STEP + (paused ? STEPS[step].settle : 0)
}

// The pixel people: one character per 5 px block, drawn with box-shadow.
const HEAD = [
  '..hhhhh...',
  '.hhhhhhh..',
  '.sshhhhh..',
  'ssesshhh..',
  '.ssssshh..',
  '..sss.....',
  '..tttttt..',
  '.tttttttt.',
  '.tttttttt.'
]

const STAND_LEGS = ['..pppppp..', '..pp..pp..', '..pp..pp..', '..pp..pp..', '.kkk.kkk..']
const WALK_LEGS = ['..pppppp..', '.pp....pp.', '.pp....pp.', '.pp....pp.', 'kkk....kk.']
const SIT_LEGS = ['pppppppp..', 'pppppppp..', 'pp........', 'pp........', 'kkk.......']
const ME = { h: '#3b2a1e', s: '#d9a77c', e: '#1a1a1a', t: '#8a8a8a', p: '#3a3a3a', k: '#161616' }
const THEM = { h: '#151515', s: '#8d5a3b', e: '#0a0a0a', t: '#6b5a4a', p: '#2e2e2e', k: '#141414' }

/**
 * A pixel map as a box-shadow on a 5 px square placed at (-5px, -5px). Each
 * block's spread is var(--seam): 0 at natural size, and a fraction of a pixel
 * when the scene is scaled, so neighbouring blocks overlap instead of showing
 * hairline gaps.
 */
function boxShadow(rows: string[], palette: Record<string, string>): string {
  const out: string[] = []
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const colour = palette[row[x]]

      if (colour) {
        out.push(`${(x + 1) * 5}px ${(y + 1) * 5}px 0 var(--seam, 0px) ${colour}`)
      }
    }
  })

  return out.join(', ')
}

export type Pose = 'stand' | 'walk' | 'sit' | 'reach'

/** Each pose of the person, and the colleague, as box-shadow values, built once. */
export const SPRITES: Readonly<Record<Pose | 'colleague', string>> = {
  stand: boxShadow([...HEAD, '.sttttttt.', '..tttttt..', ...STAND_LEGS], ME),
  walk: boxShadow([...HEAD, '.sttttttt.', '..tttttt..', ...WALK_LEGS], ME),
  sit: boxShadow([...HEAD, '.sstttttt.', '..tttttt..', ...SIT_LEGS], ME),
  reach: boxShadow([...HEAD, 'ssttttttt.', '..tttttt..', ...SIT_LEGS], ME),
  colleague: boxShadow([...HEAD, '.sttttttt.', '..tttttt..', ...STAND_LEGS], THEM)
}

/**
 * A rectangle of the pixel scene, placed from the scene's bottom-left corner:
 * a size of '100%' runs to the far edge. `cls` names the few that CSS draws
 * or shows and hides (the sky, the home window, the lamp's glow, the laptop's
 * screen, the stars, the mug).
 */
export interface Px {
  x: number
  y: number
  w: number | '100%'
  h: number | '100%'
  bg?: string
  cls?: string
}

/**
 * Behind the person at the office: wall, floor, window, plant, chair, side table.
 * The room's own colours (wall, floor, skirting, the window) are in the CSS, by
 * day and by night.
 */
export const OFFICE_BACK: readonly Px[] = [
  { x: 0, y: 0, w: '100%', h: '100%', cls: 'wall' },
  { x: 0, y: 0, w: '100%', h: 75, cls: 'floor' },
  { x: 0, y: 70, w: '100%', h: 5, cls: 'skirting' },
  { x: 245, y: 215, w: 120, h: 110, cls: 'sky' },
  { x: 302, y: 215, w: 5, h: 110, cls: 'mullion' },
  { x: 245, y: 267, w: 120, h: 5, cls: 'mullion' },
  { x: 335, y: 290, w: 15, h: 15, bg: '#e6e2cf', cls: 'stars' },
  { x: 262, y: 300, w: 3, h: 3, bg: '#9b9b9b', cls: 'stars' },
  { x: 322, y: 240, w: 3, h: 3, bg: '#9b9b9b', cls: 'stars' },
  { x: 8, y: 75, w: 20, h: 18, bg: '#5c4636' },
  { x: 3, y: 93, w: 10, h: 10, bg: '#4f7a52' },
  { x: 13, y: 98, w: 10, h: 15, bg: '#5d8c60' },
  { x: 23, y: 93, w: 10, h: 10, bg: '#4f7a52' },
  { x: 208, y: 75, w: 6, h: 9, bg: '#3a3a3a' },
  { x: 194, y: 79, w: 40, h: 6, bg: '#444444' },
  { x: 228, y: 79, w: 6, h: 60, bg: '#444444' },
  { x: 300, y: 103, w: 80, h: 8, bg: '#5b4b3c' },
  { x: 306, y: 75, w: 8, h: 28, bg: '#4a3d31' },
  { x: 366, y: 75, w: 8, h: 28, bg: '#4a3d31' }
]

/** In front of the person at the office: the desk, the monitor's stand and bezel, the mug. */
export const OFFICE_FRONT: readonly Px[] = [
  { x: 40, y: 103, w: 172, h: 8, bg: '#5b4b3c' },
  { x: 44, y: 75, w: 8, h: 28, bg: '#4a3d31' },
  { x: 200, y: 75, w: 8, h: 28, bg: '#4a3d31' },
  { x: 120, y: 111, w: 10, h: 9, bg: '#303030' },
  { x: 80, y: 120, w: 90, h: 56, bg: '#303030' },
  { x: 166, y: 111, w: 10, h: 11, bg: '#d8d8d8', cls: 'mug' },
  { x: 176, y: 114, w: 4, h: 5, bg: '#b0b0b0', cls: 'mug' }
]

/** Behind the person at home: wall, floor, the night window, the lamp, the couch. */
export const HOME_BACK: readonly Px[] = [
  { x: 0, y: 0, w: '100%', h: '100%', bg: '#211f1e' },
  { x: 0, y: 0, w: '100%', h: 75, bg: '#191817' },
  { x: 0, y: 70, w: '100%', h: 5, bg: '#2a2826' },
  { x: 300, y: 210, w: 120, h: 100, bg: '#0e1013', cls: 'home-window' },
  { x: 357, y: 210, w: 5, h: 100, bg: '#3a3836' },
  { x: 300, y: 257, w: 120, h: 5, bg: '#3a3836' },
  { x: 390, y: 270, w: 15, h: 15, bg: '#e6e2cf' },
  { x: 320, y: 285, w: 3, h: 3, bg: '#9b9b9b' },
  { x: 350, y: 235, w: 3, h: 3, bg: '#9b9b9b' },
  { x: 214, y: 110, w: 110, h: 110, cls: 'lamp-glow' },
  { x: 267, y: 75, w: 4, h: 118, bg: '#3a3836' },
  { x: 253, y: 190, w: 32, h: 18, bg: '#cdb98f' },
  // The couch, from the front: its feet, the back and its cushions, the seat
  // and its cushions, and an arm at each end.
  ...[33, 233].map((x) => ({ x, y: 75, w: 6, h: 4, bg: '#2c2622' })),
  { x: 47, y: 97, w: 180, h: 40, bg: '#43392f' },
  { x: 47, y: 133, w: 180, h: 4, bg: '#4c4137' },
  ...[106, 166].map((x) => ({ x, y: 97, w: 2, h: 36, bg: '#382f28' })),
  { x: 28, y: 79, w: 216, h: 18, bg: '#4a4038' },
  { x: 47, y: 93, w: 180, h: 4, bg: '#56493f' },
  ...[106, 166].map((x) => ({ x, y: 79, w: 2, h: 18, bg: '#3d342e' })),
  ...[25, 225].flatMap((x) => [
    { x, y: 79, w: 22, h: 40, bg: '#564a40' },
    { x, y: 115, w: 22, h: 4, bg: '#62554a' }
  ])
]

/** In front of the person at home: the laptop on their lap. */
export const HOME_FRONT: readonly Px[] = [
  { x: 106, y: 98, w: 36, h: 4, bg: '#9b9b9b' },
  { x: 104, y: 102, w: 4, h: 24, cls: 'laptop' }
]

/** A colour token of the animation's fixed palette; the component writes it as var(--name). */
export type Tone =
  | 'fg'
  | 'fg-secondary'
  | 'fg-muted'
  | 'fg-faint'
  | 'accent'
  | 'good'
  | 'attention'
  | 'neutral'

type Status = 'working' | 'done' | 'seen' | 'needs'

const TONE: Record<Status, Tone> = {
  working: 'accent',
  done: 'good',
  needs: 'attention',
  seen: 'neutral'
}

export const PROJECTS = ['uploader', 'billing'] as const

interface Session {
  name: string
  project: (typeof PROJECTS)[number]
  /**
   * The session's status at each step: working, done (not yet seen), seen, or
   * needs input; or [before, after, beat] when it changes during the step.
   */
  plan: readonly (Status | readonly [Status, Status, number])[]
}

/** The sessions, in the order the sidebar (grouped by project) and the board list them. */
const SESSIONS: readonly Session[] = [
  {
    name: 'app-142-retry',
    project: 'uploader',
    plan: ['done', 'working', 'working', 'working', 'working', 'working']
  },
  {
    name: 'app-145-backoff-docs',
    project: 'uploader',
    plan: ['done', 'working', 'working', 'done', 'seen', 'seen']
  },
  {
    name: 'app-131-cache',
    project: 'uploader',
    plan: ['seen', ['working', 'done', 10], 'done', 'seen', 'seen', 'seen']
  },
  {
    name: 'app-139-auth',
    project: 'billing',
    plan: ['needs', 'working', 'needs', ['needs', 'working', 12], 'working', 'working']
  },
  {
    name: 'app-150-migrate',
    project: 'billing',
    plan: ['working', 'seen', 'seen', 'seen', 'working', 'working']
  }
]

function statusOf(name: string, step: number, beat: number): Status {
  const planned = session(name).plan[step]

  if (!Array.isArray(planned)) {
    return planned
  }

  const [before, after, at] = planned

  return beat < at ? before : after
}

function session(name: string): Session {
  const found = SESSIONS.find((s) => s.name === name)

  if (!found) {
    throw new Error(`no session ${name}`)
  }

  return found
}

/** The morning report's rows: each session as the night left it, and what it left. */
export const REPORT_ROWS = (
  [
    ['app-142-retry', '#88', 'accent'],
    ['app-145-backoff-docs', '#89', 'accent'],
    ['app-139-auth', 'needs input', 'attention'],
    ['app-150-migrate', 'working', 'fg-muted'],
    ['app-131-cache', 'idle', 'fg-faint']
  ] as const
).map(([name, tag, tagTone]) => ({
  name,
  project: session(name).project,
  dot: TONE[statusOf(name, 0, 0)],
  tag,
  tagTone
}))

/** The session in front of the window at each step; none while the report is open. */
const IN_FRONT = [
  '',
  'app-142-retry',
  'app-142-retry',
  'app-139-auth',
  'app-142-retry',
  'app-142-retry'
]

/**
 * The quiet board at the steps that show it: its label, the beat it appears
 * at, the time it shows n beats later, and when the quiet ends.
 */
const BOARDS = new Map([
  [2, { label: 'QUIET', from: 4, now: (n: number) => `11:${pad(n * 3)}`, until: '12:00' }],
  [4, { label: 'QUIET HOURS', from: 4, now: (n: number) => `18:${pad(n * 3)}`, until: '08:00' }],
  [5, { label: 'QUIET HOURS', from: 14, now: (n: number) => `22:${pad(28 + n)}`, until: '08:00' }]
])

/** Claude Code's spinner line at each step: its verb, and the beat its seconds count from. */
const THINKING: readonly { verb: string; since: number }[] = [
  { verb: 'Noodling…', since: 5 },
  { verb: 'Noodling…', since: -20 },
  { verb: 'Noodling…', since: -40 },
  { verb: 'Brewing…', since: 11 },
  { verb: 'Noodling…', since: 5 },
  { verb: 'Pondering…', since: 5 }
]

export interface SessionRow {
  name: string
  project: string
  /** A working session shows the rippling working mark instead of a dot. */
  working: boolean
  dot: Tone
  /** The name's colour in the sidebar. */
  text: Tone
  selected: boolean
  /** What the quiet board says. */
  word: 'working' | 'waiting' | 'idle'
}

/** How a terminal line is drawn: the TUI's colours for each kind of line. */
export type LineKind = 'title' | 'logo' | 'blank' | 'user' | 'say' | 'tool' | 'result' | 'more'

export interface TermLine {
  kind: LineKind
  /** The gutter: the logo, ⏺, ⎿ or the prompt's >. */
  pre: string
  text: string
}

/** What is on or off at a tick. The component sets each as a data attribute on its root. */
export interface Flags {
  /** At home (the last step), not at the office. */
  home: boolean
  /** The office window shows the night sky. */
  night: boolean
  /** The office lights are down. */
  dim: boolean
  colleague: boolean
  mug: boolean
  /** The note that floats up from the desk when a session finishes. */
  chime: boolean
  /** The window shows the quiet board instead of the app. */
  board: boolean
  unlocked: boolean
  /** The pointer is over the Quiet row's 1h. */
  pointer: boolean
  /** ... and presses it. */
  pressed: boolean
  /** The report view is open instead of the terminal. */
  report: boolean
  /** Claude Code asks for permission in place of its input box. */
  permission: boolean
  /** The spinner line is showing. */
  status: boolean
}

/** Every text that changes, by the name of the element that shows it (its data-text). */
export interface Texts {
  boardLabel: string
  boardNow: string
  boardUntil: string
  /** The board's count line, e.g. "3 working · 1 waiting · 1 idle". */
  boardCount: string
  /** The unlocked foot's time left, m:ss. */
  countdown: string
  /** The spinner line: its glyph and verb, then how long it has been going. */
  spin: string
  seconds: string
  /** What is typed in Claude Code's input box. */
  input: string
  /** The review rail's counts: pull requests and changed files. */
  prs: string
  changes: string
}

export interface DayState {
  step: number
  flags: Flags
  person: {
    left: number
    bottom: number
    facing: 'left' | 'right'
    pose: Pose
    /** How long a change of `left` takes: walking, or 0 to jump. */
    walkSeconds: number
  }
  /** The three status dots on the desk monitor's tiny sidebar. */
  deskDots: [Tone, Tone, Tone]
  sessions: SessionRow[]
  /** The Claude Code terminal's lines, oldest first. */
  lines: TermLine[]
  texts: Texts
}

// The terminal: a Claude Code session, drawn the way its TUI draws it.
const line = (kind: LineKind, pre: string, text: string): TermLine => ({ kind, pre, text })
const blank = () => line('blank', '', ' ')
const user = (text: string) => line('user', '> ', text)
const say = (text: string) => line('say', '⏺ ', text)
const tool = (text: string) => line('tool', '⏺ ', text)
const result = (text: string) => line('result', '  ⎿  ', text)
const more = (text: string) => line('more', '     ', text)

const header = (path: string) => [
  line('title', ' ▐▛███▜▌  ', 'Claude Code v2.1'),
  line('logo', '▝▜█████▛▘ ', 'Opus 5.5 · Claude Max'),
  line('logo', '  ▘▘ ▝▝   ', path)
]

const RETRY = [
  ...header('~/.que/worktrees/uploader/app-142-retry'),
  blank(),
  user('Add retry with backoff to the uploader'),
  blank(),
  say("I'll wrap the upload in a retry with backoff."),
  blank(),
  tool('Read(src/uploader/client.ts)'),
  result('Read 142 lines'),
  blank(),
  tool('Update(src/uploader/client.ts)'),
  result('Updated with 24 additions and 3 removals'),
  blank(),
  tool('Bash(npm test)'),
  result('42 passed')
]

const RETRY_DONE = [
  ...RETRY,
  blank(),
  tool('Bash(gh pr create --fill)'),
  result('github.com/acme/uploader/pull/88'),
  blank(),
  say('Opened #88. Retries back off from 1s to 30s.')
]

const AUTH = [
  ...header('~/.que/worktrees/billing/app-139-auth'),
  blank(),
  user('Move invoices to the new schema'),
  blank(),
  tool('Read(migrations/0042_invoices.sql)'),
  result('Read 58 lines'),
  blank(),
  tool('Update(src/billing/invoices.ts)'),
  result('Updated with 31 additions and 12 removals')
]

const QUESTION = 'Did the checks on #88 pass?'
const SPINNER = ['·', '✢', '✳', '✶', '✻', '✽']

function wrap(tick: number): number {
  return ((Math.floor(tick) % LOOP_TICKS) + LOOP_TICKS) % LOOP_TICKS
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Everything the animation shows at a tick; any integer wraps into the 120-tick loop. */
export function dayState(tick: number): DayState {
  const t = wrap(tick)
  const step = Math.floor(t / TICKS_PER_STEP)
  const k = t % TICKS_PER_STEP
  const odd = t % 2 === 1

  // The person: at the desk, over to the colleague for the meeting, back, out
  // the door at six, and on the couch at home with the laptop.
  let left = 180
  let bottom = 75
  let facing: 'left' | 'right' = 'left'
  let pose: Pose = 'sit'
  let walkSeconds = 0
  // A walk takes as long as the legs move: so many ticks of the walking pose.
  const walk = (ticks: number) => (ticks * TICK_MS) / 1000

  if (step === 1) {
    pose = odd ? 'reach' : 'sit'
  }

  if (step === 2) {
    walkSeconds = walk(6)

    if (k < 4) {
      pose = 'reach'
    } else {
      left = 245
      facing = 'right'
      pose = k < 10 && odd ? 'walk' : 'stand'
    }
  }

  if (step === 3) {
    walkSeconds = walk(6)

    if (k < 6) {
      pose = odd ? 'walk' : 'stand'
    } else {
      pose = odd ? 'reach' : 'sit'
    }
  }

  if (step === 4) {
    walkSeconds = walk(10)

    if (k >= 4) {
      left = 470
      facing = 'right'
      pose = odd ? 'walk' : 'stand'
    }
  }

  if (step === 5) {
    left = 132
    bottom = 80
  }

  // Steps without a board keep the last board's text; it is hidden.
  const quiet = BOARDS.get(step)
  const shown = quiet ?? BOARDS.get(5)!
  const board = quiet !== undefined && k >= quiet.from
  const unlocked = step === 5 && k < 14
  const secondsLeft = 20 * 60 - 1 - k * 3

  const sessions = SESSIONS.map(({ name, project }): SessionRow => {
    const status = statusOf(name, step, k)
    const selected = name === IN_FRONT[step]

    return {
      name,
      project,
      working: status === 'working',
      dot: TONE[status],
      text:
        selected || status === 'done' || status === 'needs'
          ? 'fg'
          : status === 'working'
            ? 'fg-secondary'
            : 'fg-faint',
      selected,
      word: status === 'working' ? 'working' : status === 'needs' ? 'waiting' : 'idle'
    }
  })

  const count = (['working', 'waiting', 'idle'] as const)
    .flatMap((word) => {
      const n = sessions.filter((row) => row.word === word).length

      return n > 0 ? [`${n} ${word}`] : []
    })
    .join(' · ')

  let lines: TermLine[] = []
  let input = ''

  if (step === 1) {
    lines = RETRY.slice(0, k < 2 ? 7 : k < 5 ? 9 : k < 9 ? 12 : k < 13 ? 15 : 17)
  }

  if (step === 2) {
    lines = RETRY
  }

  if (step === 3) {
    lines =
      k < 12 ? AUTH : [...AUTH, blank(), tool('Bash(npm run migrate)'), result('Migrated 3 tables')]
  }

  if (step === 4) {
    lines = RETRY_DONE
  }

  if (step === 5) {
    lines = RETRY_DONE

    if (k < 6) {
      input = QUESTION.slice(0, Math.ceil((QUESTION.length * (k + 1)) / 6))
    } else {
      lines = [...lines, blank(), user(QUESTION)]
    }

    if (k >= 8) {
      lines = [
        ...lines,
        blank(),
        tool('Bash(gh pr checks 88)'),
        result('build   pass'),
        more('test    pass'),
        more('lint    pass')
      ]
    }

    if (k >= 11) {
      lines = [...lines, blank(), say('All three checks pass on #88.')]
    }
  }

  const thinking = THINKING[step]

  return {
    step,
    flags: {
      home: step === 5,
      night: step === 4,
      dim: step === 4 && k >= 6,
      colleague: step === 2,
      mug: step === 0,
      chime: step === 1 && k >= 10 && k < 16,
      board,
      unlocked,
      pointer: step === 2 && k < 4,
      pressed: step === 2 && k >= 2 && k < 4,
      report: step === 0,
      permission: step === 3 && k < 12,
      status:
        step === 1 ||
        (step === 2 && k < 4) ||
        (step === 3 && k >= 12) ||
        (step === 5 && k >= 6 && k < 11)
    },
    person: { left, bottom, facing, pose, walkSeconds },
    deskDots: [
      TONE[statusOf('app-142-retry', step, k)],
      TONE[statusOf('app-145-backoff-docs', step, k)],
      TONE[statusOf('app-139-auth', step, k)]
    ],
    sessions,
    lines,
    texts: {
      boardLabel: shown.label,
      boardNow: shown.now(k - shown.from),
      boardUntil: shown.until,
      boardCount: count,
      countdown: `${Math.floor(secondsLeft / 60)}:${pad(secondsLeft % 60)}`,
      spin: `${SPINNER[t % 6]} ${thinking.verb}`,
      seconds: ` (${k - thinking.since}s · esc to interrupt)`,
      input,
      prs: step === 0 ? '2' : '1',
      changes: step === 3 ? '2' : '3'
    }
  }
}
