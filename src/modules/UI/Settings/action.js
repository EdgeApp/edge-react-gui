export const UPDATE_SETTINGS = 'UPDATE_SETTINGS'

export const updateSettings = settings => {
  return {
    TYPE: UPDATE_SETTINGS,
    data: { settings }
  }
}
