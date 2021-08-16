// @flow

import * as React from 'react'
import { FlatList, Image } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { getCountry } from 'react-native-localize'

import { COUNTRY_CODES, FLAG_LOGO_URL } from '../../constants/CountryConstants.js'
import s from '../../locales/strings.js'
import type { CountryData } from '../../types/types'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts'
import { type OutlinedTextInputRef, OutlinedTextInput } from '../themed/OutlinedTextInput.js'
import { SelectableRow } from '../themed/SelectableRow'
import { ThemedModal } from '../themed/ThemedModal'

type CountrySelectionModalProps = {
  countryCode: string,
  bridge: AirshipBridge<string>
}

type CountrySelectionModalState = {
  input: string,
  countryCode: string,
  isFocused: boolean
}

type Props = CountrySelectionModalProps & ThemeProps

class CountrySelectionModalComponent extends React.Component<Props, CountrySelectionModalState> {
  textInput: { current: OutlinedTextInputRef | null } = React.createRef()
  constructor(props: Props) {
    super(props)
    const deviceCountry = getCountry() // "US"
    this.state = {
      input: '',
      countryCode: props.countryCode || deviceCountry || 'US',
      isFocused: true
    }
  }

  updateCountryInput = (input: string) => {
    this.setState({
      input
    })
  }

  handleSelectCountry = (selected: string) => this.props.bridge.resolve(selected)

  handleClose = () => this.props.bridge.resolve(this.state.countryCode)

  clearText = () => {
    this.setState({ input: '' })
    if (this.textInput.current) {
      this.textInput.current.blur()
    }
  }

  handleOnFocus = () => {
    this.setState({ isFocused: true })
  }

  handleOnBlur = () => {
    this.setState({ isFocused: false })
  }

  _renderItem = (data: { item: CountryData }) => {
    const { theme } = this.props
    const { countryCode } = this.state
    const styles = getStyles(theme)
    const filename = data.item.filename ? data.item.filename : data.item.name.toLowerCase().replace(' ', '-')
    const logoUrl = `${FLAG_LOGO_URL}/${filename}.png`

    return (
      <SelectableRow
        onPress={() => this.handleSelectCountry(data.item['alpha-2'])}
        icon={<Image source={{ uri: logoUrl }} style={styles.image} />}
        title={data.item['alpha-2']}
        subTitle={data.item.name}
        selected={data.item['alpha-2'] === countryCode}
        arrowTappable
      />
    )
  }

  render() {
    const { bridge, theme } = this.props
    const { input, countryCode, isFocused } = this.state
    const styles = getStyles(theme)
    const lowerCaseInput = input.toLowerCase()
    const upperCaseInput = input.toUpperCase()
    const filteredCountryCodes: CountryData[] = COUNTRY_CODES.filter(country => {
      return (
        country.name.toLowerCase().includes(lowerCaseInput) ||
        (country.filename && country.filename.includes(lowerCaseInput)) ||
        (country['alpha-2'] && country['alpha-2'].includes(upperCaseInput))
      )
    })
    const currentCountryCodeIndex = filteredCountryCodes.findIndex(country => country['alpha-2'] === countryCode)
    const currentCountryData = filteredCountryCodes.splice(currentCountryCodeIndex, 1)
    const finalCountryCodes = [...currentCountryData, ...filteredCountryCodes]

    return (
      <ThemedModal bridge={bridge} onCancel={this.handleClose} paddingRem={[1, 0]}>
        <ModalTitle center paddingRem={[0, 1, 0.5]}>
          {s.strings.buy_sell_crypto_select_country_button}
        </ModalTitle>
        <OutlinedTextInput
          autoFocus
          keyboardType="default"
          label={s.strings.buy_sell_crypto_select_country_button}
          onChangeText={this.updateCountryInput}
          value={input}
          onFocus={this.handleOnFocus}
          onBlur={this.handleOnBlur}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          size="small"
          onClear={this.clearText}
          isClearable={isFocused}
          marginRem={[0, 1.75]}
          ref={this.textInput}
          blurOnSubmit
          searchIcon
        />
        <FlatList
          style={styles.list}
          data={finalCountryCodes}
          initialNumToRender={24}
          keyboardShouldPersistTaps="handled"
          keyExtractor={this.keyExtractor}
          renderItem={this._renderItem}
        />
        <ModalCloseArrow onPress={this.handleClose} />
      </ThemedModal>
    )
  }

  keyExtractor = (item: { filename?: string, name: string, 'alpha-2': string }, index: number) => item.name
}

const getStyles = cacheStyles((theme: Theme) => ({
  list: {
    flex: 1
  },
  image: {
    height: theme.rem(2),
    width: theme.rem(2)
  }
}))

export const CountrySelectionModal = withTheme(CountrySelectionModalComponent)
