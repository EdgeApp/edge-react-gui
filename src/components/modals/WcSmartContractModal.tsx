import { abs, add, div, gt, mul } from 'biggystring'
import {
  asArray,
  asEither,
  asMaybe,
  asNumber,
  asObject,
  asOptional,
  asString,
  asTuple,
  asUnknown,
  asValue
} from 'cleaners'
import type {
  EdgeCurrencyWallet,
  EdgeSpendInfo,
  EdgeTransaction
} from 'edge-core-js'
import * as React from 'react'
import { Image, ScrollView, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import WalletConnectLogo from '../../assets/images/walletconnect-logo.png'
import { FlashNotification } from '../../components/navigation/FlashNotification'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useAsyncValue } from '../../hooks/useAsyncValue'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useWalletConnect } from '../../hooks/useWalletConnect'
import { lstrings } from '../../locales/strings'
import { asEdgeTokenId } from '../../types/types'
import {
  asAlgoPayloadMethod,
  asAlgoWcTransaction,
  getAlgoWcDangers,
  signAlgoWcTransactions
} from '../../util/algorandWalletConnect'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { raceTimeout, TIMED_OUT } from '../../util/raceTimeout'
import { zeroString } from '../../util/utils'
import {
  asWcAction,
  asWcDetails,
  asWcSimulation,
  asWcWarning,
  getWcRisks
} from '../../util/walletConnectActions'
import { AlertCardUi4 } from '../cards/AlertCard'
import { AlgoWcTransactionsCard } from '../cards/AlgoWcTransactionsCard'
import { EdgeCard } from '../cards/EdgeCard'
import { WcActionsCard } from '../cards/WcActionsCard'
import { WcDetailsCard } from '../cards/WcDetailsCard'
import { WcSimulationCard } from '../cards/WcSimulationCard'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { ModalFooter, ModalTitle } from '../themed/ModalParts'
import { SafeSlider } from '../themed/SafeSlider'
import { CryptoFiatAmountTile } from '../tiles/CryptoFiatAmountTile'
import { FiatAmountTile } from '../tiles/FiatAmountTile'
import { EdgeModal } from './EdgeModal'

interface Props extends WcSmartContractModalProps {
  bridge: AirshipBridge<void>
  wallet: EdgeCurrencyWallet
}

// How long to wait for the network to simulate a transaction. The wallet
// tries its nodes one after another, so a few dead ones take a while:
const SIMULATION_TIMEOUT_MS = 30000

