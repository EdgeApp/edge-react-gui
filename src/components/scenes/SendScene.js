// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import type { EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import { FIO_ADDRESS_LIST } from '../../constants/SceneKeys'
import { FIO_STR } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings.js'
import { getPlugins, getSettings } from '../../modules/Settings/selectors.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.ui'
import {
  convertCurrencyFromExchangeRates,
  convertNativeToExchangeRateDenomination,
  getSelectedWallet,
  getSelectedWalletId,
  getWallets
} from '../../modules/UI/selectors.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import type { GuiContact, GuiWallet } from '../../types/types.js'
import * as UTILS from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal'
import type { WalletListResult } from '../modals/WalletListModal'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { AddressTile } from '../themed/AddressTile.js'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from '../themed/Tile.js'

export const SEND_ACTION_TYPE = {
  send: 'send',
  fioTransferDomain: 'fioTransferDomain'
}

type OwnProps = {
  amount: string,
  walletId: string,
  actionType: 'send' | 'fioTransferDomain',
  fioDomain?: string,
  fioWallet?: EdgeCurrencyWallet
}
type StateProps = {
  contacts: GuiContact[],
  currencyCode: string,
  currencyInfo?: EdgeCurrencyInfo,
  currentFiatAmount: number,
  cryptoAmount: string,
  guiWallet: GuiWallet,
  coreWallet: EdgeCurrencyWallet | null,
  wallets: { string: GuiWallet },
  walletDefaultDenomProps: EdgeDenomination
}
type DispatchProps = {
  onSelectWallet(walletId: string, currencyCode: string): void
}
type Props = OwnProps & StateProps & DispatchProps & ThemeProps

type State = {
  recipientAddress: string,
  clipboard: string,
  loading: boolean,
  showSlider: boolean
}

class SendComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      recipientAddress: '',
      clipboard: '',
      loading: false,
      showSlider: true
    }
  }

  componentWillMount(): void {
    if (this.props.actionType === SEND_ACTION_TYPE.fioTransferDomain) {
      this.props.onSelectWallet(this.props.walletId, FIO_STR)
    }
  }

  resetSlider = (): void => {
    this.setState({ showSlider: false }, () => this.setState({ showSlider: true }))
  }

  onWalletPress = (): void => {
    this.openWalletSelector()
  }

  openWalletSelector = async () => {
    const { actionType } = this.props
    const allowedCurrencyCodes = []
    if (actionType === SEND_ACTION_TYPE.fioTransferDomain) {
      allowedCurrencyCodes.push(`${FIO_STR}`)
      const { walletId, currencyCode }: WalletListResult = await Airship.show(bridge => (
        <WalletListModal bridge={bridge} headerTitle={s.strings.fio_src_wallet} allowedCurrencyCodes={allowedCurrencyCodes} />
      ))
      if (walletId && currencyCode) {
        this.props.onSelectWallet(walletId, currencyCode)
      }
    }
  }

  onChangeAddress = async (recipientAddress: string) => {
    const { actionType } = this.props
    if (actionType === SEND_ACTION_TYPE.fioTransferDomain) {
      if (recipientAddress.indexOf('FIO') < 0) {
        showError(s.strings.scan_invalid_address_error_title)
        return
      }
    }
    this.setState({ recipientAddress })
  }

  submit = async () => {
    const { actionType, amount } = this.props
    const { recipientAddress } = this.state
    this.setState({ loading: true })

    if (actionType === SEND_ACTION_TYPE.fioTransferDomain) {
      const { fioDomain, fioWallet } = this.props
      if (!fioWallet || !fioDomain) return showError(s.strings.fio_wallet_missing_for_fio_domain)
      try {
        const transferResult = await fioWallet.otherMethods.fioAction('transferFioDomain', { fioDomain, newOwnerKey: recipientAddress, maxFee: amount })

        try {
          await fioWallet.saveTx({
            txid: transferResult.transaction_id,
            date: new Date().getTime(),
            currencyCode: fioWallet.currencyInfo.currencyCode,
            blockHeight: transferResult.block_num,
            nativeAmount: `-${amount}`,
            networkFee: `${amount}`,
            parentNetworkFee: '0',
            signedTx: '',
            ourReceiveAddresses: [],
            otherParams: {}
          })
        } catch (e) {
          console.log(e)
        }

        const { theme } = this.props
        const styles = getStyles(theme)
        const domainName = `@${fioDomain || ''}`
        const transferredMessage = ` ${s.strings.fio_domain_transferred.toLowerCase()}`
        await Airship.show(bridge => (
          <ButtonsModal
            bridge={bridge}
            title={s.strings.fio_domain_label}
            buttons={{
              ok: { label: s.strings.string_ok_cap }
            }}
          >
            <EdgeText style={styles.tileTextBottom}>
              <EdgeText style={styles.cursive}>{domainName}</EdgeText>
              {transferredMessage}
            </EdgeText>
          </ButtonsModal>
        ))
        return Actions.popTo(FIO_ADDRESS_LIST)
      } catch (e) {
        showError(sprintf(s.strings.fio_transfer_err_msg, s.strings.fio_domain_label))
        this.resetSlider()
      }
    }

    this.setState({ loading: false })
  }

  walletTileType = () => {
    const { actionType } = this.props
    if (actionType === SEND_ACTION_TYPE.fioTransferDomain) {
      return 'static'
    }

    return 'editable'
  }

  renderAmount() {
    const { actionType, theme, walletDefaultDenomProps } = this.props
    const styles = getStyles(theme)

    if (actionType === SEND_ACTION_TYPE.fioTransferDomain) {
      const fiatSymbol = UTILS.getFiatSymbol(this.props.guiWallet.fiatCurrencyCode)
      const symbol = `${walletDefaultDenomProps.symbol || ''} `
      const fiatPrice = `(${fiatSymbol} ${this.props.currentFiatAmount.toFixed(2)})`
      return (
        <Tile type="static" title={s.strings.transaction_details_amount_current_price}>
          <View style={styles.tileRow}>
            <EdgeText style={styles.tileTextBottom}>{symbol}</EdgeText>
            <EdgeText style={styles.tileTextPrice}>{this.props.cryptoAmount}</EdgeText>
            <EdgeText style={styles.tileTextPriceFiat}>{fiatPrice}</EdgeText>
          </View>
        </Tile>
      )
    }
  }

  renderAdditionalTiles() {
    const { actionType } = this.props

    if (actionType === SEND_ACTION_TYPE.fioTransferDomain) {
      return this.props.fioDomain && <Tile type="static" title={s.strings.fio_domain_to_transfer} body={`@${this.props.fioDomain}`} />
    }
  }

  // Render
  render() {
    const { theme, guiWallet, coreWallet, currencyCode } = this.props
    const { loading, recipientAddress, showSlider } = this.state
    const styles = getStyles(theme)
    const sliderDisabled = !recipientAddress
    const walletName = `${guiWallet.name} (${guiWallet.currencyCode})`

    return (
      <SceneWrapper background="theme">
        <ScrollView>
          <View style={styles.tilesContainer}>
            <Tile type={this.walletTileType()} title={`${s.strings.step} 1: ${s.strings.select_wallet}`} onPress={this.onWalletPress} body={walletName} />
            {coreWallet && (
              <AddressTile
                title={`${s.strings.step} 2: ${s.strings.transaction_details_recipient} ${s.strings.fragment_send_address}`}
                recipientAddress={recipientAddress}
                coreWallet={coreWallet}
                currencyCode={currencyCode}
                onChangeAddress={this.onChangeAddress}
              />
            )}
            {this.renderAmount()}
            {this.renderAdditionalTiles()}
          </View>
          <Scene.Footer style={styles.footer}>
            {showSlider && <Slider onSlidingComplete={this.submit} sliderDisabled={sliderDisabled} showSpinner={loading} />}
          </Scene.Footer>
        </ScrollView>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  tilesContainer: {
    flex: 1,
    width: '100%',
    flexDirection: 'column'
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.rem(0.25)
  },
  tileTextBottom: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  tileTextPrice: {
    flex: 1,
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  tileTextPriceFiat: {
    color: theme.primaryText,
    fontSize: theme.rem(0.75)
  },
  footer: {
    marginTop: theme.rem(0.75),
    marginHorizontal: theme.rem(2)
  },
  cursive: {
    color: theme.primaryText,
    fontStyle: 'italic'
  }
}))

