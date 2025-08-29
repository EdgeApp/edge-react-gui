import { Exit } from '../../utils/workflows'
import type { InfiniteBankAccountRequest } from '../infiniteApiTypes'
import type { InfiniteWorkflow } from '../infiniteRampTypes'

export const bankAccountWorkflow: InfiniteWorkflow = async utils => {
  const { infiniteApi, navigation, state, workflowState } = utils

  // Mark workflow as started
  workflowState.bankAccount.status = 'started'

  // Get existing bank accounts
  const bankAccounts = await infiniteApi.getBankAccounts()

  if (bankAccounts.length > 0) {
    // Use the first bank account
    const bankAccountId = bankAccounts[0].id
    state.bankAccountId = bankAccountId
    // Mark that we didn't show the bank form scene
    workflowState.bankAccount.sceneShown = false
    workflowState.bankAccount.status = 'completed'
    return
  }

  // Need to add a bank account
  workflowState.bankAccount.sceneShown = true

  await new Promise<void>((resolve, reject) => {
    // Only replace if KYC scene was shown
    const navigate =
      workflowState.kyc.sceneShown === true
        ? navigation.replace
        : navigation.navigate
    navigate('rampBankForm', {
      onSubmit: async (formData: InfiniteBankAccountRequest) => {
        try {
          const bankAccount = await infiniteApi.addBankAccount(formData)
          state.bankAccountId = bankAccount.id
          resolve()
        } catch (error: any) {
          reject(error)
        }
      },
      onCancel: () => {
        workflowState.bankAccount.status = 'cancelled'
        reject(new Exit('User cancelled bank account form'))
      }
    })
  })

  // Bank account workflow completed successfully
  workflowState.bankAccount.status = 'completed'
}
