/**
 * Interactive smoke test — boots engine, runs a short command sequence.
 * Always uses tester servers.
 */
import { execSync, spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-interactive-'))

async function main(): Promise<void> {
  const engine = spawn(
    process.execPath,
    [
      '-r',
      'sucrase/register',
      'src/cli/engine/index.ts',
      '-t',
      '-d',
      TMP,
      '--idle-timeout=60'
    ],
    { stdio: ['ignore', 'inherit', 'pipe'] }
  )

  // Actually poll, rather than sleep and hope: a flat wait is slower than it
  // needs to be on a warm machine and flaky on a cold one, and it cannot tell
  // a slow start from an engine that died on its first line.
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timed out waiting for the engine to be ready'))
    }, 60_000)
    const done = (settle: () => void): void => {
      clearTimeout(timer)
      settle()
    }
    engine.once('exit', (code, signal) => {
      const how =
        signal != null ? `killed by ${signal}` : `exited with code ${code ?? 0}`
      done(() => {
        reject(new Error(`The engine ${how} before it was ready`))
      })
    })
    engine.stderr?.on('data', (chunk: Buffer) => {
      const text = String(chunk)
      process.stderr.write(text)
      if (text.includes('Ready')) done(resolve)
    })
  })

  const run = (args: string): void => {
    console.log('>', args)
    const out = execSync(
      `node -r sucrase/register src/cli/index.ts -t -d ${TMP} --no-spawn ${args}`,
      { encoding: 'utf8' }
    )
    console.log(out)
  }

  try {
    run('engine-status')
    run('engine-config')
    run('local-users')
    run('fetch-challenge')
    console.log('PASS interactive smoke')
  } finally {
    engine.kill('SIGTERM')
    fs.rmSync(TMP, { recursive: true, force: true })
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
