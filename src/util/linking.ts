import {
  addEventListener,
  getInitialURL as expoGetInitialURL,
  openSettings as expoOpenSettings
} from 'expo-linking'

/**
 * Incoming URLs and OS app-settings via expo-linking (web-ready).
 * Outbound http(s) still goes through expo-web-browser in WebUtils.
 */

export const getInitialURL = async (): Promise<string | null> => {
  return await expoGetInitialURL()
}

export const addUrlListener = (
  handler: (url: string) => void
): (() => void) => {
  const subscription = addEventListener('url', event => {
    handler(event.url)
  })
  return () => {
    subscription.remove()
  }
}

export const openAppSettings = async (): Promise<void> => {
  try {
    await expoOpenSettings()
  } catch {
    // Web has no OS app-settings pane.
  }
}
