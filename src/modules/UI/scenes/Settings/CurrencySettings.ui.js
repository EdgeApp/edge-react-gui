// @flow

import React, {Component} from 'react'
import {Image, View} from 'react-native'
import {Actions} from 'react-native-router-flux'

import s from '../../../../locales/strings.js'
import T from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui'
import styles from './style'
import {border as b} from '../../../utils'
import Row from './components/Row.ui.js'
import RadioRows from './components/RadioRows.ui.js'
import RowRoute from './components/RowRoute.ui'

import type {GuiDenomination} from '../../../../types'

const SETTINGS_DENOMINATION_TEXT = s.strings.settings_denominations_title
const SETTINGS_OPTIONS_TEXT = s.strings.settings_options_title
const SPENDING_LIMITS_TEXT = s.strings.spending_limits

type Props = {
  denominations: Array<GuiDenomination>,
  logo: string,
  selectDenomination: (string) => void,
  selectedDenominationKey: string
}
type State = {}
export default class CurrencySettings extends Component<Props, State> {
  header (headerText: string) {
    return <Gradient style={[styles.headerRow, b()]}>

      <View style={[styles.headerTextWrap, b()]}>
        <View style={styles.leftArea}>
          <Image style={{height: 25, width: 25, resizeMode: Image.resizeMode.contain}}
            source={{uri: this.props.logo}}/>
          <T style={styles.headerText}>
            {headerText}
          </T>
        </View>
      </View>

    </Gradient>
  }

  selectDenomination = (key: string) => () => {
    console.log('src/modules/UI/scences/Settings/CurrencySettings.ui.js/selectDenomination', key)
    return this.props.selectDenomination(key)
  }

  onPressSpendingLimits = () => {
    const pluginName = this.props.pluginName
    Actions[`${pluginName}SpendingLimits`]()
  }

  render () {
    return (
      <View style={[styles.ethereumSettings, b()]}>
        <Gradient style={styles.gradient} />
        <View style={styles.container}>
          {this.header(SETTINGS_DENOMINATION_TEXT)}

          <RadioRows style={b()}>
            {
              this.props.denominations.map((denomination) => {
                const key = denomination.multiplier
                const left = <View style={{flexDirection: 'row'}}><T style={styles.symbol}>{denomination.symbol}</T><T> - {denomination.name}</T></View>
                const right = 'Right'
                const isSelected = key === this.props.selectedDenominationKey
                const onPress = this.selectDenomination(key)
                return <Row key={denomination.multiplier}
                  denomination={denomination}
                  left={left} right={right}
                  isSelected={isSelected}
                  onPress={onPress} />
              })
            }
          </RadioRows>

          {this.header(SETTINGS_OPTIONS_TEXT)}
          <RowRoute leftText={SPENDING_LIMITS_TEXT} routeFunction={this.onPressSpendingLimits} />
        </View>
      </View>
    )
  }
}
