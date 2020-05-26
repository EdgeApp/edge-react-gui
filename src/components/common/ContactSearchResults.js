// @flow

import React, { Component } from 'react'
import { FlatList, Image, TouchableHighlight, View } from 'react-native'

import ContactImage from '../../assets/images/contact.png'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import styles from '../../styles/scenes/TransactionDetailsStyle.js'
import { type GuiContact } from '../../types/types.js'

type Props = {
  contacts: Array<GuiContact>,
  currentPayeeText: string,
  onSelectPayee: (string, string) => void,
  bottomGap?: number
}

type FlatListItem = {
  item: GuiContact,
  index: number
}

export class ContactSearchResults extends Component<Props> {
  render() {
    const filteredArray = []
    const { contacts, currentPayeeText } = this.props
    const formattedInputText = currentPayeeText.toLowerCase().replace(/\s+/g, '') // Remove all whitepsaces
    for (let i = 0; i < contacts.length; i++) {
      const { givenName, familyName } = contacts[i]
      const givenNameLowerCase = givenName ? givenName.toLowerCase().replace(/\s+/g, '') : ''
      const familyNameLowerCase = familyName ? familyName.toLowerCase().replace(/\s+/g, '') : ''
      const fullName = givenNameLowerCase + familyNameLowerCase
      if (fullName.includes(formattedInputText)) {
        filteredArray.push(contacts[i])
      }
    }
    return (
      <FlatList
        style={styles.resultList}
        contentContainerStyle={{ paddingBottom: this.props.bottomGap }}
        data={filteredArray}
        initialNumToRender={12}
        keyboardShouldPersistTaps="handled"
        keyExtractor={this.keyExtractor}
        renderItem={this.renderResult}
      />
    )
  }

  keyExtractor = (item: GuiContact, index: number) => index.toString()

  renderResult = ({ item }: FlatListItem) => {
    const { familyName, givenName, thumbnailPath } = item
    const fullName = familyName ? `${givenName} ${familyName}` : givenName
    return (
      <View style={styles.singleContactWrap}>
        <TouchableHighlight
          style={styles.singleContact}
          onPress={() => this.props.onSelectPayee(fullName, thumbnailPath)}
          underlayColor={styles.underlayColor.color}
        >
          <View style={styles.contactInfoWrap}>
            <View style={styles.contactLeft}>
              <View style={styles.contactLogo}>
                {thumbnailPath ? (
                  <Image source={{ uri: thumbnailPath }} style={styles.contactThumbnail} />
                ) : (
                  <Image source={ContactImage} style={styles.contactThumbnail} />
                )}
              </View>
              <View style={styles.contactLeftTextWrap}>
                <FormattedText style={styles.contactName}>{fullName}</FormattedText>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}
