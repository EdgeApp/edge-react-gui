import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {TouchableHighlight, View} from 'react-native'
import T from '../../../components/FormattedText'
import styles, {styles as styleRaw} from '../style'
import {border as b} from '../../../../utils'

export default class RowModal extends Component {
  render () {
    return (
      <TouchableHighlight style={[styles.settingsRowContainer]} disabled={false}
        underlayColor={styleRaw.underlay.color}
        onPress={this.props.onPress}>

        <View style={[styles.settingsRowTextRow, b('red')]}>
          <View style={[styles.settingsRowLeftContainer, b('blue')]}>
            <T style={[styles.settingsRowLeftText, b('green')]}>
              {this.props.leftText}
            </T>
          </View>

          <T style={styles.modalRightText}>
            {this.props.rightText}
          </T>
        </View>

      </TouchableHighlight>
    )
  }
}

RowModal.propTypes = {
  modal: PropTypes.string,
  leftText: PropTypes.string
}
