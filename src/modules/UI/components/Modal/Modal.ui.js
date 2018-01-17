// @flow

import React, {Component, type Node} from 'react'
import s from '../../../../locales/strings.js'
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
  modalMiddle?: Node, // should be allowed to not give a middle component
  modalMiddleStyle?: {},
  modalBottom: Node,
  modalBottomStyle?: {},
  onExitButtonFxn: ?() => void,
  style?: any
}
type State = {}

export default class StylizedModal extends Component<Props, State> {
  showExitIcon = () => {
    const exitIconName = (Platform.OS === 'ios' ? 'ios' : 'md') + '-close'
    if (this.props.onExitButtonFxn) {
      return <View style={[styles.exitRow]}>
        <TouchableOpacity
          style={[styles.exitButton, b()]}
          onPress={this.props.onExitButtonFxn}>
          <Ionicon style={b()} name={exitIconName} size={30} color={exitColor} />
        </TouchableOpacity>
      </View>
    }
    return <View style={[styles.exitRow]} />
  }
  render () {
    const {headerText, headerSubtext} = this.props

    return (
      <Modal style={[styles.topLevelModal, this.props.style]} isVisible={this.props.visibilityBoolean}>
        <View style={[styles.modalHeaderIconWrapBottom]}>
          {this.props.featuredIcon}
        </View>

        <View style={[styles.visibleModal, this.props.modalVisibleStyle]}>

          {this.showExitIcon()}

          <View style={[styles.modalBox, this.props.modalBoxStyle]}>
            <View style={[styles.modalContent, this.props.modalContentStyle]}>
              <View style={[styles.modalBody, this.props.modalBodyStyle]}>

                <View style={[styles.modalTopTextWrap]}>
                  <T style={[styles.modalTopText, this.props.headerTextStyle]}>
                    {headerText}
                  </T>

                  {this.props.headerSubtext &&
                    <T style={[styles.modalTopSubtext]}>
                      {headerSubtext ? s.strings[headerSubtext] : ''}
                    </T>
                  }
                </View>

                {this.props.modalMiddle &&
                  <View style={[styles.modalMiddle, this.props.modalMiddleStyle]}>
                    {this.props.modalMiddle}
                  </View>
                }

                {this.props.modalBottom &&
                  <View style={[styles.modalBottom, this.props.modalBottomStyle]}>
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
