import { asNumber, asObject, asString, asValue } from 'cleaners'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ScrollView } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { useHandler } from '../../../hooks/useHandler'
import s from '../../../locales/strings'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { SceneWrapper } from '../../common/SceneWrapper'
import { showError } from '../../services/AirshipInstance'
import { Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { SafeSlider } from '../../themed/SafeSlider'
import { Radio } from '../../themed/ThemedButtons'
import { Tile } from '../../tiles/Tile'

export interface FioCreateHandleConfirmationProps {
  fioHandle: string
  wallet: EdgeCurrencyWallet
}

interface Props {
  navigation: NavigationProp<'fioCreateHandleConfirmation'>
  route: RouteProp<'fioCreateHandleConfirmation'>
}

const asSuccessResponse = asObject({
  account_id: asNumber,
  error: asValue(false)
})

const asFailedResponse = asObject({
  success: asValue(false),
  error: asString
})

export const FioCreateHandleConfirmationScene = ({ navigation, route }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { fioHandle, wallet } = route.params

  const [acknowledge, setAcknowledge] = React.useState(false)

  const handleCancelPress = useHandler(() => {
    throw new Error('Function not implemented.')
  })

  const handleAcknowledgePress = useHandler(() => {
    setAcknowledge(!acknowledge)
  })

  const handleSubmit = useHandler(async () => {
    console.debug(
      JSON.stringify(
        {
          address: fioHandle,
          referralCode: 'edgefree',
          publicKey: (await wallet.getReceiveAddress()).publicAddress,
          redirectUrl: '',
          apiToken: '1aNR92i2HC9MMs7ITvHSrcHu2hEoi1fhk2wLmLGDo670gA'
        },
        null,
        2
      )
    )
    try {
      const buyAddressRes = await fetch('https://reg.fioprotocol.io/public-api/buy-address', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(
          {
            address: fioHandle,
            referralCode: 'edgefree',
            publicKey: (await wallet.getReceiveAddress()).publicAddress,
            redirectUrl: '',
            apiToken: '1aNR92i2HC9MMs7ITvHSrcHu2hEoi1fhk2wLmLGDo670gA'
          },
          null,
          2
        )
      }).then(async res => res.json())

      console.debug(JSON.stringify(buyAddressRes, null, 2))
      try {
        asSuccessResponse(buyAddressRes)
        navigation.navigate('walletList', {})
      } catch (e: any) {
        try {
          const failedRes = asFailedResponse(buyAddressRes)
          showError(failedRes.error)
        } catch (e: any) {
          showError(e)
        }
      }
    } catch (e: any) {
      showError(e.message)
    }
  })

  return (
    <SceneWrapper background="header">
      <ScrollView contentContainerStyle={styles.container}>
        <Tile type="static" title="FIO Crypto Handle" body={fioHandle} />
        <Tile type="static" title="Connect to Wallet" body={wallet.name ?? ''} />
        <Radio value={acknowledge} onPress={handleAcknowledgePress} marginRem={[2, 2, 0]}>
          <EdgeText style={styles.checkTitle} numberOfLines={4}>
            {s.strings.fio_connect_checkbox_text}
          </EdgeText>
        </Radio>
        <SafeSlider parentStyle={styles.slider} onSlidingComplete={handleSubmit} disabledText={s.strings.send_confirmation_slide_to_confirm} disabled={false} />
        <MainButton type="secondary" label="Cancel" onPress={handleCancelPress} marginRem={1} />
      </ScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    // alignItems: 'center',
    // paddingVertical: theme.rem(3)
  },
  slider: {
    paddingVertical: theme.rem(1)
  },
  checkTitle: {
    fontSize: theme.rem(0.75),
    color: theme.primaryText,
    marginLeft: theme.rem(1)
  }
}))
