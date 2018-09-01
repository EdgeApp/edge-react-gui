// @flow

import { connect } from 'react-redux'

import { dispatchActionOnly } from '../../actions/indexActions'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import type { Dispatch, State } from '../../modules/ReduxTypes.js'
import { openHelpModal } from '../../modules/UI/components/HelpModal/actions'
import { MenuDropDown } from '../../modules/UI/components/MenuDropDown/MenuDropDown.ui.js'
import * as Styles from '../../styles/indexStyles'
import THEME from '../../theme/variables/airbitz'

export const dropDownStyle = {
  ...Styles.MenuDropDownStyleHeader,
  icon: { ...Styles.MenuDropDownStyle.icon, color: THEME.COLORS.WHITE }
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

export const mapStateToProps = (state: State) => {
  const useLegacyAddress = state.ui.scenes.requestType.useLegacyAddress
  const uniqueLegacyAddress = state.ui.scenes.requestType.uniqueLegacyAddress

  const addressToggle = {
    label: useLegacyAddress ? s.strings.title_use_regular_address : s.strings.title_use_legacy_address, // tie into,
    key: useLegacyAddress ? s.strings.title_use_regular_address : s.strings.title_use_legacy_address,
    value: {
      title: useLegacyAddress ? s.strings.title_use_regular_address : s.strings.title_use_legacy_address,
      value: useLegacyAddress ? Constants.USE_REGULAR_REQUEST_ADDRESS : Constants.USE_LEGACY_REQUEST_ADDRESS
    }
  }
  const dropDownButtons = uniqueLegacyAddress ? [addressToggle, help] : helpArray
  return {
    style: dropDownStyle,
    data: dropDownButtons,
    rightSide: true
  }
}

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSelect: (value: Object) => {
    switch (value.value) {
      case Constants.USE_REGULAR_REQUEST_ADDRESS:
        dispatch(dispatchActionOnly(Constants.USE_REGULAR_REQUEST_ADDRESS))
        break
      case Constants.USE_LEGACY_REQUEST_ADDRESS:
        dispatch(dispatchActionOnly(Constants.USE_LEGACY_REQUEST_ADDRESS))
        break
      case Constants.HELP_VALUE:
        dispatch(openHelpModal())
        break
    }
  }
  // nextScreen: () => dispatch(actions.nextScreen())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MenuDropDown)
