import { asArray, asMaybe, asObject, asString, asValue, Cleaner } from 'cleaners'

export interface KilnApi {
  getStakes: (address: string) => Promise<StakeStatus>
  getOperations: (address: string) => Promise<ExitOperation[]>
}

export type StakeStatus = ReturnType<typeof asStakesResponse>

export const makeKilnApi = (baseUrl: string, apiKey: string): KilnApi => {
  const fetchGet = async (baseUrl: string, path: string, apiKey: string): Promise<unknown> => {
    const headers = { 'Content-Type': 'application/json', authorization: `Bearer ${apiKey}` }
    const res = await fetch(baseUrl + path, { headers })
    if (!res.ok) {
      const message = await res.text()
      throw new Error(`Kiln fetch error: ${message}`)
    }
    const json = await res.json()
    return json
  }

  return {
    // https://docs.api.kiln.fi/reference/getethonchainv2stakes
    getStakes: async (address: string): Promise<StakeStatus> => {
      const raw = await fetchGet(baseUrl, `/v1/eth/onchain/v2/stakes?wallets=${address}`, apiKey)
      const clean = asBaseRes(asStakesResponse)(raw)
      return clean.data
    },
    // https://docs.api.kiln.fi/reference/getethonchainv2operations
    getOperations: async (address: string): Promise<ExitOperation[]> => {
      const raw = await fetchGet(baseUrl, `/v1/eth/onchain/v2/operations?wallets=${address}`, apiKey)
      const clean = asBaseRes(asOperations)(raw)
      const filteredOps = clean.data.filter((op): op is ExitOperation => op != null)
      return filteredOps
    }
  }
}

//
// Cleaners
//

const asBaseRes = <T>(func: Cleaner<T>) =>
  asObject({
    data: func
  })

const asStakesResponse = asArray(
  asObject({
    // owner: asString,
    // integration: asString,
    integration_address: asString,
    balance: asString,
    rewards: asString
    // delegated_block: asNumber,
    // delegated_at: asString,
    // updated_at: asString,
    // nrr: asNumber,
    // grr: asNumber,
    // one_year: asObject({
    //   nrr: asNumber,
    //   grr: asNumber
    // }),
    // six_month: asObject({
    //   nrr: asNumber,
    //   grr: asNumber
    // }),
    // three_month: asObject({
    //   nrr: asNumber,
    //   grr: asNumber
    // }),
    // one_month: asObject({
    //   nrr: asNumber,
    //   grr: asNumber
    // }),
    // one_week: asObject({
    //   nrr: asNumber,
    //   grr: asNumber
    // }),
    // structure: asArray(
    //   asObject({
    //     pool: asString,
    //     pool_address: asString,
    //     share: asNumber
    //   })
    // )
  })
)

const asExitType = asValue('exit')
const asExitTicketStatus = asValue('fulfillable', 'unfulfillable')
const asExitOperation = asObject({
  type: asExitType,
  ticket_id: asString,
  ticket_status: asExitTicketStatus,
  size: asString,
  // size_shares: asString,
  // claimable: asString,
  // claimable_shares: asString,
  cask_ids: asArray(asString),
  // id: asString,
  // owner: asString,
  time: asString
  // block: asNumber,
  // tx_hash: asString
})

type ExitOperation = ReturnType<typeof asExitOperation>
const asOperations = asArray(asMaybe(asExitOperation))
