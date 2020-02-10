// @flow

import React, { Component } from 'react'
import { Alert, FlatList, Image, Keyboard, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { CREATE_WALLET_CHOICE, CREATE_WALLET_SELECT_FIAT, getSpecialCurrencyInfo } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import Text from '../../modules/UI/components/FormattedText/index'
import styles, { styles as stylesRaw } from '../../styles/scenes/CreateWalletStyle.js'
import type { FlatListItem, GuiWalletType } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import * as UTILS from '../../util/utils'
import { FormField } from '../common/FormField.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { showError } from '../services/AirshipInstance.js'

const WALLET_TYPE_ORDER = [
  'wallet:bitcoin-bip44',
  'wallet:bitcoin-bip49',
  'wallet:bitcoincash',
  'wallet:monero',
  'wallet:ethereum',
  'wallet:binance',
  'wallet:bitcoinsv',
  'wallet:litecoin',
  'wallet:eos',
  'wallet:ripple',
  'wallet:rsk',
  'wallet:stellar',
  'wallet:dash',
  'wallet:tezos',
  'wallet:digibyte',
  'wallet:vertcoin',
  'wallet:ravencoin',
  'wallet:qtum',
  'wallet:feathercoin',
  'wallet:bitcoingold',
  'wallet:smartcash',
  'wallet:groestlcoin',
  'wallet:zcoin',
  'wallet:ufo',
  'wallet:fio'
]

export type CreateWalletSelectCryptoOwnProps = {
  supportedWalletTypes: Array<GuiWalletType>
}
export type CreateWalletSelectCryptoStateProps = {
  supportedWalletTypes: Array<GuiWalletType>
}

type Props = CreateWalletSelectCryptoOwnProps & CreateWalletSelectCryptoStateProps

type State = {
  selectedWalletType: string,
  sortedWalletTypes: Array<GuiWalletType>,
  searchTerm: string,
  errorShown: boolean
}

export class CreateWalletSelectCrypto extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      selectedWalletType: '',
      sortedWalletTypes: [],
      searchTerm: '',
      errorShown: false
    }
  }

  isValidWalletType = () => {
    const { selectedWalletType } = this.state
    const { sortedWalletTypes } = this.state
    const walletTypeValue = sortedWalletTypes.findIndex(walletType => walletType.value === selectedWalletType)

    const isValid: boolean = walletTypeValue >= 0
    return isValid
  }

  getWalletType = (walletTypeValue: string): GuiWalletType => {
    const { sortedWalletTypes } = this.state
    const foundValueIndex = sortedWalletTypes.findIndex(walletType => walletType.value === walletTypeValue)
    const foundValue = sortedWalletTypes[foundValueIndex]

    return foundValue
  }

  onNext = () => {
    const { selectedWalletType } = this.state
    const walletType = this.getWalletType(selectedWalletType)
    const currencyCode = walletType.currencyCode
    const specialcurrencyInfo = getSpecialCurrencyInfo(currencyCode)
    const isImportKeySupported = specialcurrencyInfo.isImportKeySupported
    if (this.isValidWalletType()) {
      if (isImportKeySupported) {
        Actions[CREATE_WALLET_CHOICE]({
          selectedWalletType: this.getWalletType(selectedWalletType)
        })
      } else {
        Actions[CREATE_WALLET_SELECT_FIAT]({ selectedWalletType: this.getWalletType(selectedWalletType) })
      }
    } else {
      Alert.alert(s.strings.create_wallet_invalid_input, s.strings.create_wallet_select_valid_crypto)
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

  handleSelectWalletType = (item: GuiWalletType): void => {
    const selectedWalletType = this.state.sortedWalletTypes.find(type => type.value === item.value)
    if (selectedWalletType) {
      this.setState(
        {
          selectedWalletType: selectedWalletType.value,
          searchTerm: selectedWalletType.label
        },
        this.onNext
      )
    }
  }

  handleOnFocus = () => {
    UTILS.noOp()
  }

  handleOnBlur = () => {
    UTILS.noOp()
  }

  static getDerivedStateFromProps (nextProps: Props, prevState: State) {
    let { errorShown } = prevState
    // Sort the wallet types
    const sortedWalletTypes: Array<GuiWalletType> = []
    const walletTypesCopy: Array<GuiWalletType> = [].concat(nextProps.supportedWalletTypes)
    let unloadedWalletCount = 0
    for (const wt of WALLET_TYPE_ORDER) {
      const idx = walletTypesCopy.findIndex(gwt => gwt.value === wt)
      if (idx >= 0) {
        sortedWalletTypes.push(walletTypesCopy[idx])
        walletTypesCopy.splice(idx, 1)
      } else {
        unloadedWalletCount++
      }
    }
    if (unloadedWalletCount) {
      if (!errorShown) {
        showError(s.strings.create_wallet_selcet_crypto_unloaded_plugins_error)
        errorShown = true
      }
    }
    sortedWalletTypes.push(...walletTypesCopy)
    return { sortedWalletTypes, errorShown }
  }

  render () {
    const filteredArray = this.state.sortedWalletTypes.filter(entry => {
      return (
        entry.label.toLowerCase().indexOf(this.state.searchTerm.toLowerCase()) >= 0 ||
        entry.currencyCode.toLowerCase().indexOf(this.state.searchTerm.toLowerCase()) >= 0
      )
    })
    const formFieldHeight = scale(50)

    return (
      <SceneWrapper avoidKeyboard background="body">
        {gap => (
          <View style={[styles.content, { marginBottom: -gap.bottom }]}>
            <FormField
              autoFocus
              containerStyle={{ height: formFieldHeight }}
              style={styles.picker}
              clearButtonMode={'while-editing'}
              onFocus={this.handleOnFocus}
              onBlur={this.handleOnBlur}
              autoCorrect={false}
              autoCapitalize={'words'}
              onChangeText={this.handleSearchTermChange}
              value={this.state.searchTerm}
              label={s.strings.create_wallet_choose_crypto}
              returnKeyType={'search'}
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

  renderWalletTypeResult = (data: FlatListItem) => {
    return (
      <View style={[styles.singleCryptoTypeWrap, data.item.value === this.state.selectedWalletType && styles.selectedItem]}>
        <TouchableHighlight
          style={[styles.singleCryptoType]}
          onPress={() => this.handleSelectWalletType(data.item)}
          underlayColor={stylesRaw.underlayColor.color}
        >
          <View style={[styles.cryptoTypeInfoWrap]}>
            <View style={styles.cryptoTypeLeft}>
              <View style={[styles.cryptoTypeLogo]}>
                {data.item.symbolImageDarkMono ? (
                  <Image source={{ uri: data.item.symbolImageDarkMono }} style={[styles.cryptoTypeLogo, { borderRadius: 20 }]} />
                ) : (
                  <View style={styles.cryptoTypeLogo} />
                )}
              </View>
              <View style={[styles.cryptoTypeLeftTextWrap]}>
                <Text style={[styles.cryptoTypeName]}>
                  {data.item.label} - {data.item.currencyCode}
                </Text>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  keyExtractor = (item: GuiWalletType, index: number): string => {
    return item.value
  }
}
