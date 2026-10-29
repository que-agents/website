import { describe, expect, it } from 'vitest'
import {
  LOOP_TICKS,
  REPORT_ROWS,
  SPRITES,
  STEPS,
  TICKS_PER_STEP,
  dayState,
  settledTick,
  stepOf,
  stepTick
} from '../src/lib/day'

const lineTexts = (tick: number) => dayState(tick).lines.map((line) => line.text)
const ticks = Array.from({ length: LOOP_TICKS }, (_, t) => t)

describe('the steps', () => {
  it('are six, labelled 8 AM to 10:14 PM, of 20 ticks each, in a 120-tick loop', () => {
    expect(STEPS.map((step) => step.time)).toEqual([
      '8 AM',
      '9:30 AM',
      '11 AM',
      '12 PM',
      '6 PM',
      '10:14 PM'
    ])
    expect(TICKS_PER_STEP).toBe(20)
    expect(LOOP_TICKS).toBe(120)
  })

  it('change every 20 ticks', () => {
    expect([0, 19, 20, 39, 40, 99, 100, 119].map(stepOf)).toEqual([0, 0, 1, 1, 2, 4, 5, 5])
    expect([19, 20, 119].map((t) => dayState(t).step)).toEqual([0, 1, 5])
  })

  it('wrap any tick into the loop', () => {
    expect(dayState(120)).toEqual(dayState(0))
    expect(dayState(245)).toEqual(dayState(5))
    expect(dayState(-1)).toEqual(dayState(119))
  })

  it('each settle on a tick inside the step', () => {
    STEPS.forEach((_, step) => {
      expect(stepOf(settledTick(step))).toBe(step)
    })
    expect(STEPS.map((_, step) => settledTick(step))).toEqual([19, 32, 59, 71, 99, 113])
  })

  it('settle where each caption is true', () => {
    expect(dayState(settledTick(0)).flags.report).toBe(true)
    expect(dayState(settledTick(1)).flags.chime).toBe(true)
    expect(dayState(settledTick(2)).flags.board).toBe(true)
    expect(dayState(settledTick(3)).flags.permission).toBe(true)
    expect(dayState(settledTick(4)).flags).toMatchObject({ board: true, night: true, dim: true })
    expect(dayState(settledTick(5)).flags.unlocked).toBe(true)
  })

  it('are jumped to at their start while playing, and at their settled frame while paused', () => {
    expect(STEPS.map((_, step) => stepTick(step, false))).toEqual([0, 20, 40, 60, 80, 100])
    expect(STEPS.map((_, step) => stepTick(step, true))).toEqual([19, 32, 59, 71, 99, 113])
  })
})

describe('the quiet board', () => {
  const board = (t: number) => {
    const { boardLabel, boardNow, boardUntil, boardCount } = dayState(t).texts
    return [boardLabel, boardNow, boardUntil, boardCount]
  }

  it('shows from 11:00 (step 3, beat 4), from 18:00 (step 5, beat 4) and after the unlock', () => {
    const boardTicks = ticks.filter((t) => dayState(t).flags.board)
    expect(boardTicks).toEqual([
      ...Array.from({ length: 16 }, (_, i) => 44 + i),
      ...Array.from({ length: 16 }, (_, i) => 84 + i),
      ...Array.from({ length: 6 }, (_, i) => 114 + i)
    ])
  })

  it('counts the sessions by what the board says, and tells the time three minutes a beat', () => {
    expect(board(44)).toEqual(['QUIET', '11:00', '12:00', '2 working · 1 waiting · 2 idle'])
    expect(board(59)).toEqual(['QUIET', '11:45', '12:00', '2 working · 1 waiting · 2 idle'])
    expect(board(84)).toEqual(['QUIET HOURS', '18:00', '08:00', '3 working · 2 idle'])
    expect(board(114)).toEqual(['QUIET HOURS', '22:28', '08:00', '3 working · 2 idle'])
    expect(board(119)[1]).toBe('22:33')
  })

  it('lists each session in the sidebar order with the word the board shows', () => {
    expect(dayState(50).sessions.map((row) => [row.name, row.word])).toEqual([
      ['app-142-retry', 'working'],
      ['app-145-backoff-docs', 'working'],
      ['app-131-cache', 'idle'],
      ['app-139-auth', 'waiting'],
      ['app-150-migrate', 'idle']
    ])
  })
})

