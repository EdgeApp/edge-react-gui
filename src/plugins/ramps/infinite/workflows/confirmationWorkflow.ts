export interface ConfirmationParams {
  fiatCurrencyCode: string
  fiatAmount: string
  cryptoCurrencyCode: string
  cryptoAmount: string
  direction: 'buy' | 'sell'
}

export const confirmationWorkflow = async (
  navigation: any,
  params: ConfirmationParams
): Promise<boolean> => {
  const {
    fiatCurrencyCode,
    fiatAmount,
    cryptoCurrencyCode,
    cryptoAmount,
    direction
  } = params

  return await new Promise<boolean>(resolve => {
    navigation.navigate('rampConfirmation', {
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
