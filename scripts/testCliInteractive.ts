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
    { stdio: ['ignore', 'inherit', 'inherit'] }
  )

  // Wait for ready by polling
  await new Promise(resolve => setTimeout(resolve, 15000))

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
    run('username-list')
    run('challenge-create')
    console.log('PASS interactive smoke')
  } finally {
    engine.kill('SIGTERM')
    fs.rmSync(TMP, { recursive: true, force: true })
  }
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
