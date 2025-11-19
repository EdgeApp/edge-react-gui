import { div, mul } from 'biggystring'
import type {
  EdgeAccount,
  EdgeCurrencyConfig,
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgeTokenId
} from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { tokenIdToFioCode } from '../../../constants/FioConstants'
import { formatNumber } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import type { CcWalletMap } from '../../../reducers/FioReducer'
import {
  getExchangeDenom,
  selectDisplayDenom
} from '../../../selectors/DenominationSelectors'
import { getExchangeRate } from '../../../selectors/WalletSelectors'
import { useSelector } from '../../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../../types/routerTypes'
import { getCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import {
  addToFioAddressCache,
  checkPubAddress,
  fioMakeSpend,
  fioSignAndBroadcast,
  getRemainingBundles
} from '../../../util/FioAddressUtils'
import { DECIMAL_PRECISION, removeIsoPrefix } from '../../../util/utils'
import { EdgeCard } from '../../cards/EdgeCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withWallet } from '../../hoc/withWallet'
import { SceneContainer } from '../../layout/SceneContainer'
import { AddressModal } from '../../modals/AddressModal'
import { ButtonsModal } from '../../modals/ButtonsModal'
import { TextInputModal } from '../../modals/TextInputModal'
import { EdgeRow } from '../../rows/EdgeRow'
import {
  Airship,
  showDevError,
  showError,
  showToast
} from '../../services/AirshipInstance'
import {
  cacheStyles,
  type Theme,
  type ThemeProps,
  useTheme
} from '../../services/ThemeContext'
import type { ExchangedFlipInputAmounts } from '../../themed/ExchangedFlipInput2'
import { SafeSlider } from '../../themed/SafeSlider'

export interface FioRequestConfirmationParams {
  amounts: ExchangedFlipInputAmounts
  fioAddressTo: string
  tokenId: EdgeTokenId
  walletId: string
}

interface StateProps {
  exchangeSecondaryToPrimaryRatio: number
  chainCode: string
  displayDenomination: EdgeDenomination
  exchangeDenomination: EdgeDenomination
  fioWallets: EdgeCurrencyWallet[]
  account: EdgeAccount
  isConnected: boolean
  fioPlugin?: EdgeCurrencyConfig
  currencyCode: string
  connectedWalletsByFioAddress: Record<string, CcWalletMap>
  defaultIsoFiat: string
}

interface OwnProps extends EdgeAppSceneProps<'fioRequestConfirmation'> {
  wallet: EdgeCurrencyWallet
}

type Props = StateProps & ThemeProps & OwnProps

interface State {
  loading: boolean
  walletAddresses: Array<{ fioAddress: string; fioWallet: EdgeCurrencyWallet }>
  fioAddressFrom: string
  fioAddressTo: string
  memo: string
  settingFioAddressTo: boolean
}

export class FioRequestConfirmationConnected extends React.Component<
  Props,
  State
> {
  constructor(props: Props) {
    super(props)
    this.state = {
      loading: false,
      fioAddressFrom: '',
      walletAddresses: [],
      fioAddressTo: this.props.route.params.fioAddressTo,
      memo: '',
      settingFioAddressTo: false
    }
  }

  componentDidMount(): void {
    this.setAddressesState().catch(showDevError)
  }

  setAddressesState = async (): Promise<void> => {
    if (this.props.fioWallets != null && this.props.fioWallets.length > 0) {
      const { chainCode, currencyCode, connectedWalletsByFioAddress } =
        this.props
      const walletAddresses: Array<{
        fioAddress: string
        fioWallet: EdgeCurrencyWallet
      }> = []
      let defaultFioAddressFrom: string | null = null
      for (const fioWallet of this.props.fioWallets) {
        try {
          const fioAddresses: string[] =
            await fioWallet.otherMethods.getFioAddressNames()
          if (fioAddresses.length > 0) {
            for (const fioAddress of fioAddresses) {
              walletAddresses.push({ fioAddress, fioWallet })
              if (
                defaultFioAddressFrom == null &&
                connectedWalletsByFioAddress[fioAddress]?.[
                  `${chainCode}:${currencyCode}`
                ] === this.props.wallet.id
              ) {
                defaultFioAddressFrom = fioAddress
              }
            }
          }
        } catch (error: unknown) {
          continue
        }
      }

      this.setState({
        walletAddresses,
        fioAddressFrom:
          defaultFioAddressFrom ?? walletAddresses[0]?.fioAddress ?? ''
      })
    }
  }

  handleConfirm = async (reset: () => void): Promise<void> => {
    const {
      account,
      exchangeDenomination,
      fioPlugin,
      isConnected,
      navigation,
      route,
      wallet
    } = this.props
    const { amounts, tokenId } = route.params
    const { walletAddresses, fioAddressFrom } = this.state
    const walletAddress = walletAddresses.find(
      ({ fioAddress }) => fioAddress === fioAddressFrom
    )
    const receiveAddresses = await wallet.getAddresses({ tokenId: null })
    const publicAddress = receiveAddresses[0]?.publicAddress

    if (publicAddress == null || publicAddress === '') {
      showError(lstrings.fio_wallet_missing_for_fio_address)
      reset()
      return
    }

    if (walletAddress != null && fioPlugin != null) {
      const { fioWallet } = walletAddress
      const val = div(
        amounts.nativeAmount,
        exchangeDenomination.multiplier,
        DECIMAL_PRECISION
      )
      try {
        if (!isConnected) {
          showError(lstrings.fio_network_alert_text)
          reset()
          return
        }
        // checking fee
        this.setState({ loading: true })
        try {
          const edgeTx = await fioMakeSpend(fioWallet, 'requestFunds', {
            payerFioAddress: '',
            payeeFioAddress: this.state.fioAddressFrom,
            payeeTokenPublicAddress: '',
            payerFioPublicKey: '',
            amount: '',
            chainCode: '',
            tokenCode: '',
            memo: ''
          })
          const bundledTxs = await getRemainingBundles(
            fioWallet,
            this.state.fioAddressFrom
          )
          // The API only returns a fee if there are 0 bundled transactions remaining. New requests can cost up to two transactions
          // so we need to check the corner case where a user might have one remaining transaction.
          if (edgeTx.networkFee !== '0' || bundledTxs < 2) {
            this.setState({ loading: false })
            reset()
            const answer = await Airship.show<'ok' | undefined>(bridge => (
              <ButtonsModal
                bridge={bridge}
                title={lstrings.fio_no_bundled_err_msg}
                message={lstrings.fio_no_bundled_add_err_msg}
                buttons={{
                  ok: { label: lstrings.title_fio_add_bundled_txs }
                }}
              />
            ))
            if (answer === 'ok') {
              navigation.navigate('fioAddressSettings', {
                showAddBundledTxs: true,
                walletId: fioWallet.id,
                fioAddressName: this.state.fioAddressFrom
              })
            }
            return
          }
        } catch (error: unknown) {
          this.setState({ loading: false })
          reset()
          showError(lstrings.fio_get_fee_err_msg)
          return
        }

        let payerPublicKey: string
        try {
          const fioCurrencyCode = fioPlugin.currencyInfo.currencyCode
          payerPublicKey = await checkPubAddress(
            fioPlugin,
            this.state.fioAddressTo,
            fioCurrencyCode,
            fioCurrencyCode
          )
        } catch (error: unknown) {
          this.setState({ loading: false })
          reset()
          showError(error)
          return
        }

        const { fioChainCode, fioTokenCode } = tokenIdToFioCode(
          wallet.currencyConfig,
          tokenId
        )

        // send fio request
        const edgeTx = await fioMakeSpend(fioWallet, 'requestFunds', {
          payerFioAddress: this.state.fioAddressTo,
          payeeFioAddress: this.state.fioAddressFrom,
          payerFioPublicKey: payerPublicKey,
          payeeTokenPublicAddress: publicAddress,
          amount: val,
          tokenCode: fioTokenCode,
          chainCode: fioChainCode,
          memo: this.state.memo
        })
        await fioSignAndBroadcast(fioWallet, edgeTx)
        this.setState({ loading: false })
        showToast(lstrings.fio_request_ok_body)
        await addToFioAddressCache(account, [this.state.fioAddressTo])
        navigation.navigate('request', { tokenId, walletId: wallet.id })
      } catch (error: unknown) {
        this.setState({ loading: false })
        reset()
        const errorObj = error as {
          json?: { fields?: Array<{ error?: string }> }
        }
        showError(
          `${lstrings.fio_request_error_header}: "${
            errorObj.json?.fields?.[0]?.error ?? String(error)
          }"`
        )
      }
    } else {
      showError(lstrings.fio_wallet_missing_for_fio_address)
      reset()
    }
  }

  handleAddressFromPressed = async (): Promise<void> => {
    await this.openFioAddressFromModal()
  }

  handleAddressToPressed = async (): Promise<void> => {
    await this.openFioAddressToModal()
  }

  handleMemoPressed = async (): Promise<void> => {
    await this.openMemoModal()
  }

  openFioAddressFromModal = async (): Promise<void> => {
    const { currencyCode, fioPlugin, wallet } = this.props
    const { walletAddresses } = this.state
    const fioAddressFrom = await Airship.show<string | undefined>(bridge => (
      <AddressModal
        bridge={bridge}
        walletId={wallet.id}
        currencyCode={currencyCode}
        title={lstrings.fio_confirm_request_fio_title}
        useUserFioAddressesOnly
      />
    ))
    if (fioAddressFrom == null) return
    if (fioPlugin != null) {
      const accountExists =
        (await fioPlugin.otherMethods.doesAccountExist(fioAddressFrom)) === true
      if (!accountExists) {
        showError(
          `${lstrings.send_fio_request_error_addr_not_exist}${
            fioAddressFrom !== '' ? '\n' + fioAddressFrom : ''
          }`
        )
        return
      }
    }
    if (
      walletAddresses.find(({ fioAddress }) => fioAddress === fioAddressFrom) ==
      null
    ) {
      showError(lstrings.fio_wallet_missing_for_fio_address)
      return
    } // Check if valid owned fio address
    if (fioAddressFrom === this.state.fioAddressTo) {
      showError(lstrings.fio_confirm_request_error_from_same)
      return
    }
    this.setState({ fioAddressFrom })
  }

  showError(error?: string): void {
    this.setState({ settingFioAddressTo: false })
    if (error != null) {
      showError(error)
    }
  }

  openFioAddressToModal = async (): Promise<void> => {
    const { fioPlugin, wallet, currencyCode } = this.props

    this.setState({ settingFioAddressTo: true })
    const fioAddressTo = await Airship.show<string | undefined>(bridge => (
      <AddressModal
        bridge={bridge}
        walletId={wallet.id}
        currencyCode={currencyCode}
        title={lstrings.fio_confirm_request_fio_title}
        isFioOnly
      />
    ))
    if (fioAddressTo == null) {
      this.showError()
      return
    }

    if (fioPlugin != null) {
      const accountExists =
        (await fioPlugin.otherMethods.doesAccountExist(fioAddressTo)) === true
      if (!accountExists) {
        this.showError(
          `${lstrings.send_fio_request_error_addr_not_exist}${
            fioAddressTo !== '' ? '\n' + fioAddressTo : ''
          }`
        )
        return
      }
    }

    if (this.state.fioAddressFrom === fioAddressTo) {
      this.showError(lstrings.fio_confirm_request_error_to_same)
      return
    }

    this.setState({ fioAddressTo, settingFioAddressTo: false })
  }

  openMemoModal = async (): Promise<void> => {
    const memo = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={this.state.memo}
        inputLabel={lstrings.fio_confirm_request_memo}
        returnKeyType="done"
        multiline
        submitLabel={lstrings.string_save}
        title={lstrings.fio_confirm_request_input_title_memo}
        autoCorrect={false}
      />
    ))
    if (memo == null) return
    if (memo.length > 64) {
      showError(lstrings.send_fio_request_error_memo_inline)
      return
    }
    if (memo !== '' && !/^[\x20-\x7E\x85\n]*$/.test(memo)) {
      showError(lstrings.send_fio_request_error_memo_invalid_character)
      return
    }
    this.setState({ memo })
  }

  render(): React.ReactNode {
    const {
      defaultIsoFiat,
      displayDenomination,
      exchangeDenomination,
      exchangeSecondaryToPrimaryRatio,
      route,
      theme
    } = this.props
    const { amounts } = route.params

    const { fioAddressFrom, fioAddressTo, loading, memo, settingFioAddressTo } =
      this.state

    let cryptoAmount, exchangeAmount
    try {
      cryptoAmount = div(
        amounts.nativeAmount,
        displayDenomination.multiplier,
        DECIMAL_PRECISION
      )
      exchangeAmount = div(
        amounts.nativeAmount,
        exchangeDenomination.multiplier,
        DECIMAL_PRECISION
      )
    } catch (e: any) {
      return null
    }

    const styles = getStyles(theme)

    const fiatAmount =
      formatNumber(mul(exchangeSecondaryToPrimaryRatio, exchangeAmount), {
        toFixed: 2
      }) ?? '0'
    const cryptoName = displayDenomination.name
    const fiatName = removeIsoPrefix(defaultIsoFiat)

    return (
      <SceneWrapper scroll>
        <SceneContainer headerTitle={lstrings.fio_confirm_request_header}>
          <View style={styles.container}>
            <EdgeCard sections>
              <EdgeRow
                rightButtonType="editable"
                title={lstrings.fio_confirm_request_from}
                body={fioAddressFrom}
                onPress={this.handleAddressFromPressed}
              />
              <EdgeRow
                rightButtonType="editable"
                title={lstrings.fio_confirm_request_to}
                body={settingFioAddressTo ? lstrings.resolving : fioAddressTo}
                onPress={this.handleAddressToPressed}
              />
              <EdgeRow
                title={lstrings.fio_confirm_request_amount}
                body={`${cryptoAmount} ${cryptoName} (${fiatAmount} ${fiatName})`}
              />
              <EdgeRow
                maximumHeight="large"
                rightButtonType="editable"
                title={lstrings.fio_confirm_request_memo}
                body={memo}
                onPress={this.handleMemoPressed}
              />
            </EdgeCard>
            <View style={styles.sliderContainer}>
              {fioAddressFrom.length > 0 && fioAddressTo.length > 0 ? (
                <SafeSlider
                  onSlidingComplete={this.handleConfirm}
                  disabled={loading}
                  disabledText={lstrings.loading}
                />
              ) : null}
            </View>
          </View>
        </SceneContainer>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    padding: theme.rem(0.5)
  },
  sliderContainer: {
    marginTop: theme.rem(2)
  }
}))

