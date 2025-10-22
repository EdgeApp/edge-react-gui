import type { EdgeCurrencyWallet } from 'edge-core-js'

import { showToast } from '../../../../components/services/AirshipInstance'
import type { RampQuoteRequest } from '../../rampPluginTypes'
import type {
  InfiniteApi,
  InfiniteQuoteFlow,
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
  bankAccountId: string
  flow: InfiniteQuoteFlow
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
    flow,
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
          // For buy (onramp), source is bank account
          const [receiveAddress] = await coreWallet.getAddresses({
            tokenId: request.tokenId
          })

          const transferParams = {
            type: flow,
            amount: freshQuote.source.amount,
            source: {
              currency: cleanFiatCode.toLowerCase(),
              network: 'wire', // Default to wire for bank transfers
              accountId: bankAccountId
            },
            destination: {
              currency: request.displayCurrencyCode.toLowerCase(),
              network: infiniteNetwork,
              toAddress: receiveAddress.publicAddress
            },
            clientReferenceId: `edge_${Date.now()}`
          }

          const transfer = await infiniteApi.createTransfer(transferParams)

          // Show deposit instructions for bank transfer with replace
          const instructions = transfer.sourceDepositInstructions
          if (instructions?.bankName != null && instructions.amount != null) {
            navigationFlow.navigate('rampBankRoutingDetails', {
              bank: {
                name: instructions.bankName,
                accountNumber: instructions.bankAccountNumber ?? '',
                routingNumber: instructions.bankRoutingNumber ?? ''
              },
              fiatCurrencyCode: cleanFiatCode,
              fiatAmount: instructions.amount.toString(),
              onDone: () => {
                navigationFlow.goBack()
              }
            })
          }

          resolve({ confirmed: true, transfer })
        } else {
          // TODO: This whole else block is a WIP implementation!

          // For sell (offramp), destination is bank account
          const [receiveAddress] = await coreWallet.getAddresses({
            tokenId: request.tokenId
          })

          const transferParams = {
            type: flow,
            amount: freshQuote.source.amount,
            source: {
              currency: request.displayCurrencyCode.toLowerCase(),
              network: infiniteNetwork,
              fromAddress: receiveAddress.publicAddress
            },
            destination: {
              currency: cleanFiatCode.toLowerCase(),
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
