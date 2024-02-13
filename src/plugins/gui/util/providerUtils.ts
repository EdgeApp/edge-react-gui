import { ProviderToken } from '../fiatProviderTypes'

export const addTokenToArray = (providerToken: ProviderToken, tokens: ProviderToken[]): void => {
  const index = tokens.findIndex(token => token.tokenId === providerToken.tokenId)
  if (index === -1) {
    tokens.push(providerToken)
  } else {
    tokens[index] = providerToken
  }
}
