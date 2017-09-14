import React, {Component} from 'react'
import {connect} from 'react-redux'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import {View} from 'react-native'
import T from '../../components/FormattedText'
import LinearGradient from 'react-native-linear-gradient'
import IonIcon from 'react-native-vector-icons/Ionicons'
import s from './style'
import {border as b} from '../../../utils'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import {setDenominationKeyRequest} from './action'
import Row from './components/Row.ui.js'
import RadioRows from './components/RadioRows.ui.js'

export class ETHSettings extends Component {
  render () {
    return (
      <View style={[s.ethereumSettings, b('brown')]}>
        <LinearGradient style={[s.headerRow, b('purple')]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} colors={['#3B7ADA', '#2B5698']}>
          <View style={[s.headerTextWrap, b('yellow')]}>
            <View style={s.leftArea}>
              <IonIcon name='logo-bitcoin' style={[s.headerIcon, b('green')]} color='white' size={24} />
              <T style={s.headerText}>
                {sprintf(strings.enUS['settings_denomination_title_eth'])}
              </T>
            </View>
          </View>
        </LinearGradient>
        <RadioRows style={b('green')} onSelect={(denomination) => this.selectDenomination('ETH', denomination)}>
          {
            this.props.denominations.map((denomination) => {
              const key = denomination.multiplier
              const left = `${denomination.symbol} - ${denomination.name}`
              const right = 'Right'
              const isSelected = key === this.props.selectedDenominationKey
              const onPress = () => this.props.selectDenomination('ETH', key)
              return <Row key={denomination.multiplier} denomination={denomination} left={left} right={right} isSelected={isSelected} onPress={onPress} />
            })
          }
        </RadioRows>
      </View>
    )
  }
}

const mapStateToProps = (state) => ({
  denominations: SETTINGS_SELECTORS.getDenominations(state, 'ETH'),
  selectedDenominationKey: SETTINGS_SELECTORS.getDisplayDenominationKey(state, 'ETH')
})
const mapDispatchToProps = (dispatch) => ({
  selectDenomination: (currencyCode, denominationKey) => dispatch(setDenominationKeyRequest(currencyCode, denominationKey))
})
export default connect(mapStateToProps, mapDispatchToProps)(ETHSettings)
