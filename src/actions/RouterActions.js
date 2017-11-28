// @flow
import {ActionConst} from 'react-native-router-flux'

export const dispatchFocusRoute = (sceneName: string) => {
  return {
    type: ActionConst.FOCUS,
    data: sceneName
  }
}
