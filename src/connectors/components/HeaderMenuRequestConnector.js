// @flow

import { connect } from 'react-redux'

import { showHelpModal } from '../../components/modals/HelpModal.js'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { MenuDropDown, MenuDropDownStyle } from '../../modules/UI/components/MenuDropDown/MenuDropDown.ui.js'
import THEME from '../../theme/variables/airbitz'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'

export const dropDownStyle = {
  ...MenuDropDownStyle,
  icon: { ...MenuDropDownStyle.icon, color: THEME.COLORS.WHITE }
}

const help = {
  label: s.strings.string_help,
  key: s.strings.string_help,
  value: {
    title: Constants.HELP_VALUE,
    value: Constants.HELP_VALUE
  }
}

const helpArray = [help]

const mapStateToProps = (state: RootState) => {
  const useLegacyAddress = state.ui.scenes.requestType.useLegacyAddress
  const uniqueLegacyAddress = state.ui.scenes.requestType.uniqueLegacyAddress

  const addressToggle = {
    label: useLegacyAddress ? s.strings.title_use_regular_address : s.strings.title_use_legacy_address, // tie into,
    key: useLegacyAddress ? s.strings.title_use_regular_address : s.strings.title_use_legacy_address,
    value: {
      title: useLegacyAddress ? s.strings.title_use_regular_address : s.strings.title_use_legacy_address,
      value: useLegacyAddress ? 'useRegularRequestAddress' : 'useLegacyRequestAddress'
    }
  }
  const dropDownButtons = uniqueLegacyAddress ? [addressToggle, help] : helpArray
  return {
    style: dropDownStyle,
    data: dropDownButtons,
    rightSide: true
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSelect: (value: Object) => {
    switch (value.value) {
      case 'useRegularRequestAddress': {
        dispatch({ type: 'USE_REGULAR_REQUEST_ADDRESS' })
        break
      }

      case 'useLegacyRequestAddress': {
        dispatch({ type: 'USE_LEGACY_REQUEST_ADDRESS' })
        break
      }

      case Constants.HELP_VALUE:
        showHelpModal()
        break
    }
  }
  // nextScreen: () => dispatch(actions.nextScreen())
})

export default connect(mapStateToProps, mapDispatchToProps)(MenuDropDown)
