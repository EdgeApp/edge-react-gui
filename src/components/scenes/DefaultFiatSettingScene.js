// @flow

import * as React from 'react'
import { Alert, FlatList, Keyboard, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'

import { setDefaultFiatRequest } from '../../actions/SettingsActions'
import { FIAT_COUNTRY } from '../../constants/CountryConstants'
import s from '../../locales/strings.js'
import { getDefaultFiat } from '../../selectors/SettingsSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { type Theme } from '../../types/Theme'
import type { FlatListItem, GuiFiatType } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { getSupportedFiats } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'
import { SceneHeader } from '../themed/SceneHeader'
import { SelectableRow } from '../themed/SelectableRow'

type OwnProps = {
  navigation: NavigationProp<'defaultFiatSetting'>
}
type StateProps = {
  supportedFiats: GuiFiatType[]
}
type DispatchProps = {
  onSelectFiat: (selectedDefaultFiat: string) => void
}
type Props = StateProps & DispatchProps & OwnProps & ThemeProps

type State = {
  supportedFiats: GuiFiatType[],
  selectedFiat: string,
  searchTerm: string
}

export class DefaultFiatSettingComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      searchTerm: '',
      supportedFiats: props.supportedFiats,
      selectedFiat: ''
    }
  }

  handleSearchTermChange = (searchTerm: string): void => {
    this.setState({
      searchTerm
    })
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
        onPress={() => this.onSelectFiat(data.item)}
      />
    )
  }

  render() {
    const styles = getStyles(this.props.theme)
    const filteredArray = this.props.supportedFiats.filter(entry => {
      return entry.label.toLowerCase().indexOf(this.state.searchTerm.toLowerCase()) >= 0
    })

    return (
      <SceneWrapper avoidKeyboard background="theme" hasTabs={false}>
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

  onSelectFiat = ({ value: selectedFiat }: { value: string }) => {
    const { navigation } = this.props
    if (!this.isValidFiat(selectedFiat)) {
      Alert.alert(s.strings.fragment_create_wallet_select_valid)
    } else {
      this.setState({ selectedFiat })
      Keyboard.dismiss()
      this.props.onSelectFiat(selectedFiat)
      navigation.goBack()
    }
  }

  isValidFiat = (selectedFiat: string) => {
    const { supportedFiats } = this.state

    const isValid = supportedFiats.find(fiat => fiat.value === selectedFiat)

    return isValid
  }

  keyExtractor = (item: GuiFiatType, index: string) => String(index)
}

const getStyles = cacheStyles((theme: Theme) => ({
  content: {
    flex: 1,
    paddingTop: scale(5)
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

export const DefaultFiatSettingScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    supportedFiats: getSupportedFiats(getDefaultFiat(state))
  }),
  dispatch => ({
    onSelectFiat(selectedDefaultFiat) {
      dispatch(setDefaultFiatRequest(selectedDefaultFiat))
    }
  })
)(withTheme(DefaultFiatSettingComponent))
