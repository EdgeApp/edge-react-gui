/**
 * Format a provider's crypto amount string for display on a ramp quote.
 *
 * Decimals worth less than $0.01 are cut, and trailing zeros are dropped. With
 * SOL at $117.67, $0.01 is 0.00008498, so "0.388792343" displays as "0.38879".
 * The cut truncates rather than rounds, so the shown amount differs from the
 * provider's by less than $0.01 and a buy quote never overstates the crypto
 * received.
 *
 * Amounts stay in the provider's "." decimal format. With no rate, or when the
 * cut would show a non-zero amount as 0, every significant decimal is kept.
 * Anything other than a plain decimal string, such as an exponent, is returned
 * as received.
 */
export const formatRampCryptoAmount = (
  cryptoAmount: string,
  usdRate: number
): string => {
  if (!/^\d+(\.\d*)?$/.test(cryptoAmount)) return cryptoAmount

  const [integers, decimals = ''] = cryptoAmount.split('.')
  const significant = decimals.replace(/0+$/, '')
  const shown =
    usdRate > 0
      ? significant
          .slice(0, Math.max(0, Math.ceil(Math.log10(usdRate) + 2)))
          .replace(/0+$/, '')
      : significant

  const isZeroed = shown === '' && significant !== '' && /^0+$/.test(integers)
  const fraction = isZeroed ? significant : shown

  return fraction === '' ? integers : `${integers}.${fraction}`
}
