// @flow

import type { EdgeContext, EdgeContextOptions, EdgeCorePluginFactory } from 'edge-core-js'
import { makeEdgeContext, makeFakeContexts } from 'edge-core-js'

import ENV from '../../env.json'

const { AIRBITZ_API_KEY, SHAPESHIFT_API_KEY, CHANGELLY_INIT, CHANGE_NOW_API_KEY } = ENV

export async function makeCoreContext (pluginFactories: Array<EdgeCorePluginFactory> = []): Promise<EdgeContext> {
  const opts: EdgeContextOptions = {
    apiKey: AIRBITZ_API_KEY,
    appId: '',
    plugins: pluginFactories,
    shapeshiftKey: SHAPESHIFT_API_KEY,
    changellyInit: CHANGELLY_INIT,
    changeNowKey: CHANGE_NOW_API_KEY
  }

  if (ENV.USE_FAKE_CORE) {
    const [context] = await makeFakeContexts({ ...opts, localFakeUser: true })
    return context
  }

  return makeEdgeContext(opts)
}
