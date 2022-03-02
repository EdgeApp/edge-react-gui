// @flow

import type { Disklet } from 'disklet'
import type { EdgeCurrencyWallet, EdgeMetaToken } from 'edge-core-js'
import { difference, keys, union } from 'lodash'
import * as React from 'react'
import { FlatList, View } from 'react-native'

import { approveTokenTerms } from '../../actions/TokenTermsActions.js'
import { checkEnabledTokensArray, setWalletEnabledTokens } from '../../actions/WalletActions'
import { getSpecialCurrencyInfo, PREFERRED_TOKENS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { type CustomTokenInfo, type GuiWallet, asSafeDefaultGuiWallet } from '../../types/types.js'
import { mergeTokensRemoveInvisible } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { MainButton } from '../themed/MainButton.js'
import { ManageTokensHeader } from '../themed/ManageTokensHeader'
import { ManageTokensRow } from '../themed/ManageTokensRow'
import { SceneHeader } from '../themed/SceneHeader'
import { getCurrencyIcon } from './../../util/CurrencyInfoHelpers'

type OwnProps = {
  navigation: NavigationProp<'manageTokens'>,
  route: RouteProp<'manageTokens'>
}
type DispatchProps = {
  setEnabledTokensList: (walletId: string, enabledTokens: string[], oldEnabledTokensList: string[]) => void
}

type StateProps = {
  disklet: Disklet,
  wallets: { [walletId: string]: GuiWallet },
  currencyWallets: { [walletId: string]: EdgeCurrencyWallet },
  manageTokensPending: boolean,
  enabledTokens: string[],
  settingsCustomTokens: CustomTokenInfo[]
}

type Props = OwnProps & DispatchProps & StateProps & ThemeProps

type State = {
  walletId: string,
  tokensToEnable: string[],
  tokensToDisable: string[],
  searchValue: string
}

class ManageTokensSceneComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const { route } = this.props
    const { walletId } = route.params

    this.state = {
      walletId,
      tokensToEnable: [],
      tokensToDisable: [],
      searchValue: ''
    }
  }

  getTokens(): EdgeMetaToken[] {
    const { route, wallets, currencyWallets } = this.props
    const { walletId } = route.params
    const { metaTokens, type } = wallets[walletId]
    const { pluginId } = currencyWallets[walletId].currencyInfo

    const specialCurrencyInfo = getSpecialCurrencyInfo(pluginId)

    const customTokens = this.props.settingsCustomTokens

    const accountMetaTokenInfo: CustomTokenInfo[] = specialCurrencyInfo.isCustomTokensSupported ? [...customTokens] : []

    const filteredTokenInfo = accountMetaTokenInfo.filter(token => {
      return token.walletType === type || token.walletType === undefined
    })

    const combinedTokenInfo = mergeTokensRemoveInvisible(metaTokens, filteredTokenInfo)

    const sortedTokenInfo = combinedTokenInfo.sort((a, b) => {
      if (a.currencyCode < b.currencyCode) return -1
      if (a === b) return 0
      return 1
    })

    // put preferred tokens at the top
    for (const cc of PREFERRED_TOKENS) {
      const idx = sortedTokenInfo.findIndex(e => e.currencyCode === cc)
      if (idx > -1) {
        const tokenInfo = sortedTokenInfo[idx]
        sortedTokenInfo.splice(idx, 1)
        sortedTokenInfo.unshift(tokenInfo)
      }
    }

    return sortedTokenInfo
  }

  getAllowedWalletCurrencyCodes(): string[] {
    const { wallets } = this.props
    return keys(wallets).reduce((acc, key: string) => {
      const wallet = wallets[key]
      const isKey = acc.length > 0 && acc.includes(wallet.currencyCode)

      if (wallet.metaTokens.length > 0 && !isKey) {
        acc.push(wallet.currencyCode)
      }

      return acc
    }, [])
  }

  getWalletIdsIfNotTokens(): string[] {
    const { wallets } = this.props
    return keys(wallets).filter((key: string) => wallets[key].metaTokens.length === 0)
  }

  onSelectWallet = async () => {
    const { navigation } = this.props
    const { walletId, currencyCode } = await Airship.show(bridge => (
      <WalletListModal
        allowedCurrencyCodes={this.getAllowedWalletCurrencyCodes()}
        excludeWalletIds={this.getWalletIdsIfNotTokens()}
        bridge={bridge}
        headerTitle={s.strings.select_wallet}
      />
    ))

    if (walletId && currencyCode) {
      navigation.setParams({ walletId })
    }
  }

  toggleToken = (currencyCode: string, enable: boolean) => {
    if (enable) {
      this.setState({
        tokensToEnable: union(this.state.tokensToEnable, [currencyCode]),
        tokensToDisable: difference(this.state.tokensToDisable, [currencyCode])
      })
    } else {
      this.setState({
        tokensToEnable: difference(this.state.tokensToEnable, [currencyCode]),
        tokensToDisable: union(this.state.tokensToDisable, [currencyCode])
      })
    }
  }

  getFilteredTokens = (): EdgeMetaToken[] => {
    const { searchValue } = this.state
    const tokens = this.getTokens()

    const RegexObj = new RegExp(searchValue, 'i')
    return tokens.filter(({ currencyCode, currencyName }) => RegexObj.test(currencyCode) || RegexObj.test(currencyName))
  }

  changeSearchValue = value => {
    this.setState({ searchValue: value })
  }

  saveEnabledTokenList = async () => {
    const { disklet, navigation, route, wallets, enabledTokens } = this.props

    const { walletId } = route.params
    const { currencyCode, id } = wallets[walletId]
    const newEnabledTokens = difference(union(this.state.tokensToEnable, enabledTokens), this.state.tokensToDisable)
    if (newEnabledTokens.length > 0) await approveTokenTerms(disklet, currencyCode)

    this.props.setEnabledTokensList(id, newEnabledTokens, [])
    navigation.goBack()
  }

  goToAddTokenScene = () => {
    const { navigation, route } = this.props
    const { walletId } = route.params
    navigation.navigate('addToken', {
      walletId
    })
  }

  goToEditTokenScene = (currencyCode: string) => {
    const { navigation, route, wallets } = this.props
    const { walletId } = route.params
    const { id, metaTokens } = wallets[walletId]
    navigation.navigate('editToken', {
      walletId: id,
      currencyCode,
      metaTokens
    })
  }

  render() {
    const { route, manageTokensPending, theme, wallets, enabledTokens, currencyWallets } = this.props
    const { searchValue } = this.state
    const { walletId } = route.params
    if (wallets[walletId] == null || currencyWallets[walletId] == null) return null
    const { name, currencyCode } = wallets[walletId]
    const { pluginId, metaTokens } = currencyWallets[walletId].currencyInfo
    const styles = getStyles(theme)
    const tempEnabledTokens = difference(union(this.state.tokensToEnable, enabledTokens), this.state.tokensToDisable)

    return (
      <SceneWrapper>
        <SceneHeader underline>
          <ManageTokensHeader
            walletName={name}
            walletId={walletId}
            currencyCode={currencyCode}
            changeSearchValue={this.changeSearchValue}
            onSelectWallet={this.onSelectWallet}
            searchValue={searchValue}
          />
        </SceneHeader>
        <FlatList
          keyExtractor={item => item.currencyCode}
          data={this.getFilteredTokens()}
          renderItem={metaToken => (
            <ManageTokensRow
              goToEditTokenScene={this.goToEditTokenScene}
              metaToken={metaToken}
              walletId={walletId}
              symbolImage={getCurrencyIcon(pluginId, metaToken.item.contractAddress).symbolImage}
              toggleToken={this.toggleToken}
              enabledList={tempEnabledTokens}
              metaTokens={metaTokens}
            />
          )}
          style={styles.tokensArea}
        />
        <DividerLine marginRem={[0, 1]} />
        <View style={styles.buttonsArea}>
          <View style={styles.buttonWrapper}>
            <MainButton label={s.strings.string_save} marginRem={0.5} spinner={manageTokensPending} type="secondary" onPress={this.saveEnabledTokenList} />
          </View>
          <View style={styles.buttonWrapper}>
            <MainButton label={s.strings.addtoken_add} marginRem={0.5} type="secondary" onPress={this.goToAddTokenScene} />
          </View>
        </View>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  tokensArea: {
    marginTop: theme.rem(-0.5),
    flex: 4
  },
  buttonWrapper: {
    flex: 1
  },
  buttonsArea: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: theme.rem(0.5)
  }
}))

export const ManageTokensScene = connect<StateProps, DispatchProps, OwnProps>(
  (state, { route: { params } }) => ({
    disklet: state.core.disklet,
    manageTokensPending: state.ui.wallets.manageTokensPending,
    settingsCustomTokens: state.ui.settings.customTokens,
    wallets: state.ui.wallets.byId,
    currencyWallets: state.core.account.currencyWallets,
    enabledTokens: asSafeDefaultGuiWallet(state.ui.wallets.byId[params.walletId]).enabledTokens
  }),
  dispatch => ({
    setEnabledTokensList(walletId: string, enabledTokens: string[], oldEnabledTokensList: string[]) {
      dispatch(setWalletEnabledTokens(walletId, enabledTokens, oldEnabledTokensList))
      dispatch(checkEnabledTokensArray(walletId, enabledTokens))
    }
  })
)(withTheme(ManageTokensSceneComponent))
