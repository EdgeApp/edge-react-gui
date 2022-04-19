// @flow

import { type EdgeSwapConfig, type EdgeSwapInfo } from 'edge-core-js/types'
import * as React from 'react'
import { Linking, Text, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'

import { getSwapPluginIconUri } from '../../constants/CdnUris'
import s from '../../locales/strings.js'
import { Airship } from '../services/AirshipInstance.js'
import { cacheStyles, useTheme } from '../services/ThemeContext'
import { MainButton } from '../themed/MainButton'
import { ModalMessage, ModalTitle } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'

type TermsUri = {
  termsUri?: string,
  privacyUri?: string,
  kycUri?: string
}

const pluginData: { [pluginId: string]: TermsUri } = {
  changelly: {
    termsUri: 'https://changelly.com/terms-of-use',
    privacyUri: 'https://changelly.com/privacy-policy',
    kycUri: 'https://changelly.com/aml-kyc'
  },
  switchain: {
    termsUri: 'https://www.switchain.com/tos',
    privacyUri: 'https://www.switchain.com/policy',
    kycUri: 'https://www.switchain.com/policy'
  },
  changenow: {
    termsUri: 'https://changenow.io/terms-of-use',
    privacyUri: 'https://changenow.io/privacy-policy',
    kycUri: 'https://changenow.io/faq/kyc'
  },
  foxExchange: {
    termsUri: 'https://fox.exchange/tos'
  }
}

export async function swapVerifyTerms(swapConfig: EdgeSwapConfig): Promise<boolean> {
  const { pluginId } = swapConfig.swapInfo
  const uris = pluginData[pluginId]
  if (uris == null) return true
  if (swapConfig.userSettings && swapConfig.userSettings.agreedToTerms) {
    return true
  }

  const result = await Airship.show(bridge => <SwapVerifyTermsModal bridge={bridge} swapInfo={swapConfig.swapInfo} uris={uris} />)

  if (result) {
    await swapConfig.changeUserSettings({ agreedToTerms: true })
  } else {
    await swapConfig.changeUserSettings({ agreedToTerms: false })
    await swapConfig.changeEnabled(false)
  }
  return result
}

type Props = {
  bridge: AirshipBridge<boolean>,
  swapInfo: EdgeSwapInfo,
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
      <ModalMessage>{s.strings.swap_terms_statement}</ModalMessage>
      <MainButton label={s.strings.swap_terms_accept_button} marginRem={0.5} onPress={() => bridge.resolve(true)} />
      <MainButton label={s.strings.swap_terms_reject_button} marginRem={0.5} type="secondary" onPress={() => bridge.resolve(false)} />
      <View style={styles.linkContainer}>
        {termsUri == null ? null : (
          <Text style={styles.linkText} onPress={() => Linking.openURL(termsUri)}>
            {s.strings.swap_terms_terms_link}
          </Text>
        )}
        {privacyUri == null ? null : (
          <Text style={styles.linkText} onPress={() => Linking.openURL(privacyUri)}>
            {s.strings.swap_terms_privacy_link}
          </Text>
        )}
        {kycUri == null ? null : (
          <Text style={styles.linkText} onPress={() => Linking.openURL(kycUri)}>
            {s.strings.swap_terms_kyc_link}
          </Text>
        )}
      </View>
    </ThemedModal>
  )
}

const getStyles = cacheStyles(theme => ({
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
