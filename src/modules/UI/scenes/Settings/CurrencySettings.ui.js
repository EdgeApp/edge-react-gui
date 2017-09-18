import React, {Component} from 'react'
import {Image, View} from 'react-native'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import T from '../../components/FormattedText'
import LinearGradient from 'react-native-linear-gradient'
import s from './style'
import {border as b} from '../../../utils'
import Row from './components/Row.ui.js'
import RadioRows from './components/RadioRows.ui.js'

export default class CurrencySettings extends Component {
  header () {
    return <LinearGradient style={[s.headerRow, b('purple')]}
      start={{x: 0, y: 0}} end={{x: 1, y: 0}}
      colors={['#3B7ADA', '#2B5698']}>

      <View style={[s.headerTextWrap, b('yellow')]}>
        <View style={s.leftArea}>
          <Image style={{height: 25, width: 25, resizeMode: Image.resizeMode.contain}}
            source={{uri: this.props.logo}}/>
          <T style={s.headerText}>
            {sprintf(strings.enUS['settings_denominations_title'])}
          </T>
        </View>
      </View>

    </LinearGradient>
  }

  selectDenomination = (key) => () => {
    console.log('setDenomination', key)
    return this.props.selectDenomination(key)
  }

  render () {
    return (
      <View style={[s.ethereumSettings, b('brown')]}>

        {this.header()}

        <RadioRows style={b('green')}>
          {
            this.props.denominations.map((denomination) => {
              const key = denomination.multiplier
              const left = `${denomination.symbol} - ${denomination.name}`
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
      </View>
    )
  }
}
