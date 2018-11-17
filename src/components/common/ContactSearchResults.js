/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'

import ContactImage from '../../assets/images/contact.png'
import { scale } from '../../lib/scaling.js'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import SearchResults from '../../modules/UI/components/SearchResults/index'
import styles from '../../styles/scenes/TransactionDetailsStyle'

class ContactSearchResults extends Component {
  render () {
    const filteredArray = this.props.contacts.filter(entry => (entry.givenName + ' ' + entry.familyName).indexOf(this.props.currentPayeeText) >= 0)

    return (
      <SearchResults
        renderRegularResultFxn={this.renderResult}
        onRegularSelectFxn={this.props.onSelectPayee}
        regularArray={filteredArray}
        usableHeight={this.props.usableHeight}
        style={styles.SearchResults}
        keyExtractor={this.keyExtractor}
        height={this.props.usableHeight - 60}
        extraTopSpace={-10}
      />
    )
  }

  renderResult = (data, onRegularSelectFxn) => {
    const fullName = data.item.familyName ? data.item.givenName + ' ' + data.item.familyName : data.item.givenName

    return (
      <View style={styles.singleContactWrap}>
        <TouchableHighlight
          style={[styles.singleContact]}
          onPress={() => onRegularSelectFxn(fullName, data.item.thumbnailPath)}
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
