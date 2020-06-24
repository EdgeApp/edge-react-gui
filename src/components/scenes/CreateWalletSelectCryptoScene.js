// @flow

import { type EdgeAccount } from 'edge-core-js'
import React, { Component } from 'react'
import { Alert, FlatList, Image, Keyboard, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { CREATE_WALLET_CHOICE, CREATE_WALLET_SELECT_FIAT, getSpecialCurrencyInfo } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import styles, { styles as stylesRaw } from '../../styles/scenes/CreateWalletStyle.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import { type CreateWalletType, type FlatListItem } from '../../types/types.js'
import { getCreateWalletTypes } from '../../util/CurrencyInfoHelpers.js'
import { scale } from '../../util/scaling.js'
import { FormField } from '../common/FormField.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type StateProps = {
  account: EdgeAccount
}
type Props = StateProps

type State = {
  selectedWalletType: string,
  searchTerm: string
}

class CreateWalletSelectCryptoComponent extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      selectedWalletType: '',
      searchTerm: ''
    }
  }

  getWalletType(walletType: string): CreateWalletType | void {
    const { account } = this.props
    return getCreateWalletTypes(account).find(type => type.value === walletType)
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
      Actions[CREATE_WALLET_CHOICE]({
        selectedWalletType: createWalletType
      })
    } else {
      Actions[CREATE_WALLET_SELECT_FIAT]({
        selectedWalletType: createWalletType
      })
    }
  }

  onBack = () => {
    Keyboard.dismiss()
    Actions.pop() // redirect to the list of wallets
  }

  handleSearchTermChange = (searchTerm: string): void => {
    this.setState({
      searchTerm
    })
  }

  handleSelectWalletType = (item: CreateWalletType): void => {
    this.setState({ selectedWalletType: item.value }, this.onNext)
  }

  handleOnFocus = () => {}

  handleOnBlur = () => {}

  render() {
    const { account } = this.props
    const { searchTerm } = this.state
    const lowerSearch = searchTerm.toLowerCase()

    // Sort and filter the available types:
    const sortedArray = getCreateWalletTypes(account)
    const filteredArray = sortedArray.filter(
      entry => entry.label.toLowerCase().indexOf(lowerSearch) >= 0 || entry.currencyCode.toLowerCase().indexOf(lowerSearch) >= 0
    )

    const formFieldHeight = scale(50)

    return (
      <SceneWrapper avoidKeyboard background="body">
        {gap => (
          <View style={[styles.content, { marginBottom: -gap.bottom }]}>
            <FormField
              autoFocus
              containerStyle={{ height: formFieldHeight }}
              style={styles.picker}
              clearButtonMode="while-editing"
              onFocus={this.handleOnFocus}
              onBlur={this.handleOnBlur}
              autoCorrect={false}
              autoCapitalize="words"
              onChangeText={this.handleSearchTermChange}
              value={this.state.searchTerm}
              label={s.strings.create_wallet_choose_crypto}
              returnKeyType="search"
              autpCorrect={false}
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

  renderWalletTypeResult = (data: FlatListItem<CreateWalletType>) => {
    const { value, symbolImageDarkMono, currencyCode } = data.item

    // Ripple hack:
    let { label } = data.item
    if (currencyCode.toLowerCase() === 'xrp') label = 'Ripple'

    return (
      <View style={[styles.singleCryptoTypeWrap, value === this.state.selectedWalletType && styles.selectedItem]}>
        <TouchableHighlight
          style={styles.singleCryptoType}
          onPress={() => this.handleSelectWalletType(data.item)}
          underlayColor={stylesRaw.underlayColor.color}
        >
          <View style={styles.cryptoTypeInfoWrap}>
            <View style={styles.cryptoTypeLeft}>
              <View style={styles.cryptoTypeLogo}>
                {symbolImageDarkMono ? (
                  <Image source={{ uri: symbolImageDarkMono }} style={[styles.cryptoTypeLogo, { borderRadius: 20 }]} />
                ) : (
                  <View style={styles.cryptoTypeLogo} />
                )}
              </View>
              <View style={styles.cryptoTypeLeftTextWrap}>
                <Text style={styles.cryptoTypeName}>
                  {label} - {currencyCode}
                </Text>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  keyExtractor = (item: CreateWalletType, index: number): string => {
    return item.value
  }
}

export const CreateWalletSelectCryptoScene = connect(
  (state: ReduxState): StateProps => ({
    account: state.core.account
  }),
  (dispatch: Dispatch) => ({})
)(CreateWalletSelectCryptoComponent)
