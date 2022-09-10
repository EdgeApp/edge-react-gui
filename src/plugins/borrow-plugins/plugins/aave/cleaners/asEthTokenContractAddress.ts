import { asObject, asString } from 'cleaners'

export const asEthTokenContractAddress = (raw: unknown): string => {
  const edgeToken = asObject({
    networkLocation: asObject({
      contractAddress: asString
    })
  })(raw)
  return edgeToken.networkLocation.contractAddress.toLowerCase()
}
