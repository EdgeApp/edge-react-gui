export const CHANGE_PIN_NUMBER_VALUE = 'CHANGE_PIN_NUMBER_VALUE'

export function changePinNumberValue (data) {
  return {
    type: CHANGE_PIN_NUMBER_VALUE,
    data
  }
}
