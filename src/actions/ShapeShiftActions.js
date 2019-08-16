// @flow

import { base64 } from 'rfc4648'

import ENV from '../../env.json'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'

/**
 * Signs into a ShapeShift account, activating the plugin.
 */
export function activateShapeShift (oauthCode: string) {
  return async function (dispatch: Dispatch, getState: GetState) {
    const { account } = getState().core

    const userSettings = await fetchShapeShiftToken(oauthCode)
    await account.swapConfig['shapeshift'].changeUserSettings(userSettings)
    dispatch({ type: 'ON_KYC_TOKEN_SET' })
  }
}

/**
 * Sign out of the ShapeShift account, deactivating the plugin.
 */
export function deactivateShapeShift () {
  return async function (dispatch: Dispatch, getState: GetState) {
    const { account } = getState().core

    await account.swapConfig['shapeshift'].changeUserSettings({})
    dispatch({ type: 'NEED_KYC_SETTING' })
  }
}

type ShapeShiftSettings = {
  accessToken: string,
  refreshToken: string
}

/**
 * Turns a ShapeShift OAUTH code into a long-term token.
 */
async function fetchShapeShiftToken (oauthCode: string): Promise<ShapeShiftSettings> {
  const { clientId = '3a49c306-8c52-42a2-b7cf-bda4e4aa6d7d', secret = 'CWmm11jKoayEGPptfLzkyrrmyVHAG1skzRQuKJZYBrhy' } = ENV.SHAPESHIFT_INIT

  const auth = base64.stringify(parseAscii(clientId + ':' + secret))
  const uri = 'https://auth.shapeshift.io/oauth/token'
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Basic ' + auth
    },
    body: JSON.stringify({
      code: oauthCode,
      grant_type: 'authorization_code'
    })
  }

  if (global.androidFetch) {
    const response = await global.androidFetch(uri, options)
    return parseShapeShiftReply(JSON.parse(response))
  }

  const response = await fetch(uri, options)
  if (!response.ok) {
    throw new Error(`Fetching ${uri} returned ${response.status}`)
  }
  return parseShapeShiftReply(await response.json())
}

function parseShapeShiftReply (reply: mixed): ShapeShiftSettings {
  if (reply == null || typeof reply !== 'object' || typeof reply.access_token !== 'string' || typeof reply.refresh_token !== 'string') {
    throw new TypeError(`Invalid ShapeShift reply: ${JSON.stringify(reply)}`)
  }

  return {
    accessToken: reply.access_token,
    refreshToken: reply.refresh_token
  }
}

function parseAscii (text: string): Uint8Array {
  const data = new Uint8Array(text.length)
  for (let i = 0; i < text.length; ++i) data[i] = text.charCodeAt(i)
  return data
}
