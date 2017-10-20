// @flow
// import * as actions from './indexActions'

export const loginWithEdge = (url: string) => (dispatch: any, getState: any) => {
  const state = getState()
  console.log(url)
  console.log(state)
}
