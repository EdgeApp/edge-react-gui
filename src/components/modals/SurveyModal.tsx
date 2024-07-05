import React, { useState } from 'react'
import { Platform, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useDispatch } from '../../types/reactRedux'
import { logEvent } from '../../util/tracking'
import { shuffleArray } from '../../util/utils'
import { ModalButtons } from '../buttons/ModalButtons'
import { EdgeCard } from '../cards/EdgeCard'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText, HeaderText, Paragraph, SmallText } from '../themed/EdgeText'
import { SimpleTextInput } from '../themed/SimpleTextInput'
import { Radio } from '../themed/ThemedButtons'
import { EdgeModal } from './EdgeModal'

const SURVEY_OPTS = [
  { label: lstrings.survey_opt_youtube, selected: false },
  { label: lstrings.survey_opt_search_engine, selected: false },
  { label: lstrings.survey_opt_x_twitter, selected: false },
  { label: lstrings.survey_opt_in_person_event, selected: false },
  { label: lstrings.survey_opt_personal_referral, selected: false },
  { label: lstrings.survey_opt_article, selected: false },
  { label: lstrings.survey_opt_other_specify, selected: false }
]

export const SurveyModal = (props: { bridge: AirshipBridge<void> }) => {
  const { bridge } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  // Randomize response options, excluding "Other"
  const randomizedSurveyOpts = [...shuffleArray(SURVEY_OPTS.slice(0, -1)), SURVEY_OPTS[SURVEY_OPTS.length - 1]]
  const [options, setOptions] = useState(randomizedSurveyOpts)
  const [selectedIndex, setSelectedIndex] = useState<number>()

  // "Other" custom text response
  const [otherText, setOtherText] = useState('')
  const inputHeight = useSharedValue(0)

  const handleOptionPress = useHandler((index: number) => {
    setSelectedIndex(index)
    setOptions(prevOptions =>
      prevOptions.map((option, i) => ({
        ...option,
        selected: i === index
      }))
    )

    // TODO: Auto focus, but it's kind of buggy if using refs in this situation...
    if (index === options.length - 1) {
      // Handle "Other" response selection
      inputHeight.value = withTiming(theme.rem(3.25), { duration: 300, easing: Easing.inOut(Easing.ease) })
    } else {
      inputHeight.value = withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })
    }
  })

  const handleSubmitPress = useHandler(async () => {
    if (selectedIndex == null) return // Shouldn't happen, button is disabled if no selection

    dispatch(logEvent('Survey_Discover', { surveyResponse: selectedIndex === options.length - 1 ? `Other: ${otherText}` : options[selectedIndex].label }))

    bridge.resolve()
  })

  const handleDismissButtonPress = useHandler(async () => {
    dispatch(logEvent('Survey_Discover', { surveyResponse: 'DISMISSED' }))

    bridge.resolve()
  })

  const handleModalDismiss = useHandler(() => {
    dispatch(logEvent('Survey_Discover', { surveyResponse: 'DISMISSED' }))

    bridge.resolve()
  })

  const animatedStyle = useAnimatedStyle(() => ({
    height: inputHeight.value,
    width: '100%',
    opacity: inputHeight.value ? 1 : 0
  }))

  return (
    <EdgeModal bridge={bridge} onCancel={handleModalDismiss}>
      {/** HACK: iOS and Android use extraScrollHeight differently... */}
      <KeyboardAwareScrollView
        extraScrollHeight={Platform.OS === 'ios' ? theme.rem(-16) : theme.rem(9)}
        enableOnAndroid
        contentContainerStyle={styles.contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        style={styles.containerStyle}
      >
        <Paragraph center>
          <HeaderText>{sprintf(lstrings.survey_discover_title_1s, config.appName)}</HeaderText>
        </Paragraph>
        <Paragraph center>
          <SmallText>{lstrings.survey_discover_subtitle}</SmallText>
        </Paragraph>
        <EdgeCard>
          <View style={styles.radioContainer}>
            {options.map((option, index) => (
              <Radio value={option.selected} onPress={() => handleOptionPress(index)} key={index}>
                <EdgeText style={styles.radioLabel}>{option.label}</EdgeText>
              </Radio>
            ))}
            <Animated.View style={[styles.baseAnimatedStyle, animatedStyle]}>
              <SimpleTextInput value={otherText} onChangeText={setOtherText} placeholder={lstrings.specify_placeholder} horizontalRem={0.5} bottomRem={0.5} />
            </Animated.View>
          </View>
        </EdgeCard>
      </KeyboardAwareScrollView>
      <ModalButtons
        primary={{
          label: lstrings.survey_opt_submit,
          disabled: selectedIndex == null || (selectedIndex === options.length - 1 && otherText.trim() === ''),
          onPress: handleSubmitPress,
          spinner: false
        }}
        secondary={{
          label: lstrings.survey_opt_dismiss,
          onPress: handleDismissButtonPress,
          spinner: false
        }}
      />
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  radioContainer: {
    alignItems: 'flex-start'
  },
  radioLabel: {
    marginHorizontal: theme.rem(0.5)
  },
  baseAnimatedStyle: {
    overflow: 'hidden'
  },
  containerStyle: {
    flexGrow: 0
  },
  contentContainerStyle: {
    alignItems: 'center'
  }
}))
