import { randomUUID } from 'expo-crypto'

/**
 * Random UUID (v4) via expo-crypto.
 * react-native-securerandom stays linked; sha.js stays for sync digests
 * because expo-crypto hashing is async-only.
 */
export const makeUuid = async (): Promise<string> => randomUUID()
