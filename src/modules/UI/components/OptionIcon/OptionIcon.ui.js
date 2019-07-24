// @flow

import React, { Component } from 'react'
import FAIcon from 'react-native-vector-icons/FontAwesome'

import THEME from '../../../../theme/variables/airbitz.js'
import { scale } from '../../../../util/scaling.js'

type Props = {
  iconName: string
}

export default class OptionIcon extends Component<Props> {
  render () {
    return (
      <FAIcon
        name={this.props.iconName}
        size={scale(24)}
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
