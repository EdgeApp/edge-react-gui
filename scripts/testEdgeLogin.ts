/**
 * Edge-login E2E against login-tester without the GUI:
 * 1. Create+login an approving account
 * 2. Request request-edge-login (returns lobbyId + uri)
 * 3. Approve the lobby from the logged-in account
 * 4. Poll until the pending login completes with a session
 *
 * Also prints the lobby URI for optional Maestro approval on a
 * tester-configured Edge build.
 *
 * Usage: node -r sucrase/register scripts/testEdgeLogin.ts
 */
import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { engineRequest } from './engineRequest'
import { createAccountWithCaptcha, startEngine } from './util/cliHarness'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-edgelogin-'))
const USER = `edgelogin${crypto.randomBytes(3).toString('hex')}`
const PASS = `Pass${crypto.randomBytes(4).toString('hex')}!e1`
const PIN = '2468'

async function createWithCaptcha(sock: string): Promise<string> {
  const create = await createAccountWithCaptcha(engineRequest, sock, {
    username: USER,
    password: PASS,
    pin: PIN
  })
  if (create.status !== 200) {
    throw new Error(`create failed: ${JSON.stringify(create.json)}`)
  }
  return create.json.sessionId as string
}

async function main(): Promise<void> {
  console.log(`Approver user=${USER} dir=${TMP}`)
  // A longer idle window than the others: this suite waits for a human to
  // approve the login on a second device.
  const { engine, socketPath: sock } = await startEngine({
    directory: TMP,
    idleTimeoutSeconds: 180
  })

  try {
    const approverSession = await createWithCaptcha(sock)
    console.log('approver session', approverSession)

    const pending = await engineRequest(sock, 'POST', '/request-edge-login')
    if (pending.status !== 200) {
      throw new Error(`edge login failed: ${JSON.stringify(pending.json)}`)
    }
    const { pendingId, lobbyId, uri } = pending.json
    console.log(JSON.stringify({ pendingId, lobbyId, uri }, null, 2))
    console.log(
      'Maestro tip: paste this URI into Scan QR → Enter on a tester-server Edge build:'
    )
    console.log(`  LOBBY_URI=${uri}`)
    console.log(
      `  maestro-runner --platform ios -e LOBBY_URI=${uri} test ~/.edge-cli/maestro/C999006-edge-login-approve.yaml`
    )

    // Approve via REST (same tester login server)
    const fetched = await engineRequest(
      sock,
      'GET',
      `/account/${approverSession}/fetch-lobby/${lobbyId}`
    )
    console.log('lobby fetch', fetched.status, JSON.stringify(fetched.json))
    const approved = await engineRequest(
      sock,
      'POST',
      `/account/${approverSession}/approve-login-request/${lobbyId}`
    )
    console.log('lobby approve', approved.status, JSON.stringify(approved.json))

    const deadline = Date.now() + 60_000
    while (Date.now() < deadline) {
      const polled = await engineRequest(
        sock,
        'GET',
        `/pending-edge-login/${pendingId}`
      )
      console.log('poll', polled.json?.state)
      if (polled.json?.state === 'done' && polled.json?.session != null) {
        console.log('PASS request-edge-login', polled.json.session.sessionId)
        // Cleanup
        await engineRequest(
          sock,
          'POST',
          `/account/${approverSession}/delete-remote-account`
        )
        return
      }
      if (polled.json?.state === 'error' || polled.json?.state === 'closed') {
        throw new Error(`edge login ended: ${JSON.stringify(polled.json)}`)
      }
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    throw new Error('Timed out waiting for request-edge-login approval')
  } finally {
    engine.kill('SIGTERM')
    fs.rmSync(TMP, { recursive: true, force: true })
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
