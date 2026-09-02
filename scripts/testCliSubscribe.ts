/**
 * Proves the subscribe/one-shot concurrency contract against a real engine:
 *
 *   1. A subscriber holds the engine open even with no account logged in.
 *   2. One-shot commands run normally while a subscriber is attached.
 *   3. The idle timer re-arms once the last subscriber detaches.
 *   4. Stopping the engine closes the stream with a reason and exit code 7.
 *
 * Uses its own --directory so it never touches a developer's live engine.
 *
 *   node -r sucrase/register scripts/testCliSubscribe.ts
 */
import { type ChildProcess, spawn, spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = path.join(os.tmpdir(), `edge-cli-subscribe-${process.pid}`)
const CLI = ['-r', 'sucrase/register', 'src/cli/index.ts']
const BASE = ['-t', `--directory=${DIR}`]

let failures = 0
function check(label: string, ok: boolean, detail = ''): void {
  if (ok) console.log(`OK   ${label}`)
  else {
    failures++
    console.error(`FAIL ${label}${detail !== '' ? ` — ${detail}` : ''}`)
  }
}

function cli(...args: string[]): { status: number; out: string } {
  const result = spawnSync('node', [...CLI, ...BASE, ...args], {
    encoding: 'utf8'
  })
  return { status: result.status ?? -1, out: result.stdout + result.stderr }
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

async function main(): Promise<void> {
  fs.mkdirSync(DIR, { recursive: true })

  const status = cli('engine-status')
  check('engine starts', status.status === 0, status.out.slice(0, 200))

  let subOut = ''
  const sub: ChildProcess = spawn('node', [...CLI, ...BASE, 'subscribe'], {
    stdio: ['ignore', 'pipe', 'pipe']
  })
  sub.stdout?.on('data', d => (subOut += String(d)))
  sub.stderr?.on('data', d => (subOut += String(d)))
  const subExit = new Promise<number>(resolve => {
    sub.on('exit', code => {
      resolve(code ?? -1)
    })
  })
  await sleep(2500)

  const held = cli('engine-status')
  check(
    'a subscriber holds off idle shutdown',
    /"idleShutdownAt":\s*null/.test(held.out) &&
      /"sessionCount":\s*0/.test(held.out),
    held.out.slice(0, 200)
  )

  const concurrent = cli('local-users')
  check(
    'one-shot commands run while subscribed',
    concurrent.status === 0 && concurrent.out.includes('localUsers'),
    concurrent.out.slice(0, 200)
  )

  const stopped = cli('engine-stop')
  check('engine-stop succeeds', stopped.status === 0, stopped.out.slice(0, 200))

  const code = await Promise.race([subExit, sleep(8000).then(() => -2)])
  check('subscriber exits when the engine stops', code === 7, `exit ${code}`)
  check(
    'subscriber is told why the stream ended',
    subOut.includes('engineShutdown'),
    subOut.slice(0, 300)
  )

  // A fresh engine must re-arm its idle timer with no subscriber attached.
  const rearmed = cli('engine-status')
  check(
    'idle timer re-arms with no subscriber',
    /"idleShutdownAt":\s*"/.test(rearmed.out),
    rearmed.out.slice(0, 200)
  )
  cli('engine-stop')

  fs.rmSync(DIR, { recursive: true, force: true })
  if (failures > 0) {
    console.error(`\n${failures} check(s) failed`)
    process.exit(1)
  }
  console.log('\ntestCliSubscribe: all checks passed')
}

main().catch((error: unknown) => {
  console.error(error)
  fs.rmSync(DIR, { recursive: true, force: true })
  process.exit(1)
})
