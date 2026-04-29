import type { EdgeCurrencyWallet } from 'edge-core-js'

import { showToast } from '../../../../components/services/AirshipInstance'
import type { RampQuoteRequest } from '../../rampPluginTypes'
import type {
  InfiniteApi,
  InfiniteOfframpTransferRequest,
  InfiniteOnrampTransferRequest,
  InfiniteQuoteResponse,
  InfiniteTransferResponse
} from '../infiniteApiTypes'
import type { NavigationFlow } from '../utils/navigationFlow'

export interface Params {
  infiniteApi: InfiniteApi
  navigationFlow: NavigationFlow
}

export interface ConfirmationParams {
  request: RampQuoteRequest
  source: {
    amount: string
    currencyCode: string
  }
  target: {
    amount: string
    currencyCode: string
  }
  // New parameters for transfer creation
  freshQuote: InfiniteQuoteResponse
  coreWallet: EdgeCurrencyWallet
  /** Required for OFFRAMP; unused for ONRAMP push-payment flow. */
  bankAccountId?: string
  infiniteNetwork: string
  cleanFiatCode: string
}

export interface ConfirmationResult {
  confirmed: boolean
  transfer?: InfiniteTransferResponse
}

export const confirmationWorkflow = async (
  params: Params,
  confirmationParams: ConfirmationParams
): Promise<ConfirmationResult> => {
  const { navigationFlow, infiniteApi } = params
  const {
    source,
    target,
    request,
    freshQuote,
    coreWallet,
    bankAccountId,
    infiniteNetwork,
    cleanFiatCode
  } = confirmationParams

  return await new Promise<ConfirmationResult>(resolve => {
    navigationFlow.navigate('rampConfirmation', {
      source,
      target,
      direction: request.direction,
      onConfirm: async () => {
        // Create the transfer here - let errors bubble up
        if (request.direction === 'buy') {
          // ONRAMP is push-payment: Infinite provisions a virtual bank account
          // and returns the deposit instructions in the create response. The
          // user's own bank account is not part of the request.
          const [receiveAddress] = await coreWallet.getAddresses({
            tokenId: request.tokenId
          })

          const transferParams: InfiniteOnrampTransferRequest = {
            type: 'ONRAMP',
            amount: freshQuote.source.amount,
            source: {
              currency: cleanFiatCode.toUpperCase(),
              network: 'ACH'
            },
            destination: {
              currency: request.displayCurrencyCode.toUpperCase(),
              network: infiniteNetwork,
              toAddress: receiveAddress.publicAddress
            },
            clientReferenceId: `edge_${Date.now()}`
          }

          const transfer = await infiniteApi.createTransfer(transferParams)

          const instructions = transfer.sourceDepositInstructions
          if (instructions?.bankName == null || instructions.amount == null) {
            throw new Error(
              `Transfer ${
                transfer.id ?? transfer.depositAddressId ?? ''
              } created but deposit instructions are missing`
            )
          }

          navigationFlow.navigate('rampBankRoutingDetails', {
            bank: {
              name: instructions.bankName,
              accountNumber: instructions.bankAccountNumber ?? '',
              routingNumber: instructions.bankRoutingNumber ?? ''
            },
            fiatCurrencyCode: cleanFiatCode,
            fiatAmount: instructions.amount.toString(),
            onDone: () => {
              navigationFlow.popToTop()
            }
          })

          resolve({ confirmed: true, transfer })
        } else {
          // TODO: This whole else block is a WIP implementation!

          if (bankAccountId == null) {
            throw new Error(
              'Infinite OFFRAMP requires a destination bank account id'
            )
          }

          // For sell (offramp), destination is bank account
          const [receiveAddress] = await coreWallet.getAddresses({
            tokenId: request.tokenId
          })

          const transferParams: InfiniteOfframpTransferRequest = {
            type: 'OFFRAMP',
            amount: freshQuote.source.amount,
            source: {
              currency: request.displayCurrencyCode.toUpperCase(),
              network: infiniteNetwork,
              fromAddress: receiveAddress.publicAddress
            },
            destination: {
              currency: cleanFiatCode.toUpperCase(),
              network: 'ach', // Default to ACH for bank transfers
              accountId: bankAccountId
            },
            clientReferenceId: `edge_${Date.now()}`
          }

          const transfer = await infiniteApi.createTransfer(transferParams)

          // Show deposit instructions
          if (transfer.sourceDepositInstructions?.toAddress != null) {
            // TODO: Show deposit address to user
            showToast(
              `Send ${request.displayCurrencyCode} to: ${transfer.sourceDepositInstructions.toAddress}`
            )
          }

          resolve({ confirmed: true, transfer })
        }
      },
      onCancel: () => {
        resolve({ confirmed: false })
      }
    })
  })
}
