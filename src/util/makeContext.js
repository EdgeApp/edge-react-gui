// @flow

import type { EdgeContext, EdgeContextOptions } from 'edge-core-js'
import { makeEdgeContext } from 'edge-core-js'

import ENV from '../../env.json'

const { AIRBITZ_API_KEY, SHAPESHIFT_API_KEY, CHANGELLY_INIT, FAAST_INIT, CHANGE_NOW_API_KEY } = ENV

export async function makeCoreContext (): Promise<EdgeContext> {
  const opts: EdgeContextOptions = {
    apiKey: AIRBITZ_API_KEY,
    appId: '',
    shapeshiftKey: SHAPESHIFT_API_KEY,
    changellyInit: CHANGELLY_INIT,
    changeNowKey: CHANGE_NOW_API_KEY,
    faastInit: FAAST_INIT
  }

  return makeEdgeContext(opts)
}
