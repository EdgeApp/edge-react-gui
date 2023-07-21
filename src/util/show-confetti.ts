import { Disklet } from 'disklet'

const CONFETTI_SHOWN = 'confetti_shown.json'

export interface ConfettiShownTimes {
  doneAmount: number
  showNext: boolean
  randomShown: boolean
}

const getConfettiShownTimes = async (disklet: Disklet): Promise<{ [key: string]: ConfettiShownTimes }> => {
  try {
    const shownTimes = JSON.parse(await disklet.getText(CONFETTI_SHOWN))
    return shownTimes
  } catch (error: any) {
    console.log(error)
    return {}
  }
}
const setConfettiShownTimes = async (data: { [key: string]: ConfettiShownTimes }, disklet: Disklet): Promise<void> => {
  try {
    await disklet.setText(CONFETTI_SHOWN, JSON.stringify(data))
  } catch (error: any) {
    console.log(error)
  }
}

const calculateNewShownData = (userData: ConfettiShownTimes): ConfettiShownTimes => {
  const ATTEMPTS = 8
  const BEFORE_RANDOM_ATTEMPTS = 12
  userData.showNext = false
  if (userData.doneAmount < BEFORE_RANDOM_ATTEMPTS) {
    if (userData.doneAmount === 1) userData.showNext = true
    if (userData.doneAmount === 5) userData.showNext = true
    if (userData.doneAmount === 11) userData.showNext = true
  } else {
    const attempt = (userData.doneAmount - BEFORE_RANDOM_ATTEMPTS) % ATTEMPTS
    if (attempt === 0) {
      userData.randomShown = false
    }
    if (!userData.randomShown) {
      const targets = new Array(ATTEMPTS - attempt).fill(0)
      targets[0] = 1
      if (targets[Math.floor(Math.random() * (ATTEMPTS - attempt)) - 1]) {
        userData.randomShown = true
        userData.showNext = true
      }
    }
  }
  return userData
}

export const needToShowConfetti = async (userId: string, disklet: Disklet): Promise<boolean> => {
  const data: { [key: string]: ConfettiShownTimes } = await getConfettiShownTimes(disklet)
  const userData: ConfettiShownTimes = data[userId] || { doneAmount: 0, showNext: true, randomShown: false }

  const needToShow = userData.showNext
  userData.doneAmount++
  data[userId] = calculateNewShownData(userData)
  await setConfettiShownTimes(data, disklet)
  return needToShow
}
