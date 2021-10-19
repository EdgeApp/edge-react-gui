// @flow

import * as React from 'react'
import { FlatList, Image, StyleSheet, TouchableHighlight, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import ContactImage from '../../assets/images/contact.png'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type GuiContact } from '../../types/types.js'
import { scale } from '../../util/scaling.js'

type Props = {
  contacts: GuiContact[],
  currentPayeeText: string,
  onSelectPayee: (string, string) => void,
  bottomGap?: number
}

type FlatListItem = {
  item: GuiContact,
  index: number
}

export class ContactSearchResults extends React.Component<Props> {
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
        <TouchableHighlight style={styles.singleContact} onPress={() => this.props.onSelectPayee(fullName, thumbnailPath)} underlayColor={THEME.COLORS.GRAY_4}>
          <View style={styles.contactInfoWrap}>
            <View style={styles.contactLeft}>
              <View style={styles.contactLogo}>
                {thumbnailPath ? (
                  <FastImage source={{ uri: thumbnailPath }} style={styles.contactThumbnail} />
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

const rawStyles = {
  resultList: {
    backgroundColor: THEME.COLORS.WHITE,
    borderTopColor: THEME.COLORS.GRAY_3,
    borderTopWidth: 1,
    flex: 1
  },
  singleContact: {
    height: scale(60),
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.TRANSACTION_DETAILS_GREY_2,
    padding: scale(10),
    paddingRight: scale(15),
    paddingLeft: scale(15)
  },
  singleContactWrap: {
    flexDirection: 'column',
    flex: 1
  },
  contactInfoWrap: {
    flexDirection: 'row',
    height: scale(40),
    flex: 1,
    justifyContent: 'space-between'
  },
  contactLeft: {
    flexDirection: 'row'
  },
  contactLogo: {
    width: scale(40),
    height: scale(40),
    marginRight: scale(10)
  },
  contactLeftTextWrap: {
    justifyContent: 'center'
  },
  contactName: {
    fontSize: scale(16),
    color: THEME.COLORS.TRANSACTION_DETAILS_GREY_3,
    textAlignVertical: 'center'
  },
  contactThumbnail: {
    height: scale(40),
    width: scale(40),
    borderRadius: scale(20)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
