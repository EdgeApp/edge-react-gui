// @flow
import React, { Component } from 'react'
import FAIcon from 'react-native-vector-icons/FontAwesome'

import THEME from '../../../../theme/variables/airbitz.js'

type Props = {
  iconName: string
}

type State = {}

export default class OptionIcon extends Component<Props, State> {
  render () {
    return (
      <FAIcon
        name={this.props.iconName}
        size={24}
        color={THEME.COLORS.PRIMARY}
        style={[
          {
            backgroundColor: THEME.COLORS.TRANSPARENT,
            zIndex: 1015,
            elevation: 1015
          }
        ]}
      />
    )
  }
}
