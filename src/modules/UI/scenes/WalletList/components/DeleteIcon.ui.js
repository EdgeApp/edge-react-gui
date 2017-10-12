// @flow
import React, {Component} from 'react'
import * as Constants from '../../../../../constants/indexConstants'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import {colors as c} from '../../../../../theme/variables/airbitz.js'

export default class DeleteIcon extends Component<{}> {
  render () {
    return <FAIcon name={Constants.TRASH_O} size={24} color={c.primary} style={[{
      position: 'relative',
      top: 12,
      left: 14,
      height: 24,
      width: 24,
      backgroundColor: 'transparent',
      zIndex: 1015,
      elevation: 1015
    }]} />
  }
}
