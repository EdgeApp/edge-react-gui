// @flow

import * as React from 'react'
import { Image, Keyboard, Linking, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { getBuildNumber, getVersion } from 'react-native-device-info'
import { WebView } from 'react-native-webview'

import logo from '../../assets/images/olingoLogo/Olingo_logo_Icon.png'

import { Fontello } from '../../assets/vector'
import s from '../../locales/strings.js'
import { PLATFORM } from '../../theme/variables/platform.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts'
import { SelectableRow } from '../themed/SelectableRow'
import { ThemedModal } from '../themed/ThemedModal'

const buildNumber = getBuildNumber()
const versionNumber = getVersion()
const HELP_URIS = {
  knowledgeBase: 'https://support.edge.app/support/home',
  support: 'https://support.edge.app/support/tickets/new',
  call: '+1-855-346-4974',
  site: 'https://edge.app'
}

export function showHelpModal(): Promise<mixed> {
  return Airship.show(bridge => <HelpModal bridge={bridge} />)
}

function showWebViewModal(uri: string, title: string): void {
  Airship.show(bridge => <HelpWebViewModal bridge={bridge} uri={uri} title={title} />)
}

type Props = {
  bridge: AirshipBridge<void>
}

class HelpWebViewModal extends React.Component<Props & { uri: string, title: string }> {
  webview: WebView | void
  handleClose = () => this.props.bridge.resolve()

  render() {
    const { bridge, uri, title } = this.props
    return (
      <ThemedModal bridge={bridge} onCancel={this.handleClose} paddingRem={[1, 0]}>
        <ModalTitle center paddingRem={[0, 1, 1]}>
          {title}
        </ModalTitle>
        <WebView ref={element => (this.webview = element)} source={{ uri }} />

        <ModalCloseArrow onPress={this.handleClose} />
      </ThemedModal>
    )
  }
}

class HelpModalComponent extends React.Component<Props & ThemeProps> {
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

    return (
      <ThemedModal bridge={bridge} onCancel={this.handleClose} paddingRem={[1, 0]}>
        <View style={styles.titleContainer}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <ModalTitle center paddingRem={[0, 1, 1]}>
            {s.strings.help_modal_title}
          </ModalTitle>
        </View>

        <SelectableRow
          icon={<Fontello name="help_idea" color={theme.iconTappable} size={theme.rem(1.5)} />}
          title={s.strings.help_knowledge_base}
          subTitle={s.strings.help_knowledge_base_text}
          onPress={() => showWebViewModal(HELP_URIS.knowledgeBase, s.strings.help_knowledge_base)}
          underline
          arrowTappable
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
        />

        <SelectableRow
          icon={<Fontello name="help_headset" color={theme.iconTappable} size={theme.rem(1.5)} />}
          title={s.strings.help_support}
          subTitle={s.strings.help_support_text}
          onPress={() => showWebViewModal(HELP_URIS.support, s.strings.help_support)}
          underline
          arrowTappable
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
        />

        <SelectableRow
          icon={<Fontello name="help_call" color={theme.iconTappable} size={theme.rem(1.5)} />}
          title={s.strings.help_call}
          subTitle={s.strings.help_call_text}
          onPress={() => Linking.openURL(`tel:${HELP_URIS.call}`)}
          underline
          arrowTappable
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
        />

        <SelectableRow
          icon={<Fontello name="globe" color={theme.iconTappable} size={theme.rem(1.5)} />}
          title={s.strings.help_site}
          subTitle={s.strings.help_site_text}
          onPress={() => showWebViewModal(HELP_URIS.site, s.strings.help_site_text)}
          arrowTappable
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
        />
        <View style={styles.footer}>
          <EdgeText style={styles.version}>{versionText}</EdgeText>
          <EdgeText style={styles.version}>{buildText}</EdgeText>
        </View>

        <ModalCloseArrow onPress={this.handleClose} />
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

const HelpModal = withTheme(HelpModalComponent)
