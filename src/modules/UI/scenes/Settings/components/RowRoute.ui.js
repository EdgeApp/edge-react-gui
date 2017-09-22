import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
  TouchableOpacity,
  View
} from 'react-native'
import T from '../../../components/FormattedText'
import {Actions} from 'react-native-router-flux'
import s from '../style'
import {border as b} from '../../../../utils'

export default class RowRoute extends Component {
  _handleOnPressRouting (route) {
    Actions[route]()
    // goRoute()
  }

  render () {
    return (
      <TouchableOpacity style={[s.settingsRowContainer]} disabled={false} onPress={() => this.props.routeFunction()}>

        <View style={[s.settingsRowTextRow, b('red')]}>
          <View style={[s.settingsRowLeftContainer, b('blue')]}>
            <T style={[s.settingsRowLeftText, b('green')]}>
              {this.props.leftText}
            </T>
          </View>
          <View style={[s.settingsRowLeftContainer, b('blue')]}>
            <T style={[s.routeRowRightText, b('green')]}>
              {this.props.right}
            </T>
          </View>
        </View>

      </TouchableOpacity>
    )
  }
}
RowRoute.propTypes = {
  scene: PropTypes.string,
  leftText: PropTypes.string
}
