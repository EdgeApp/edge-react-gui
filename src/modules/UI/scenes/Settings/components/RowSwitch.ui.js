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
  componentWillMount () {
    this.setState({
      value: this.props.value
    })
  }
  _onPressToggleSetting = () => {
    const newValue = !this.state.value
    this.setState({
      value: newValue
    })
    this.props.onToggle(newValue)
  }

  render () {
    return (
      <TouchableOpacity style={[s.settingsRowContainer]} disabled={false} onPress={() => this._onPressToggleSetting(this.props.property)}>
        <View style={[s.settingsRowTextRow, b('red')]}>
          <View style={[s.settingsRowLeftContainer, b('blue')]}>
            <T style={[s.settingsRowLeftText, b('green')]}>{this.props.leftText}</T>
          </View>
          <Switch onValueChange={this._onPressToggleSetting} value={this.state.value} />
        </View>

      </TouchableOpacity>
    )
  }
}
// make sure onToggle becomes required
RowSwitch.propTypes = {
  value: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  leftText: PropTypes.string,
  property: PropTypes.string
}
RowSwitch.defaultProps ={
  value: false
}