export const FioRequestConfirmationScene = withWallet((ownProps: OwnProps) => {
  const { route, navigation, wallet } = ownProps
  const { tokenId } = route.params
  const currencyCode = getCurrencyCode(wallet, tokenId)
  const theme = useTheme()

  const account = useSelector(state => state.core.account)
  const connectedWalletsByFioAddress = useSelector(
    state => state.ui.fio.connectedWalletsByFioAddress
  )
  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)
  const displayDenomination = useSelector(state =>
    selectDisplayDenom(state, wallet.currencyConfig, tokenId)
  )
  const exchangeSecondaryToPrimaryRatio = useSelector(state =>
    getExchangeRate(
      state.exchangeRates,
      wallet.currencyInfo.pluginId,
      tokenId,
      defaultIsoFiat
    )
  )
  const fioWallets = useSelector(state => state.ui.wallets.fioWallets)
  const isConnected = useSelector(state => state.network.isConnected)

  const exchangeDenomination = getExchangeDenom(wallet.currencyConfig, tokenId)

  return (
    <FioRequestConfirmationConnected
      account={account}
      chainCode={wallet.currencyInfo.currencyCode}
      connectedWalletsByFioAddress={connectedWalletsByFioAddress}
      currencyCode={currencyCode}
      defaultIsoFiat={defaultIsoFiat}
      displayDenomination={displayDenomination}
      exchangeDenomination={exchangeDenomination}
      exchangeSecondaryToPrimaryRatio={exchangeSecondaryToPrimaryRatio}
      fioPlugin={account.currencyConfig.fio}
      fioWallets={fioWallets}
      isConnected={isConnected}
      navigation={navigation}
      route={route}
      theme={theme}
      wallet={wallet}
    />
  )
})
