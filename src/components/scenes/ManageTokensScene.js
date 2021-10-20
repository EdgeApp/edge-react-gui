// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import { difference, keys, union } from 'lodash'
import * as React from 'react'
import { FlatList, View } from 'react-native'

import { checkEnabledTokensArray, setWalletEnabledTokens } from '../../actions/WalletActions'
import { getSpecialCurrencyInfo, PREFERRED_TOKENS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import type { CustomTokenInfo, GuiWallet } from '../../types/types.js'
import * as UTILS from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { MainButton } from '../themed/MainButton.js'
import ManageTokensHeader from '../themed/ManageTokensHeader'
import ManageTokensRow from '../themed/ManageTokensRow'
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
  wallets: { [walletId: string]: GuiWallet },
  manageTokensPending: boolean,
  metaTokens: EdgeMetaToken[],
  settingsCustomTokens: CustomTokenInfo[]
}

type Props = OwnProps & DispatchProps & StateProps & ThemeProps

type State = {
  walletId: string,
  enabledList: string[],
  combinedCurrencyInfos: EdgeMetaToken[],
  searchValue: string
}

class ManageTokensSceneComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const { route } = this.props
    const { guiWallet } = route.params
    const { enabledTokens, id } = guiWallet

    this.state = {
      walletId: id,
      enabledList: [...enabledTokens],
      combinedCurrencyInfos: [],
      searchValue: ''
    }
  }

  componentDidUpdate(prevProps) {
    const { route } = this.props
    const { guiWallet } = route.params
    if (guiWallet.id !== prevProps.route.params.guiWallet.id) {
      this.updateTokens()
    }
  }

  updateTokens() {
    const { route } = this.props
    const { guiWallet } = route.params
    this.setState({ enabledList: [...guiWallet.enabledTokens] })
  }

  getTokens(): EdgeMetaToken[] {
    const { route } = this.props
    const { guiWallet } = route.params
    const { metaTokens, currencyCode } = guiWallet

    const specialCurrencyInfo = getSpecialCurrencyInfo(currencyCode)

    const customTokens = this.props.settingsCustomTokens

    const accountMetaTokenInfo: CustomTokenInfo[] = specialCurrencyInfo.isCustomTokensSupported ? [...customTokens] : []

    const filteredTokenInfo = accountMetaTokenInfo.filter(token => {
      return token.walletType === guiWallet.type || token.walletType === undefined
    })

    const combinedTokenInfo = UTILS.mergeTokensRemoveInvisible(metaTokens, filteredTokenInfo)

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
      navigation.setParams({ guiWallet: this.props.wallets[walletId] })
    }
  }

  toggleToken = (currencyCode: string) => {
    const newEnabledList = this.state.enabledList
    const index = newEnabledList.indexOf(currencyCode)
    if (index >= 0) {
      newEnabledList.splice(index, 1)
    } else {
      newEnabledList.push(currencyCode)
    }
    this.setState({
      enabledList: newEnabledList
    })
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

  saveEnabledTokenList = () => {
    const { navigation, route } = this.props
    const { guiWallet } = route.params
    const { id } = guiWallet
    const disabledList: string[] = []
    // get disabled list
    for (const val of this.state.combinedCurrencyInfos) {
      if (this.state.enabledList.indexOf(val.currencyCode) === -1) disabledList.push(val.currencyCode)
    }
    this.props.setEnabledTokensList(id, this.state.enabledList, disabledList)
    navigation.goBack()
  }

  onDeleteToken = (currencyCode: string) => {
    const enabledListAfterDelete = difference(this.state.enabledList, [currencyCode])
    this.setState({
      enabledList: enabledListAfterDelete
    })
  }

  onAddToken = (currencyCode: string) => {
    const newEnabledList = union(this.state.enabledList, [currencyCode])
    this.setState({
      enabledList: newEnabledList
    })
  }

  goToAddTokenScene = () => {
    const { navigation, route } = this.props
    const { guiWallet } = route.params
    const { id } = guiWallet
    navigation.navigate('addToken', {
      walletId: id,
      onAddToken: this.onAddToken
    })
  }

  goToEditTokenScene = (currencyCode: string) => {
    const { navigation, route } = this.props
    const { guiWallet } = route.params
    const { id, metaTokens } = guiWallet
    navigation.navigate('editToken', {
      walletId: id,
      currencyCode,
      metaTokens,
      onDeleteToken: this.onDeleteToken
    })
  }

  render() {
    const { route, manageTokensPending, theme } = this.props
    const { searchValue, enabledList } = this.state
    const { guiWallet } = route.params
    const { name, currencyCode } = guiWallet
    const styles = getStyles(theme)

    return (
      <SceneWrapper>
        <SceneHeader underline>
          <ManageTokensHeader
            walletName={name}
            walletId={guiWallet.id}
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
              walletId={guiWallet.id}
              symbolImage={getCurrencyIcon(currencyCode, metaToken.item.currencyCode).symbolImage}
              toggleToken={this.toggleToken}
              enabledList={enabledList}
              metaTokens={guiWallet.metaTokens}
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
  (state, { route: { params } }) => {
    const { guiWallet } = params
    const wallets = state.ui.wallets.byId
    const wallet = wallets[guiWallet.id]
    return {
      manageTokensPending: state.ui.wallets.manageTokensPending,
      settingsCustomTokens: state.ui.settings.customTokens,
      metaTokens: wallet.metaTokens,
      wallets
    }
  },
  dispatch => ({
    setEnabledTokensList(walletId: string, enabledTokens: string[], oldEnabledTokensList: string[]) {
      dispatch(setWalletEnabledTokens(walletId, enabledTokens, oldEnabledTokensList))
      dispatch(checkEnabledTokensArray(walletId, enabledTokens))
    }
  })
)(withTheme(ManageTokensSceneComponent))