export const SendScene = connect(
  (state: RootState, ownProps: OwnProps): StateProps => {
    const walletId = getSelectedWalletId(state) || ownProps.walletId
    const wallets = getWallets(state)
    const wallet = walletId ? wallets[walletId] : getSelectedWallet(state)
    const contacts = state.contacts
    const settings = getSettings(state)
    const currencyCode = wallet.currencyCode
    const plugins = getPlugins(state)
    const allCurrencyInfos = plugins.allCurrencyInfos
    const currencyInfo = UTILS.getCurrencyInfo(allCurrencyInfos, currencyCode)
    const walletDefaultDenomProps: EdgeDenomination = UTILS.isCryptoParentCurrency(wallet, wallet.currencyCode)
      ? UTILS.getWalletDefaultDenomProps(wallet, settings)
      : UTILS.getWalletDefaultDenomProps(wallet, settings, wallet.currencyCode)

    const nativeAmount = ownProps.amount ? bns.abs(`${ownProps.amount}`) : ''
    const cryptoAmount = convertNativeToExchangeRateDenomination(settings, currencyCode, nativeAmount)
    const currentFiatAmount = convertCurrencyFromExchangeRates(state.exchangeRates, currencyCode, wallet.isoFiatCurrencyCode, parseFloat(cryptoAmount))

    const { account } = state.core
    const { currencyWallets } = account

    return {
      contacts,
      currencyCode,
      currencyInfo,
      currentFiatAmount,
      cryptoAmount,
      guiWallet: wallet,
      coreWallet: currencyWallets ? currencyWallets[walletId] : null,
      wallets,
      walletDefaultDenomProps
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    onSelectWallet: (walletId: string, currencyCode: string) => {
      dispatch({ type: 'UI/WALLETS/SELECT_WALLET', data: { currencyCode: currencyCode, walletId: walletId } })
    }
  })
)(withTheme(SendComponent))
