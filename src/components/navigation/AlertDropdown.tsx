import * as React from 'react'
import { Text, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { textStyle } from '../../styles/common/textStylesThemed'
import { trackError } from '../../util/tracking'
import { AirshipDropdown } from '../common/AirshipDropdown'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { styled } from '../hoc/styled'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  bridge: AirshipBridge<void>
  message: string

  /**
   * Error/exception thrown by the app. When present, makes dropdown persistent
   * and shows Report Error button at bottom.
   **/
  error?: unknown

  /** True for orange warning, false for red alert: */
  warning?: boolean

  /** No auto-hide, must dismiss through the tap. */
  persistent?: boolean

  /** If given, pressing the body of the dropdown invokes onPress, while the
   * close icon dismisses the dropdown */
  onPress?: () => void | Promise<void>
}

export function AlertDropdown(props: Props) {
  const { bridge, error, persistent, message, warning, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const color = warning ? theme.dropdownWarning : theme.dropdownError
  const [reportSent, setReportSent] = React.useState(false)

  const handleOnPress = useHandler(async () => {
    if (onPress != null) await onPress()
    bridge.resolve()
  })

  const handleClose = useHandler(() => {
    bridge.resolve()
  })

  const handleReportError = useHandler(() => {
    if (error != null) {
      trackError(error, 'AlertDropdown_Report', {
        userReportedError: true
      })
      setReportSent(true)
      // Wait before resolving to allow the user to read the
      // report sent message
      setTimeout(() => {
        bridge.resolve()
      }, 3000)
    }
  })

  const shouldPersist = persistent || error != null

  return (
    <AirshipDropdown
      autoHideMs={shouldPersist ? 0 : undefined}
      bridge={bridge}
      backgroundColor={color}
      // Disable onPress to prevent dismissing
      onPress={() => {}}
    >
      <View style={styles.container}>
        <EdgeTouchableOpacity style={styles.content} onPress={handleOnPress}>
          <EntypoIcon name="warning" size={theme.rem(1)} style={styles.icon} />
          <Text style={styles.text}>
            <Text style={styles.textBold}>
              {warning
                ? lstrings.alert_dropdown_warning
                : lstrings.alert_dropdown_alert}
            </Text>
            {message}
          </Text>
        </EdgeTouchableOpacity>
        <EdgeTouchableOpacity onPress={handleClose}>
          <AntDesignIcon
            name="closecircle"
            size={theme.rem(1)}
            style={styles.icon}
          />
        </EdgeTouchableOpacity>
      </View>
      {error != null && (
        <ErrorButtonContainer>
          {reportSent ? (
            <ReportSentContainer>
              <CheckIcon name="checkcircle" size={theme.rem(1)} />
              <ReportSentText>{lstrings.string_report_sent}</ReportSentText>
            </ReportSentContainer>
          ) : (
            <ErrorButton onPress={handleReportError}>
              <ErrorButtonText>{lstrings.string_report_error}</ErrorButtonText>
            </ErrorButton>
          )}
        </ErrorButtonContainer>
      )}
    </AirshipDropdown>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.rem(0.5)
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  text: {
    ...textStyle(theme, 'row-center', 'small'),
    color: theme.dropdownText,
    padding: theme.rem(0.25)
  },
  textBold: {
    fontFamily: theme.fontFaceBold
  },
  icon: {
    color: theme.icon,
    minWidth: theme.rem(1.5),
    textAlign: 'center'
  }
}))

const ErrorButtonContainer = styled(View)(theme => ({
  flexDirection: 'row',
  justifyContent: 'center',
  paddingHorizontal: theme.rem(0.5),
  paddingBottom: theme.rem(0.5)
}))

const ErrorButton = styled(EdgeTouchableOpacity)(theme => ({
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.3)',
  borderRadius: theme.rem(0.25),
  paddingVertical: theme.rem(0.375),
  paddingHorizontal: theme.rem(0.75),
  alignItems: 'center'
}))

const ErrorButtonText = styled(EdgeText)(theme => ({
  ...textStyle(theme, 'row-center', 'small'),
  fontFamily: theme.fontFaceMedium
}))

const ReportSentContainer = styled(View)(theme => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  // Extra padding is to match the error button's border width
  // to keep the height after transition.
  paddingVertical: theme.rem(0.375) + 1
}))

const CheckIcon = styled(AntDesignIcon)(theme => ({
  color: '#FFFFFF',
  marginRight: theme.rem(0.25)
}))

const ReportSentText = styled(Text)(theme => ({
  ...textStyle(theme, 'row-center', 'small'),
  color: '#FFFFFF',
  fontFamily: theme.fontFaceMedium
}))
