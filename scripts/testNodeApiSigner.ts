/**
 * Verify the Node N-API Edge API HMAC signer against a JS HMAC-SHA256
 * reference using edgeKey.json, and that makeCoreContext prefers apiSigner.
 */
import { createHmac } from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { EventHub } from '../src/cli/engine/events'
import type { EngineLogger } from '../src/cli/engine/logger'
import { makeCoreContext } from '../src/cli/engine/makeCoreContext'
import {
  hasNodeApiSigner,
  makeNodeApiSigner,
  NODE_API_SIGNER_BUNDLE_ID,
  resetNodeApiSignerCacheForTests
} from '../src/cli/engine/nodeApiSigner'

function assert(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

async function main(): Promise<void> {
  resetNodeApiSignerCacheForTests()

  assert(
    hasNodeApiSigner(),
    'Node API signer addon missing — run npm run build:cli:native first'
  )

  const edgeKeyPath = path.join(__dirname, '..', 'edgeKey.json')
  assert(fs.existsSync(edgeKeyPath), 'edgeKey.json required for HMAC reference')
  const edgeKey = JSON.parse(fs.readFileSync(edgeKeyPath, 'utf8')) as {
    apiKey: string
    apiSecret: string
  }
  assert(typeof edgeKey.apiKey === 'string' && edgeKey.apiKey !== '', 'apiKey')
  assert(
    typeof edgeKey.apiSecret === 'string' && edgeKey.apiSecret !== '',
    'apiSecret'
  )

  const secret = Buffer.from(edgeKey.apiSecret.replace(/^0x/i, ''), 'hex')
  const message = 'POST\n/v2/login\n{"userId":"test"}'
  const expectedSig = createHmac('sha256', secret)
    .update(message, 'utf8')
    .digest('base64')

  const signer = makeNodeApiSigner()
  const signed = await signer.signMessage(message)

  assert(
    signed.apiKey === edgeKey.apiKey,
    `apiKey mismatch: ${signed.apiKey} !== ${edgeKey.apiKey}`
  )
  assert(
    signed.signature === expectedSig,
    `signature mismatch\n native=${signed.signature}\n expect=${expectedSig}\n pad=${NODE_API_SIGNER_BUNDLE_ID}`
  )
  console.log('PASS node HMAC matches JS reference')

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-node-hmac-'))
  const events = new EventHub()
  const logs: string[] = []
  const logger = {
    logPath: path.join(dir, 'test.log'),
    write(level: string, message: string) {
      logs.push(`${level}:${message}`)
    },
    info(message: string) {
      logs.push(`info:${message}`)
    },
    warn(message: string) {
      logs.push(`warn:${message}`)
    },
    error(message: string) {
      logs.push(`error:${message}`)
    },
    close() {}
  } as unknown as EngineLogger

  const bundle = await makeCoreContext({
    directory: dir,
    testMode: true,
    events,
    logger
  })
  assert(
    logs.some(l => l.includes('Node native Edge API HMAC')),
    'expected makeCoreContext to log native signer use'
  )
  assert(
    logs.some(l => l.includes('Fetched infoRollup appKeys')),
    `expected makeCoreContext to fetch infoRollup appKeys with the native HMAC signer\nlogs:\n${logs.join(
      '\n'
    )}`
  )
  assert(
    !logs.some(l => l.includes('infoRollup appKeys fetch failed')),
    `infoRollup appKeys fetch failed; native HMAC signer should authorize info-tester\nlogs:\n${logs.join(
      '\n'
    )}`
  )
  assert(bundle.context != null, 'missing context')
  console.log('PASS makeCoreContext uses native signer on tester')
  console.log(
    'PASS makeCoreContext fetched infoRollup appKeys with native signer'
  )
  await bundle.context.close()
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
