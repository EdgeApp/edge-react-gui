import type { InfiniteWorkflowUtils } from '../infiniteRampTypes'

export interface ConfirmationParams {
  fiatCurrencyCode: string
  fiatAmount: string
  cryptoCurrencyCode: string
  cryptoAmount: string
  direction: 'buy' | 'sell'
}

export const confirmationWorkflow = async (
  utils: InfiniteWorkflowUtils,
  params: ConfirmationParams
): Promise<boolean> => {
  const { navigation, workflowState } = utils
  const {
    fiatCurrencyCode,
    fiatAmount,
    cryptoCurrencyCode,
    cryptoAmount,
    direction
  } = params

  // Determine if we should replace based on workflow states
  // Replace if KYC scene was shown but bank form wasn't
  // (i.e., when we had existing bank accounts)
  const shouldReplace =
    workflowState.kyc.sceneShown === true &&
    workflowState.bankAccount.sceneShown === false

  return await new Promise<boolean>(resolve => {
    const navigate = shouldReplace ? navigation.replace : navigation.navigate
    navigate('rampConfirmation', {
      fiatCurrencyCode,
      fiatAmount,
      cryptoCurrencyCode,
      cryptoAmount,
      direction,
      onConfirm: () => {
        resolve(true)
      },
      onCancel: () => {
        resolve(false)
      }
    })
  })
}
