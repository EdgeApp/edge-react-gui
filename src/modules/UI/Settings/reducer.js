import * as ACTION from './action.js'

export default settings = (state = {}, action) => {
  const { type, data = {} } = action
  const { settings } = data

  switch (type) {
    case ACTION.UPDATE_SETTINGS:
      return settings
    default:
      return state
  }
}
