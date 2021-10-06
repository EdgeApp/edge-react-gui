// @flow

import * as React from 'react'
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type GuiContact } from '../../types/types.js'
import { AirshipModal } from '../common/AirshipModal.js'
import { ContactSearchResults } from '../common/ContactSearchResults.js'
import { FormField, MaterialInputOnWhite } from '../common/FormField.js'

type Props = {
  bridge: AirshipBridge<{ payeeName: string, thumbnailPath: string } | null>,
  personStatus: string,
  payeeName: string,
  contacts: GuiContact[]
}

type State = {
  payeeName: string
}

export class TransactionDetailsPersonInput extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { payeeName: props.payeeName }
  }

  onChangePerson = (payeeName: string) => {
    this.setState({ payeeName })
  }

  onSelectPerson = (payeeName: string, thumbnailPath: string) => {
    this.props.bridge.resolve({ payeeName, thumbnailPath })
  }

  render() {
    const { bridge, personStatus, contacts } = this.props
    const { payeeName } = this.state
    const personStatusString = sprintf(s.strings.transaction_details_person_input, personStatus)
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(null)}>
        <TouchableWithoutFeedback onPress={() => bridge.resolve(null)}>
          <View style={styles.airshipContainer}>
            <FormattedText style={styles.airshipHeader}>{personStatusString}</FormattedText>
            <FormField
              {...MaterialInputOnWhite}
              containerStyle={{
                ...MaterialInputOnWhite.containerStyle,
                height: THEME.rem(3.44),
                width: '100%'
              }}
              autoFocus
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="done"
              label={personStatusString}
              onChangeText={this.onChangePerson}
              onSubmitEditing={() => bridge.resolve({ payeeName, thumbnailPath: '' })}
              value={payeeName}
            />
            <ContactSearchResults contacts={contacts} currentPayeeText={payeeName} onSelectPayee={this.onSelectPerson} />
          </View>
        </TouchableWithoutFeedback>
      </AirshipModal>
    )
  }
}

const rawStyles = {
  airshipContainer: {
    flex: 1,
    padding: THEME.rem(0.8)
  },
  airshipHeader: {
    fontSize: THEME.rem(1.2),
    marginBottom: THEME.rem(1),
    alignSelf: 'center'
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
