// @flow

import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { Alert, FlatList, Image, View } from 'react-native'

import { CREATE_WALLET_CHOICE, CREATE_WALLET_SELECT_FIAT } from '../../constants/SceneKeys.js'
import { getSpecialCurrencyInfo, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes.js'
import { type CreateWalletType, type FlatListItem } from '../../types/types.js'
import { getCreateWalletTypes } from '../../util/CurrencyInfoHelpers.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { OutlinedTextInput } from '../themed/OutlinedTextInput.js'
import { SceneHeader } from '../themed/SceneHeader'
import { SelectableRow } from '../themed/SelectableRow'

type StateProps = {
  account: EdgeAccount
}
type Props = StateProps & ThemeProps

type State = {
  selectedWalletType: string,
  searchTerm: string,
  isFocused: boolean
}

class CreateWalletSelectCryptoComponent extends React.Component<Props, State> {
  textInput = React.createRef()

  constructor(props: Props) {
    super(props)
    this.state = {
      selectedWalletType: '',
      searchTerm: '',
      isFocused: true
    }
  }

  getWalletType(walletType: string): CreateWalletType | void {
    const { account } = this.props
    return getCreateWalletTypes(account).find(type => type.walletType === walletType)
  }

  onNext = () => {
    const { selectedWalletType } = this.state

    // Find the details about the wallet type:
    const createWalletType = this.getWalletType(selectedWalletType)
    if (createWalletType == null) {
      Alert.alert(s.strings.create_wallet_invalid_input, s.strings.create_wallet_select_valid_crypto)
      return
    }

    // Does this wallet type support private key import?
    const { currencyCode } = createWalletType
    const { isImportKeySupported } = getSpecialCurrencyInfo(currencyCode)

    // Go to the next screen:
    if (isImportKeySupported) {
      Actions.push(CREATE_WALLET_CHOICE, {
        selectedWalletType: createWalletType
      })
    } else {
      Actions.push(CREATE_WALLET_SELECT_FIAT, {
        selectedWalletType: createWalletType
      })
    }
  }

  handleSearchTermChange = (searchTerm: string): void => {
    this.setState({
      searchTerm
    })
  }

  handleSelectWalletType = (item: CreateWalletType): void => {
    this.setState({ selectedWalletType: item.walletType }, this.onNext)
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

  renderWalletTypeResult = (data: FlatListItem<CreateWalletType>) => {
    const { theme } = this.props
    const { walletType, symbolImageDarkMono, currencyCode } = data.item
    const styles = getStyles(theme)

    // Ripple hack:
    let { currencyName } = data.item
    if (currencyCode.toLowerCase() === 'xrp') currencyName = 'Ripple'

    return (
      <SelectableRow
        onPress={() => this.handleSelectWalletType(data.item)}
        icon={symbolImageDarkMono ? <Image source={{ uri: symbolImageDarkMono }} style={styles.cryptoTypeLogo} /> : <View style={styles.cryptoTypeLogo} />}
        title={currencyCode}
        subTitle={currencyName}
        selected={walletType === this.state.selectedWalletType}
      />
    )
  }

  keyExtractor = (item: CreateWalletType, index: number): string => {
    return item.walletType
  }

  render() {
    const { account } = this.props
    const { searchTerm, isFocused } = this.state
    const lowerSearch = searchTerm.toLowerCase()
    const styles = getStyles(this.props.theme)

    // Sort and filter the available types:
    const sortedArray = getCreateWalletTypes(account)
    const filteredArray = sortedArray.filter(
      entry =>
        !SPECIAL_CURRENCY_INFO[entry.currencyCode]?.keysOnlyMode &&
        (entry.currencyName.toLowerCase().indexOf(lowerSearch) >= 0 || entry.currencyCode.toLowerCase().indexOf(lowerSearch) >= 0)
    )

    return (
      <SceneWrapper avoidKeyboard background="theme">
        {gap => (
          <View style={[styles.content, { marginBottom: -gap.bottom }]}>
            <SceneHeader withTopMargin title={s.strings.title_create_wallet_select_crypto} />
            <OutlinedTextInput
              autoFocus
              onFocus={this.handleOnFocus}
              onBlur={this.handleOnBlur}
              autoCorrect={false}
              autoCapitalize="words"
              onChangeText={this.handleSearchTermChange}
              value={this.state.searchTerm}
              label={s.strings.create_wallet_choose_crypto}
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
              initialNumToRender={12}
              keyboardShouldPersistTaps="handled"
              keyExtractor={this.keyExtractor}
              renderItem={this.renderWalletTypeResult}
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
    marginLeft: theme.rem(0.25)
  }
}))

export const CreateWalletSelectCryptoScene = connect<StateProps, {}, {}>(
  state => ({
    account: state.core.account
  }),
  dispatch => ({})
)(withTheme(CreateWalletSelectCryptoComponent))
