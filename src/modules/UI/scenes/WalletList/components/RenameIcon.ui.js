// @flow
import React, {Component} from 'react'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import THEME from '../../../../../theme/variables/airbitz.js'

export default class RenameIcon extends Component<{}> {
  render () {
    return <MAIcon name='edit' size={24} color={THEME.COLORS.PRIMARY} style={[{
      backgroundColor: THEME.COLORS.TRANSPARENT,
      zIndex: 1015,
      elevation: 1015
    }]} />
  }
}
