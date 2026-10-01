import fs from 'fs'
import path from 'path'

/**
 * True when the generators may only verify, not write.
 *
 * `--check` turns every generator into a staleness test: it derives what the
 * artifact should contain and fails if the committed copy disagrees. That is
 * what makes committing the generated files safe — an edited declaration
 * cannot reach a commit while `commands.json` still describes the old one.
 */
const CHECK_ONLY = process.argv.includes('--check')

/**
 * Write a file only when its contents actually change.
 *
 * `npm run prepare` regenerates every artifact on each install, so an
 * unconditional write would touch mtimes and show up as a git diff even when
 * nothing about the source moved. Returns true when something was written.
 *
 * Under `--check` nothing is written; a file that would have changed throws
 * instead. `hint` names the command that regenerates this particular
 * artifact: the route generators are not the only callers any more, and
 * telling someone to run `npm run docs:api` when the stale file is the npm
 * manifest sends them somewhere that cannot fix it.
 */
export function writeIfChanged(
  file: string,
  contents: string,
  hint = {
    why: 'A route declaration changed without regenerating it.',
    run: 'npm run docs:api'
  }
): boolean {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === contents) {
    return false
  }
  if (CHECK_ONLY) {
    // A stack trace would bury the one line that matters.
    console.error(
      `✗ ${path.relative(process.cwd(), file)} is out of date.\n` +
        `  ${hint.why}\n` +
        `  Run \`${hint.run}\` and commit the result.`
    )
    process.exit(1)
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, contents)
  return true
}
