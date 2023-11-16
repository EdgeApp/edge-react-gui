import { ethers } from 'ethers'

export type Multipass<T> = (fn: (provider: ethers.providers.BaseProvider) => Promise<T>) => Promise<T>

// This can be deprecated once ethers.providers.FallbackProvider is fixed
export const makeMultipass = (providers: ethers.providers.BaseProvider[]) => {
  let lastServerIndex = 0

  return async <T>(fn: (provider: ethers.providers.BaseProvider) => Promise<T>): Promise<T> => {
    const provider = providers[lastServerIndex % providers.length]
    try {
      return await fn(provider)
    } catch (error: any) {
      // Move index forward if an error is thrown
      ++lastServerIndex
      throw error
    }
  }
}
