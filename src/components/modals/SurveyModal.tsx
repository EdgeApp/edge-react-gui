import { InstallSurvey2 } from 'edge-info-server'
import React from 'react'
import { Platform, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { getLocaleOrDefaultString } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useDispatch } from '../../types/reactRedux'
import { infoServerData } from '../../util/network'
import { logEvent } from '../../util/tracking'
import { shuffleArray } from '../../util/utils'
import { ModalButtons } from '../buttons/ModalButtons'
import { EdgeCard } from '../cards/EdgeCard'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText, HeaderText, Paragraph, SmallText } from '../themed/EdgeText'
import { SimpleTextInput } from '../themed/SimpleTextInput'
import { Radio } from '../themed/ThemedButtons'
import { EdgeModal } from './EdgeModal'

interface SurveyCategory {
  catKey: SurveyOption2Keys | 'other'
  label: string
}

const SURVEY_CATS: SurveyCategory[] = [
  { catKey: 'ads', label: lstrings.survey_opt_ad },
  { catKey: 'appStore', label: lstrings.survey_opt_app_store },
  { catKey: 'article', label: lstrings.survey_opt_article },
  { catKey: 'inPerson', label: lstrings.survey_opt_in_person_event },
  { catKey: 'referral', label: lstrings.survey_opt_personal_referral },
  { catKey: 'search', label: lstrings.survey_opt_search_engine },
  { catKey: 'social', label: lstrings.survey_opt_social }
]

interface LocaleSubcategory {
  [langKey: string]: string
}

type SurveyOption2Keys = keyof InstallSurvey2['surveyOptions2']

