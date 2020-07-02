// @flow

import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import s from '../../locales/strings.js'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

export function CryptoExchangeQuoteProcessingScreenComponent(props: {}) {
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

const rawStyles = {
  top: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  bottom: {
    flex: 1
  },
  momentText: {
    color: THEME.COLORS.WHITE,
    width: '100%',
    textAlign: 'center',
    fontSize: scale(18),
    marginBottom: scale(20)
  },
  findingText: {
    color: THEME.COLORS.WHITE,
    width: '100%',
    textAlign: 'center',
    fontSize: scale(14)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
