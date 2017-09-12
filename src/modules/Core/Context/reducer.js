import * as ACTION from './action.js'

const initialState = {
  context: {},
  usernames: []
}
export const context = (state = initialState, action) => {
  const {type, data = {} } = action

  switch (type) {
  case ACTION.ADD_CONTEXT: {
    const {context}  = data
    return {
      ...state,
      context
    }
  }

  case ACTION.ADD_USERNAMES: {
    const {usernames} = data
    return {
      ...state,
      usernames
    }
  }

  case 'LOGOUT': {
    const {username} = data
    return {
      ...state,
      nextUsername: username
    }
  }

  default:
    return state
  }
}
