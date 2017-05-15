export const DISABLE_LOADING_SCREEN_VISIBILITY = 'DISABLE_LOADING_SCREEN_VISIBILITY'
export const ENABLE_LOADING_SCREEN_VISIBILITY = 'ENABLE_LOADING_SCREEN_VISIBILITY'

export function disableLoadingScreenVisibility () {
  return {
    type: DISABLE_LOADING_SCREEN_VISIBILITY
  }
}

export function enableLoadingScreenVisibility() {
    return {
        type: ENABLE_LOADING_SCREEN_VISIBILITY
    }
}