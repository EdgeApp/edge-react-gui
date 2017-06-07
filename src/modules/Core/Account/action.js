export const ADD_ACCOUNT = 'ADD_ACCOUNT'
export const addAccount = account => {
  return {
    type: ADD_ACCOUNT,
    data: { account }
  }
}
