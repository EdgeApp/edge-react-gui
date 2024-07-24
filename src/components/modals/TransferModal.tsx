import { EdgeAccount } from 'edge-core-js'
import React from 'react'
import { View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { cacheStyles } from 'react-native-patina'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import { sprintf } from 'sprintf-js'

import { selectWalletToken } from '../../actions/WalletActions'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useDispatch } from '../../types/reactRedux'
import { Airship } from '../services/AirshipInstance'
import { Theme, useTheme } from '../services/ThemeContext'
import { SelectableRow } from '../themed/SelectableRow'
import { EdgeModal } from './EdgeModal'
import { WalletListModal, WalletListResult } from './WalletListModal'

interface Props {
  bridge: AirshipBridge<void>
  account: EdgeAccount
  depositOrSend: 'deposit' | 'send'
  navigation: any
}

interface TransferOption {
  icon: React.ReactNode
  title: string
  onPress: () => void
}

/**
 * Renders a modal with descritive options for transferring crypto in/out of
 * Edge, i.e.: buying/selling/sending/receiving crypto
 */
export const TransferModal = ({ account, bridge, depositOrSend, navigation }: Props) => {
  const theme = useTheme()
  const style = styles(theme)
  const dispatch = useDispatch()

  const handleSell = useHandler(() => {
    navigation.navigate('sellTab', { screen: 'pluginListSell' })
    Airship.clear()
  })

  const handleBuy = useHandler(() => {
    navigation.navigate('buyTab', { screen: 'pluginListBuy' })
    Airship.clear()
  })

  const handleSend = useHandler(async () => {
    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} headerTitle={lstrings.select_wallet_to_send_from} navigation={navigation} />
    ))
    if (result?.type === 'wallet') {
      const { walletId, tokenId } = result
      navigation.push('send2', { walletId, tokenId, hiddenFeaturesMap: { scamWarning: false } })
    }
    Airship.clear()
  })

  const handleReceive = useHandler(async () => {
    Airship.clear()

    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} headerTitle={lstrings.select_receive_asset} navigation={navigation} showCreateWallet />
    ))

    if (result?.type === 'wallet') {
      const { walletId, tokenId } = result
      await dispatch(selectWalletToken({ navigation, walletId, tokenId }))
      navigation.navigate('request', { tokenId, walletId })
    }
  })

  const handleCancel = useHandler(() => {
    bridge.resolve()
  })

  const iconProps = { size: theme.rem(1.25), color: theme.iconTappable }
  const depositOptions: TransferOption[] = [
    {
      icon: (
        <>
          <FontAwesomeIcon name="bank" {...iconProps} />
          <AntDesignIcon name="arrowright" {...iconProps} />
        </>
      ),
      title: lstrings.transfer_from_bank_title,
      onPress: handleBuy
    },
    {
      icon: (
        <>
          <AntDesignIcon name="wallet" {...iconProps} />
          <AntDesignIcon name="arrowright" {...iconProps} />
        </>
      ),
      title: lstrings.transfer_from_wallet_title,
      onPress: handleReceive
    }
  ]

  const sendOptions: TransferOption[] = [
    {
      icon: (
        <>
          <AntDesignIcon name="arrowright" {...iconProps} />
          <FontAwesomeIcon name="bank" {...iconProps} />
        </>
      ),
      title: lstrings.transfer_to_bank_title,
      onPress: handleSell
    },
    {
      icon: (
        <>
          <FontAwesomeIcon name="bank" {...iconProps} />
          <AntDesignIcon name="arrowright" {...iconProps} />
        </>
      ),
      title: sprintf(lstrings.transfer_to_from_bank_title_1s, config.appName),
      onPress: handleBuy
    },
    {
      icon: (
        <>
          <AntDesignIcon name="arrowright" {...iconProps} />
          <AntDesignIcon name="wallet" {...iconProps} />
        </>
      ),
      title: lstrings.transfer_to_another_wallet_title,
      onPress: handleSend
    }
  ]

  const options = depositOrSend === 'deposit' ? depositOptions : sendOptions
  return (
    <EdgeModal bridge={bridge} title={depositOrSend === 'deposit' ? lstrings.loan_fragment_deposit : lstrings.fragment_send_subtitle} onCancel={handleCancel}>
      {options.map((option, index) => {
        const { title, icon, onPress } = option
        return <SelectableRow marginRem={0.5} key={title} title={title} onPress={onPress} icon={<View style={style.iconContainer}>{icon}</View>} />
      })}
    </EdgeModal>
  )
}

const styles = cacheStyles((theme: Theme) => ({
  iconContainer: {
    flexDirection: 'row',
    paddingVertical: theme.rem(0.5),
    width: theme.rem(2.5),
    marginHorizontal: theme.rem(0)
  }
}))
