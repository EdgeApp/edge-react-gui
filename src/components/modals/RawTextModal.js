// @flow

import { PrimaryButton } from 'edge-components'
import React, { type Node, Component } from 'react'
import { Clipboard, ScrollView, StyleSheet, View } from 'react-native'
import EntypoIcon from 'react-native-vector-icons/Entypo'
import { connect } from 'react-redux'

import s from '../../locales/strings.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { type EdgeTheme } from '../../reducers/ThemeReducer.js'
import type { State as StateType } from '../../types/reduxTypes.js'
import { showToast } from '../services/AirshipInstance.js'
import { type AirshipBridge, AirshipModal, ContentArea, IconCircle } from './modalParts.js'

type OwnProps = {
  bridge: AirshipBridge<void>,
  body: string,
  icon?: Node,
  title: string
}

type StateProps = {
  theme: EdgeTheme
}

type Props = OwnProps & StateProps

export class RawTextModalComponent extends Component<Props> {
  copyToClipboard = () => {
    Clipboard.setString(this.props.body)
    showToast(s.strings.fragment_copied)
    this.props.bridge.resolve()
  }

  render() {
    const { body, bridge, icon, theme, title } = this.props
    const styles = getStyles(theme)
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve()}>
        <IconCircle>{icon || <EntypoIcon name="info" size={theme.rem(2)} color={theme.tileBackground} />}</IconCircle>
        <Text style={styles.header}>{title}</Text>
        <ContentArea grow>
          <ScrollView style={styles.textContainer}>
            <Text>{body}</Text>
          </ScrollView>
        </ContentArea>
        <View style={styles.buttonContainer}>
          <PrimaryButton style={styles.buttonLeft} onPress={this.copyToClipboard}>
            <PrimaryButton.Text>{s.strings.fragment_request_copy_title}</PrimaryButton.Text>
          </PrimaryButton>
          <PrimaryButton style={styles.buttonRight} onPress={() => bridge.resolve()}>
            <PrimaryButton.Text>{s.strings.string_ok_cap}</PrimaryButton.Text>
          </PrimaryButton>
        </View>
      </AirshipModal>
    )
  }
}

export const RawTextModal = connect((state: StateType): StateProps => ({ theme: state.theme }))(RawTextModalComponent)

const getStyles = (theme: EdgeTheme) => {
  return StyleSheet.create({
    header: {
      width: '100%',
      textAlign: 'center',
      fontSize: theme.rem(1.5),
      paddingTop: theme.rem(0.75)
    },
    textContainer: {
      flex: 1
    },
    buttonContainer: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.rem(1),
      paddingBottom: theme.rem(1)
    },
    buttonLeft: {
      width: '100%',
      marginRight: theme.rem(0.5)
    },
    buttonRight: {
      width: '100%',
      marginLeft: theme.rem(0.5)
    }
  })
}
