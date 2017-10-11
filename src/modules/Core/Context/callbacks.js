// @flow
import type {AbcContextCallbacks} from 'airbitz-core-types'
import type {Dispatch} from '../../ReduxTypes'

import {displayDropdownAlert} from '../../UI/components/DropdownAlert/actions'

export default (dispatch: Dispatch): AbcContextCallbacks => ({
  onError: (error: Error) => {
    console.log(error)
    dispatch(displayDropdownAlert({title: error.message}))
  }
})
