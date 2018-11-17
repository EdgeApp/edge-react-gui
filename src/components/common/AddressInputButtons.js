// @flow

import React, { Component } from 'react'
import slowlog from 'react-native-slowlog'

import s from '../../locales/strings.js'
import { PrimaryButton, SecondaryButton } from '../../modules/UI/components/Buttons/index'
import { InteractiveModal } from '../../modules/UI/components/Modals/index'

const CANCEL_TEXT = s.strings.string_cancel_cap
const DONE_TEXT = s.strings.string_done_cap

export type Props = {
  onSubmit: () => void,
  onCancel: () => void
}
export class AddressInputButtons extends Component<Props> {
  constructor (props: any) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  render () {
    return (
      <InteractiveModal.Row>
        <InteractiveModal.Item>
          <SecondaryButton onPress={this.props.onCancel}>
            <SecondaryButton.Text>{CANCEL_TEXT}</SecondaryButton.Text>
          </SecondaryButton>
        </InteractiveModal.Item>

        <InteractiveModal.Item>
          <PrimaryButton onPress={this.props.onSubmit}>
            <PrimaryButton.Text>{DONE_TEXT}</PrimaryButton.Text>
          </PrimaryButton>
        </InteractiveModal.Item>
      </InteractiveModal.Row>
    )
  }
}
