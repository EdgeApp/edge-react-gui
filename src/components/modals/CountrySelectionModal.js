// @flow

import { FormField, MaterialInputStyle } from 'edge-components'
import React, { Component } from 'react'
import { FlatList, Image, TouchableHighlight, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'

import { COUNTRY_CODES, FLAG, FLAG_LOGO_URL, FONT_AWESOME } from '../../constants/indexConstants'
import { scale } from '../../lib/scaling.js'
import s from '../../locales/strings.js'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import styles from '../../styles/components/CountrySelectionModalStyle.js'
import { colors } from '../../theme/variables/airbitz.js'
import { type AirshipBridge } from '../common/Airship.js'
import { AirshipModal } from '../common/AirshipModal.js'
import { IconCircle } from '../common/IconCircle.js'

type CountrySelectionModalProps = {
  countryCode: string,
  bridge: AirshipBridge<string>
}

type CountrySelectionModalState = {
  input: string,
  countryCode: string
}

export class CountrySelectionModal extends Component<CountrySelectionModalProps, CountrySelectionModalState> {
  constructor (props: CountrySelectionModalProps) {
    super(props)
    const deviceCountry = DeviceInfo.getDeviceCountry() // "US"
    this.state = {
      input: '',
      countryCode: props.countryCode || deviceCountry || 'US'
    }
  }

  updateCountryInput = (input: string) => {
    this.setState({
      input
    })
  }

  _renderItem = data => {
    const { bridge } = this.props
    const { countryCode } = this.state
    const filename = data.item.filename ? data.item.filename : data.item.name.toLowerCase().replace(' ', '-')
    const logoUrl = `${FLAG_LOGO_URL}/${filename}.png`

    return (
      <View style={[styles.singleCountryWrap, data.item['alpha-2'] === countryCode && styles.selectedItem]}>
        <TouchableHighlight style={[styles.singleCountry]} onPress={() => bridge.resolve(data.item['alpha-2'])} underlayColor={styles.underlayColor.color}>
          <View style={[styles.countryInfoWrap]}>
            <View style={styles.countryLeft}>
              <View style={[styles.countryLogo]}>
                <Image source={{ uri: logoUrl }} style={{ height: scale(40), width: scale(40), borderRadius: 20 }} />
              </View>
              <View style={[styles.countryLeftTextWrap]}>
                <FormattedText style={[styles.countryName]}>{data.item.name}</FormattedText>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  render () {
    const { bridge } = this.props
    const { input, countryCode } = this.state
    const lowerCaseInput = input.toLowerCase()
    const filteredCountryCodes = COUNTRY_CODES.filter(country => {
      return country.name.toLowerCase().includes(lowerCaseInput) || (country.filename && country.filename.includes(lowerCaseInput))
    })
    const currentCountryCodeIndex = filteredCountryCodes.findIndex(country => country['alpha-2'] === countryCode)
    const currentCountryData = filteredCountryCodes.splice(currentCountryCodeIndex, 1)
    const finalCountryCodes = [...currentCountryData, ...filteredCountryCodes]

    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(this.state.countryCode)}>
        <IconCircle>
          <Icon type={FONT_AWESOME} name={FLAG} size={36} color={colors.primary} />
        </IconCircle>
        <View style={{ flex: 1, paddingLeft: scale(12), paddingRight: scale(12) }}>
          <FormField
            style={MaterialInputStyle}
            value={input}
            onChangeText={this.updateCountryInput}
            error={''}
            keyboardType={'default'}
            label={s.strings.buy_sell_crypto_select_country_button}
          />
          <FlatList
            style={{ flex: 1 }}
            data={finalCountryCodes}
            initialNumToRender={24}
            keyboardShouldPersistTaps="handled"
            keyExtractor={this.keyExtractor}
            renderItem={this._renderItem}
          />
        </View>
      </AirshipModal>
    )
  }

  keyExtractor = (item: { filename?: string, name: string, 'alpha-2': string }, index: number) => item.name
}
