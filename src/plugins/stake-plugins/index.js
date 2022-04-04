// @flow
import '@ethersproject/shims'

import { makeStakePlugin as makeMasonryStakePlugin } from './policies/masonryPolicy'

export * from './types'

export const makeStakePlugin = makeMasonryStakePlugin
