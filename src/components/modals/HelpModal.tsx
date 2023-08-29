import * as React from 'react'
import { Dimensions, Image, Keyboard, Linking, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { getBuildNumber, getVersion } from 'react-native-device-info'
import { sprintf } from 'sprintf-js'

import { Fontello } from '../../assets/vector'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { openBrowserUri } from '../../util/WebUtils'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ModalTitle } from '../themed/ModalParts'
import { SelectableRow } from '../themed/SelectableRow'
import { ThemedModal } from '../themed/ThemedModal'

const buildNumber = getBuildNumber()
const versionNumber = getVersion()

export async function showHelpModal(navigation: NavigationBase): Promise<void> {
  return await Airship.show(bridge => <HelpModal bridge={bridge} navigation={navigation} />)
}

interface Props {
  bridge: AirshipBridge<void>
  navigation: NavigationBase
}

export const HelpModal = (props: Props) => {
  const { bridge, navigation } = props
  const theme = useTheme()
  const account = useSelector(state => state.core.account)
  const loggedIn = useWatch(account, 'loggedIn')

  const handleClose = useHandler(() => bridge.resolve())

  const handleSitePress = useHandler((title: string, uri: string) => {
    if (loggedIn) {
      navigation.navigate('webView', { title, uri })
      Airship.clear()
    } else {
      // Just open in a browser since we don't all the features of a full
      // logged-in scene:
      openBrowserUri(uri)
    }
  })

  React.useEffect(() => {
    Keyboard.dismiss()
  }, [])

  const styles = getStyles(theme)
  const versionText = `${lstrings.help_version} ${versionNumber}`
  const buildText = `${lstrings.help_build} ${buildNumber}`
  const optionMarginRem = [0.75, 0, 0.5, 1]
  const optionPaddingRem = [0, 1, 1, 0]
  const helpModalTitle = sprintf(lstrings.help_modal_title_thanks, config.appName)
  const helpSiteMoreInfoText = sprintf(lstrings.help_site_more_info_text, config.appName)

  return (
    <ThemedModal bridge={bridge} onCancel={handleClose} paddingRem={[1, 0]}>
      <View style={styles.titleContainer}>
        <Image source={theme.primaryLogo} style={styles.logo} resizeMode="contain" />
        <ModalTitle center paddingRem={[0, 1, 1]}>
          {helpModalTitle}
        </ModalTitle>
      </View>

      <SelectableRow
        arrowTappable
        icon={<Fontello name="help_idea" color={theme.iconTappable} size={theme.rem(1.5)} />}
        marginRem={optionMarginRem}
        paddingRem={optionPaddingRem}
        subTitle={lstrings.help_knowledge_base_text}
        title={lstrings.help_knowledge_base}
        underline
        onPress={() => handleSitePress(lstrings.help_knowledge_base, config.knowledgeBase)}
      />

      <SelectableRow
        arrowTappable
        icon={<Fontello name="help_headset" color={theme.iconTappable} size={theme.rem(1.5)} />}
        marginRem={optionMarginRem}
        paddingRem={optionPaddingRem}
        subTitle={lstrings.help_support_text}
        title={lstrings.help_support}
        underline
        onPress={() => handleSitePress(lstrings.help_support, config.supportSite)}
      />

      <SelectableRow
        arrowTappable
        icon={<Fontello name="help_call" color={theme.iconTappable} size={theme.rem(1.5)} />}
        marginRem={optionMarginRem}
        paddingRem={optionPaddingRem}
        subTitle={lstrings.help_call_text}
        title={lstrings.help_call}
        underline
        onPress={async () => await Linking.openURL(`tel:${config.phoneNumber}`)}
      />

      <SelectableRow
        arrowTappable
        icon={<Fontello name="globe" color={theme.iconTappable} size={theme.rem(1.5)} />}
        marginRem={optionMarginRem}
        paddingRem={optionPaddingRem}
        subTitle={helpSiteMoreInfoText}
        title={sprintf(lstrings.help_visit_site, config.appName)}
        underline
        onPress={() => handleSitePress(helpSiteMoreInfoText, config.website)}
      />
      <SelectableRow
        arrowTappable
        icon={<Fontello name="doc-text" color={theme.iconTappable} size={theme.rem(1.5)} />}
        marginRem={optionMarginRem}
        paddingRem={optionPaddingRem}
        subTitle={lstrings.help_terms_of_service_text}
        title={lstrings.title_terms_of_service}
        onPress={() => handleSitePress(lstrings.title_terms_of_service, config.termsOfServiceSite)}
      />
      <View style={styles.footer}>
        <EdgeText style={styles.version}>{versionText}</EdgeText>
        <EdgeText style={styles.version}>{buildText}</EdgeText>
      </View>
    </ThemedModal>
  )
}

const deviceHeight = Dimensions.get('window').height

const getStyles = cacheStyles((theme: Theme) => ({
  titleContainer: {
    marginTop: theme.rem(0.5),
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    height: theme.rem(2.25)
  },
  footer: {
    marginTop: deviceHeight < theme.rem(42) ? 0 : theme.rem(1.5),
    paddingVertical: deviceHeight < theme.rem(42) ? theme.rem(0.25) : theme.rem(0.5),
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  version: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75)
  }
}))
