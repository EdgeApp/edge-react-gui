// @flow
import React, {Component} from 'react'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import {colors as c} from '../../../../../theme/variables/airbitz.js'

export default class RenameIcon extends Component<{}> {
  render () {
    return <MAIcon name='edit' size={24} color={c.primary} style={[{
      position: 'relative',
      top: 12,
      left: 14,
      height: 24,
      width: 24,
      backgroundColor: 'transparent'
    }]} />
  }
}
