/**
 * Exercise the CLI against the in-process fake world.
 *
 * `makeFakeEdgeWorld` emulates the login, info and sync servers and cuts the
 * currency plugins off from the network, so the account-shaped commands run
 * with no server, no API key and no internet. That is what lets these run in a
 * pre-commit hook, where a suite needing login-tester cannot.
 *
 * Responses are checked against each route's `returns` cleaner in strict mode,
 * so a shape that drifts from the reference fails here.
 *
 *   node -r sucrase/register scripts/testCliFake.ts
 */
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = path.join(os.tmpdir(), `edge-cli-fake-${process.pid}`)
const CLI = ['-r', 'sucrase/register', 'src/cli/index.ts']
const BASE = ['--fake', `--directory=${DIR}`]

const USER = `faker${process.pid}`
const PASS = 'y768Mv4PLFupQjMu'
const PIN = '1111'

let failures = 0
let passes = 0

interface Run {
  status: number
  out: string
  json: any
}

function cli(...args: string[]): Run {
  const result = spawnSync('node', [...CLI, ...BASE, ...args], {
    encoding: 'utf8',
    env: { ...process.env, EDGE_CLI_CHECK_RESPONSES: 'strict' }
  })
  const out = (result.stdout ?? '') + (result.stderr ?? '')
  let json: any
  try {
    json = JSON.parse(result.stdout ?? '')
  } catch {
    json = undefined
  }
  return { status: result.status ?? -1, out, json }
}

/** Run a command and require it to succeed. */
function ok(label: string, ...args: string[]): Run {
  const run = cli(...args)
  const good = run.status === 0 && !/"error":\s*\{/.test(run.out)
  if (good) {
    passes++
    console.log(`OK   ${label}`)
  } else {
    failures++
    console.error(
      `FAIL ${label} — ${run.out.replace(/\s+/g, ' ').slice(0, 160)}`
    )
  }
  return run
}

/** Run a command that is expected to fail, and say why that is correct. */
function refuses(label: string, code: string, ...args: string[]): void {
  const run = cli(...args)
  if (run.status !== 0 && run.out.includes(code)) {
    passes++
    console.log(`OK   ${label} (refused with ${code})`)
  } else {
    failures++
    console.error(
      `FAIL ${label} — expected ${code}, got ${run.out
        .replace(/\s+/g, ' ')
        .slice(0, 140)}`
    )
  }
}

function main(): void {
  fs.mkdirSync(DIR, { recursive: true })
  try {
    // No arguments, engine-local.
    ok('engine-status', 'engine-status')
    ok('engine-config', 'engine-config')
    ok('engine-sessions', 'engine-sessions')

    // No arguments, reaching core.
    ok('local-users', 'local-users')

    // One named argument.
    ok('username-available', 'username-available', `--username=${USER}free`)

    // A body, and a session that persists into later commands.
    ok(
      'create-account',
      'create-account',
      `--username=${USER}`,
      `--password=${PASS}`,
      `--pin=${PIN}`
    )
    ok('fetch-login-messages', 'fetch-login-messages')
    ok('help', 'help', 'username-available')

    // A positional path parameter. No handle exists to read, so the refusal is
    // what proves the parameter reached the handler.
    refuses(
      'object-get with an unknown handle',
      'OBJECT_NOT_FOUND',
      'object-get',
      'tx_nosuchhandle'
    )
    refuses(
      'object-delete with an unknown handle',
      'OBJECT_NOT_FOUND',
      'object-delete',
      'tx_nosuchhandle'
    )

    ok('logout', 'logout')
    ok(
      'login-with-password',
      'login-with-password',
      `--username=${USER}`,
      `--password=${PASS}`
    )
    ok('engine-stop', 'engine-stop')
  } finally {
    cli('engine-stop')
    fs.rmSync(DIR, { recursive: true, force: true })
  }

  console.log(`\ntestCliFake: ${passes} passed, ${failures} failed`)
  if (failures > 0) process.exit(1)
}

main()