export const WcSmartContractModal: React.FC<Props> = (props: Props) => {
  const {
    actions = [],
    algoTransactions,
    bridge,
    dApp,
    dAppOrigin,
    details = [],
    nativeAmount,
    networkFee,
    payload: rawPayload,
    tokenId,
    topic,
    requestId,
    wallet,
    walletAddress,
    warnings = []
  } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const walletConnect = useWalletConnect()
  const dAppName = dApp.peerMeta.name
  const iconUri = dApp.peerMeta.icons[0]

  const walletName = getWalletName(wallet)

  // A request to sign a message moves nothing by itself:
  const isSignRequest =
    asMaybe(asObject({ method: asEvmSignMethod }).withRest)(rawPayload) != null

  // Ask the network what a transaction would do, if the wallet's plugin
  // knows how. The request stays on screen while the answer loads:
  const canSimulate =
    asMaybe(asEvmTransactionPayload)(rawPayload) != null &&
    wallet.otherMethods.simulateWalletConnectV2Payload != null
  const [simulationResult, simulationError] = useAsyncValue(async () => {
    if (!canSimulate) return
    const result = await raceTimeout(
      wallet.otherMethods.simulateWalletConnectV2Payload(rawPayload),
      SIMULATION_TIMEOUT_MS
    )
    if (result === TIMED_OUT) throw new Error('The simulation timed out')
    return asWcSimulation(result)
  }, [])
  const simulation = !canSimulate
    ? undefined
    : simulationError != null
    ? 'unavailable'
    : simulationResult ?? 'loading'

  // The card only says the simulation is unavailable, so keep the reason
  // where support can find it:
  React.useEffect(() => {
    if (simulationError != null) {
      console.warn('WalletConnect simulation failed:', String(simulationError))
    }
  }, [simulationError])

  const {
    currencyCode: feeCurrencyCode,
    displayName: feeDisplayName,
    pluginId
  } = wallet.currencyInfo

  const feeCurrencyStr = `${feeDisplayName} (${feeCurrencyCode})`
  const feeCurrencyBalance = wallet.balanceMap.get(null) ?? '0'

  const amountDenom = useDisplayDenom(wallet.currencyConfig, tokenId)
  const feeDenom = useDisplayDenom(wallet.currencyConfig, null)

  // For total amount, convert 'amount' currency to 'fee' currency so it be totaled as a single crypto amount to pass to FiatAmountTile component
  const amountCurrencyToFeeCurrencyExchangeRate = div(
    amountDenom.multiplier,
    feeDenom.multiplier
  )
  const amountCryptoAsFeeCrypto = mul(
    amountCurrencyToFeeCurrencyExchangeRate,
    networkFee
  )
  const totalNativeCrypto = mul(
    add(nativeAmount, amountCryptoAsFeeCrypto),
    '-1'
  )

  const isInsufficientBal =
    tokenId == null
      ? gt(abs(totalNativeCrypto), feeCurrencyBalance)
      : gt(networkFee, feeCurrencyBalance)

  const handleSubmit = (): void => {
    wcRequestResponse(true)
      .then(() => {
        Airship.show(bridge => (
          <FlashNotification
            bridge={bridge}
            message={
              isSignRequest
                ? lstrings.wc_sign_message_confirmed
                : lstrings.wc_smartcontract_confirmed
            }
          />
        )).catch(() => {})
      })
      .catch((error: unknown) => {
        showError(error)
      })
      .finally(props.bridge.resolve)
  }

  const handleClose = (): void => {
    wcRequestResponse(false)
      .catch((error: unknown) => {
        showError(error)
      })
      .finally(props.bridge.resolve)
  }

  const renderRisks = (): React.ReactElement | null => {
    // An allowance the simulation finds counts just like one we decoded:
    const approvals = typeof simulation === 'object' ? simulation.approvals : []
    const risks = getWcRisks([...actions, ...approvals], warnings, {
      currencyConfig: wallet.currencyConfig,
      dAppOrigin
    })
    if (risks.length === 0) return null
    return (
      <AlertCardUi4
        title={lstrings.wc_request_alert_title}
        body={risks}
        type="error"
        marginRem={0.5}
      />
    )
  }

  const renderAlgoDanger = (): React.ReactElement | null => {
    if (algoTransactions == null) return null
    const dangers = getAlgoWcDangers(algoTransactions, wallet.currencyConfig)
    if (dangers.length === 0) return null
    return (
      <AlertCardUi4
        title={lstrings.wc_algo_danger_title}
        body={dangers}
        type="error"
        marginRem={0.5}
      />
    )
  }

  const renderWarning = (): React.ReactElement => {
    return isInsufficientBal ? (
      <AlertCardUi4
        title={lstrings.wc_smartcontract_warning_title}
        body={sprintf(
          lstrings.wc_smartcontract_insufficient_text,
          feeCurrencyStr
        )}
        type="warning"
        marginRem={0.5}
      />
    ) : (
      <AlertCardUi4
        title={lstrings.wc_smartcontract_warning_title}
        body={[
          lstrings.wc_smartcontract_warning_point_funds,
          lstrings.wc_smartcontract_warning_point_trust
        ]}
        type="warning"
        marginRem={0.5}
      />
    )
  }

  const wcRequestResponse = async (approve: boolean): Promise<void> => {
    if (!approve) {
      await walletConnect.rejectRequest(topic, requestId)
      return
    }

    const payload = asPayload(rawPayload)
    try {
      switch (payload.method) {
        case 'personal_sign': {
          const cleanPayload = asEvmSignPayload(payload)
          const result = await wallet.signMessage(cleanPayload.params[0])
          await walletConnect.approveRequest(topic, requestId, result)
          break
        }
        case 'eth_sign':
        case 'eth_signTypedData':
        case 'eth_signTypedData_v4': {
          const cleanPayload = asEvmSignPayload(payload)
          const typedData =
            cleanPayload.method === 'eth_signTypedData' ||
            cleanPayload.method === 'eth_signTypedData_v4'
          const result = await wallet.signMessage(cleanPayload.params[1], {
            otherParams: { typedData }
          })
          await walletConnect.approveRequest(topic, requestId, result)
          break
        }
        case 'eth_signTransaction': {
          const cleanPayload = asEvmTransactionPayload(payload)
          const spendInfo: EdgeSpendInfo =
            await wallet.otherMethods.txRpcParamsToSpendInfo(
              cleanPayload.params[0]
            )
          const tx = await wallet.makeSpend(spendInfo)
          const signTx = await wallet.signTx(tx)
          await walletConnect.approveRequest(topic, requestId, signTx.signedTx)
          await wallet.saveTx(signTx)
          break
        }
        case 'eth_sendTransaction': {
          const cleanPayload = asEvmTransactionPayload(payload)
          const spendInfo: EdgeSpendInfo =
            await wallet.otherMethods.txRpcParamsToSpendInfo(
              cleanPayload.params[0]
            )
          const tx = await wallet.makeSpend(spendInfo)
          const signedTx = await wallet.signTx(tx)
          const sentTx = await wallet.broadcastTx(signedTx)
          await walletConnect.approveRequest(topic, requestId, sentTx.txid)
          await wallet.saveTx(sentTx)
          break
        }
        case 'eth_sendRawTransaction': {
          const cleanPayload = asEvmSendRawTransactionPayload(payload)
          const fakeEdgeTransaction: EdgeTransaction = {
            blockHeight: 0,
            currencyCode: wallet.currencyInfo.currencyCode,
            date: 0,
            isSend: false,
            memos: [],
            nativeAmount: '0',
            networkFee: '0',
            networkFees: [],
            ourReceiveAddresses: [],
            signedTx: cleanPayload.params[0],
            tokenId: null,
            txid: '',
            walletId: wallet.id
          }
          const sentTx = await wallet.broadcastTx(fakeEdgeTransaction)
          await walletConnect.approveRequest(topic, requestId, sentTx.txid)
          break
        }
        case 'algo_signTxn': {
          const signedTxs = await signAlgoWcTransactions(
            payload,
            async txn => await wallet.signMessage(txn)
          )
          await walletConnect.approveRequest(topic, requestId, signedTxs)
          break
        }
        case 'cosmos_getAccounts':
        case 'cosmos_signDirect':
        case 'cosmos_signAmino': {
          const cleanPayload = asEither(
            asCosmosGetAccountsPayload,
            asCosmosSignDirectPayload,
            asCosmosSignAminoPayload
          )(payload)
          const result = await wallet.signMessage('', {
            otherParams: cleanPayload
          })
          await walletConnect.approveRequest(
            topic,
            requestId,
            JSON.parse(result)
          )
        }
      }
    } catch (e: any) {
      await walletConnect.rejectRequest(topic, requestId)
      throw e
    }
  }

  const walletImageUri = getCurrencyIconUris(pluginId, tokenId).symbolImage
  const slider = isInsufficientBal ? null : (
    <SafeSlider
      parentStyle={styles.slider}
      onSlidingComplete={handleSubmit}
      disabledText={lstrings.send_confirmation_slide_to_confirm}
      disabled={false}
    />
  )

  return (
    <EdgeModal
      bridge={bridge}
      onCancel={handleClose}
      title={
        <View style={styles.title}>
          <Image style={styles.logo} source={WalletConnectLogo} />
          <ModalTitle>
            {isSignRequest
              ? lstrings.wc_sign_message_title
              : lstrings.wc_smartcontract_title}
          </ModalTitle>
        </View>
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollPadding}
        scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
      >
        {renderWarning()}
        {renderRisks()}
        {renderAlgoDanger()}
        {actions.length === 0 ? null : (
          <WcActionsCard
            actions={actions}
            wallet={wallet}
            walletAddress={walletAddress}
          />
        )}
        {simulation == null ? null : (
          <WcSimulationCard
            simulation={simulation}
            wallet={wallet}
            walletAddress={walletAddress}
          />
        )}
        {zeroString(nativeAmount) ? null : (
          <CryptoFiatAmountTile
            title={lstrings.string_amount}
            nativeCryptoAmount={nativeAmount}
            denomination={amountDenom}
            currencyConfig={wallet.currencyConfig}
            tokenId={tokenId}
          />
        )}
        <EdgeCard icon={walletImageUri}>
          <EdgeRow title={lstrings.wc_smartcontract_wallet} body={walletName} />
        </EdgeCard>
        <EdgeCard icon={iconUri}>
          <EdgeRow title={lstrings.wc_smartcontract_dapp} body={dAppName} />
        </EdgeCard>
        {algoTransactions == null ? null : (
          <AlgoWcTransactionsCard
            transactions={algoTransactions}
            wallet={wallet}
          />
        )}
        <WcDetailsCard details={details} />
        {zeroString(networkFee) ? null : (
          <CryptoFiatAmountTile
            title={lstrings.wc_smartcontract_network_fee}
            nativeCryptoAmount={networkFee}
            denomination={feeDenom}
            tokenId={null}
            currencyConfig={wallet.currencyConfig}
          />
        )}
        {zeroString(totalNativeCrypto) ? null : (
          <FiatAmountTile
            title={lstrings.wc_smartcontract_max_total}
            nativeCryptoAmount={totalNativeCrypto}
            tokenId={null}
            wallet={wallet}
          />
        )}
        {slider}
      </ScrollView>
      {/* <ModalFooterFade /> */}
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.rem(1),
    paddingTop: theme.rem(1)
  },
  logo: {
    height: theme.rem(2),
    width: theme.rem(2),
    resizeMode: 'contain',
    padding: theme.rem(0.5)
  },
  scrollPadding: {
    paddingBottom: theme.rem(ModalFooter.bottomRem)
  },
  slider: {
    paddingVertical: theme.rem(1)
  }
}))

