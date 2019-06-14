// @flow

import { FormField, MaterialInputStyle, Modal } from 'edge-components'
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

type CountrySelectionModalProps = {
  countryCode: string,
  onDone: string => void
}

type CountrySelectionModalState = {
  input: string,
  countryCode: string
}

export class CountrySelectionModal extends Component<CountrySelectionModalProps, CountrySelectionModalState> {
  constructor (props: CountrySelectionModalProps) {
    super(props)
    let input = ''
    if (props.countryCode) {
      const countryData = COUNTRY_CODES.find(country => country['alpha-2'] === props.countryCode)
      if (countryData) input = countryData.name
    }
    const deviceCountry = DeviceInfo.getDeviceCountry() // "US"
    this.state = {
      input,
      countryCode: props.countryCode || deviceCountry || 'US'
    }
  }

  updateCountryInput = (input: string) => {
    this.setState({
      input
    })
  }

  _renderItem = data => {
    const { onDone } = this.props
    const { countryCode } = this.state
    const filename = data.item.filename ? data.item.filename : data.item.name.toLowerCase().replace(' ', '-')
    const logoUrl = `${FLAG_LOGO_URL}/${filename}.png`
    return (
      <View style={[styles.singleCountryWrap, data.item['alpha-2'] === countryCode && styles.selectedItem]}>
        <TouchableHighlight style={[styles.singleCountry]} onPress={() => onDone(data.item['alpha-2'])} underlayColor={styles.underlayColor.color}>
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
    const { input, countryCode } = this.state
    const lowerCaseInput = input.toLowerCase()
    const filteredCountryCodes = COUNTRY_CODES.filter(country => {
      return country.name.toLowerCase().includes(lowerCaseInput) || (country.filename && country.filename.includes(lowerCaseInput))
    })
    const currentCountryCodeIndex = filteredCountryCodes.findIndex(country => country['alpha-2'] === countryCode)
    const currentCountryData = filteredCountryCodes.splice(currentCountryCodeIndex, 1)
    const finalCountryCodes = [...currentCountryData, ...filteredCountryCodes]
    return (
      <View>
        <Modal.Icon>
          <Icon type={FONT_AWESOME} name={FLAG} size={36} color={colors.primary} />
        </Modal.Icon>
        <Modal.Container style={{ borderRadius: 0 }}>
          <Modal.Icon.AndroidHackSpacer />
          <Modal.Body>
            <View>
              <FormField
                style={MaterialInputStyle}
                value={input}
                onChangeText={this.updateCountryInput}
                error={''}
                keyboardType={'default'}
                label={s.strings.buy_sell_crypto_select_country_button}
              />
            </View>
            <FlatList
              style={{ width: '100%', height: 400 }}
              data={finalCountryCodes}
              renderItem={this._renderItem}
              keyExtractor={this.keyExtractor}
              initialNumToRender={24}
            />
          </Modal.Body>
        </Modal.Container>
      </View>
    )
  }

  keyExtractor = (item: { filename?: string, name: string, ['alpha-2']: string }, index: number) => item.name
}

export const createCountrySelectionModal = (args: { countryCode: string }) =>
  function CountrySelectionComponent (props: { +onDone: Function }) {
    return <CountrySelectionModal {...props} {...args} />
  }
