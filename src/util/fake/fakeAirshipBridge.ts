import type { AirshipBridge } from 'react-native-airship'

export const fakeAirshipBridge: AirshipBridge<any> = {
  resolve: value => undefined,
  reject: _error => undefined,
  remove: () => undefined,
  on: (name, callback) => () => undefined,
  onResult: callback => undefined
}
