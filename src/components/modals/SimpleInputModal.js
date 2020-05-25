// @flow

import { FormField, MaterialInputStyle } from 'edge-components'
import * as React from 'react'
import { Text } from 'react-native'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import { type AirshipBridge, AirshipModal, ContentArea, dayText, IconCircle, THEME } from './modalParts.js'

type Props = {
  bridge: AirshipBridge<string>,
  icon?: React.Node,
  title: string,
  subTitle?: string,
  inputLabel?: string,
  inputType?: string,
  inputValue?: string
}

type State = {
  input: string
}

export class SimpleInputModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { input: props.inputValue || '' }
  }

  onChangeText = (input: string) => this.setState({ input })
  submit = () => this.props.bridge.resolve(this.state.input)
  render() {
    const {
      bridge,
      subTitle,
      title,
      inputLabel = 'Enter Input',
      inputType,
      icon = <EntypoIcon name="info" size={THEME.rem(2)} color={THEME.COLORS.SECONDARY} />
    } = this.props
    const { input } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(input)}>
        <IconCircle>{icon}</IconCircle>
        <ContentArea padding="wide">
          <Text style={dayText('title')}>{title}</Text>
          {subTitle && <Text style={dayText('autoCenter')}>{subTitle}</Text>}
          <FormField
            autoFocus
            blurOnSubmit
            style={MaterialInputStyle}
            returnKeyType="done"
            autoCapitalize="none"
            autoCorrect={false}
            value={input}
            onChangeText={this.onChangeText}
            label={inputLabel}
            onSubmitEditing={this.submit}
            keyboardType={inputType}
          />
        </ContentArea>
      </AirshipModal>
    )
  }
}
