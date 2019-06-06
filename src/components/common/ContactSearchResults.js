/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { FlatList, Image, TouchableHighlight, View } from 'react-native'

import ContactImage from '../../assets/images/contact.png'
import { scale } from '../../lib/scaling.js'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import styles from '../../styles/scenes/TransactionDetailsStyle'

class ContactSearchResults extends Component {
  render () {
    const filteredArray = this.props.contacts.filter(entry => (entry.givenName + ' ' + entry.familyName).indexOf(this.props.currentPayeeText) >= 0)

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

  renderResult = data => {
    const fullName = data.item.familyName ? data.item.givenName + ' ' + data.item.familyName : data.item.givenName

    return (
      <View style={styles.singleContactWrap}>
        <TouchableHighlight
          style={[styles.singleContact]}
          onPress={() => this.props.onSelectPayee(fullName, data.item.thumbnailPath)}
          underlayColor={styles.underlayColor.color}
        >
          <View style={[styles.contactInfoWrap]}>
            <View style={styles.contactLeft}>
              <View style={[styles.contactLogo]}>
                {data.item.thumbnailPath ? (
                  <Image source={{ uri: data.item.thumbnailPath }} style={{ height: scale(40), width: scale(40), borderRadius: 20 }} />
                ) : (
                  <Image source={ContactImage} style={{ height: scale(40), width: scale(40), borderRadius: 20 }} />
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

  keyExtractor = (item, index) => index
}

export default ContactSearchResults
