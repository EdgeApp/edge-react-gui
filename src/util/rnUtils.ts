import { generateSecureRandom } from 'react-native-securerandom'
import { v4 } from 'uuid'

/**
 * Utility routines that require React Native native imports. Cannot
 * be used in unit tests that run in Node
 */

/**
 * Creates a random UUID string
 * @returns string
 */
export const makeUuid = async (): Promise<string> => {
  const bytes = await generateSecureRandom(256)
  const uuid = v4({ random: bytes })
  return uuid
}
