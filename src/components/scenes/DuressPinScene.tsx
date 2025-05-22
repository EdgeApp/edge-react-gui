import * as React from 'react'
import { Keyboard, ScrollView } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { useHandler } from '../../hooks/useHandler'
import { useScrollToEnd } from '../../hooks/useScrollToEnd'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { logActivity } from '../../util/logger'
import { SceneButtons } from '../buttons/SceneButtons'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { SceneContainer } from '../layout/SceneContainer'
import { showError, showToast } from '../services/AirshipInstance'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { DigitInput, MAX_PIN_LENGTH } from './inputs/DigitInput'

interface Props extends EdgeAppSceneProps<'duressPin'> {}

export const DuressPinScene = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)

  const [pin, setPin] = React.useState('')
  const isValidPin = pin.length === MAX_PIN_LENGTH

  const handleComplete = () => {
    if (!isValidPin) return
    logActivity(`Duress PIN selected`)
    account
      .checkPin(pin)
      .then(async isConflicting => {
        if (isConflicting) {
          showToast(lstrings.duress_mode_pin_match_rule_message)
          return
        }
        await account.changePin({ enableLogin: true, pin, forDuressAccount: true })
        navigation.navigate('duressModeSetting')
      })
      .catch(err => showError(err))
  }

  const handleChangePin = useHandler((newPin: string) => {
    // Change pin only when input are numbers
    if ((/^\d+$/.test(newPin) || newPin.length === 0) && newPin.length <= 4) {
      setPin(newPin)
      if (newPin.length === 4) {
        Keyboard.dismiss()
      }
    }
  })

  const scrollViewRef = useScrollToEnd(isValidPin)

  return (
    <SceneWrapper scroll={false}>
      <SceneContainer expand headerTitle={lstrings.title_set_duress_pin}>
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <EdgeAnim enter={{ type: 'fadeInUp' }}>
            <EdgeText style={styles.description} numberOfLines={0}>
              {lstrings.duress_mode_set_pin_message}
            </EdgeText>
          </EdgeAnim>
          <EdgeAnim enter={{ type: 'fadeInDown' }}>
            <DigitInput pin={pin} testID="pinInput" onChangePin={handleChangePin} />
          </EdgeAnim>
        </ScrollView>
        <SceneButtons
          absolute
          primary={{
            label: lstrings.string_done_cap,
            onPress: handleComplete,
            disabled: !isValidPin
          }}
          animDistanceStart={50}
        />
      </SceneContainer>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  content: {
    flexGrow: 1,
    marginHorizontal: theme.rem(0.5)
  },
  description: {
    marginBottom: theme.rem(2)
  }
}))
