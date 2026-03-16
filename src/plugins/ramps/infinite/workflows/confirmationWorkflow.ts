import type { EdgeCurrencyWallet } from 'edge-core-js'

import { showToast } from '../../../../components/services/AirshipInstance'
import type { RampQuoteRequest } from '../../rampPluginTypes'
import type {
  InfiniteApi,
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
      onConfirm: async (): Promise<void> => {
        if (request.direction === 'buy') {
          const [receiveAddress] = await coreWallet.getAddresses({
            tokenId: request.tokenId
          })

          const transferParams = {
            type: 'ONRAMP' as const,
            amount: freshQuote.source.amount,
            source: {
              currency: cleanFiatCode.toLowerCase()
            },
            destination: {
              currency: request.displayCurrencyCode.toLowerCase(),
              network: infiniteNetwork,
              toAddress: receiveAddress.publicAddress
            },
            clientReferenceId: `edge_${Date.now()}`
          }

          const transfer = await infiniteApi.createTransfer(transferParams)

          const instructions = transfer.sourceDepositInstructions
          if (instructions?.bankName == null || instructions.amount == null) {
            throw new Error(
              `Transfer ${transfer.id} created but deposit instructions are missing`
            )
          }

          navigationFlow.navigate('rampBankRoutingDetails', {
            bank: {
              name: instructions.bankName,
              beneficiaryName: instructions.bankBeneficiaryName ?? '',
              address: instructions.bankAddress ?? undefined,
              addressLine: instructions.bankAddressLine ?? undefined,
              accountNumber: instructions.bankAccountNumber ?? '',
              routingNumber: instructions.bankRoutingNumber ?? '',
              depositMessage: instructions.depositMessage ?? ''
            },
            fiatCurrencyCode: cleanFiatCode,
            fiatAmount: instructions.amount.toString(),
            onDone: () => {
              navigationFlow.goBack()
            }
          })

          resolve({ confirmed: true, transfer })
          return
        }

        // TODO: This whole else block is a WIP implementation!

        const [receiveAddress] = await coreWallet.getAddresses({
          tokenId: request.tokenId
        })

        const transferParams = {
          type: 'OFFRAMP' as const,
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

        if (transfer.sourceDepositInstructions?.toAddress != null) {
          // TODO: Show deposit address to user
          showToast(
            `Send ${request.displayCurrencyCode} to: ${transfer.sourceDepositInstructions.toAddress}`
          )
        }

        resolve({ confirmed: true, transfer })
      },
      onCancel: () => {
        resolve({ confirmed: false })
      }
    })
  })
}
