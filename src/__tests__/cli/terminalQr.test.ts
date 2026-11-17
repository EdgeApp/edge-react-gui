import { describe, expect, it } from '@jest/globals'
import qrcodeGenerator from 'qrcode-generator'

import { renderTerminalQr } from '../../cli/client/terminalQr'

const URI = 'edge://edge/HbC9mVJ2xR4tN8pL'
const RICH = { TERM: 'xterm-256color' }

const DARK_256 = '\x1b[48;5;16m'
const LIGHT_256 = '\x1b[48;5;231m'

// Built from a string: a regular expression literal may not hold the escape
// character itself.
const ESC = '\x1b'
const SGR = `${ESC}\\[[0-9;]*m`

/**
 * Read a drawn code back into modules, the way a terminal shows it: each
 * colour code sets the background of the cells that follow, and two cells
 * make one module.
 */
function readBack(lines: string[], dark: string, light: string): boolean[][] {
  return lines.map(line => {
    const cells: boolean[] = []
    let isDark: boolean | undefined
    for (const part of line.split(new RegExp(`(${SGR})`))) {
      if (part === dark) isDark = true
      else if (part === light) isDark = false
      else if (part.startsWith('\x1b[')) isDark = undefined
      else cells.push(...Array.from(part, () => isDark === true))
    }
    expect(cells.length % 2).toBe(0)
    return cells.filter((_, i) => i % 2 === 0)
  })
}

function modules(data: string, level: 'L' | 'M'): boolean[][] {
  const qr = qrcodeGenerator(0, level)
  qr.addData(data)
  qr.make()
  const count = qr.getModuleCount()
  return Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, col) => qr.isDark(row, col))
  )
}

describe('renderTerminalQr', () => {
  it('draws every module, inside a 4-module light quiet zone', () => {
    const drawn = renderTerminalQr(URI, { env: RICH })
    const grid = readBack(drawn.lines, DARK_256, LIGHT_256)
    const expected = modules(URI, 'M')
    const size = expected.length + 8

    expect(grid.length).toBe(size)
    expect(drawn.height).toBe(size)
    expect(drawn.width).toBe(2 * size)
    for (const [y, row] of grid.entries()) {
      expect(row.length).toBe(size)
      for (const [x, isDark] of row.entries()) {
        const inside = y >= 4 && x >= 4 && y < size - 4 && x < size - 4
        expect(isDark).toBe(inside ? expected[y - 4][x - 4] : false)
      }
    }
  })

  it('uses only spaces and background colours, and resets each row', () => {
    const { lines } = renderTerminalQr(URI, { env: RICH })
    for (const line of lines) {
      expect(line).toMatch(
        new RegExp(`^(${ESC}\\[48;5;(16|231)m| )+${ESC}\\[0m$`)
      )
    }
  })

  it('draws the compact form when the standard one does not fit', () => {
    const drawn = renderTerminalQr(URI, { columns: 80, rows: 32, env: RICH })
    const expected = modules(URI, 'L')
    const size = expected.length + 4
    expect(drawn.tooBig).toBe(false)
    expect(drawn.height).toBe(size)

    const grid = readBack(drawn.lines, DARK_256, LIGHT_256)
    for (const [y, row] of grid.entries()) {
      for (const [x, isDark] of row.entries()) {
        const inside = y >= 2 && x >= 2 && y < size - 2 && x < size - 2
        expect(isDark).toBe(inside ? expected[y - 2][x - 2] : false)
      }
    }
  })

  it('reports a terminal too small for either form', () => {
    const drawn = renderTerminalQr(URI, { columns: 80, rows: 24, env: RICH })
    // The compact form, the smaller of the two, with the size it needs.
    expect(drawn.height).toBe(modules(URI, 'L').length + 4)
    expect(drawn.tooBig).toBe(true)
  })

  it('keeps the standard form when the size is unknown', () => {
    const drawn = renderTerminalQr(URI, { env: RICH })
    expect(drawn.height).toBe(modules(URI, 'M').length + 8)
    expect(drawn.tooBig).toBe(false)
  })

  it('falls back to 16 colours where 256 are not advertised', () => {
    for (const env of [{ TERM: 'linux' }, {}]) {
      const { lines } = renderTerminalQr(URI, { env, platform: 'linux' })
      const codes = new Set(lines.join('').match(new RegExp(SGR, 'g')))
      expect([...codes].sort()).toEqual(['\x1b[0m', '\x1b[107m', '\x1b[40m'])
    }
  })

  it('uses the 256-colour cube wherever the terminal advertises it', () => {
    const envs = [
      { TERM: 'xterm-256color' },
      { TERM: 'tmux-256color' },
      { COLORTERM: 'truecolor' },
      { COLORTERM: '24bit' },
      { WT_SESSION: '7c1f' }
    ]
    for (const env of envs) {
      const { lines } = renderTerminalQr(URI, { env, platform: 'win32' })
      expect(lines.join('')).toContain(DARK_256)
      expect(lines.join('')).toContain(LIGHT_256)
    }
  })
})
