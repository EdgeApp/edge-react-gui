// @flow

import * as React from 'react'
import { Alert, FlatList, Image, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { FIAT_COUNTRY } from '../../constants/CountryConstants'
import { CREATE_WALLET_ACCOUNT_SETUP, CREATE_WALLET_NAME } from '../../constants/SceneKeys.js'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { getDefaultFiat } from '../../selectors/SettingsSelectors.js'
import { connect } from '../../types/reactRedux.js'
import type { CreateWalletType, FlatListItem, GuiFiatType } from '../../types/types.js'
import { getSupportedFiats } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeTextFieldOutlined } from '../themed/EdgeOutlinedField'
import { SceneHeader } from '../themed/SceneHeader'
import { SelectableRow } from '../themed/SelectableRow'

type OwnProps = {
  selectedWalletType: CreateWalletType,
  cleanedPrivateKey?: string
}
type StateProps = {
  supportedFiats: GuiFiatType[]
}
type Props = OwnProps & StateProps & ThemeProps

type State = {
  searchTerm: string,
  selectedFiat: string,
  isFocused: boolean
}

class CreateWalletSelectFiatComponent extends React.Component<Props, State> {
  textInput = React.createRef()

  constructor(props: Props) {
    super(props)
    this.state = {
      searchTerm: '',
      selectedFiat: '',
      isFocused: true
    }
  }

  isValidFiatType = () => {
    const { selectedFiat } = this.state
    const fiatTypeIndex = this.props.supportedFiats.findIndex(fiatType => fiatType.value === selectedFiat)
    const isValid = fiatTypeIndex >= 0
    return isValid
  }

  getFiatType = (fiatKey: string) => {
    const fiatTypeIndex = this.props.supportedFiats.findIndex(fiatType => fiatType.value === fiatKey)

    return this.props.supportedFiats[fiatTypeIndex]
  }

  onNext = () => {
    const { cleanedPrivateKey, selectedWalletType } = this.props
    if (this.isValidFiatType()) {
      // check if account-based or not
      const specialCurrencyInfo = getSpecialCurrencyInfo(selectedWalletType.currencyCode)
      // check if eos-like
      let nextSceneKey = CREATE_WALLET_NAME
      if (!specialCurrencyInfo.needsAccountNameSetup || cleanedPrivateKey) {
        nextSceneKey = CREATE_WALLET_NAME
      } else {
        nextSceneKey = CREATE_WALLET_ACCOUNT_SETUP
      }
      Actions[nextSceneKey]({
        selectedWalletType: selectedWalletType,
        selectedFiat: this.getFiatType(this.state.selectedFiat),
        cleanedPrivateKey
      })
    } else {
      Alert.alert(s.strings.create_wallet_invalid_input, s.strings.create_wallet_select_valid_fiat)
    }
  }

  handleSearchTermChange = (searchTerm: string) => {
    this.setState({
      searchTerm
    })
  }

  handleSelectFiatType = (item: GuiFiatType) => {
    const selectedFiat = this.props.supportedFiats.find(type => type.value === item.value)

    if (selectedFiat) {
      this.setState(
        {
          selectedFiat: selectedFiat.value
        },
        this.onNext
      )
    }
  }

  clearText = () => {
    this.setState({ searchTerm: '' })
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

  renderFiatTypeResult = (data: FlatListItem<GuiFiatType>) => {
    const styles = getStyles(this.props.theme)
    const fiatCountry = FIAT_COUNTRY[data.item.value]
    if (!fiatCountry) {
      return null
    }

    return (
      <SelectableRow
        onPress={() => this.handleSelectFiatType(data.item)}
        icon={fiatCountry.logoUrl ? <Image source={{ uri: fiatCountry.logoUrl }} style={styles.cryptoTypeLogo} /> : <View style={styles.cryptoTypeLogo} />}
        title={data.item.value}
        subTitle={s.strings[`currency_label_${data.item.value}`]}
        selected={data.item.value === this.state.selectedFiat}
      />
    )
  }

  keyExtractor = (item: GuiFiatType, index: string) => {
    return item.value
  }

  render() {
    const { isFocused } = this.state
    const styles = getStyles(this.props.theme)
    const filteredArray = this.props.supportedFiats.filter(entry => {
      return entry.label.toLowerCase().indexOf(this.state.searchTerm.toLowerCase()) >= 0
    })

    return (
      <SceneWrapper avoidKeyboard background="theme">
        {gap => (
          <View style={[styles.content, { marginBottom: -gap.bottom }]}>
            <SceneHeader withTopMargin title={s.strings.title_create_wallet_select_fiat} />
            <EdgeTextFieldOutlined
              autoFocus
              onFocus={this.handleOnFocus}
              onBlur={this.handleOnBlur}
              autoCorrect={false}
              autoCapitalize="words"
              onChangeText={this.handleSearchTermChange}
              value={this.state.searchTerm}
              label={s.strings.fragment_wallets_addwallet_fiat_hint}
              returnKeyType="search"
              size="small"
              onClear={this.clearText}
              isClearable={isFocused}
              marginRem={[0, 1.75]}
              ref={this.textInput}
              blurOnSubmit
            />
            <FlatList
              style={styles.resultList}
              automaticallyAdjustContentInsets={false}
              contentContainerStyle={{ paddingBottom: gap.bottom }}
              data={filteredArray}
              initialNumToRender={30}
              keyboardShouldPersistTaps="handled"
              keyExtractor={this.keyExtractor}
              renderItem={this.renderFiatTypeResult}
            />
          </View>
        )}
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  content: {
    flex: 1
  },
  resultList: {
    flex: 1
  },
  cryptoTypeLogo: {
    width: theme.rem(2),
    height: theme.rem(2),
    borderRadius: theme.rem(1),
    marginLeft: theme.rem(0.25),
    backgroundColor: theme.backgroundGradientRight
  }
}))

export const CreateWalletSelectFiatScene = connect<StateProps, {}, OwnProps>(
  state => ({
    supportedFiats: getSupportedFiats(getDefaultFiat(state))
  }),
  dispatch => ({})
)(withTheme(CreateWalletSelectFiatComponent))