export const SurveyModal = (props: { bridge: AirshipBridge<void> }) => {
  const { bridge } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  /**
   * Shuffle the categories, then append an “other” category at the end:
   */
  const [options] = React.useState<SurveyCategory[]>(() => [...shuffleArray(SURVEY_CATS), { catKey: 'other', label: lstrings.survey_opt_other_specify }])

  /**
   * Store the user's selection here (rather than on each item).
   * This can be `undefined`, or one of the category keys (like "ads", "other", etc.)
   */
  const [selectedCatKey, setSelectedCatKey] = React.useState<SurveyOption2Keys | 'other' | undefined>()

  /**
   * “Other” custom text response:
   */
  const [otherText, setOtherText] = React.useState('')
  const inputHeight = useSharedValue(0)

  const isOtherSelected = selectedCatKey === 'other'

  /**
   * Handle radio press:
   * - Update the selected catKey
   * - Animate the “Other” text input if necessary
   */
  const handleOptionPress = useHandler((catKey: SurveyOption2Keys | 'other') => {
    setSelectedCatKey(catKey)

    // Expand the text input if “Other” was selected:
    if (catKey === 'other') {
      inputHeight.value = withTiming(theme.rem(3.25), {
        duration: 300,
        easing: Easing.inOut(Easing.ease)
      })
    } else {
      inputHeight.value = withTiming(0, {
        duration: 300,
        easing: Easing.inOut(Easing.ease)
      })
    }
  })

  /**
   * If the user picks something *besides* “Other,” we open the second modal:
   */
  const handleNextPress = React.useCallback(async () => {
    if (selectedCatKey == null || selectedCatKey === 'other') return // Shouldn't happen if the button is disabled, and if "other" is selected, the next button is unavailable

    // Show the second modal:
    const isSurveyCompleted = await Airship.show((bridge: AirshipBridge<boolean>) => <SurveyModal2 bridge={bridge} category={selectedCatKey} />)
    if (isSurveyCompleted) {
      // If they completed it, close the first modal:
      props.bridge.resolve()
    }
  }, [props.bridge, selectedCatKey])

  /**
   * If the user picks “Other,” we submit right away (with the custom text).
   */
  const handleSubmitPress = useHandler(() => {
    dispatch(
      logEvent('Survey_Discover2', {
        surveyCategory2: 'None',
        surveyResponse2: `Other: ${otherText}`
      })
    )
    bridge.resolve()
  })

  const handleModalDismiss = useHandler(() => {
    dispatch(logEvent('Survey_Discover2', { surveyResponse2: 'DISMISSED' }))
    bridge.resolve()
  })

  const animatedStyle = useAnimatedStyle(() => ({
    height: inputHeight.value,
    width: '100%',
    opacity: inputHeight.value ? 1 : 0
  }))

  return (
    <EdgeModal
      bridge={bridge}
      onCancel={handleModalDismiss}
      title={
        <View style={styles.titleContainer}>
          <Paragraph center>
            <HeaderText>{sprintf(lstrings.survey_discover_title_1s, config.appName)}</HeaderText>
          </Paragraph>
          <Paragraph center>
            <SmallText>{lstrings.survey_discover_subtitle}</SmallText>
          </Paragraph>
        </View>
      }
    >
      {/** HACK: iOS and Android use extraScrollHeight differently... */}
      <KeyboardAwareScrollView
        extraScrollHeight={Platform.OS === 'ios' ? theme.rem(-16) : theme.rem(9)}
        enableOnAndroid
        contentContainerStyle={styles.contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        style={styles.containerStyle}
      >
        <EdgeCard>
          <View style={styles.radioContainer}>
            {options.map((option, index) => (
              <Radio key={option.catKey} value={selectedCatKey === option.catKey} onPress={() => handleOptionPress(option.catKey)}>
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
          label: isOtherSelected ? lstrings.survey_opt_submit : lstrings.string_next_capitalized,
          // Only enable if a selection is made; if “Other,” require text:
          disabled: selectedCatKey == null || (isOtherSelected && otherText.trim() === ''),
          onPress: isOtherSelected && otherText.trim() !== '' ? handleSubmitPress : handleNextPress,
          spinner: false
        }}
        secondary={{
          label: lstrings.survey_opt_dismiss,
          onPress: handleModalDismiss,
          spinner: false
        }}
      />
    </EdgeModal>
  )
}

const SurveyModal2 = (props: { bridge: AirshipBridge<boolean>; category: SurveyOption2Keys }) => {
  const { bridge, category } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  // Build an array of subOptions that each contain:
  //    - enValue: the raw English string from the data
  //    - displayedValue: the result of getLocaleOrDefaultString()
  const [subOptions] = React.useState(() => {
    const subItems: LocaleSubcategory[] = infoServerData.rollup?.installSurvey2?.surveyOptions2[category] ?? []
    const coreOptions = shuffleArray(subItems).map(localeObj => ({
      enValue: localeObj.en, // This is what we will log
      displayedValue: getLocaleOrDefaultString(localeObj) // This is what we show in the UI
    }))
    // Append “Other”:
    coreOptions.push({
      enValue: 'Other',
      displayedValue: lstrings.survey_opt_other_specify
    })
    return coreOptions
  })

  const [selectedSubCatEnVal, setSelectedSubCatEnVal] = React.useState<string | undefined>()

  const [otherText, setOtherText] = React.useState('')
  const inputHeight = useSharedValue(0)
  const isOtherSelected = selectedSubCatEnVal === 'Other'

  const handleOptionPress = useHandler((selectedEnVal: string) => {
    setSelectedSubCatEnVal(selectedEnVal)
    if (selectedEnVal === 'Other') {
      inputHeight.value = withTiming(theme.rem(3.25), {
        duration: 300,
        easing: Easing.inOut(Easing.ease)
      })
    } else {
      inputHeight.value = withTiming(0, {
        duration: 300,
        easing: Easing.inOut(Easing.ease)
      })
    }
  })

  // When submitting, always report the English selection value
  const handleSubmitPress = useHandler(() => {
    if (selectedSubCatEnVal == null) return

    dispatch(
      logEvent('Survey_Discover2', {
        surveyCategory2: category,
        surveyResponse2: selectedSubCatEnVal === 'Other' ? `Other: ${otherText}` : selectedSubCatEnVal
      })
    )
    bridge.resolve(true)
  })

  const handleModalDismiss = useHandler(() => {
    bridge.resolve(false)
  })

  const animatedStyle = useAnimatedStyle(() => ({
    height: inputHeight.value,
    width: '100%',
    opacity: inputHeight.value ? 1 : 0
  }))

  return (
    <EdgeModal
      bridge={bridge}
      onCancel={handleModalDismiss}
      title={
        <View style={styles.titleContainer}>
          <Paragraph center>
            <HeaderText>{sprintf(lstrings.survey_discover_title_1s, config.appName)}</HeaderText>
          </Paragraph>
          <Paragraph center>
            <SmallText>{lstrings.survey_discover_subtitle}</SmallText>
          </Paragraph>
        </View>
      }
    >
      <KeyboardAwareScrollView
        extraScrollHeight={Platform.OS === 'ios' ? theme.rem(-16) : theme.rem(9)}
        enableOnAndroid
        contentContainerStyle={styles.contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        style={styles.containerStyle}
      >
        <EdgeCard>
          <View style={styles.radioContainer}>
            {subOptions.map((option, index) => (
              <Radio key={index} value={selectedSubCatEnVal === option.enValue} onPress={() => handleOptionPress(option.enValue)}>
                <EdgeText style={styles.radioLabel}>{option.displayedValue}</EdgeText>
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
          disabled: selectedSubCatEnVal == null || (isOtherSelected && otherText.trim() === ''),
          onPress: handleSubmitPress,
          spinner: false
        }}
        secondary={{
          label: lstrings.survey_opt_dismiss,
          onPress: handleModalDismiss,
          spinner: false
        }}
      />
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  titleContainer: {
    flexDirection: 'column'
  },
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
