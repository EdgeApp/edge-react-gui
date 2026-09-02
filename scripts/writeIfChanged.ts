import fs from 'fs'
import path from 'path'

/**
 * Write a file only when its contents actually change.
 *
 * `npm run prepare` regenerates every artifact on each install, so an
 * unconditional write would touch mtimes and show up as a git diff even when
 * nothing about the source moved. Returns true when something was written.
 */
export function writeIfChanged(file: string, contents: string): boolean {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === contents) {
    return false
  }
  fs.writeFileSync(file, contents)
  return true
}
