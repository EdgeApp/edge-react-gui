// @flow
import type { AbcContext, AbcContextCallbacks, AbcContextOptions, EdgeCorePluginFactory } from 'edge-core-js'
import { makeEdgeContext, makeFakeContexts } from 'edge-core-js'

import ENV from '../../env.json'

const { AIRBITZ_API_KEY, SHAPESHIFT_API_KEY } = ENV

function makeCoreContext (callbacks: AbcContextCallbacks = {}, pluginFactories: Array<EdgeCorePluginFactory> = []): Promise<AbcContext> {
  const opts: AbcContextOptions = {
    apiKey: AIRBITZ_API_KEY,
    callbacks,
    plugins: pluginFactories,
    shapeshiftKey: SHAPESHIFT_API_KEY
  }

  if (ENV.USE_FAKE_CORE) {
    const [context] = makeFakeContexts({ ...opts, localFakeUser: true })
    return Promise.resolve(context)
  }

  return makeEdgeContext(opts)
}

export { makeCoreContext }
