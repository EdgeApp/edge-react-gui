import {
  addEventListener,
  canOpenURL as expoCanOpenURL,
  getInitialURL as expoGetInitialURL,
  openSettings as expoOpenSettings,
  openURL as expoOpenURL
} from 'expo-linking'

/**
 * Incoming URLs, outbound system URLs, and OS app-settings via expo-linking
 * (web-ready). In-app https still goes through expo-web-browser in WebUtils.
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

export const openURL = async (url: string): Promise<void> => {
  await expoOpenURL(url)
}

export const canOpenURL = async (url: string): Promise<boolean> => {
  return await expoCanOpenURL(url)
}
