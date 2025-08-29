import type { InfiniteWorkflow } from '../infiniteRampTypes'

// Exports
export const authenticateWorkflow: InfiniteWorkflow = async utils => {
  const { account, infiniteApi, pluginId, state, workflowState } = utils

  // Mark workflow as started
  workflowState.auth.status = 'started'

  // Check if already authenticated
  if (infiniteApi.isAuthenticated()) {
    workflowState.auth.status = 'completed'
    return
  }

  // Check if we already have a private key
  let privateKey = state.privateKey
  if (privateKey == null) {
    // Try to load from storage (stored as hex string)
    // const itemIds = await account.dataStore.listItemIds(pluginId)
    const itemIds: string[] = []
    if (itemIds.includes(INFINITE_PRIVATE_KEY)) {
      const storedKeyHex = await account.dataStore.getItem(
        pluginId,
        INFINITE_PRIVATE_KEY
      )
      // Convert hex string back to Uint8Array
      privateKey = hexToBytes(storedKeyHex)
    } else {
      // Generate new private key
      privateKey = infiniteApi.createPrivateKey()
      // Save to storage as hex string
      await account.dataStore.setItem(
        pluginId,
        INFINITE_PRIVATE_KEY,
        bytesToHex(privateKey)
      )
    }
    state.privateKey = privateKey
  }

  // Get public key from private key
  const publicKey = infiniteApi.getPublicKeyFromPrivate(privateKey)

  // Get challenge
  const challengeResponse = await infiniteApi.getChallenge(publicKey)

  // Sign the challenge message
  const signature = infiniteApi.signChallenge(
    challengeResponse.message,
    privateKey
  )

  // Verify signature
  await infiniteApi.verifySignature({
    public_key: publicKey,
    signature,
    nonce: challengeResponse.nonce,
    platform: 'mobile'
  })

  // Mark workflow as completed
  workflowState.auth.status = 'completed'
}

// Storage keys
const INFINITE_PRIVATE_KEY = 'infinite_auth_private_key'

// Utility functions
const hexToBytes = (hex: string): Uint8Array => {
  if (hex.startsWith('0x')) hex = hex.slice(2)
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
