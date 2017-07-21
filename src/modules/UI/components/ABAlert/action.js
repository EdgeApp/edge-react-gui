export const OPEN_AB_ALERT = 'OPEN_AB_ALERT'
export const CLOSE_AB_ALERT = 'CLOSE_AB_ALERT'

export const openABAlert = syntax => {
  return {
    type: OPEN_AB_ALERT,
    data: { syntax }
  }
}

export const closeABAlert = () => {
  return {
    type: CLOSE_AB_ALERT
  }
}
