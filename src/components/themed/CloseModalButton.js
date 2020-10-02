// @flow

import React, { PureComponent } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import Entypo from 'react-native-vector-icons/Entypo'

import { type AirshipBridge } from '../modals/modalParts'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'

type OwnProps = {
  bridge: AirshipBridge<null>
}

class CloseModalButtonComponent extends PureComponent<OwnProps & ThemeProps> {
  render() {
    const { theme } = this.props
    return (
      <TouchableWithoutFeedback onPress={() => this.props.bridge.resolve(null)}>
        <View style={{ height: theme.rem(3.75), justifyContent: 'center', alignItems: 'center' }}>
          <Entypo name="chevron-thin-down" size={theme.rem(1.25)} color={theme.modalCloseIcon} />
        </View>
      </TouchableWithoutFeedback>
    )
  }
}

export const CloseModalButton = withTheme(CloseModalButtonComponent)
