// @flow

import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { Alert, FlatList, View } from 'react-native'

import { getSpecialCurrencyInfo, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { type TestProps, connect } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { type CreateWalletType, type FlatListItem } from '../../types/types.js'
import { getCreateWalletTypes } from '../../util/CurrencyInfoHelpers.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow.js'
import { OutlinedTextInput } from '../themed/OutlinedTextInput.js'
import { SceneHeader } from '../themed/SceneHeader'

type OwnProps = {
  navigation: NavigationProp<'createWalletReview'>
}
type StateProps = {
  account: EdgeAccount
}
type Props = StateProps & OwnProps & ThemeProps & TestProps

type State = {
  selectedWalletType: string,
  searchTerm: string
}

export class CreateWalletSelectCryptoComponent extends React.Component<Props & TestProps, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      selectedWalletType: '',
      searchTerm: ''
    }
  }

  getWalletType(walletType: string): CreateWalletType | void {
    const { account } = this.props
    return getCreateWalletTypes(account).find(type => type.walletType === walletType)
  }

  onNext = () => {
    const { navigation } = this.props
    const { selectedWalletType } = this.state

    // Find the details about the wallet type:
    const createWalletType = this.getWalletType(selectedWalletType)
    if (createWalletType == null) {
      Alert.alert(s.strings.create_wallet_invalid_input, s.strings.create_wallet_select_valid_crypto)
      return
    }

    // Does this wallet type support private key import?
    const { walletType } = createWalletType
    const { isImportKeySupported } = getSpecialCurrencyInfo(walletType)

    // Go to the next screen:
    if (isImportKeySupported) {
      navigation.navigate('createWalletChoice', {
        selectedWalletType: createWalletType
      })
    } else {
      navigation.navigate('createWalletSelectFiat', {
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

  renderWalletTypeResult = (data: FlatListItem<CreateWalletType>) => {
    const { currencyCode, pluginId } = data.item
    // Ripple hack:
    let { currencyName, walletType } = data.item
    if (currencyCode.toLowerCase() === 'xrp') currencyName = 'Ripple'

    return (
      <CreateWalletSelectCryptoRow
        currencyCode={currencyCode}
        pluginId={pluginId}
        walletName={currencyName}
        onPress={() => this.handleSelectWalletType(data.item)}
        ref={this.props.generateTestHook(`CreateCryptoWalletScene.${walletType}Row`)}
      />
    )
  }

  keyExtractor = (item: CreateWalletType, index: number): string => {
    return item.walletType
  }

  render() {
    const { account } = this.props
    const { searchTerm } = this.state
    const lowerSearch = searchTerm.toLowerCase()
    const styles = getStyles(this.props.theme)

    // Sort and filter the available types:
    const sortedArray = getCreateWalletTypes(account)
    const filteredArray = sortedArray.filter(
      entry =>
        !SPECIAL_CURRENCY_INFO[entry.pluginId]?.keysOnlyMode &&
        (entry.currencyName.toLowerCase().indexOf(lowerSearch) >= 0 || entry.currencyCode.toLowerCase().indexOf(lowerSearch) >= 0)
    )

    return (
      <SceneWrapper avoidKeyboard background="theme">
        {gap => (
          <View style={[styles.content, { marginBottom: -gap.bottom }]}>
            <SceneHeader withTopMargin title={s.strings.title_create_wallet_select_crypto} />
            <OutlinedTextInput
              autoCorrect={false}
              autoCapitalize="words"
              onChangeText={this.handleSearchTermChange}
              value={this.state.searchTerm}
              label={s.strings.create_wallet_choose_crypto}
              returnKeyType="search"
              marginRem={[0, 1.75]}
              searchIcon
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
              ref={this.props.generateTestHook('CreateWalletSelectCryptoScene.CurrencyCodeList')}
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
  }
}))

export const CreateWalletSelectCryptoScene = connect<StateProps, {}, OwnProps & TestProps>(
  state => ({
    account: state.core.account
  }),
  dispatch => ({})
)(withTheme(CreateWalletSelectCryptoComponent))
