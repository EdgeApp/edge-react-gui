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
    console.log('Infinite Auth: Already authenticated, skipping')
    return
  }

  console.log('Infinite Auth: Starting authentication flow')

  // Get public key from private key
  const publicKey = infiniteApi.getPublicKeyFromPrivate(privateKey)
  console.log('Infinite Auth: Public key:', publicKey)

  // Get challenge
  console.log('Infinite Auth: Requesting challenge')
  const challengeResponse = await infiniteApi.getChallenge(publicKey)
  console.log('Infinite Auth: Challenge received:', {
    nonce: challengeResponse.nonce,
    expiresAt: challengeResponse.expires_at_iso
  })

  // Sign the challenge message
  const signature = infiniteApi.signChallenge(
    challengeResponse.message,
    privateKey
  )
  console.log(
    'Infinite Auth: Message signed, signature:',
    signature.slice(0, 20) + '...'
  )

  // Verify signature
  console.log('Infinite Auth: Verifying signature')
  await infiniteApi.verifySignature({
    public_key: publicKey,
    signature,
    nonce: challengeResponse.nonce,
    platform: 'mobile'
  })
  console.log('Infinite Auth: Authentication successful')
}
