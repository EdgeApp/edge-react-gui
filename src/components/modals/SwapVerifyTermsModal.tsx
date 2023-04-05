import { EdgeSwapConfig, EdgeSwapInfo } from 'edge-core-js/types'
import * as React from 'react'
import { Linking, Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'

import { lstrings } from '../../locales/strings'
import { getSwapPluginIconUri } from '../../util/CdnUris'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { MainButton } from '../themed/MainButton'
import { ModalMessage, ModalTitle } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'

interface TermsUri {
  termsUri?: string
  privacyUri?: string
  kycUri?: string
}

const pluginData: { [pluginId: string]: TermsUri } = {
  changenow: {
    termsUri: 'https://changenow.io/terms-of-use',
    privacyUri: 'https://changenow.io/privacy-policy',
    kycUri: 'https://changenow.io/faq/kyc'
  }
}

export async function swapVerifyTerms(swapConfig: EdgeSwapConfig): Promise<boolean> {
  const { pluginId } = swapConfig.swapInfo
  const uris = pluginData[pluginId]
  if (uris == null) return true
  if (swapConfig.userSettings && swapConfig.userSettings.agreedToTerms) {
    return true
  }

  const result = await Airship.show<boolean>(bridge => <SwapVerifyTermsModal bridge={bridge} swapInfo={swapConfig.swapInfo} uris={uris} />)

  if (result) {
    await swapConfig.changeUserSettings({ agreedToTerms: true })
  } else {
    await swapConfig.changeUserSettings({ agreedToTerms: false })
    await swapConfig.changeEnabled(false)
  }
  return result
}

interface Props {
  bridge: AirshipBridge<boolean>
  swapInfo: EdgeSwapInfo
  uris: TermsUri
}

function SwapVerifyTermsModal(props: Props) {
  const { bridge, swapInfo, uris } = props
  const { displayName, pluginId } = swapInfo
  const { termsUri, privacyUri, kycUri } = uris
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(false)}>
      <View style={styles.titleContainer}>
        <FastImage style={styles.titleImage} source={{ uri: getSwapPluginIconUri(pluginId, theme) }} resizeMode="contain" />
        <ModalTitle>{displayName}</ModalTitle>
      </View>
      <ModalMessage>{lstrings.swap_terms_statement}</ModalMessage>
      <MainButton label={lstrings.swap_terms_accept_button} marginRem={0.5} onPress={() => bridge.resolve(true)} />
      <MainButton label={lstrings.swap_terms_reject_button} marginRem={0.5} type="secondary" onPress={() => bridge.resolve(false)} />
      <View style={styles.linkContainer}>
        {termsUri == null ? null : (
          <Text style={styles.linkText} onPress={async () => await Linking.openURL(termsUri)}>
            {lstrings.swap_terms_terms_link}
          </Text>
        )}
        {privacyUri == null ? null : (
          <Text style={styles.linkText} onPress={async () => await Linking.openURL(privacyUri)}>
            {lstrings.swap_terms_privacy_link}
          </Text>
        )}
        {kycUri == null ? null : (
          <Text style={styles.linkText} onPress={async () => await Linking.openURL(kycUri)}>
            {lstrings.swap_terms_kyc_link}
          </Text>
        )}
      </View>
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  linkText: {
    color: theme.iconTappable,
    flexShrink: 1,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(0.84),
    margin: theme.rem(0.5)
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  titleImage: {
    height: theme.rem(1.75),
    margin: theme.rem(0.5),
    width: theme.rem(1.75)
  }
}))
