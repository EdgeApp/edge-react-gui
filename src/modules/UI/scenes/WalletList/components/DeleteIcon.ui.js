// @flow
import React, {Component} from 'react'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import THEME from '../../../../../theme/variables/airbitz.js'

export default class DeleteIcon extends Component<{}> {
  render () {
    return <FAIcon name='trash-o' size={24} color={THEME.COLORS.PRIMARY} style={[{
      position: 'relative',
      top: 12,
      left: 14,
      height: 24,
      width: 24,
      backgroundColor: THEME.COLORS.TRANSPARENT,
      zIndex: 1015,
      elevation: 1015
    }]} />
  }
}
