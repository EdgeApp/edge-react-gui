import { join } from 'path'

import { PluginEnvironment } from '../common/innerPlugin'
import type { ZcashIo } from './zcashIo'
import { makeZcashIo } from './zcashIo.node'
import { ZcashTools } from './ZcashTools'
import type { ZcashNetworkInfo } from './zcashTypes'

function contextPath(
  io: PluginEnvironment<ZcashNetworkInfo>['io']
): string | undefined {
  const value = 'path' in io ? (io as { path?: unknown }).path : undefined
  return typeof value === 'string' && value !== '' ? value : undefined
}

export async function makeCurrencyTools(
  env: PluginEnvironment<ZcashNetworkInfo>
): Promise<ZcashTools> {
  const injected = env.nativeIo.zcash as ZcashIo | undefined
  if (injected != null) {
    return new ZcashTools(env)
  }

  const path = contextPath(env.io)
  if (path == null) {
    throw new Error('Need zcash native IO')
  }

  const zcash = makeZcashIo({
    documentDirectory: join(path, 'native', 'zcash')
  })
  env.nativeIo = { ...env.nativeIo, zcash }
  return new ZcashTools(env)
}

export { makeCurrencyEngine } from './ZcashEngine'
export { updateInfoPayload } from './ZcashTools'
