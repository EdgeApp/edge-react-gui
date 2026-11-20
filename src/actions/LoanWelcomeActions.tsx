import type { Disklet } from 'disklet'

import { AAVE_WELCOME } from '../constants/constantSettings'

export const isShowLoanWelcomeModal = async (
  disklet: Disklet
): Promise<true | undefined> => {
  try {
    await disklet.getText(AAVE_WELCOME)
  } catch (error: any) {
    await disklet.setText(AAVE_WELCOME, '')
    return true
  }
}
