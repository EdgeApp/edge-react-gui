import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
  Switch,
  TouchableOpacity,
  View
} from 'react-native'
import T from '../../../components/FormattedText'
import s from '../style'
import {border as b} from '../../../../utils'

export default class RowSwitch extends Component {
  _onPressToggleSetting = () => {
    // console.log('toggline property: ', property)
  }

  render () {
    return (
      <TouchableOpacity style={[s.settingsRowContainer]} disabled={false} onPress={() => this._onPressToggleSetting(this.props.property)}>

        <View style={[s.settingsRowTextRow, b('red')]}>
          <View style={[s.settingsRowLeftContainer, b('blue')]}>
            <T style={[s.settingsRowLeftText, b('green')]}>{this.props.leftText}</T>
          </View>
          <Switch onValueChange={() => this._onPressToggleSetting(this.props.property)} value={false} />
        </View>

      </TouchableOpacity>
    )
  }
}
RowSwitch.propTypes = {
  leftText: PropTypes.string,
  property: PropTypes.string
}
