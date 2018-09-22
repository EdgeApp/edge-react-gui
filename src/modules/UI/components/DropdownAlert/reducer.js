// @flow

import type { Action } from '../../../ReduxTypes.js'

const initialState = {
  visible: false,
  type: '',
  title: '',
  message: ''
}

type DropdownAlertState = {
  visible: boolean,
  type: string,
  title: string,
  message: string
}

export const dropdownAlert = (state: DropdownAlertState = initialState, action: Action) => {
  switch (action.type) {
    case 'UI/COMPONENTS/DROPDOWN_ALERT/DISPLAY_DROPDOWN_ALERT': {
      if (!action.data) throw new Error('Invalid action')
      const { type, title, message } = action.data

      return {
        visible: true,
        type,
        title,
        message
      }
    }

    case 'UI/COMPONENTS/DROPDOWN_ALERT/DISMISS_DROPDOWN_ALERT': {
      return initialState
    }

    default:
      return state
  }
}

export default dropdownAlert
