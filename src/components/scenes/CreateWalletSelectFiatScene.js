// @flow

import React, { Component } from 'react'
import { Alert, FlatList, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { getDefaultFiat } from '../../modules/Settings/selectors.js'
import Text from '../../modules/UI/components/FormattedText/index'
import styles, { styles as stylesRaw } from '../../styles/scenes/CreateWalletStyle.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import type { FlatListItem, GuiFiatType, GuiWalletType } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { getSupportedFiats } from '../../util/utils'
import { FormField } from '../common/FormField.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type OwnProps = {
  selectedWalletType: GuiWalletType,
  cleanedPrivateKey?: string
}
type StateProps = {
  supportedFiats: Array<GuiFiatType>
}
type Props = OwnProps & StateProps

type State = {
  searchTerm: string,
  selectedFiat: string
}

class CreateWalletSelectFiatComponent extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      searchTerm: '',
      selectedFiat: ''
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
      const specialCurrencyInfo = Constants.getSpecialCurrencyInfo(selectedWalletType.currencyCode)
      // check if eos-like
      let nextSceneKey = Constants.CREATE_WALLET_NAME
      if (!specialCurrencyInfo.needsAccountNameSetup || cleanedPrivateKey) {
        nextSceneKey = Constants.CREATE_WALLET_NAME
      } else {
        nextSceneKey = Constants.CREATE_WALLET_ACCOUNT_SETUP
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
          selectedFiat: selectedFiat.value,
          searchTerm: selectedFiat.label
        },
        this.onNext
      )
    }
  }

  handleOnFocus = () => {}

  handleOnBlur = () => {}

  render () {
    const filteredArray = this.props.supportedFiats.filter(entry => {
      return entry.label.toLowerCase().indexOf(this.state.searchTerm.toLowerCase()) >= 0
    })
    const formFieldHeight = scale(50)

    return (
      <SceneWrapper avoidKeyboard background="body">
        {gap => (
          <View style={[styles.content, { marginBottom: -gap.bottom }]}>
            <FormField
              style={styles.picker}
              autoFocus
              containerStyle={{ height: formFieldHeight }}
              clearButtonMode={'while-editing'}
              onFocus={this.handleOnFocus}
              onBlur={this.handleOnBlur}
              autoCorrect={false}
              autoCapitalize={'words'}
              onChangeText={this.handleSearchTermChange}
              value={this.state.searchTerm}
              label={s.strings.fragment_wallets_addwallet_fiat_hint}
              returnKeyType={'search'}
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

  renderFiatTypeResult = (data: FlatListItem<GuiFiatType>) => {
    return (
      <View style={[styles.singleCryptoTypeWrap, data.item.value === this.state.selectedFiat && styles.selectedItem]}>
        <TouchableHighlight
          style={[styles.singleCryptoType]}
          onPress={() => this.handleSelectFiatType(data.item)}
          underlayColor={stylesRaw.underlayColor.color}
        >
          <View style={[styles.cryptoTypeInfoWrap]}>
            <View style={styles.cryptoTypeLeft}>
              <View style={[styles.cryptoTypeLeftTextWrap]}>
                <Text style={[styles.cryptoTypeName]}>{data.item.label}</Text>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  keyExtractor = (item: GuiFiatType, index: string) => {
    return item.value
  }
}

export const CreateWalletSelectFiatScene = connect(
  (state: ReduxState): StateProps => ({
    supportedFiats: getSupportedFiats(getDefaultFiat(state))
  }),
  (dispatch: Dispatch) => ({})
)(CreateWalletSelectFiatComponent)
