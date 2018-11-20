// @flow

import type { EdgeContext, EdgeContextOptions, EdgeCorePluginFactory } from 'edge-core-js'
import { makeEdgeContext, makeFakeContexts } from 'edge-core-js'

import ENV from '../../env.json'

const { AIRBITZ_API_KEY, SHAPESHIFT_API_KEY, CHANGELLY_INIT } = ENV

function makeCoreContext (pluginFactories: Array<EdgeCorePluginFactory> = []): Promise<EdgeContext> {
  const opts: EdgeContextOptions = {
    apiKey: AIRBITZ_API_KEY,
    plugins: pluginFactories,
    shapeshiftKey: SHAPESHIFT_API_KEY,
    changellyInit: CHANGELLY_INIT
  }

  if (ENV.USE_FAKE_CORE) {
    const [context] = makeFakeContexts({ ...opts, localFakeUser: true })
    return Promise.resolve(context)
  }

  return makeEdgeContext(opts)
}

export { makeCoreContext }
