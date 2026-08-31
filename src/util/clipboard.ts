import { getStringAsync, setStringAsync } from 'expo-clipboard'

/**
 * Clipboard helpers via expo-clipboard.
 * @react-native-clipboard/clipboard stays linked so native autolinking
 * keeps RNCClipboard (unlinking it previously left Main undefined).
 */

export const setClipboard = (text: string): void => {
  setStringAsync(text).catch(() => {})
}

export const getClipboard = async (): Promise<string> => {
  return await getStringAsync()
}
