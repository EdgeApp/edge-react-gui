import * as ACTION from './CachedUsers.action'

const userList = [
  { id: '1', name: 'foofoo' },
  { id: '2', name: 'foofoo1' },
  { id: '3', name: 'foofoo2' },
  { id: '4', name: 'foofoo3' }
]

export const users = (state = userList, action) => {
  return state
}

export const selectedUserToLogin = (state = null, action) => {
  switch (action.type) {
    case ACTION.SELECT_USER_LOGIN :
      return action.id

    default:
      return state
  }
}

export const listView = (state = false, action) => {
  switch (action.type) {
    case ACTION.OPEN_USER_LIST :
      return true

    case ACTION.CLOSE_USER_LIST :
      return false

    default:
      return state
  }
}
