import type { InfiniteApi } from '../infiniteApiTypes'

// Exports
interface Params {
  infiniteApi: InfiniteApi
  privateKey: Uint8Array
}

export const authenticateWorkflow = async (params: Params): Promise<void> => {
  const { infiniteApi, privateKey } = params

  // Check if already authenticated
  if (infiniteApi.isAuthenticated()) {
    return
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
}
