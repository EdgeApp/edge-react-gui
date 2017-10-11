import React, {Component} from 'react'
import strings from '../../../../locales/default'
import {View} from 'react-native'
import PropTypes from 'prop-types'
import styles from './style'
import Modal from 'react-native-modal'
import Gradient from '../Gradient/Gradient.ui'
import T from '../FormattedText'
import {border as b} from '../../../utils'

export default class StylizedModal extends Component {
  render () {
    const {headerText, headerSubtext} = this.props
    return (
      <Modal style={[styles.topLevelModal, {marginLeft: 20, marginRight: 20, marginTop: 20}, b('yellow')]}
        isVisible={this.props.visibilityBoolean}>
        <View style={[styles.modalBox, b('red')]}>
          <View style={[styles.modalBody, b('purple')]}>
            <View style={[styles.modalTopTextWrap, b('blue')]}>
              <T style={[styles.modalTopText, b('yellow')]}>
                {strings.enUS[headerText]}
              </T>
              {
                this.props.headerSubtext
                && <T style={[styles.modalTopSubtext, b('green')]}>
                  {headerSubtext ? strings.enUS[headerSubtext] : ''}
                </T>
              }

            </View>
            {
              this.props.modalMiddle
              && <View style={[styles.modalMiddle, b('brown')]}>
                {this.props.modalMiddle}
              </View>
            }
            {
              this.props.modalBottom
              && <View style={[styles.modalBottom, b('green')]}>
                {this.props.modalBottom}
              </View>
            }
          </View>
        </View>

        <Gradient style={[styles.modalHeaderIconWrapBottom]}>
          <View style={styles.modalHeaderIconWrapTop}>
            {this.props.featuredIcon}
          </View>
        </Gradient>
      </Modal>
    )
  }
}

StylizedModal.propTypes = {
  visibilityBoolean: PropTypes.bool
}