// [message, account, password]: personal_sign (password not supported yet)
// [address, message]: eth_sign, eth_signTypedData, eth_signTypedData_v4

const asEvmSignMethod = asValue(
  'personal_sign',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v4'
)
const asEvmSignPayload = asObject({
  method: asEvmSignMethod,
  params: asTuple(asString, asString)
})

const asEvmSendRawTransactionMethod = asValue('eth_sendRawTransaction')
const asEvmSendRawTransactionPayload = asObject({
  method: asEvmSendRawTransactionMethod,
  params: asTuple(asString)
})
const asEvmTransactionMethod = asValue(
  'eth_sendTransaction',
  'eth_signTransaction'
)
const asEvmTransactionPayload = asObject({
  method: asEvmTransactionMethod,
  params: asTuple(
    asObject({
      from: asString,
      to: asOptional(asString),
      data: asString,
      gas: asOptional(asString),
      gasPrice: asOptional(asString),
      value: asOptional(asString),
      nonce: asOptional(asString)
    }),
    asOptional(asString, '')
  )
})
const asCosmosPayloadMethod = asValue(
  'cosmos_getAccounts',
  'cosmos_signDirect',
  'cosmos_signAmino'
)
const asCosmosGetAccountsPayload = asObject({
  method: asValue('cosmos_getAccounts'),
  params: asObject({})
})
const asCosmosSignDirectPayload = asObject({
  method: asValue('cosmos_signDirect'),
  params: asObject({
    signerAddress: asString,
    signDoc: asObject({
      chainId: asString,
      accountNumber: asString,
      authInfoBytes: asString,
      bodyBytes: asString
    })
  })
})
const asCosmosSignAminoPayload = asObject({
  method: asValue('cosmos_signAmino'),
  params: asObject({
    signerAddress: asString,
    signDoc: asObject({
      chain_id: asString,
      account_number: asString,
      sequence: asString,
      memo: asString,
      msgs: asArray(asUnknown),
      fee: asObject({
        amount: asArray(asObject({ denom: asString, amount: asString })),
        gas: asString
      })
    })
  })
})

const asPayload = asObject({
  method: asEither(
    asCosmosPayloadMethod,
    asAlgoPayloadMethod,
    asEvmSignMethod,
    asEvmTransactionMethod,
    asEvmSendRawTransactionMethod
  )
}).withRest

export const asWcSmartContractModalProps = asObject({
  // What the plugin says the request would sign or do:
  actions: asOptional(asArray(asWcAction)),
  warnings: asOptional(asArray(asWcWarning)),
  details: asOptional(asArray(asWcDetails)),
  // Algorand requests list every transaction they ask the wallet to sign:
  algoTransactions: asOptional(asArray(asAlgoWcTransaction)),
  // Where WalletConnect says the request came from:
  dAppOrigin: asOptional(asString),
  // The address the session gave the dapp for this wallet:
  walletAddress: asOptional(asString),
  dApp: asObject({
    peerMeta: asObject({
      name: asString,
      icons: asArray(asString)
    })
  }),
  nativeAmount: asString,
  networkFee: asString,
  tokenId: asEdgeTokenId,
  topic: asString,
  requestId: asNumber,
  payload: asUnknown
})
type WcSmartContractModalProps = ReturnType<typeof asWcSmartContractModalProps>
