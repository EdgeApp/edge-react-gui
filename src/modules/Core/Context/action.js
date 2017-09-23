const PREFIX = 'Core/Context/'

export const ADD_CONTEXT = PREFIX + 'ADD_CONTEXT'
export const addContext = (context) => ({
  type: ADD_CONTEXT,
  data: {context}
})

export const ADD_USERNAMES = PREFIX + 'ADD_USERNAMES'
export const addUsernames = (usernames) => ({
  type: ADD_USERNAMES,
  data: {usernames}
})
