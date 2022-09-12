import * as React from 'react'
import { Alert, FlatList, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { FIAT_COUNTRY } from '../../constants/CountryConstants'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { connect } from '../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../types/routerTypes'
import { FlatListItem, GuiFiatType } from '../../types/types'
import { getSupportedFiats } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'
import { SceneHeader } from '../themed/SceneHeader'
import { SelectableRow } from '../themed/SelectableRow'

type OwnProps = {
  navigation: NavigationProp<'createWalletSelectFiat'>
  route: RouteProp<'createWalletSelectFiat'>
}
type StateProps = {
  supportedFiats: GuiFiatType[]
}
type Props = OwnProps & StateProps & ThemeProps

type State = {
  searchTerm: string
  selectedFiat: string
}

export class CreateWalletSelectFiatComponent extends React.Component<Props, State> {
  constructor(props: Props) {
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
    const { navigation, route } = this.props
    const { cleanedPrivateKey, selectedWalletType } = route.params

    if (this.isValidFiatType()) {
      // check if account-based or not
      const specialCurrencyInfo = getSpecialCurrencyInfo(selectedWalletType.walletType)
      // check if eos-like
      if (!specialCurrencyInfo.needsAccountNameSetup || cleanedPrivateKey) {
        navigation.navigate('createWalletName', {
          selectedWalletType: selectedWalletType,
          selectedFiat: this.getFiatType(this.state.selectedFiat),
          cleanedPrivateKey
        })
      } else {
        navigation.navigate('createWalletAccountSetup', {
          selectedWalletType: selectedWalletType,
          selectedFiat: this.getFiatType(this.state.selectedFiat)
        })
      }
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

  renderFiatTypeResult = (data: FlatListItem<GuiFiatType>) => {
    const styles = getStyles(this.props.theme)
    const fiatCountry = FIAT_COUNTRY[data.item.value]
    if (!fiatCountry) {
      return null
    }

    return (
      <SelectableRow
        icon={fiatCountry.logoUrl ? <FastImage source={{ uri: fiatCountry.logoUrl }} style={styles.cryptoTypeLogo} /> : <View style={styles.cryptoTypeLogo} />}
        paddingRem={[0, 1]}
        subTitle={s.strings[`currency_label_${data.item.value}`]}
        title={data.item.value}
        onPress={() => this.handleSelectFiatType(data.item)}
      />
    )
  }

  keyExtractor = (item: GuiFiatType, index: string) => {
    return item.value
  }

  render() {
    const styles = getStyles(this.props.theme)
    const filteredArray = this.props.supportedFiats.filter(entry => {
      return entry.label.toLowerCase().includes(this.state.searchTerm.toLowerCase())
    })

    return (
      <SceneWrapper avoidKeyboard background="theme">
        {gap => (
          <View style={[styles.content, { marginBottom: -gap.bottom }]}>
            <SceneHeader withTopMargin title={s.strings.title_create_wallet_select_fiat} />
            <OutlinedTextInput
              autoCorrect={false}
              autoCapitalize="words"
              onChangeText={this.handleSearchTermChange}
              value={this.state.searchTerm}
              label={s.strings.fragment_wallets_addwallet_fiat_hint}
              returnKeyType="search"
              marginRem={[0, 1.75]}
              searchIcon
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
    backgroundColor: theme.backgroundGradientColors[1]
  }
}))

export const CreateWalletSelectFiatScene = connect<StateProps, {}, OwnProps>(
  state => ({
    supportedFiats: getSupportedFiats(getDefaultFiat(state))
  }),
  dispatch => ({})
)(withTheme(CreateWalletSelectFiatComponent))
