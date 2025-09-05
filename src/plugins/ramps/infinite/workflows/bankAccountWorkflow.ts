import { Exit } from '../../utils/workflows'
import type { InfiniteBankAccountRequest } from '../infiniteApiTypes'
import type { InfiniteWorkflow } from '../infiniteRampTypes'

export const bankAccountWorkflow: InfiniteWorkflow = async utils => {
  const { infiniteApi, navigation, state, workflowState } = utils

  // Mark workflow as started
  workflowState.bankAccount.status = 'started'

  // Get existing bank accounts using customer ID
  if (state.customerId != null) {
    const customerAccounts = await infiniteApi.getCustomerAccounts(
      state.customerId
    )

    if (customerAccounts.accounts.length > 0) {
      // Use the first bank account
      const bankAccountId = customerAccounts.accounts[0].id
      state.bankAccountId = bankAccountId
      // Mark that we didn't show the bank form scene
      workflowState.bankAccount.sceneShown = false
      workflowState.bankAccount.status = 'completed'
      console.log(
        `[bankAccountWorkflow] Using existing bank account: ${bankAccountId}`
      )
      return
    }
  }

  // Need to add a bank account
  workflowState.bankAccount.sceneShown = true

  await new Promise<void>((resolve, reject) => {
    // Only replace if KYC scene was shown
    const navigate =
      workflowState.kyc.sceneShown === true
        ? navigation.replace.bind(navigation)
        : navigation.navigate.bind(navigation)
    navigate('rampBankForm', {
      onSubmit: async (formData: InfiniteBankAccountRequest) => {
        const bankAccount = await infiniteApi.addBankAccount(formData)
        state.bankAccountId = bankAccount.id
        resolve()
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
