// @flow

import React, { Component } from 'react'
import { View } from 'react-native'
import slowlog from 'react-native-slowlog'

import s from '../../locales/strings.js'
import { TertiaryButton } from '../../modules/UI/components/Buttons/index'
import { InteractiveModal } from '../../modules/UI/components/Modals/index'
import styles from '../../styles/scenes/ScaneStyle.js'
import { FormField } from './FormField.js'

export type Props = {
  uri: string,
  onChangeText: string => void,
  onPaste: () => void,
  onSubmit: () => void
}
export class AddressInput extends Component<Props> {
  constructor (props: any) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  // this component is for the input area of the Recipient Address Modal
  render () {
    return (
      <View>
        <InteractiveModal.Row>
          <InteractiveModal.Item>
            <FormField
              style={[styles.addressInput]}
              value={this.props.uri}
              onChangeText={this.props.onChangeText}
              autoCapitalize={'none'}
              autoFocus
              label={s.strings.fragment_send_send_to_hint}
              returnKeyType={'done'}
              autoCorrect={false}
              onSubmitEditing={this.props.onSubmit}
            />
          </InteractiveModal.Item>
        </InteractiveModal.Row>
        {this.props.copyMessage && (
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <TertiaryButton ellipsizeMode={'middle'} onPress={this.props.onPaste} numberOfLines={1} style={styles.addressInputButton}>
                <TertiaryButton.Text>{this.props.copyMessage}</TertiaryButton.Text>
              </TertiaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        )}
      </View>
    )
  }
}
