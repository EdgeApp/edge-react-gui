import { launchImageLibraryAsync } from 'expo-image-picker'

/**
 * Photo-library picker via expo-image-picker.
 * react-native-image-picker stays linked; ScanModal was the only GUI caller.
 */

export interface LibraryImagePickResult {
  canceled: boolean
  uri?: string
}

export const pickImageFromLibrary =
  async (): Promise<LibraryImagePickResult> => {
    const result = await launchImageLibraryAsync({
      mediaTypes: ['images']
    })
    if (result.canceled) {
      return { canceled: true }
    }
    return { canceled: false, uri: result.assets[0]?.uri }
  }
