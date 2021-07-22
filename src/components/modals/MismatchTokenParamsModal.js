// @flow

import * as React from 'react'
import { View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import { Fontello } from '../../assets/vector'
import s from '../../locales/strings'
import { useState } from '../../types/reactHooks'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'
import { Checkbox } from '../themed/Checkbox'
import { Fade } from '../themed/Fade'
import { ModalMessage, ModalTitle } from '../themed/ModalParts'
import { PrimaryButton } from '../themed/PrimaryButton.js'
import { ThemedModal } from '../themed/ThemedModal'

type Props = {
  bridge: AirshipBridge<boolean>
}

export const MismatchTokenParamsModal = ({ bridge }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const [isChecked, setIsChecked] = useState<boolean>(false)

  return (
    <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(false)} paddingRem={[1, 0.5]}>
      <Fontello style={styles.alignSelfCenter} name="warning-in-circle" size={theme.rem(2.35)} color={theme.warningIcon} />
      <ModalTitle paddingRem={[1, 0, 0.2]}>{s.strings.mismatching_token_parameters}</ModalTitle>
      <ModalMessage>{s.strings.token_do_not_match}</ModalMessage>
      <ModalMessage paddingRem={[1, 0, 0.5]} isWarning>
        {s.strings.incorrect_token_parameters}
      </ModalMessage>
      <Checkbox textStyle={styles.checkboxText} value={isChecked} onChange={setIsChecked} paddingRem={[0.8, 1]} marginRem={[0.5, 0.5, 2.35]}>
        {s.strings.i_understand_the_conditions}
      </Checkbox>
      <View style={styles.alignSelfCenter}>
        <Fade visible={isChecked}>
          <PrimaryButton label={s.strings.confirm_finish} marginRem={[0, 0, 1.35]} outlined onPress={() => bridge.resolve(true)} />
        </Fade>
      </View>
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  alignSelfCenter: {
    alignSelf: 'center'
  },
  checkboxText: {
    fontFamily: theme.fontFaceBold,
    fontSize: theme.rem(0.7)
  }
}))
