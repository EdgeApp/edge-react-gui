import React, { Component } from 'react'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import { View } from 'react-native'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import styles from './style'
import Modal from 'react-native-modal'
import LinearGradient from 'react-native-linear-gradient'
import T from '../FormattedText'
import {border as b} from '../../../utils'

class StylizedModal extends Component {
  render () {
    return (
      <Modal style={[styles.topLevelModal, {marginLeft: 20, marginRight: 20, marginTop: 20}, b('yellow')]}
        isVisible={this.props.visibilityBoolean}>
        <View style={[styles.modalBox, b('red')]}>
          <View style={[styles.modalBody, b('purple')]}>
            <View style={[styles.modalTopTextWrap, b('blue')]}>
              <T style={[styles.modalTopText, b('yellow')]}>{sprintf(strings.enUS[this.props.headerText])}</T>
              {this.props.headerSubtext &&
                <T style={[styles.modalTopSubtext, b('green')]}>
                  {this.props.headerSubtext || ''}
                </T>
              }

            </View>
            {this.props.modalMiddle &&
              <View style={[styles.modalMiddle, b('brown')]}>
                {this.props.modalMiddle}
              </View>
            }
            {this.props.modalBottom &&
            <View style={[styles.modalBottom, b('green')]}>
              {this.props.modalBottom}
            </View>
            }
          </View>
        </View>

        <LinearGradient style={[styles.modalHeaderIconWrapBottom]}
          start={{x: 0, y: 0}} end={{x: 1, y: 0}}
          colors={['#3B7ADA', '#2B5698']}>
          <View style={styles.modalHeaderIconWrapTop}>
            {this.props.featuredIcon}
          </View>
        </LinearGradient>
      </Modal>
    )
  }
}

StylizedModal.propTypes = {
  visibilityBoolean: PropTypes.bool
}

export default connect()(StylizedModal)
