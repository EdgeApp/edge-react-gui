// @flow

import React, { Component } from 'react'
import type { Node } from 'react'
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import Modal from 'react-native-modal'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { scale } from '../../../../lib/scaling.js'
import s from '../../../../locales/strings.js'
import { border as b } from '../../../utils'
import T from '../FormattedText'
import styles, { exitColor } from './style'

type Props = {
  headerText: string,
  headerTextStyle?: StyleSheet.Styles,
  headerSubtext?: string,
  visibilityBoolean: boolean,
  featuredIcon: Node,
  modalHeaderIcon?: {},
  modalVisibleStyle?: StyleSheet.Styles,
  modalBoxStyle?: StyleSheet.Styles,
  modalContentStyle?: StyleSheet.Styles,
  modalBodyStyle?: StyleSheet.Styles,
  modalMiddle?: Node, // should be allowed to not give a middle component
  modalMiddleStyle?: StyleSheet.Styles,
  modalBottom: Node,
  modalBottomStyle?: StyleSheet.Styles,
  onExitButtonFxn: ?() => void,
  style?: StyleSheet.Styles
}

export default class StylizedModal extends Component<Props> {
  showExitIcon = () => {
    const exitIconName = (Platform.OS === 'ios' ? 'ios' : 'md') + '-close'
    if (this.props.onExitButtonFxn) {
      return (
        <View style={[styles.exitRow]}>
          <TouchableOpacity style={[styles.exitButton, b()]} onPress={this.props.onExitButtonFxn}>
            <Ionicon style={b()} name={exitIconName} size={scale(30)} color={exitColor} />
          </TouchableOpacity>
        </View>
      )
    }
    return <View style={[styles.exitRowEmpty]} />
  }
  render () {
    const { headerText, headerSubtext } = this.props

    return (
      <Modal style={[styles.topLevelModal, this.props.style]} isVisible={this.props.visibilityBoolean}>
        <View style={[styles.modalHeaderIconWrapBottom, this.props.modalHeaderIcon]}>{this.props.featuredIcon}</View>

        <View style={[styles.visibleModal, this.props.modalVisibleStyle]}>
          {this.showExitIcon()}

          <View style={[styles.modalBox, this.props.modalBoxStyle]}>
            <View style={[styles.modalContent, this.props.modalContentStyle]}>
              <View style={[styles.modalBody, this.props.modalBodyStyle]}>
                <View style={[styles.modalTopTextWrap]}>
                  <T style={[styles.modalTopText, this.props.headerTextStyle]}>{headerText}</T>

                  {this.props.headerSubtext && <T style={[styles.modalTopSubtext]}>{headerSubtext ? s.strings[headerSubtext] : ''}</T>}
                </View>

                {this.props.modalMiddle && <View style={[styles.modalMiddle, this.props.modalMiddleStyle]}>{this.props.modalMiddle}</View>}

                {this.props.modalBottom && <View style={[styles.modalBottom, this.props.modalBottomStyle]}>{this.props.modalBottom}</View>}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    )
  }
}
