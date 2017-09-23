import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {TouchableOpacity, View} from 'react-native'
import T from '../../../components/FormattedText'
import s from '../style'
import {border as b} from '../../../../utils'

export default class RowModal extends Component {
  render () {
    return (
      <TouchableOpacity style={[s.settingsRowContainer]} disabled={false}
        onPress={this.props.onPress}>

        <View style={[s.settingsRowTextRow, b('red')]}>
          <View style={[s.settingsRowLeftContainer, b('blue')]}>
            <T style={[s.settingsRowLeftText, b('green')]}>
              {this.props.leftText}
            </T>
          </View>

          <T style={s.modalRightText}>
            {this.props.rightText}
          </T>
        </View>

      </TouchableOpacity>
    )
  }
}

RowModal.propTypes = {
  modal: PropTypes.string,
  leftText: PropTypes.string
}
