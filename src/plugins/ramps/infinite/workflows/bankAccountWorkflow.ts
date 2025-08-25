import { Exit } from '../../utils/workflows'
import type { InfiniteBankAccountRequest } from '../infiniteApiTypes'
import type { InfiniteWorkflow } from '../infiniteRampTypes'

export const bankAccountWorkflow: InfiniteWorkflow = async utils => {
  const { infiniteApi, navigation, state } = utils

  // Get existing bank accounts
  const bankAccounts = await infiniteApi.getBankAccounts()

  if (bankAccounts.length > 0) {
    // Use the first bank account
    const bankAccountId = bankAccounts[0].id
    state.bankAccountId = bankAccountId
    return
  }

  // Need to add a bank account
  await new Promise<void>((resolve, reject) => {
    navigation.navigate('rampBankForm', {
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
        reject(new Exit('User cancelled bank account form'))
      }
    })
  })
}
