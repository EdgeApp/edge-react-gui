// @flow

import { useCavy } from 'cavy'
import * as React from 'react'
import { Image, Keyboard, Linking } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { getBuildNumber, getVersion } from 'react-native-device-info'
import { WebView } from 'react-native-webview'
import { sprintf } from 'sprintf-js'

import { Fontello } from '../../assets/vector'
import s from '../../locales/strings.js'
import { config } from '../../theme/appConfig.js'
import { PLATFORM } from '../../theme/variables/platform.js'
import { View } from '../../types/reactNative.js'
import { type TestProps } from '../../types/reactRedux.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts'
import { SelectableRow } from '../themed/SelectableRow'
import { ThemedModal } from '../themed/ThemedModal'

const buildNumber = getBuildNumber()
const versionNumber = getVersion()
const HELP_URIS = {
  knowledgeBase: config.knowledgeBase,
  support: config.supportSite,
  call: config.phoneNumber,
  site: config.website
}

export function showHelpModal(): Promise<mixed> {
  return Airship.show(bridge => <HelpModal bridge={bridge} />)
}

export function showWebViewModal(uri: string, title: string): void {
  Airship.show(bridge => <HelpWebViewModal bridge={bridge} uri={uri} title={title} />)
}

type Props = {
  bridge: AirshipBridge<void>
}

export const HelpWebViewModal = (props: Props & { uri: string, title: string }) => {
  const handleClose = () => props.bridge.resolve()
  const { bridge, uri, title } = props
  const generateTestHook = useCavy()
  return (
    <ThemedModal bridge={bridge} onCancel={handleClose} paddingRem={[1, 0]}>
      <ModalTitle center paddingRem={[0, 1, 1]}>
        {title}
      </ModalTitle>
      <WebView source={{ uri }} />

      <ModalCloseArrow onPress={handleClose} ref={generateTestHook('HelpModal.CloseHelpWebViewModal')} />
    </ThemedModal>
  )
}
export class HelpModalComponent extends React.Component<Props & ThemeProps & TestProps> {
  handleClose = () => this.props.bridge.resolve()

  componentDidMount() {
    Keyboard.dismiss()
  }

  render() {
    const { bridge, theme } = this.props
    const styles = getStyles(theme)
    const versionText = `${s.strings.help_version} ${versionNumber}`
    const buildText = `${s.strings.help_build} ${buildNumber}`
    const optionMarginRem = [0.75, 0, 0.5, 1]
    const optionPaddingRem = [0, 1, 1, 0]
    const helpModalTitle = sprintf(s.strings.help_modal_title_thanks, config.appName)
    const helpSiteMoreInfoText = sprintf(s.strings.help_site_more_info_text, config.appName)

    return (
      <ThemedModal bridge={bridge} onCancel={this.handleClose} paddingRem={[1, 0]}>
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
          subTitle={s.strings.help_knowledge_base_text}
          title={s.strings.help_knowledge_base}
          underline
          onPress={() => showWebViewModal(HELP_URIS.knowledgeBase, s.strings.help_knowledge_base)}
        />

        <SelectableRow
          arrowTappable
          icon={<Fontello name="help_headset" color={theme.iconTappable} size={theme.rem(1.5)} />}
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
          subTitle={s.strings.help_support_text}
          title={s.strings.help_support}
          underline
          onPress={() => showWebViewModal(HELP_URIS.support, s.strings.help_support)}
        />

        <SelectableRow
          arrowTappable
          icon={<Fontello name="help_call" color={theme.iconTappable} size={theme.rem(1.5)} />}
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
          subTitle={s.strings.help_call_text}
          title={s.strings.help_call}
          underline
          onPress={() => Linking.openURL(`tel:${HELP_URIS.call}`)}
        />

        <SelectableRow
          arrowTappable
          icon={<Fontello name="globe" color={theme.iconTappable} size={theme.rem(1.5)} />}
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
          subTitle={helpSiteMoreInfoText}
          title={sprintf(s.strings.help_visit_site, config.appName)}
          onPress={() => showWebViewModal(HELP_URIS.site, helpSiteMoreInfoText)}
        />
        <View style={styles.footer}>
          <EdgeText style={styles.version}>{versionText}</EdgeText>
          <EdgeText style={styles.version}>{buildText}</EdgeText>
        </View>

        <ModalCloseArrow onPress={this.handleClose} ref={this.props.generateTestHook('HelpModal.Close')} />
      </ThemedModal>
    )
  }
}

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
    marginTop: PLATFORM.deviceHeight < theme.rem(42) ? 0 : theme.rem(1.5),
    paddingVertical: PLATFORM.deviceHeight < theme.rem(42) ? theme.rem(0.25) : theme.rem(0.5),
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  version: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75)
  }
}))

const HelpModal = withTheme(props => <HelpModalComponent {...props} />)
