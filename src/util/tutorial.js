// @flow
import type { Disklet } from 'disklet'

import { TUTORIAL } from '../constants/constantSettings.js'

type UserTutorialList = {
  walletListSlideTutorialCount: number
}

export const getWalletListSlideTutorial = async (disklet: Disklet): Promise<UserTutorialList> => {
  try {
    const userTutorialList = JSON.parse(await disklet.getText(TUTORIAL))
    return userTutorialList
  } catch (error) {
    console.log(error)
    return { walletListSlideTutorialCount: 0 }
  }
}

export const setUserTutorialList = async (data: UserTutorialList, disklet: Disklet): Promise<void> => {
  await disklet.setText(TUTORIAL, JSON.stringify(data))
}
