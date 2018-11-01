// @flow

import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'

import s from '../../locales/strings.js'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import { CryptoExchangeQuoteProecessingSceneStyles as styles } from '../../styles/indexStyles'

type Props = {}
type State = {}

class CryptoExchangeQuoteProcessingScreenComponent extends Component<Props, State> {
  render () {
    return (
      <SafeAreaView>
        <Gradient style={styles.scene}>
          <Gradient style={styles.gradient} />
          <View style={styles.top}>
            <ActivityIndicator />
          </View>
          <View style={styles.bottom}>
            <FormattedText style={styles.momentText} isBold>
              {s.strings.just_a_moment}
            </FormattedText>
            <FormattedText style={styles.findingText}>{s.strings.trying_to_find}</FormattedText>
          </View>
        </Gradient>
      </SafeAreaView>
    )
  }
}

export { CryptoExchangeQuoteProcessingScreenComponent }
