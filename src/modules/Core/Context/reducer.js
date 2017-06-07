import * as ACTION from './action.js'

export const context = (state = {}, action) => {
  const { type, data = {} } = action
  const { context } = data

  switch (type) {
    case ACTION.ADD_CONTEXT:
      console.log('context', context)
      return context
    default:
      return state
  }
}
