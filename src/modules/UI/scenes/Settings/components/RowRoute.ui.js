import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
  TouchableHighlight,
  View
} from 'react-native'
import T from '../../../components/FormattedText'
import {Actions} from 'react-native-router-flux'
import styles, {styles as styleRaw} from '../style'
import {border as b} from '../../../../utils'

export default class RowRoute extends Component {
  _handleOnPressRouting (route) {
    Actions[route]()
  }

  render () {
    return (
      <TouchableHighlight style={[styles.settingsRowContainer]}
        underlayColor={styleRaw.underlay.color}
        disabled={false}
        onPress={this.props.routeFunction}>

        <View style={[styles.settingsRowTextRow, b('red')]}>
          <View style={[styles.settingsRowLeftContainer, b('blue')]}>
            <T style={[styles.settingsRowLeftText, b('green')]}>
              {this.props.leftText}
            </T>
          </View>
          <View style={[styles.settingsRowLeftContainer, b('blue')]}>
            <T style={[styles.routeRowRightText, b('green')]}>
              {this.props.right}
            </T>
          </View>
        </View>

      </TouchableHighlight>
    )
  }
}
RowRoute.propTypes = {
  scene: PropTypes.string,
  leftText: PropTypes.string
}
