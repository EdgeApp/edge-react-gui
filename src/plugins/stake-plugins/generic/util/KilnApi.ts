import { asArray, asJSON, asMaybe, asObject, asString, asValue, Cleaner } from 'cleaners'

export class KilnError extends Error {
  name: string
  message: string
  error: string

  constructor(message: string, error: string) {
    super(message)
    this.name = 'KilnError'
    this.message = message
    this.error = error
  }
}

export interface KilnApi {
  adaGetStakes: (params: {
    stakeAddresses?: string[]
    walletAddresses?: string[]
    poolIds?: string[]
    accountIds?: string[]
    currentPage?: number
    pageSize?: number
  }) => Promise<AdaStake[]>
  adaStakeTransaction: (walletAddress: string, poolId: string, accountId: string) => Promise<AdaStakeTransaction>
  adaUnstakeTransaction: (walletAddress: string) => Promise<AdaUnstakeTransaction>
  adaWithdrawRewards: (walletAddress: string, amountLovelace?: string) => Promise<AdaStakeTransaction>
  ethGetOnChainStakes: (address: string) => Promise<EthOnChainStake[]>
  ethGetOnChainOperations: (address: string) => Promise<ExitOperation[]>
}

export const makeKilnApi = (baseUrl: string, apiKey: string): KilnApi => {
  const fetchKiln = async (path: string, init?: RequestInit): Promise<unknown> => {
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      accept: 'application/json; charset=utf-8',
      authorization: `Bearer ${apiKey}`
    }
    const url = baseUrl + path
    const opts = { ...init, headers: { ...headers, ...init?.headers } }
    const res = await fetch(url, opts)
    if (!res.ok) {
      const message = await res.text()
      const errorResponse = asMaybe(asKilnErrorResponse)(message)
      if (errorResponse != null) throw new KilnError(errorResponse.message, errorResponse.error)
      throw new Error(`Kiln fetch error: ${message}`)
    }
    const json = await res.json()
    return json
  }

  const instance: KilnApi = {
    // https://docs.api.kiln.fi/reference/getadastakes
    async adaGetStakes({ stakeAddresses, walletAddresses, poolIds, accountIds, currentPage, pageSize }) {
      if (walletAddresses == null && stakeAddresses == null) {
        throw new Error('Must provide at least one stake address or wallet address')
      }
      const query = new URLSearchParams()
      if (accountIds != null) {
        query.set('account_ids', accountIds.join(','))
      }
      if (currentPage != null) {
        query.set('currentPage', currentPage.toString())
      }
      if (pageSize != null) {
        query.set('page_size', pageSize.toString())
      }
      if (poolIds != null) {
        query.set('pool_ids', poolIds.join(','))
      }
      if (stakeAddresses != null) {
        query.set('stake_addresses', stakeAddresses.join(','))
      }
      if (walletAddresses != null) {
        query.set('wallets', walletAddresses.join(','))
      }
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const raw = await fetchKiln(`/v1/ada/stakes?${query.toString()}`)
      const response = asKilnResponse(asArray(asAdaStake))(raw)
      return response.data
    },

    // https://docs.api.kiln.fi/reference/postadastaketx
    async adaStakeTransaction(walletAddress, poolId, accountId) {
      const raw = await fetchKiln('/v1/ada/transaction/stake', {
        method: 'POST',
        body: JSON.stringify({
          account_id: accountId,
          wallet: walletAddress,
          pool_id: poolId
        })
      })
      const response = asKilnResponse(asAdaStakeTransaction)(raw)
      return response.data
    },

    // https://docs.api.kiln.fi/reference/postadaunstaketx
    async adaUnstakeTransaction(walletAddress) {
      const raw = await fetchKiln('/v1/ada/transaction/unstake', {
        method: 'POST',
        body: JSON.stringify({
          wallet: walletAddress
        })
      })
      const response = asKilnResponse(asAdaUnstakeTransaction)(raw)
      return response.data
    },

    // https://docs.api.kiln.fi/reference/postadawithdrawrewardstx
    async adaWithdrawRewards(walletAddress, amountLovelace) {
      const raw = await fetchKiln('/v1/ada/transaction/withdraw-rewards', {
        method: 'POST',
        body: JSON.stringify({
          wallet: walletAddress,
          amountLovelace
        })
      })
      const response = asKilnResponse(asAdaUnstakeTransaction)(raw)
      return response.data
    },

    // https://docs.api.kiln.fi/reference/getethonchainv2stakes
    async ethGetOnChainStakes(address) {
      const raw = await fetchKiln(`/v1/eth/onchain/v2/stakes?wallets=${address}`)
      const response = asKilnResponse(asArray(asEthOnChainStake))(raw)
      return response.data
    },
    // https://docs.api.kiln.fi/reference/getethonchainv2operations
    async ethGetOnChainOperations(address) {
      const raw = await fetchKiln(`/v1/eth/onchain/v2/operations?wallets=${address}`)
      const response = asKilnResponse(asArray(asMaybe(asExitOperation)))(raw)
      const filteredOps = response.data.filter((op): op is ExitOperation => op != null)
      return filteredOps
    }
  }

  return instance
}

// -----------------------------------------------------------------------------
// Cleaners
// -----------------------------------------------------------------------------

export interface KilnResponse<T> {
  data: T
}

const asKilnResponse = <T>(asT: Cleaner<T>) =>
  asObject({
    data: asT
  })

export interface KilnErrorResponse {
  error: string
  message: string
}
const asKilnErrorResponse = asJSON(
  asObject<KilnErrorResponse>({
    error: asString,
    message: asString
  })
)

//
// Ada
//

export type AdaStake = ReturnType<typeof asAdaStake>
const asAdaStake = asObject({
  // wallet_addresses: asArray(asString),
  stake_address: asString,
  pool_id: asString,
  balance: asString,
  rewards: asString,
  // available_rewards: asString,
  // delegated_epoch: asNumber,
  // delegated_at: asString,
  // activated_epoch: asNumber,
  // activated_at: asString,
  state: asString
  // net_apy: asNumber,
  // updated_at: asString
})

export type AdaStakeTransaction = ReturnType<typeof asAdaStakeTransaction>
const asAdaStakeTransaction = asObject({
  // unsigned_tx_hash: asString,
  unsigned_tx_serialized: asString
  // inputs: asArray(asObject({
  //   transaction_id: asString,
  //   index: asNumber
  // })),
})

export type AdaUnstakeTransaction = ReturnType<typeof asAdaStakeTransaction>
const asAdaUnstakeTransaction = asObject({
  // unsigned_tx_hash: asString,
  unsigned_tx_serialized: asString
  // inputs: asArray(asObject({
  //   transaction_id: asString,
  //   index: asNumber
  // })),
})

//
// Eth On-Chain
//

export type EthOnChainStake = ReturnType<typeof asEthOnChainStake>
const asEthOnChainStake = asObject({
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

const asExitType = asValue('exit')
const asExitTicketStatus = asValue('fulfillable', 'unfulfillable')

export type ExitOperation = ReturnType<typeof asExitOperation>
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