describe('the report', () => {
  it('lists each session as the night left it: two pull requests, a question, one working, one idle', () => {
    expect(REPORT_ROWS).toEqual([
      { name: 'app-142-retry', project: 'uploader', dot: 'good', tag: '#88', tagTone: 'accent' },
      {
        name: 'app-145-backoff-docs',
        project: 'uploader',
        dot: 'good',
        tag: '#89',
        tagTone: 'accent'
      },
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
      {
        name: 'app-131-cache',
        project: 'uploader',
        dot: 'neutral',
        tag: 'idle',
        tagTone: 'fg-faint'
      }
    ])
  })

  it('counts two pull requests on the rail while it is open, then one', () => {
    expect([0, 20, 60].map((t) => [dayState(t).texts.prs, dayState(t).texts.changes])).toEqual([
      ['2', '3'],
      ['1', '3'],
      ['1', '2']
    ])
  })
})

describe('the sidebar', () => {
  it('marks a session done when it finishes, with the chime', () => {
    const cache = (t: number) => dayState(t).sessions[2]
    expect(cache(29)).toMatchObject({ working: true, dot: 'accent' })
    expect(cache(30)).toMatchObject({ working: false, dot: 'good', text: 'fg' })
    expect(dayState(29).flags.chime).toBe(false)
    expect(dayState(30).flags.chime).toBe(true)
    expect(dayState(36).flags.chime).toBe(false)
  })

  it('selects the session in front: none on the report, then retry, auth at noon', () => {
    const selected = (t: number) =>
      dayState(t)
        .sessions.filter((row) => row.selected)
        .map((row) => row.name)
    expect(selected(0)).toEqual([])
    expect(selected(20)).toEqual(['app-142-retry'])
    expect(selected(60)).toEqual(['app-139-auth'])
  })

  it('shows the Quiet row until the unlock, then a countdown from 19:59, three seconds a tick', () => {
    expect(dayState(99).flags.unlocked).toBe(false)
    expect(dayState(100)).toMatchObject({
      flags: { unlocked: true },
      texts: { countdown: '19:59' }
    })
    expect(dayState(113)).toMatchObject({
      flags: { unlocked: true },
      texts: { countdown: '19:20' }
    })
    expect(dayState(114).flags.unlocked).toBe(false)
  })

  it('points at 1h and presses it before the meeting', () => {
    const quiet = (t: number) => {
      const { pointer, pressed } = dayState(t).flags
      return { pointer, pressed }
    }
    expect(quiet(40)).toEqual({ pointer: true, pressed: false })
    expect(quiet(42)).toEqual({ pointer: true, pressed: true })
    expect(quiet(44)).toEqual({ pointer: false, pressed: false })
  })
})

