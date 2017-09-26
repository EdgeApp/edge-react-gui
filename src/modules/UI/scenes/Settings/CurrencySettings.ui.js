import React, {Component} from 'react'
import {Image, View} from 'react-native'
import strings from '../../../../locales/default'
import T from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui'
import s from './style'
import {border as b} from '../../../utils'
import Row from './components/Row.ui.js'
import RadioRows from './components/RadioRows.ui.js'

export default class CurrencySettings extends Component {
  header () {
    return <Gradient style={[s.headerRow, b()]}>

      <View style={[s.headerTextWrap, b()]}>
        <View style={s.leftArea}>
          <Image style={{height: 25, width: 25, resizeMode: Image.resizeMode.contain}}
            source={{uri: this.props.logo}}/>
          <T style={s.headerText}>
            {strings.enUS['settings_denominations_title']}
          </T>
        </View>
      </View>

    </Gradient>
  }

  selectDenomination = (key) => () => {
    console.log('setDenomination', key)
    return this.props.selectDenomination(key)
  }

  render () {
    return (
      <View style={[s.ethereumSettings, b()]}>

        {this.header()}

        <RadioRows style={b()}>
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
