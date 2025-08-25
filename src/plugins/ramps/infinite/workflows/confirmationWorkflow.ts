export interface ConfirmationParams {
  fiatCurrencyCode: string
  fiatAmount: string
  cryptoCurrencyCode: string
  cryptoAmount: string
  direction: 'buy' | 'sell'
}

export const confirmationWorkflow = async (
  navigation: any,
  params: ConfirmationParams & { replace?: boolean }
): Promise<boolean> => {
  const {
    fiatCurrencyCode,
    fiatAmount,
    cryptoCurrencyCode,
    cryptoAmount,
    direction,
    replace = false
  } = params

  return await new Promise<boolean>(resolve => {
    const navigate = replace ? navigation.replace : navigation.navigate
    navigate('rampConfirmation', {
      fiatCurrencyCode,
      fiatAmount,
      cryptoCurrencyCode,
      cryptoAmount,
      direction,
      onConfirm: () => {
        resolve(true)
      },
      onCancel: () => {
        resolve(false)
      }
    })
  })
}
