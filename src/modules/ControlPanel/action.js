export const OPEN_SELECT_USER = 'OPEN_SELECT_USER'
export const CLOSE_SELECT_USER = 'CLOSE_SELECT_USER'

export const openSelectUser = () => {
  return {
    type: OPEN_SELECT_USER
  }
}

export const closeSelectUser = () => {
  return {
    type: CLOSE_SELECT_USER
  }
}
