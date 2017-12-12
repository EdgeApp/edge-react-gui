// @flow

import React, {Component, type Node} from 'react'
import strings from '../../../../locales/default'
import {
  View,
  TouchableOpacity,
  Platform
} from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'
import PropTypes from 'prop-types'
import styles, {exitColor} from './style'
import Modal from 'react-native-modal'
import T from '../FormattedText'
import {border as b} from '../../../utils'

type Props = {
  headerText: string,
  headerTextStyle?: {},
  headerSubtext?: string,
  visibilityBoolean: boolean,
  featuredIcon: Node,
  modalVisibleStyle?: {},
  modalBoxStyle?: {},
  modalContentStyle?: {},
  modalBodyStyle?: {},
  modalMiddle: Node,
  modalMiddleStyle?: {},
  modalBottom: Node,
  modalBottomStyle?: {},
  onExitButtonFxn: ?() => void,
  style?: any
}
type State = {}

export default class StylizedModal extends Component<Props, State> {
  render () {
    const {headerText, headerSubtext} = this.props
    const exitIconName = (Platform.OS === 'ios' ? 'ios' : 'md') + '-close'
    return (
      <Modal style={[styles.topLevelModal, b('yellow'), this.props.style]} isVisible={this.props.visibilityBoolean}>
        <View style={[styles.modalHeaderIconWrapBottom]}>
          {this.props.featuredIcon}
        </View>

        <View style={[styles.visibleModal, this.props.modalVisibleStyle]}>

          <View style={[styles.exitRow]}>
            <TouchableOpacity
              style={[styles.exitButton, b()]}
              onPress={this.props.onExitButtonFxn}>
              <Ionicon style={b()} name={exitIconName} size={30} color={exitColor} />
            </TouchableOpacity>
          </View>

          <View style={[styles.modalBox, this.props.modalBoxStyle]}>
            <View style={[styles.modalContent, this.props.modalContentStyle]}>
              <View style={[styles.modalBody, this.props.modalBodyStyle]}>

                <View style={[styles.modalTopTextWrap]}>
                  <T style={[styles.modalTopText, this.props.headerTextStyle]}>
                    {strings.enUS[headerText]}
                  </T>

                  {this.props.headerSubtext
                    && <T style={[styles.modalTopSubtext]}>
                      {headerSubtext ? strings.enUS[headerSubtext] : ''}
                    </T>
                  }
                </View>

                {this.props.modalMiddle
                  && <View style={[styles.modalMiddle, this.props.modalMiddleStyle]}>
                    {this.props.modalMiddle}
                  </View>
                }

                {this.props.modalBottom
                  && <View style={[styles.modalBottom, this.props.modalBottomStyle]}>
                    {this.props.modalBottom}
                  </View>
                }

              </View>
            </View>
          </View>

        </View>

      </Modal>
    )
  }
}

StylizedModal.propTypes = {
  visibilityBoolean: PropTypes.bool
}
