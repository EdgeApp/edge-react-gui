import * as ACTION from './action.js'

const initialState = {
  context: {},
  usernames: []
}
export const context = (state = initialState, action) => {
  const { type, data = {} } = action

  switch (type) {
    case ACTION.ADD_CONTEXT: {
      const context = data.context
      return {
        ...state,
        context
      }
    }

    case ACTION.ADD_USERNAMES: {
      const usernames = data.usernames
      return {
        ...state,
        usernames
      }
    }
    default:
      return state
  }
}
