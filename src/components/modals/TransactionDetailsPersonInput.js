// @flow

import * as React from 'react'
import { FlatList, Image } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { type GuiContact } from '../../types/types.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts'
import { OutlinedTextInput, OutlinedTextInputRef } from '../themed/OutlinedTextInput.js'
import { SelectableRow } from '../themed/SelectableRow'
import { ThemedModal } from '../themed/ThemedModal'

type OwnProps = {
  bridge: AirshipBridge<null>,
  personStatus: string,
  personName: string,
  contacts: GuiContact[],
  onChangePerson: (string, string) => void
}
type State = {
  personName: string
}

type Props = OwnProps & ThemeProps

export class TransactionDetailsPersonInput extends React.Component<Props, State> {
  textInput: { current: OutlinedTextInputRef | null } = React.createRef()
  constructor(props: Props) {
    super(props)
    this.state = { personName: props.personName }
  }

  onChangePerson = (value: string) => {
    this.props.onChangePerson(value, '')
    this.setState({ personName: value })
  }

  onSelectPerson = (personName: string, thumbnail: string) => {
    this.props.onChangePerson(personName, thumbnail)
    this.setState({ personName: personName })
    this.props.bridge.resolve(null)
  }

  _renderItem = (data: { item: GuiContact }) => {
    const { theme } = this.props
    const { personName } = this.state
    const styles = getStyles(theme)
    const { item } = data
    const { givenName, familyName, hasThumbnail, thumbnailPath } = item
    const fullName = familyName ? `${givenName} ${familyName}` : givenName
    return (
      <SelectableRow
        onPress={() => this.onSelectPerson(fullName, thumbnailPath)}
        icon={
          hasThumbnail ? (
            <Image style={styles.image} source={{ uri: thumbnailPath }} />
          ) : (
            <IonIcon style={styles.tileAvatarIcon} name="person" size={theme.rem(1.5)} />
          )
        }
        title={fullName}
        // subTitle={emailAddresses[0]?.email || ''}
        selected={fullName === personName}
      />
    )
  }

  handleClose = () => this.props.bridge.resolve(null)

  clearText = () => {
    this.setState({ personName: '' })
    if (this.textInput.current) {
      this.textInput.current.blur()
    }
  }

  render() {
    const { bridge, personStatus, contacts, theme } = this.props
    const { personName } = this.state
    const styles = getStyles(theme)
    const personStatusString = sprintf(s.strings.transaction_details_person_input, personStatus)
    const contactsFiltered = []

    // Converts a string to lowercase & removes whitespace
    const norm = (str: string) => str.toLowerCase().replace(/\s/g, '')

    for (let i = 0; i < contacts.length; i++) {
      const { givenName, familyName } = contacts[i]
      const fullNameNorm = norm(givenName) + norm(familyName)
      if (fullNameNorm.includes(norm(personName))) {
        contactsFiltered.push(contacts[i])
      }
    }

    return (
      <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(null)}>
        <ModalTitle center paddingRem={[0, 1, 0.5]}>
          {personStatusString}
        </ModalTitle>
        <OutlinedTextInput
          keyboardType="default"
          label={personStatusString}
          autoFocus
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="done"
          onClear={this.clearText}
          onChangeText={this.onChangePerson}
          clearIcon
          marginRem={[0, 1.75]}
          ref={this.textInput}
          blurOnSubmit
          searchIcon
          value={personName}
        />
        <FlatList
          style={styles.list}
          data={contactsFiltered}
          initialNumToRender={12}
          keyboardShouldPersistTaps="handled"
          keyExtractor={this.keyExtractor}
          renderItem={this._renderItem}
        />
        <ModalCloseArrow onPress={this.handleClose} />
      </ThemedModal>
    )
  }

  keyExtractor = (item: GuiContact, index: number) => index.toString()
}

const getStyles = cacheStyles((theme: Theme) => ({
  list: {
    flex: 1
  },
  image: {
    height: theme.rem(2),
    width: theme.rem(2)
  },
  tileAvatarIcon: {
    color: theme.primaryText,
    marginRight: theme.rem(0.5)
  },
  airshipHeader: {
    fontSize: theme.rem(1.2),
    marginBottom: theme.rem(1),
    alignSelf: 'center'
  }
}))

export const TransactionDetailsPersonInputModal = withTheme(TransactionDetailsPersonInput)
