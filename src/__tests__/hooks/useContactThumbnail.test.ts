import { describe, expect, it } from '@jest/globals'

import { getMerchantThumbnail } from '../../hooks/redux/useContactThumbnail'
import { edgeDark } from '../../theme/variables/edgeDark'
import { edgeLight } from '../../theme/variables/edgeLight'

describe('getMerchantThumbnail', () => {
  it('gives a MoonPay Trade merchant its themed swap logo, fitted', () => {
    expect(getMerchantThumbnail('MoonPay Trade (DeFi)', edgeDark)).toEqual({
      uri: 'https://content.edge.app/exchangeIcons/mptradedefi/icon.png',
      fit: true
    })
    expect(
      getMerchantThumbnail('MoonPay Trade (Centralized)', edgeLight)
    ).toEqual({
      uri: 'https://content.edge.app/exchangeIcons/mptrade/icon-light.png',
      fit: true
    })
  })

  it('keeps the cropped image for every other merchant', () => {
    expect(getMerchantThumbnail('Bitrefill', edgeLight)).toEqual({
      uri: 'https://content.edge.app/bitrefill.png',
      fit: false
    })
  })

  it('has no thumbnail for a name no merchant matches', () => {
    expect(getMerchantThumbnail('Alice', edgeDark)).toBeUndefined()
  })
})