describe('the terminal', () => {
  it('is empty while the report is open', () => {
    expect(dayState(0).flags.report).toBe(true)
    expect(lineTexts(0)).toEqual([])
  })

  it('draws Claude Code: its header, the prompt, then tool calls and their results', () => {
    expect(dayState(20).lines.slice(0, 5)).toEqual([
      { kind: 'title', pre: ' ▐▛███▜▌  ', text: 'Claude Code v2.1' },
      { kind: 'logo', pre: '▝▜█████▛▘ ', text: 'Opus 5.5 · Claude Max' },
      { kind: 'logo', pre: '  ▘▘ ▝▝   ', text: '~/.que/worktrees/uploader/app-142-retry' },
      { kind: 'blank', pre: '', text: ' ' },
      { kind: 'user', pre: '> ', text: 'Add retry with backoff to the uploader' }
    ])
    expect(lineTexts(20).at(-1)).toBe("I'll wrap the upload in a retry with backoff.")
    expect(dayState(32).lines.at(-1)).toEqual({
      kind: 'tool',
      pre: '⏺ ',
      text: 'Bash(npm test)'
    })
    expect(dayState(39).lines.at(-1)).toEqual({
      kind: 'result',
      pre: '  ⎿  ',
      text: '42 passed'
    })
  })

  it('asks for permission at noon, then runs the migration', () => {
    expect(dayState(71).flags).toMatchObject({ permission: true, status: false })
    expect(lineTexts(71).at(-1)).toBe('Updated with 31 additions and 12 removals')
    expect(dayState(72).flags).toMatchObject({ permission: false, status: true })
    expect(lineTexts(72).slice(-2)).toEqual(['Bash(npm run migrate)', 'Migrated 3 tables'])
    expect(dayState(72).texts).toMatchObject({
      spin: '· Brewing…',
      seconds: ' (1s · esc to interrupt)'
    })
  })

  it('types the question during the unlock, then answers it', () => {
    expect(dayState(100).texts.input).toBe('Did t')
    expect(dayState(105).texts.input).toBe('Did the checks on #88 pass?')
    expect(dayState(106).texts.input).toBe('')
    expect(lineTexts(106).at(-1)).toBe('Did the checks on #88 pass?')
    expect(lineTexts(108).slice(-4)).toEqual([
      'Bash(gh pr checks 88)',
      'build   pass',
      'test    pass',
      'lint    pass'
    ])
    expect(lineTexts(113).at(-1)).toBe('All three checks pass on #88.')
  })

  it('spins through six glyphs, one a tick, counting the seconds the session has been going', () => {
    expect(dayState(20).texts).toMatchObject({
      spin: '✳ Noodling…',
      seconds: ' (20s · esc to interrupt)'
    })
    expect(dayState(40).texts.seconds).toBe(' (40s · esc to interrupt)')
    expect(dayState(106).texts).toMatchObject({
      spin: '✻ Pondering…',
      seconds: ' (1s · esc to interrupt)'
    })
    expect([20, 21, 22, 23, 24, 25, 26].map((t) => dayState(t).texts.spin[0])).toEqual([
      '✳',
      '✶',
      '✻',
      '✽',
      '·',
      '✢',
      '✳'
    ])
  })
})

describe('the scene', () => {
  it('captions each step', () => {
    expect(STEPS.map((_, step) => dayState(step * TICKS_PER_STEP).texts.caption)).toEqual(
      STEPS.map((step) => step.caption)
    )
  })

  it('is the office until 10:14 PM, then home', () => {
    expect(ticks.filter((t) => dayState(t).flags.home)).toEqual(
      Array.from({ length: 20 }, (_, i) => 100 + i)
    )
  })

  it('walks the person over for the meeting, back to the desk, and out at six', () => {
    expect(dayState(43).person).toMatchObject({ left: 180, pose: 'reach', walkSeconds: 1.5 })
    expect(dayState(44).person).toMatchObject({ left: 245, facing: 'right', walkSeconds: 1.5 })
    expect(dayState(60).person).toMatchObject({ left: 180, facing: 'left' })
    expect(dayState(84).person).toMatchObject({ left: 470, walkSeconds: 2.5 })
    expect(dayState(100).person).toEqual({
      left: 132,
      bottom: 80,
      facing: 'left',
      pose: 'sit',
      walkSeconds: 0
    })
  })

  it('draws every pose as a box-shadow', () => {
    for (const shadow of Object.values(SPRITES)) {
      const block = String.raw`\d+px \d+px 0 var\(--seam, 0px\) #[0-9a-f]{6}`
      expect(shadow).toMatch(new RegExp(`^(${block}, )+${block}$`))
    }
    expect(SPRITES.stand.startsWith('15px 5px 0 var(--seam, 0px) #3b2a1e')).toBe(true)
  })
})
