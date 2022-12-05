import { asMaybeNoAmountSpecifiedError, EdgeAccount, EdgeDenomination, EdgeSpendInfo, EdgeSpendTarget, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useExchangeDenom } from '../../hooks/useExchangeDenom'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import s from '../../locales/strings'
import { useState } from '../../types/reactHooks'
import { useSelector } from '../../types/reactRedux'
import { RouteProp } from '../../types/routerTypes'
import { GuiExchangeRates } from '../../types/types'
import { getCurrencyCode, getTokenId } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { convertTransactionFeeToDisplayFee } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { FlipInputModal2, FlipInputModalRef, FlipInputModalResult } from '../modals/FlipInputModal2'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ExchangedFlipInputAmounts, ExchangeFlipInputFields } from '../themed/ExchangedFlipInput2'
import { AddressTile2, ChangeAddressResult } from '../tiles/AddressTile2'
import { EditableAmountTile } from '../tiles/EditableAmountTile'
import { ErrorTile } from '../tiles/ErrorTile'
import { Tile } from '../tiles/Tile'

interface Props {
  // navigation: NavigationProp<'send2'>
  route: RouteProp<'send2'>
}

const SendComponent = (props: Props) => {
  const { route } = props
  const theme = useTheme()

  const flipInputModalRef = React.useRef<FlipInputModalRef>(null)
  const { walletId: initWalletId = '', tokenId: tokenIdProp, spendInfo: initSpendInfo, openCamera, lockTilesMap = {}, hiddenTilesMap = {} } = route.params

  const [walletId, setWalletId] = useState<string>(initWalletId)
  const [spendInfo, setSpendInfo] = useState<EdgeSpendInfo>(initSpendInfo ?? { spendTargets: [{}] })
  const [fieldChanged, setFieldChanged] = useState<ExchangeFlipInputFields>('fiat')
  const [feeNativeAmount, setFeeNativeAmount] = useState<string>('')
  const [error, setError] = useState<Error | undefined>(undefined)
  const [edgeTransaction, setEdgeTransaction] = useState<EdgeTransaction | null>(null)

  // 0 = no max spend. 1 and higher = the spendTarget that requested the max spend. 1 = 1st, 2 = 2nd ...
  const [maxSpendSetter, setMaxSpendSetter] = useState<number>(0)

  const account = useSelector<EdgeAccount>(state => state.core.account)
  const exchangeRates = useSelector<GuiExchangeRates>(state => state.exchangeRates)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const [currencyCode, setCurrencyCode] = useState<string>(spendInfo?.currencyCode ?? currencyWallets[walletId].currencyInfo.currencyCode)
  const { pluginId } = currencyWallets[walletId].currencyInfo
  const cryptoDisplayDenomination = useDisplayDenom(pluginId, currencyCode)
  const cryptoExchangeDenomination = useExchangeDenom(pluginId, currencyCode)
  const parentDisplayDenom = useDisplayDenom(pluginId, currencyWallets[walletId].currencyInfo.currencyCode)
  const parentExchangeDenom = useExchangeDenom(pluginId, currencyWallets[walletId].currencyInfo.currencyCode)
  const coreWallet = currencyWallets[walletId]

  const tokenId = tokenIdProp ?? getTokenId(account, pluginId, currencyCode)
  spendInfo.currencyCode = getCurrencyCode(coreWallet, tokenId)

  const handleChangeAddress =
    (spendTarget: EdgeSpendTarget) =>
    async (changeAddressResult: ChangeAddressResult): Promise<void> => {
      spendTarget.publicAddress = changeAddressResult.parsedUri?.publicAddress ?? ''

      // We can assume the spendTarget object came from the Component spendInfo so simply resetting the spendInfo
      // should properly re-render with new spendTargets
      setSpendInfo({ ...spendInfo })
    }

  const handleAddressAmountPress = (index: number) => () => {
    spendInfo.spendTargets.splice(index, 1)
    setSpendInfo({ ...spendInfo })
  }

  const renderAddressAmountTile = (index: number, spendTarget: EdgeSpendTarget) => {
    const { publicAddress, nativeAmount } = spendTarget
    return (
      <EditableAmountTile
        title={`Send To ${publicAddress}`}
        exchangeRates={exchangeRates}
        nativeAmount={nativeAmount ?? ''}
        wallet={coreWallet}
        currencyCode={currencyCode}
        exchangeDenomination={cryptoExchangeDenomination}
        displayDenomination={cryptoDisplayDenomination}
        lockInputs={lockTilesMap.amount ?? false}
        compressed
        // TODO: Handle press
        onPress={handleAddressAmountPress(index)}
      />
    )
  }

  const handleResetSendTransaction = (spendTarget: EdgeSpendTarget) => () => {
    spendTarget.otherParams = undefined
    spendTarget.publicAddress = undefined
    spendTarget.nativeAmount = undefined
    setSpendInfo({ ...spendInfo })
  }

  const renderAddressTile = (index: number, spendTarget: EdgeSpendTarget) => {
    if (coreWallet != null && !hiddenTilesMap.address) {
      // TODO: Change API of AddressTile to access undefined recipientAddress
      const { publicAddress = '' } = spendTarget
      const title = s.strings.send_scene_send_to_address + (spendInfo.spendTargets.length > 1 ? ` ${(index + 1).toString()}` : '')
      return (
        <AddressTile2
          title={title}
          recipientAddress={publicAddress}
          coreWallet={coreWallet}
          currencyCode={currencyCode}
          onChangeAddress={handleChangeAddress(spendTarget)}
          resetSendTransaction={handleResetSendTransaction(spendTarget)}
          lockInputs={lockTilesMap.address}
          isCameraOpen={!!openCamera}
        />
      )
    }

    return null
  }

  const handleAmountsChanged = (spendTarget: EdgeSpendTarget) => (amounts: ExchangedFlipInputAmounts) => {
    const { nativeAmount, fieldChanged: newField } = amounts
    spendTarget.nativeAmount = nativeAmount === '' ? undefined : nativeAmount

    // This works since the spendTarget object is guaranteed to be inside
    // the spendInfo object
    setSpendInfo({ ...spendInfo })
    setMaxSpendSetter(0)
    setFieldChanged(newField)
  }

  const handleSetMax = (index: number) => () => {
    setMaxSpendSetter(index)
  }

  const handleFeesChange = useHandler(() => {
    // if (coreWallet == null) return
    // navigation.navigate('changeMiningFee2', {
    //   spendInfo,
    //   maxSpendSetter,
    //   wallet: coreWallet,
    //   onSubmit: (networkFeeOption, customNetworkFee) => {
    //     setSpendInfo({ ...spendInfo, networkFeeOption, customNetworkFee })
    //     setMaxSpendSetter(false)
    //   }
    // })
  })

  const handleFlipInputModal = (index: number, spendTarget: EdgeSpendTarget) => () => {
    Airship.show<FlipInputModalResult>(bridge => (
      <FlipInputModal2
        ref={flipInputModalRef}
        bridge={bridge}
        startNativeAmount={spendTarget.nativeAmount}
        forceField={fieldChanged}
        onAmountsChanged={handleAmountsChanged(spendTarget)}
        onMaxSet={handleSetMax(index + 1)}
        onFeesChange={handleFeesChange}
        wallet={coreWallet}
        tokenId={tokenId}
        feeNativeAmount={feeNativeAmount}
      />
    )).catch(error => console.log(error))
  }

  const renderAmount = (index: number, spendTarget: EdgeSpendTarget) => {
    const { publicAddress, nativeAmount } = spendTarget
    if (publicAddress != null && !hiddenTilesMap.amount) {
      const title = s.strings.fio_request_amount + (spendInfo.spendTargets.length > 1 ? ` ${(index + 1).toString()}` : '')
      return (
        <EditableAmountTile
          title={title}
          exchangeRates={exchangeRates}
          nativeAmount={nativeAmount ?? ''}
          wallet={coreWallet}
          currencyCode={currencyCode}
          exchangeDenomination={cryptoExchangeDenomination}
          displayDenomination={cryptoDisplayDenomination}
          lockInputs={lockTilesMap.amount ?? false}
          // TODO: Handle press
          onPress={handleFlipInputModal(index, spendTarget)}
        />
      )
    }

    return null
  }

  const renderAddressAmountPairs = () => {
    const out: Array<JSX.Element | null> = []
    for (let i = 0; i < spendInfo.spendTargets.length; i++) {
      const spendTarget = spendInfo.spendTargets[i]
      let element
      if (i < spendInfo.spendTargets.length - 1) {
        element = renderAddressAmountTile(i, spendTarget)
        if (element != null) out.push(element)
      } else {
        element = renderAddressTile(i, spendTarget)
        if (element != null) out.push(element)
        element = renderAmount(i, spendTarget)
        if (element != null) out.push(element)
      }
    }
    return out
  }

  const handleWalletPress = useHandler(() => {
    Airship.show<WalletListResult>(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.fio_src_wallet} />)
      .then((result: WalletListResult) => {
        if (result.walletId == null || result.currencyCode == null) {
          return
        }
        setWalletId(result.walletId)
        const { pluginId: newPluginId } = currencyWallets[result.walletId].currencyInfo
        if (pluginId !== newPluginId || currencyCode !== result.currencyCode) {
          setCurrencyCode(result.currencyCode)
          setSpendInfo({ spendTargets: [{}] })
        }
      })
      .catch(error => {
        showError(error)
        console.error(error)
      })
  })

  const renderSelectedWallet = () => {
    const name = coreWallet == null ? '' : getWalletName(coreWallet)

    return (
      <Tile
        type={lockTilesMap.wallet ? 'static' : 'editable'}
        title={s.strings.send_scene_send_from_wallet}
        onPress={lockTilesMap.wallet ? undefined : handleWalletPress}
        body={`${name} (${currencyCode})`}
      />
    )
  }

  const handleAddAddress = useHandler(() => {
    spendInfo.spendTargets.push({})
    setSpendInfo({ ...spendInfo })
  })

  const renderAddAddress = () => {
    const type = coreWallet.type
    const maxSpendTargets = getSpecialCurrencyInfo(type)?.maxSpendTargets ?? 1
    if (maxSpendTargets < 2 || hiddenTilesMap.address || hiddenTilesMap.amount || lockTilesMap.address || lockTilesMap.amount) {
      return null
    }
    const numTargets = spendInfo.spendTargets.length
    const lastTargetHasAddress = spendInfo.spendTargets[numTargets - 1].publicAddress != null
    const lastTargetHasAmount = spendInfo.spendTargets[numTargets - 1].nativeAmount != null
    if (lastTargetHasAddress && lastTargetHasAmount) {
      return <Tile type="touchable" title={s.strings.send_add_destination_address} onPress={handleAddAddress} maximumHeight="small" contentPadding />
    } else {
      return null
    }
  }

  const renderError = () => {
    if (error && asMaybeNoAmountSpecifiedError(error) == null) {
      return <ErrorTile message={error.message} />
    }
    return null
  }

  const renderFees = () => {
    if (edgeTransaction != null) {
      const { noChangeMiningFee } = getSpecialCurrencyInfo(pluginId)
      let feeDisplayDenomination: EdgeDenomination
      let feeExchangeDenomination: EdgeDenomination
      if (edgeTransaction.parentNetworkFee != null) {
        feeDisplayDenomination = parentDisplayDenom
        feeExchangeDenomination = parentExchangeDenom
      } else {
        feeDisplayDenomination = cryptoDisplayDenomination
        feeExchangeDenomination = cryptoExchangeDenomination
      }
      const transactionFee = convertTransactionFeeToDisplayFee(coreWallet, exchangeRates, edgeTransaction, feeDisplayDenomination, feeExchangeDenomination)

      const fiatAmount = transactionFee.fiatAmount === '0' ? '0' : ` ${transactionFee.fiatAmount}`
      const feeSyntax = `${transactionFee.cryptoSymbol ?? ''} ${transactionFee.cryptoAmount} (${transactionFee.fiatSymbol ?? ''}${fiatAmount})`
      const feeSyntaxStyle = transactionFee.fiatStyle

      return (
        <Tile type={noChangeMiningFee ? 'static' : 'touchable'} title={`${s.strings.string_fee}:`} onPress={handleFeesChange}>
          <EdgeText
            style={{
              // @ts-expect-error
              color: feeSyntaxStyle ? theme[feeSyntaxStyle] : theme.primaryText
            }}
          >
            {feeSyntax}
          </EdgeText>
        </Tile>
      )
    }

    return null
  }

  // Calculate the transaction
  useAsyncEffect(async () => {
    try {
      if (spendInfo.spendTargets[0].publicAddress == null) {
        setEdgeTransaction(null)
        return
      }
      if (maxSpendSetter === 1) {
        const maxSpendable = await coreWallet.getMaxSpendable(spendInfo)
        spendInfo.spendTargets[0].nativeAmount = maxSpendable
      }
      if (spendInfo.spendTargets[0].nativeAmount == null) {
        flipInputModalRef.current?.setFees({ feeNativeAmount: '' })
        return
      }
      const edgeTx = await coreWallet.makeSpend(spendInfo)
      setEdgeTransaction(edgeTx)
      const { parentNetworkFee, networkFee } = edgeTx
      const feeNativeAmount = parentNetworkFee ?? networkFee
      const feeTokenId = parentNetworkFee == null ? tokenId : undefined
      setFeeNativeAmount(feeNativeAmount)
      flipInputModalRef.current?.setFees({ feeTokenId, feeNativeAmount })
      flipInputModalRef.current?.setError(null)
      setError(undefined)
    } catch (e: any) {
      setError(e)
      setEdgeTransaction(null)
      flipInputModalRef.current?.setError(e.message)
      flipInputModalRef.current?.setFees({ feeNativeAmount: '' })
    }
  }, [spendInfo, maxSpendSetter])

  return (
    <SceneWrapper background="theme">
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        {renderSelectedWallet()}
        {renderAddressAmountPairs()}
        {renderAddAddress()}
        {renderError()}
        {renderFees()}
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

export const SendScene2 = React.memo(SendComponent)
