import type { EdgeCurrencyWallet } from 'edge-core-js'

import { showToast } from '../../../../components/services/AirshipInstance'
import type {
  InfiniteQuoteFlow,
  InfiniteQuoteResponse,
  InfiniteTransferResponse
} from '../infiniteApiTypes'
import type { InfiniteWorkflowUtils } from '../infiniteRampTypes'

export interface ConfirmationParams {
  fiatCurrencyCode: string
  fiatAmount: string
  cryptoCurrencyCode: string
  cryptoAmount: string
  direction: 'buy' | 'sell'
  // New parameters for transfer creation
  freshQuote: InfiniteQuoteResponse
  coreWallet: EdgeCurrencyWallet
  tokenId?: string
  bankAccountId: string
  flow: InfiniteQuoteFlow
  infiniteNetwork: string
  displayCurrencyCode: string
  cleanFiatCode: string
}

export interface ConfirmationResult {
  confirmed: boolean
  transfer?: InfiniteTransferResponse
}

export const confirmationWorkflow = async (
  utils: InfiniteWorkflowUtils,
  params: ConfirmationParams
): Promise<ConfirmationResult> => {
  const { navigation, workflowState, infiniteApi } = utils
  const {
    fiatCurrencyCode,
    fiatAmount,
    cryptoCurrencyCode,
    cryptoAmount,
    direction,
    freshQuote,
    coreWallet,
    tokenId,
    bankAccountId,
    flow,
    infiniteNetwork,
    displayCurrencyCode,
    cleanFiatCode
  } = params

  // Determine if we should replace based on workflow states
  // Replace if KYC scene was shown but bank form wasn't
  // (i.e., when we had existing bank accounts)
  const shouldReplace =
    workflowState.kyc.sceneShown === true &&
    workflowState.bankAccount.sceneShown === false

  return await new Promise<ConfirmationResult>(resolve => {
    const navigationParams = {
      fiatCurrencyCode,
      fiatAmount,
      cryptoCurrencyCode,
      cryptoAmount,
      direction,
      onConfirm: async () => {
        // Create the transfer here - let errors bubble up
        if (direction === 'buy') {
          // For buy (onramp), source is bank account
          const receiveAddress = await coreWallet.getReceiveAddress({
            tokenId: tokenId ?? null
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
              currency: displayCurrencyCode.toLowerCase(),
              network: infiniteNetwork,
              toAddress: receiveAddress.publicAddress
            },
            clientReferenceId: `edge_${Date.now()}`
          }

          const transfer = await infiniteApi.createTransfer(transferParams)

          // Show deposit instructions for bank transfer with replace
          const instructions = transfer.sourceDepositInstructions
          if (instructions?.bankName != null && instructions.amount != null) {
            navigation.replace('rampBankRoutingDetails', {
              bank: {
                name: instructions.bankName,
                accountNumber: instructions.bankAccountNumber || '',
                routingNumber: instructions.bankRoutingNumber || ''
              },
              fiatCurrencyCode: cleanFiatCode,
              fiatAmount: instructions.amount.toString()
            })
          }

          resolve({ confirmed: true, transfer })
        } else {
          // For sell (offramp), destination is bank account
          const receiveAddress = await coreWallet.getReceiveAddress({
            tokenId: tokenId ?? null
          })

          const transferParams = {
            type: flow,
            amount: freshQuote.source.amount,
            source: {
              currency: displayCurrencyCode.toLowerCase(),
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
              `Send ${displayCurrencyCode} to: ${transfer.sourceDepositInstructions.toAddress}`
            )
          }

          resolve({ confirmed: true, transfer })
        }
      },
      onCancel: () => {
        resolve({ confirmed: false })
      }
    }

    if (shouldReplace) {
      navigation.replace('rampConfirmation', navigationParams)
    } else {
      navigation.navigate('rampConfirmation', navigationParams)
    }
  })
}
