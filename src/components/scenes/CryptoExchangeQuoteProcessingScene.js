// @flow

import React from 'react'
import { ActivityIndicator, View } from 'react-native'

import s from '../../locales/strings.js'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import { styles } from '../../styles/scenes/CryptoExchangeQuoteProcessingSceneStyles.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

export function CryptoExchangeQuoteProcessingScreenComponent (props: {}) {
  return (
    <SceneWrapper hasTabs={false}>
      <View style={styles.top}>
        <ActivityIndicator />
      </View>
      <View style={styles.bottom}>
        <FormattedText style={styles.momentText} isBold>
          {s.strings.just_a_moment}
        </FormattedText>
        <FormattedText style={styles.findingText}>{s.strings.trying_to_find}</FormattedText>
      </View>
    </SceneWrapper>
  )
}
