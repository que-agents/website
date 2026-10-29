// The home page's "day with que" animation as a pure function of the clock.
// The clock ticks every 250 ms; the day is six steps of 20 ticks (five seconds
// each) and starts over after 120. dayState(t) says everything the pixel scene
// and the app window show at tick t; DayAnimation.astro only puts it on the page.

export const TICK_MS = 250
export const TICKS_PER_STEP = 20

export interface Step {
  /** The timeline's label. */
  time: string
  /** The line under the animation. */
  caption: string
  /** What the app shows, in one sentence, for the screen-reader list. */
  shows: string
  /** The tick within the step that stands for the whole step when motion is reduced. */
  settle: number
}

export const STEPS: readonly Step[] = [
  {
    time: '8 AM',
    caption: 'The morning report: what the night did.',
    shows:
      'The report view sums up the night: five sessions, two pull requests, one session waiting for you and one unlock.',
    settle: 19
  },
  {
    time: '9:30 AM',
    caption: 'One worktree per task. A chime when one finishes.',
    shows:
      'A Claude Code session reads, edits and tests the uploader in its own worktree while the others work, and a chime sounds as the cache session finishes.',
    settle: 12
  },
  {
    time: '11 AM',
    caption: 'A meeting: quiet for an hour.',
    shows:
      'One click on Quiet 1h swaps the window for the quiet board, a dim row per session saying working, waiting or idle, until 12:00.',
    settle: 19
  },
  {
    time: '12 PM',
    caption: 'Quiet ends. The question waited for you.',
    shows:
      'The terminals come back, and the billing session is still asking for permission to run npm run migrate.',
    settle: 11
  },
  {
    time: '6 PM',
    caption: 'Quiet hours. The sessions keep running.',
    shows:
      'Quiet hours start: the quiet board stays up until 08:00 while three sessions keep working.',
    settle: 19
  },
  {
    time: '10:14 PM',
    caption: 'Need a look? Unlock, timed and logged.',
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

/** The tick that shows a step when motion is reduced: a settled frame, not its first. */
export function settledTick(step: number): number {
  return step * TICKS_PER_STEP + STEPS[step].settle
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

/** The sessions, in the order the sidebar (grouped by project) and the board list them. */
export const SESSIONS: readonly { name: string; project: (typeof PROJECTS)[number] }[] = [
  { name: 'app-142-retry', project: 'uploader' },
  { name: 'app-145-backoff-docs', project: 'uploader' },
  { name: 'app-131-cache', project: 'uploader' },
  { name: 'app-139-auth', project: 'billing' },
  { name: 'app-150-migrate', project: 'billing' }
]

/** The morning report's rows. */
export const REPORT_ROWS: readonly {
  name: string
  project: string
  dot: Tone
  tag: string
  tagTone: Tone
}[] = [
  { name: 'app-142-retry', project: 'uploader', dot: 'good', tag: '#88', tagTone: 'accent' },
  { name: 'app-145-backoff-docs', project: 'uploader', dot: 'good', tag: '#89', tagTone: 'accent' },
  {
    name: 'app-139-auth',
    project: 'billing',
    dot: 'attention',
    tag: 'needs input',
    tagTone: 'attention'
  },
  {
    name: 'app-150-migrate',
    project: 'billing',
    dot: 'accent',
    tag: 'working',
    tagTone: 'fg-muted'
  },
  { name: 'app-131-cache', project: 'uploader', dot: 'neutral', tag: 'idle', tagTone: 'fg-faint' }
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

export interface DayState {
  /** The tick, 0 to 119. */
  tick: number
  step: number
  /** The tick within the step, 0 to 19. */
  beat: number
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
  board: {
    label: string
    now: string
    until: string
    /** The count line, e.g. "3 working · 1 waiting · 1 idle". */
    count: string
  }
  /** The unlocked foot's time left, m:ss. */
  countdown: string
  terminal: {
    lines: TermLine[]
    /** What is typed in the input box. */
    input: string
    spinner: string
    verb: string
    seconds: number
  }
  /** The review rail's counts: pull requests and changed files. */
  prs: string
  changes: string
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

const pad = (n: number) => String(n).padStart(2, '0')

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
  if (step === 1) {
    pose = odd ? 'reach' : 'sit'
  }
  if (step === 2) {
    walkSeconds = 1.5
    if (k < 4) {
      pose = 'reach'
    } else {
      left = 245
      facing = 'right'
      pose = k < 10 && odd ? 'walk' : 'stand'
    }
  }
  if (step === 3) {
    walkSeconds = 1.5
    if (k < 6) {
      pose = odd ? 'walk' : 'stand'
    } else {
      pose = odd ? 'reach' : 'sit'
    }
  }
  if (step === 4) {
    walkSeconds = 2.5
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

  const board = (step === 2 && k >= 4) || (step === 4 && k >= 4) || (step === 5 && k >= 14)
  const unlocked = step === 5 && k < 14
  const secondsLeft = 20 * 60 - 1 - k * 3

  // Each session's status at each step: working, done (not yet seen), seen, or needs input.
  const plan: Record<string, Status[]> = {
    'app-142-retry': ['done', 'working', 'working', 'working', 'working', 'working'],
    'app-145-backoff-docs': ['done', 'working', 'working', 'done', 'seen', 'seen'],
    'app-131-cache': ['seen', k >= 10 ? 'done' : 'working', 'done', 'seen', 'seen', 'seen'],
    'app-139-auth': [
      'needs',
      'working',
      'needs',
      k >= 12 ? 'working' : 'needs',
      'working',
      'working'
    ],
    'app-150-migrate': ['working', 'seen', 'seen', 'seen', 'working', 'working']
  }
  const selected = step === 3 ? 'app-139-auth' : step === 0 ? '' : 'app-142-retry'
  const sessions = SESSIONS.map(({ name, project }): SessionRow => {
    const status = plan[name][step]
    const isSelected = name === selected
    return {
      name,
      project,
      working: status === 'working',
      dot: TONE[status],
      text:
        isSelected || status === 'done' || status === 'needs'
          ? 'fg'
          : status === 'working'
            ? 'fg-secondary'
            : 'fg-faint',
      selected: isSelected,
      word: status === 'working' ? 'working' : status === 'needs' ? 'waiting' : 'idle'
    }
  })
  const count = (['working', 'waiting', 'idle'] as const)
    .map((word) => [sessions.filter((row) => row.word === word).length, word] as const)
    .filter(([n]) => n > 0)
    .map(([n, word]) => `${n} ${word}`)
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

  return {
    tick: t,
    step,
    beat: k,
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
      TONE[plan['app-142-retry'][step]],
      TONE[plan['app-145-backoff-docs'][step]],
      TONE[plan['app-139-auth'][step]]
    ],
    sessions,
    board: {
      label: step === 2 ? 'QUIET' : 'QUIET HOURS',
      now:
        step === 2
          ? `11:${pad((k - 4) * 3)}`
          : step === 4
            ? `18:${pad((k - 4) * 3)}`
            : `22:${pad(28 + (k - 14))}`,
      until: step === 2 ? '12:00' : '08:00',
      count
    },
    countdown: `${Math.floor(secondsLeft / 60)}:${pad(secondsLeft % 60)}`,
    terminal: {
      lines,
      input,
      spinner: SPINNER[t % 6],
      verb: step === 3 ? 'Brewing…' : step === 5 ? 'Pondering…' : 'Noodling…',
      seconds: step === 1 ? 20 + k : step === 2 ? 40 + k : step === 3 ? k - 11 : k - 5
    },
    prs: step === 0 ? '2' : '1',
    changes: step === 3 ? '2' : '3'
  }
}
