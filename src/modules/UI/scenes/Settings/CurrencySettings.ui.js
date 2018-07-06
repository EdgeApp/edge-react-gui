// @flow

import React, { Component } from 'react'
import { Image, View } from 'react-native'

import s from '../../../../locales/strings.js'
import type { GuiDenomination } from '../../../../types'
import T from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui'
import SafeAreaView from '../../components/SafeAreaView'
import RadioRows from './components/RadioRows.ui.js'
import SwitchRow from './components/RowSwitch.ui.js'
import Row from './components/Row.ui.js'
import { SetCustomNodesModal } from './components/SetCustomNodesModal.ui.js'
import styles from './style'

const SETTINGS_DENOMINATION_TEXT = s.strings.settings_denominations_title

type Props = {
  denominations: Array<GuiDenomination>,
  logo: string,
  selectDenomination: string => void,
  selectedDenominationKey: string,
  isCustomNodesEnabled?: boolean,
  customNodesList?: Array<string>,
  closeSetCustomNodesModal: () => void,
  openSetCustomNodesModal: () => void
}

type State = {
  isSetEnabledCustomNodesModalVisible: boolean
}

export default class CurrencySettings extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      isSetEnabledCustomNodesModalVisible: false
    }
  }

  header () {
    return (
      <Gradient style={[styles.headerRow]}>
        <View style={[styles.headerTextWrap]}>
          <View style={styles.leftArea}>
            <Image style={{ height: 25, width: 25, resizeMode: Image.resizeMode.contain }} source={{ uri: this.props.logo }} />
            <T style={styles.headerText}>{SETTINGS_DENOMINATION_TEXT}</T>
          </View>
        </View>
      </Gradient>
    )
  }

  selectDenomination = (key: string) => () => {
    return this.props.selectDenomination(key)
  }

  closeSetCustomNodesModal = () => {
    this.setState({
      isSetEnabledCustomNodesModalVisible: false
    })
  }

  openSetCustomNodesModal = () => {
    this.setState({
      isSetEnabledCustomNodesModalVisible: true
    })
  }

  onToggleEnableCustomNodes = () => {
    if (!this.state.isSetEnabledCustomNodesModalVisible) {
      this.openSetCustomNodesModal()
    } else {
      this.closeSetCustomNodesModal()
    }
  }

  render () {
    return (
      <SafeAreaView>
        <View style={[styles.ethereumSettings]}>
          <Gradient style={styles.gradient} />
          <View style={styles.container}>
            <SetCustomNodesModal
              isActive={this.state.isSetEnabledCustomNodesModalVisible}
              onExit={this.closeSetCustomNodesModal}
              customNodesList={this.props.customNodesList}
            />
            {this.header()}
            <RadioRows>
              {this.props.denominations.map(denomination => {
                const key = denomination.multiplier
                const left = (
                  <View style={{ flexDirection: 'row' }}>
                    <T style={styles.symbol}>{denomination.symbol}</T>
                    <T> - {denomination.name}</T>
                  </View>
                )
                const isSelected = key === this.props.selectedDenominationKey
                const onPress = this.selectDenomination(key)
                return <Row key={denomination.multiplier} denomination={denomination} left={left} isSelected={isSelected} onPress={onPress} />
              })}
            </RadioRows>
            <SwitchRow
              leftText={s.strings.settings_enable_custom_nodes}
              key='enableCustomNodes'
              onToggle={this.onToggleEnableCustomNodes}
              value={this.props.isCustomNodesEnabled}
              isActive={this.state.isSetEnabledCustomNodesModalVisible}
            />
          </View>
        </View>
      </SafeAreaView>
    )
  }
}
