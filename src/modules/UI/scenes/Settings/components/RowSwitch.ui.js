import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
  Switch,
  TouchableHighlight,
  View
} from 'react-native'
import T from '../../../components/FormattedText'
import styles, {styles as styleRaw} from '../style'
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
    return <TouchableHighlight style={[styles.settingsRowContainer]}
      underlayColor={styleRaw.underlay.color}
      disabled={false}
      onPress={() => this._onPressToggleSetting(this.props.property)}>

      <View style={[styles.settingsRowTextRow, b('red')]}>
        <View style={[styles.settingsRowLeftContainer, b('blue')]}>
          <T style={[styles.settingsRowLeftText, b('green')]}>
            {this.props.leftText}
          </T>
        </View>
        <Switch
          onValueChange={() => this._onPressToggleSetting(this.props.property)}
          value={this.props.value} />
      </View>

    </TouchableHighlight>
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
