// @flow

import React, { Component } from 'react'
import { FlatList, Image, TouchableHighlight, View } from 'react-native'

import ContactImage from '../../assets/images/contact.png'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import styles from '../../styles/scenes/TransactionDetailsStyle'
import type { GuiContact } from '../../types/types.js'

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
  render () {
    const filteredArray = this.props.contacts.filter(contact => {
      const { givenName, familyName } = contact
      const givenNameLowerCase = givenName ? givenName.toLowerCase() : ''
      const familyNameLowerCase = familyName ? familyName.toLowerCase() : ''
      const inputTextLowerCase = this.props.currentPayeeText.toLowerCase()
      return givenNameLowerCase.includes(inputTextLowerCase) || familyNameLowerCase.includes(inputTextLowerCase)
    })
    return (
      <FlatList
        style={styles.resultList}
        contentContainerStyle={{ paddingBottom: this.props.bottomGap }}
        data={filteredArray}
        initialNumToRender={12}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item: GuiContact, index: number) => index.toString()}
        renderItem={this.renderResult}
      />
    )
  }
  renderResult = ({ item }: FlatListItem) => {
    const { familyName, givenName, thumbnailPath } = item
    const fullName = familyName ? `${givenName} ${familyName}` : givenName
    return (
      <View style={styles.singleContactWrap}>
        <TouchableHighlight
          style={[styles.singleContact]}
          onPress={() => this.props.onSelectPayee(fullName, thumbnailPath)}
          underlayColor={styles.underlayColor.color}
        >
          <View style={[styles.contactInfoWrap]}>
            <View style={styles.contactLeft}>
              <View style={[styles.contactLogo]}>
                {thumbnailPath ? (
                  <Image source={{ uri: thumbnailPath }} style={styles.contactThumbnail} />
                ) : (
                  <Image source={ContactImage} style={styles.contactThumbnail} />
                )}
              </View>
              <View style={[styles.contactLeftTextWrap]}>
                <FormattedText style={[styles.contactName]}>{fullName}</FormattedText>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}
