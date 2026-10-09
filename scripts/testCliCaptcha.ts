/**
 * Focused CAPTCHA + account create + password login test against login-tester.
 *
 * Usage: node -r sucrase/register scripts/testCliCaptcha.ts
 */
import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { engineRequest } from './engineRequest'
import {
  createAccountWithCaptcha,
  loginWithPasswordAndCaptcha,
  startEngine
} from './util/cliHarness'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-captcha-'))
const USER = `captcha${crypto.randomBytes(4).toString('hex')}`
const PASS = `Pass${crypto.randomBytes(4).toString('hex')}!b2`
const PIN = '4321'

async function main(): Promise<void> {
  console.log(`user=${USER} dir=${TMP}`)
  const { engine, socketPath: sock } = await startEngine({ directory: TMP })

  try {
    // Create — expect challenge or success
    const create = await createAccountWithCaptcha(engineRequest, sock, {
      username: USER,
      password: PASS,
      pin: PIN
    })
    console.log('create status', create.status, create.json?.error?.code)
    if (create.status !== 200) {
      throw new Error(`create failed: ${JSON.stringify(create.json)}`)
    }
    console.log('CREATED session', create.json.sessionId)

    // Logout
    await engineRequest(
      sock,
      'POST',
      `/account/${create.json.sessionId}/logout`
    )

    // Login again with captcha path
    const login = await loginWithPasswordAndCaptcha(engineRequest, sock, {
      username: USER,
      password: PASS
    })
    console.log('login status', login.status, login.json?.error?.code)
    if (login.status !== 200) {
      throw new Error(`login failed: ${JSON.stringify(login.json)}`)
    }
    console.log('LOGGED IN session', login.json.sessionId)

    // Cleanup remote account
    await engineRequest(
      sock,
      'POST',
      `/account/${login.json.sessionId}/delete-remote-account`
    )
    console.log('PASS captcha account create + login')
  } finally {
    engine.kill('SIGTERM')
    fs.rmSync(TMP, { recursive: true, force: true })
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
