import { mkdirSync } from 'fs'
import { makeNodeZcashModule } from 'zcash-native/node'

import { wrapZcashNative } from './zcashIo'
import type { ZcashIo } from './zcashIo'

export interface MakeNodeZcashIoOpts {
  documentDirectory: string
}

/**
 * Node N-API Zcash native IO for in-process plugins (CLI).
 * Do not import this from the React Native / webpack bundle.
 */
export function makeZcashIo(opts: MakeNodeZcashIoOpts): ZcashIo {
  mkdirSync(opts.documentDirectory, { recursive: true })
  return wrapZcashNative(makeNodeZcashModule(opts))
}
