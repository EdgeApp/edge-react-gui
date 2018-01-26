// @flow
import type {
  AbcContext,
  AbcContextCallbacks,
  AbcCorePlugin,
  AbcContextOptions
} from 'edge-login'

import {makeFakeContexts, makeEdgeContext} from 'edge-login'
import ENV from '../../env.json'
const {AIRBITZ_API_KEY, SHAPESHIFT_API_KEY} = ENV

function makeCoreContext (callbacks: AbcContextCallbacks = {}, pluginFactories: Array<AbcCorePlugin> = []): Promise<AbcContext> {
  const opts: AbcContextOptions = {
    apiKey: AIRBITZ_API_KEY,
    callbacks,
    plugins: pluginFactories,
    shapeshiftKey: SHAPESHIFT_API_KEY
  }

  if (ENV.USE_FAKE_CORE) {
    const [context] = makeFakeContexts({...opts, localFakeUser: true})
    return Promise.resolve(context)
  }

  return makeEdgeContext(opts)
}

export {makeCoreContext}
