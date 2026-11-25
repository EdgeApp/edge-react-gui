import qrcodeGenerator from 'qrcode-generator'

/**
 * A QR code drawn in a terminal so that a phone camera can scan it.
 *
 * Each module is two spaces on an explicit background colour, one text row
 * per module row: a terminal cell is about twice as tall as it is wide, so two
 * cells make a square module. There are no block glyphs (`▀ ▄ █`). A terminal
 * that adds space between lines, as Apple Terminal does, or draws glyphs with
 * seams between rows, as xterm.js does in VS Code, splits a half-block module
 * in two, and a code drawn that way does not decode. A background colour
 * fills the whole cell instead, and spaces are one column wide in every font
 * and locale.
 *
 * Both colours are drawn, the quiet zone included, so the code is dark on
 * light whatever the terminal's theme: scanners expect dark modules on a
 * light field, and a code that leaves "light" to a dark theme's background is
 * inverted. The colours are black (16) and white (231) from the 256-colour
 * cube, which themes do not repaint, with the 16-colour black and bright
 * white for a terminal that does not advertise 256 colours.
 */

export interface TerminalQrOptions {
  /** The terminal's size in cells, when the output is a terminal. */
  columns?: number
  rows?: number
  /** For the colour choice; `process.env` and `process.platform` by default. */
  env?: Record<string, string | undefined>
  platform?: NodeJS.Platform
}

export interface TerminalQr {
  /** The rows to print, each ending in a colour reset. */
  lines: string[]
  /** The code's size in terminal cells, quiet zone included. */
  width: number
  height: number
  /** The terminal is known to be too small to show the whole code. */
  tooBig: boolean
}

/**
 * The two forms, in order of preference.
 *
 * The standard one has the 4-module quiet zone ISO/IEC 18004 requires and
 * error correction level M. The compact one, for a terminal too small for
 * that, has a 2-module quiet zone, which phone scanners accept, and level L,
 * which keeps an `edge://edge/<lobbyId>` link to the smallest version.
 */
const FORMS = [
  { level: 'M', margin: 4 },
  { level: 'L', margin: 2 }
] as const

const RESET = '\x1b[0m'

/** Draw `data` as a QR code for the terminal described by `opts`. */
export function renderTerminalQr(
  data: string,
  opts: TerminalQrOptions = {}
): TerminalQr {
  const { columns, rows } = opts
  const fits = (width: number, height: number): boolean =>
    (columns == null || width <= columns) &&
    // One row more than the code, for the line the cursor ends on.
    (rows == null || height + 1 <= rows)

  let drawn: TerminalQr | undefined
  for (const form of FORMS) {
    const qr = qrcodeGenerator(0, form.level)
    qr.addData(data)
    qr.make()
    const size = qr.getModuleCount() + 2 * form.margin
    const width = 2 * size
    const height = size
    drawn = {
      lines: drawRows(qr, form.margin, size, palette(opts)),
      width,
      height,
      tooBig: !fits(width, height)
    }
    if (!drawn.tooBig) break
  }
  // `FORMS` is not empty, so the loop always draws one.
  if (drawn == null) throw new Error('No QR form to draw')
  return drawn
}

interface Palette {
  dark: string
  light: string
}

/**
 * The 256-colour cube's black and white where the terminal advertises 256
 * colours, as macOS, VS Code, tmux and most Linux terminals do through
 * `TERM`, and Windows Terminal does through `WT_SESSION`. Elsewhere, such as
 * the Linux console and the classic Windows console, the 16-colour black and
 * bright white.
 */
function palette(opts: TerminalQrOptions): Palette {
  const env = opts.env ?? process.env
  const platform = opts.platform ?? process.platform
  const colorterm = env.COLORTERM ?? ''
  const rich =
    /256color/.test(env.TERM ?? '') ||
    colorterm === 'truecolor' ||
    colorterm === '24bit' ||
    (platform === 'win32' && env.WT_SESSION != null)
  return rich
    ? { dark: '\x1b[48;5;16m', light: '\x1b[48;5;231m' }
    : { dark: '\x1b[40m', light: '\x1b[107m' }
}

/** One text row per module row, the quiet zone included. */
function drawRows(
  qr: ReturnType<typeof qrcodeGenerator>,
  margin: number,
  size: number,
  colors: Palette
): string[] {
  const count = qr.getModuleCount()
  const isDark = (row: number, col: number): boolean =>
    row >= 0 && col >= 0 && row < count && col < count && qr.isDark(row, col)

  const lines: string[] = []
  for (let y = 0; y < size; ++y) {
    let line = ''
    let current = ''
    for (let x = 0; x < size; ++x) {
      const color = isDark(y - margin, x - margin) ? colors.dark : colors.light
      // A colour code only where the colour changes, to keep each row short.
      if (color !== current) {
        line += color
        current = color
      }
      line += '  '
    }
    lines.push(line + RESET)
  }
  return lines
}
