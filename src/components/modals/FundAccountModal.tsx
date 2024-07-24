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
import { NavigationBase } from '../../types/routerTypes'
import { Airship } from '../services/AirshipInstance'
import { Theme, useTheme } from '../services/ThemeContext'
import { SelectableRow } from '../themed/SelectableRow'
import { ButtonsModal } from './ButtonsModal'
import { EdgeModal } from './EdgeModal'
import { WalletListModal, WalletListResult } from './WalletListModal'

interface Props {
  bridge: AirshipBridge<void>
  navigation: NavigationBase
}

/**
 * Renders a modal with descritive options for funding an account
 */
export const FundAccountModal = (props: Props) => {
  const { bridge, navigation } = props
  const theme = useTheme()
  const style = styles(theme)
  const dispatch = useDispatch()

  const handleBuy = useHandler(() => {
    navigation.navigate('buyTab', { screen: 'pluginListBuy' })
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

      await Airship.show<'ok' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.fund_account_modal_receive_title}
          message={lstrings.fund_account_modal_receive_message}
          buttons={{ ok: { label: lstrings.string_ok } }}
        />
      ))
    }
  })

  const handleCancel = useHandler(() => {
    bridge.resolve()
  })

  const iconProps = React.useMemo(() => ({ size: theme.rem(1.25), color: theme.iconTappable }), [theme])

  return (
    <EdgeModal bridge={bridge} title={lstrings.fund_account_modal_title} onCancel={handleCancel}>
      <SelectableRow
        marginRem={0.5}
        minimumFontScale={0.5}
        title={lstrings.buy_crypto}
        subTitle={lstrings.fund_account_modal_buy_body}
        onPress={handleBuy}
        icon={
          <View style={style.iconContainer}>
            <FontAwesomeIcon name="bank" {...iconProps} />
            <AntDesignIcon name="arrowright" {...iconProps} />
          </View>
        }
      />
      <SelectableRow
        marginRem={0.5}
        minimumFontScale={0.5}
        title={lstrings.fund_account_modal_receive_title}
        subTitle={sprintf(lstrings.fund_account_modal_receive_body_1s, config.appName)}
        onPress={handleReceive}
        icon={
          <View style={style.iconContainer}>
            <AntDesignIcon name="wallet" {...iconProps} />
            <AntDesignIcon name="arrowright" {...iconProps} />
          </View>
        }
      />
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
