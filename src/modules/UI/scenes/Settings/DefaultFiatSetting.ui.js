import React, {Component} from 'react'
import {
  View
} from 'react-native'
import * as UTILS from '../../../utils'
import DropdownPicker from '../../components/Dropdown/Dropdown.ui'

export default class DefaultFiatSetting extends Component {
  render () {
    const supportedFiats = UTILS.getSupportedFiats()
    return
    <View />
  }
}
