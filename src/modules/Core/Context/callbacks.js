// @flow
import type {AbcContextCallbacks} from 'airbitz-core-types'
import type {Dispatch} from '../../ReduxTypes'

import {Alert} from 'react-native'

export default (dispatch: Dispatch): AbcContextCallbacks => ({ // eslint-disable-line no-unused-vars
  onError: (error: Error) => {
    Alert.alert(error.message)
    console.log(error)
  }
})
