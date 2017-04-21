export const ADD_AIRBITZ_TO_REDUX = 'ADD_AIRBITZ_TO_REDUX'
export const ADD_ACCOUNT_TO_REDUX = 'ADD_ACCOUNT_TO_REDUX'

export function addAirbitzToRedux (airbitz) {
  console.log('addAirbitzToRedux')
  
  return {
    type: ADD_AIRBITZ_TO_REDUX,
    airbitz
  }
}

export function addAccountToRedux (account) {
  console.log('addAccountToRedux')

  return {
    type: ADD_ACCOUNT_TO_REDUX,
    account
  }
}
