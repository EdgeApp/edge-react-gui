// @flow

import type { EdgeCurrencyWallet, EdgeParsedUri } from 'edge-core-js'
import React from 'react'

import s from '../../locales/strings.js'
import { type GuiMakeSpendInfo } from '../../types/types.js'
import { Airship } from '../services/AirshipInstance.js'
import { ButtonsModal } from './ButtonsModal.js'

const BITPAY = {
  domain: 'bitpay.com',
  merchantName: (memo: string) => {
    // Example BitPay memo
    // "Payment request for BitPay invoice DKffym7WxX6kzJ73yfYS7s for merchant Electronic Frontier Foundation"
    // eslint-disable-next-line no-unused-vars
    const [_, merchantName] = memo.split(' for merchant ')
    return merchantName
  }
}

export const paymentProtocolUriReceived = async (
  { paymentProtocolURL }: EdgeParsedUri & { paymentProtocolURL?: string },
  coreWallet: EdgeCurrencyWallet
): Promise<GuiMakeSpendInfo | void> => {
  try {
    if (!paymentProtocolURL) throw new Error('no paymentProtocolUrl prop')

    const paymentProtocolInfo = await coreWallet.getPaymentProtocolInfo(paymentProtocolURL)
    const { domain, memo, nativeAmount, spendTargets } = paymentProtocolInfo
    const name = domain === BITPAY.domain ? BITPAY.merchantName(memo) : domain

    return {
      lockInputs: true,
      networkFeeOption: 'standard',
      metadata: {
        name,
        notes: memo
      },
      nativeAmount,
      spendTargets,
      otherParams: { paymentProtocolInfo }
    }
  } catch (error) {
    console.log('error', error)
    await Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.scan_invalid_address_error_title}
        message={s.strings.scan_invalid_address_error_description}
        buttons={{ ok: { label: s.strings.string_ok } }}
      />
    ))
  }
}
