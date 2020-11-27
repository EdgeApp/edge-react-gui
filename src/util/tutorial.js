// @flow
import type { Disklet } from 'disklet'

const TUTORIAL = 'tutorial.json'

type UserTutorialList = {
  [userId: string]: {
    walletListSlideTutorialCount: string
  }
}

export const getWalletListSlideTutorial = async (userId: string, disklet: Disklet): Promise<UserTutorialList> => {
  try {
    const userTutorialList = JSON.parse(await disklet.getText(TUTORIAL))
    if (!userTutorialList[userId]) {
      userTutorialList[userId] = { walletListSlideTutorialCount: '0' }
    }
    return userTutorialList
  } catch (error) {
    console.log(error)
    return { [userId]: { walletListSlideTutorialCount: '0' } }
  }
}

export const setUserTutorialList = async (data: UserTutorialList, disklet: Disklet): Promise<void> => {
  await disklet.setText(TUTORIAL, JSON.stringify(data))
}
