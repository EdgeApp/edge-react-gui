import { isAvailableAsync, requestReview } from 'expo-store-review'

/**
 * In-app store review via expo-store-review.
 * react-native-store-review and react-native-in-app-review stay linked.
 */

export const isStoreReviewAvailable = async (): Promise<boolean> => {
  return await isAvailableAsync()
}

export const requestStoreReview = async (): Promise<void> => {
  await requestReview()
}
