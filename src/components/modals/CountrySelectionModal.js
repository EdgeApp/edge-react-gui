// @flow

import { FormField, MaterialInputStyle } from 'edge-components'
import * as React from 'react'
import { FlatList, Image, StyleSheet, TouchableHighlight, View } from 'react-native'
import { getCountry } from 'react-native-localize'

import { COUNTRY_CODES, FLAG, FLAG_LOGO_URL, FONT_AWESOME } from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'
import { type AirshipBridge, AirshipModal, IconCircle } from './modalParts.js'

type CountrySelectionModalProps = {
  countryCode: string,
  bridge: AirshipBridge<string>
}

type CountrySelectionModalState = {
  input: string,
  countryCode: string
}

export class CountrySelectionModal extends React.Component<CountrySelectionModalProps, CountrySelectionModalState> {
  constructor(props: CountrySelectionModalProps) {
    super(props)
    const deviceCountry = getCountry() // "US"
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
        <TouchableHighlight style={styles.singleCountry} onPress={() => bridge.resolve(data.item['alpha-2'])} underlayColor={THEME.COLORS.GRAY_4}>
          <View style={styles.countryInfoWrap}>
            <View style={styles.countryLeft}>
              <View style={styles.countryLogo}>
                <Image source={{ uri: logoUrl }} style={{ height: scale(40), width: scale(40), borderRadius: 20 }} />
              </View>
              <View style={styles.countryLeftTextWrap}>
                <FormattedText style={styles.countryName}>{data.item.name}</FormattedText>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  render() {
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
        {gap => (
          <>
            <IconCircle>
              <Icon type={FONT_AWESOME} name={FLAG} size={36} />
            </IconCircle>
            <View style={{ flex: 1, paddingLeft: scale(12), paddingRight: scale(12) }}>
              <FormField
                autoFocus
                error=""
                keyboardType="default"
                label={s.strings.buy_sell_crypto_select_country_button}
                onChangeText={this.updateCountryInput}
                style={MaterialInputStyle}
                value={input}
              />
              <FlatList
                style={{ flex: 1, marginBottom: -gap.bottom }}
                contentContainerStyle={{ paddingBottom: gap.bottom }}
                data={finalCountryCodes}
                initialNumToRender={24}
                keyboardShouldPersistTaps="handled"
                keyExtractor={this.keyExtractor}
                renderItem={this._renderItem}
              />
            </View>
          </>
        )}
      </AirshipModal>
    )
  }

  keyExtractor = (item: { filename?: string, name: string, 'alpha-2': string }, index: number) => item.name
}

const rawStyles = {
  singleCountry: {
    height: scale(60),
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.COUNTRY_SELECTION_MODAL_GRAY_1,
    padding: scale(10),
    paddingRight: scale(15),
    paddingLeft: scale(15)
  },
  singleCountryWrap: {
    flexDirection: 'column',
    flex: 1
  },
  countryInfoWrap: {
    flexDirection: 'row',
    height: scale(40),
    flex: 1,
    justifyContent: 'space-between'
  },
  countryLeft: {
    flexDirection: 'row'
  },
  countryLogo: {
    width: scale(40),
    height: scale(40),
    marginRight: scale(10)
  },
  countryLeftTextWrap: {
    justifyContent: 'center'
  },
  countryName: {
    fontSize: scale(16),
    color: THEME.COLORS.COUNTRY_SELECTION_MODAL_GRAY_2,
    textAlignVertical: 'center'
  },
  selectedItem: {
    backgroundColor: THEME.COLORS.GRAY_4,
    borderLeftWidth: scale(1),
    borderLeftColor: THEME.COLORS.GRAY_3,
    borderRightWidth: scale(1),
    borderRightColor: THEME.COLORS.GRAY_3
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
