import { asMaybe } from 'cleaners'
import { EdgeAccount } from 'edge-core-js'

import {
  asErrorResponse,
  asLoginPayload,
  LoginPayload,
  LoginUpdatePayload,
  PushRequestBody,
  wasLoginUpdatePayload,
  wasPushRequestBody
} from '../../controllers/action-queue/types/pushApiTypes'
import { ENV } from '../../env'
import { base58 } from '../encoding'

const { ACTION_QUEUE, AIRBITZ_API_KEY } = ENV
const { pushServerUri } = ACTION_QUEUE

export interface PushClient {
  getPushEvents: () => Promise<LoginPayload>
  getPushRequestBody: (payload?: LoginUpdatePayload) => PushRequestBody
  uploadPushEvents: (payload: LoginUpdatePayload) => Promise<void>
}

export const makePushClient = (account: EdgeAccount, clientId: string): PushClient => {
  const instance: PushClient = {
    async getPushEvents(): Promise<LoginPayload> {
      const requestBody = this.getPushRequestBody()

      const response = await fetch(`${pushServerUri}/v2/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: wasPushRequestBody(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`)
      }

      const data = await response.json()
      const loginPayload = asLoginPayload(data)

      return loginPayload
    },

    getPushRequestBody(payload?: LoginUpdatePayload): PushRequestBody {
      const data = payload != null ? wasLoginUpdatePayload(payload) : undefined
      return {
        apiKey: AIRBITZ_API_KEY,
        deviceId: clientId,
        loginId: base58.parse(account.rootLoginId),
        data
      }
    },

    async uploadPushEvents(payload: LoginUpdatePayload): Promise<void> {
      const requestBody = instance.getPushRequestBody(payload)
      const response = await fetch(`${pushServerUri}/v2/login/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: wasPushRequestBody(requestBody)
      })

      if (!response.ok) {
        const responseBody = await response.text()
        const responseData = asMaybe(asErrorResponse)(responseBody)
        console.error(
          'Failed push-server request:',
          JSON.stringify(
            {
              requestBodyData: requestBody.data,
              responseBody,
              responseData,
              responseStatus: response.status
            },
            null,
            2
          )
        )
        throw new Error(`Request failed with ${response.status}`)
      }
    }
  }
  return instance
}
