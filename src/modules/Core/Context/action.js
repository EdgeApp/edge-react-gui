export const ADD_CONTEXT = 'ADD_CONTEXT'
export const addContext = context => {
  return {
    type: ADD_CONTEXT,
    data: { context }
  }
}
